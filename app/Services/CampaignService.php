<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\CampaignItem;
use App\Models\UserCampaignItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\UserCampaign;
use App\Models\Address;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Jobs\CancelPendingOrderJob;

class CampaignService
{
    public function checkout($user, $data)
    {
        $order = DB::transaction(function () use ($user, $data) {

            $total = 0;

            $address = Address::query()
                ->where('user_id', $user->id)
                ->findOrFail($data['address_id']);

            $order = Order::create([

                'user_id' => $user->id,

                'type' => 'campaign',

                'status' => 'pending',

                'order_code'
                    => 'CP-' . strtoupper(Str::random(8)),

                'shipping_name'
                    => $address->full_name,

                'shipping_phone'
                    => $address->phone,

                'shipping_address'
                    => implode(', ', [

                        $address->address_line,

                        $address->ward,

                        $address->district,

                        $address->province,
                    ]),

                // 'shipping_name'
                //     => $data['shipping_name'],

                // 'shipping_phone'
                //     => $data['shipping_phone'],

                // 'shipping_address'
                //     => $data['shipping_address'],

                'total' => 0,

                'shipping_fee' => 0,
            ]);

            // 🔥 event
            event(new \App\Events\OrderCreated($order));

            foreach ($data['items'] as $inputItem) {

                $userCampaignItem = UserCampaignItem::with([
                    'campaignItem.productVariant.product',
                    'userCampaign.campaign'
                ])
                ->lockForUpdate()
                ->findOrFail(
                    $inputItem['user_campaign_item_id']
                );

                // ownership
                if (
                    $userCampaignItem->userCampaign->user_id
                    !== $user->id
                ) {
                    throw new \Exception(
                        'Không có quyền checkout item này'
                    );
                }

                // approved
                if (
                    $userCampaignItem->status !== 'approved'
                ) {
                    throw new \Exception(
                        'Item chưa được approve'
                    );
                }

                // expire
                if (
                    $userCampaignItem->userCampaign->expires_at
                    && now()->gt(
                        $userCampaignItem->userCampaign->expires_at
                    )
                ) {
                    throw new \Exception(
                        'Campaign đã hết hạn checkout'
                    );
                }

                // remain
                $remain =
                    $userCampaignItem->approved_quantity
                    - $userCampaignItem->paid_quantity
                    - $userCampaignItem->reserved_quantity;

                if (
                    $inputItem['quantity'] > $remain
                ) {
                    throw new \Exception(
                        "Chỉ còn {$remain} sản phẩm có thể checkout"
                    );
                }

                $campaignItem =
                    $userCampaignItem->campaignItem;

                $variant =
                    $campaignItem->productVariant;

                // 🔥 reserve STOCK
                $available =
                    $variant->stock
                    - $variant->reserved_stock;

                if (
                    $available < $inputItem['quantity']
                ) {
                    throw new \Exception(
                        "Sản phẩm {$variant->product->name} không đủ stock"
                    );
                }

                // reserve stock
                $variant->increment(
                    'reserved_stock',
                    $inputItem['quantity']
                );

                $price = $campaignItem->price;

                $lineTotal =
                    $price * $inputItem['quantity'];

                OrderItem::create([

                    'order_id' => $order->id,

                    'product_variant_id'
                        => $variant->id,

                    'campaign_item_id'
                        => $campaignItem->id,

                    'user_campaign_item_id'
                        => $userCampaignItem->id,

                    'price' => $price,

                    'quantity'
                        => $inputItem['quantity'],

                    'product_name'
                        => $variant->product->name,

                    'variant_snapshot'
                        => "Size: {$variant->size}, Color: {$variant->color}",
                ]);

                // 🔥 reserve campaign slot
                $userCampaignItem->increment(
                    'reserved_quantity',
                    $inputItem['quantity']
                );

                $total += $lineTotal;
            }

            $order->update([
                'total' => $total
            ]);

            return $order;
        });

        // 🔥 auto cancel
        CancelPendingOrderJob::dispatch($order->id)
            ->delay(
                now()->addMinutes(
                    config('app.order_auto_cancel_minutes')
                )
            );

        return [
            'order_id' => $order->id,
            'order_code' => $order->order_code,
            'total' => $order->total
        ];
    }

    public function register($user, $campaignId, array $data)
    {
        return DB::transaction(function () use ($user, $campaignId, $data) {

            $campaign = Campaign::with('items')
                ->findOrFail($campaignId);

            // 🔥 active
            if (!$campaign->isActive()) {
                throw new \Exception('Campaign không hoạt động');
            }

            // 🔥 duplicate
            $exists = UserCampaign::where('user_id', $user->id)
                ->where('campaign_id', $campaignId)
                ->exists();

            if ($exists) {
                throw new \Exception('Bạn đã đăng ký campaign');
            }

            // 🔥 global limit
            if ($campaign->limit) {

                $count = UserCampaign::where('campaign_id', $campaignId)
                    ->count();

                if ($count >= $campaign->limit) {
                    throw new \Exception('Campaign đã đầy');
                }
            }

            // 🔥 create user_campaign
            $userCampaign = UserCampaign::create([
                'user_id' => $user->id,
                'campaign_id' => $campaignId,
                'status' => 'pending',
            ]);

            foreach ($data['items'] as $itemData) {

                $campaignItem = CampaignItem::lockForUpdate()
                    ->findOrFail($itemData['campaign_item_id']);

                // 🔥 validate item belongs campaign
                if ($campaignItem->campaign_id != $campaignId) {
                    throw new \Exception('Campaign item không hợp lệ');
                }

                // 🔥 validate quantity
                if ($itemData['quantity'] <= 0) {
                    throw new \Exception('Quantity không hợp lệ');
                }

                // 🔥 item limit
                if ($campaignItem->limit_quantity) {

                    $registered = UserCampaignItem::where(
                        'campaign_item_id',
                        $campaignItem->id
                    )->sum('quantity');

                    if (
                        ($registered + $itemData['quantity'])
                        > $campaignItem->limit_quantity
                    ) {
                        throw new \Exception(
                            "Sản phẩm {$campaignItem->id} đã hết slot"
                        );
                    }
                }

                UserCampaignItem::create([
                    'user_campaign_id' => $userCampaign->id,
                    'campaign_item_id' => $campaignItem->id,
                    'quantity' => $itemData['quantity'],
                    'status' => 'pending',
                ]);
            }

            return [
                'message' => 'Đăng ký campaign thành công',
                'data' => $userCampaign->load('items')
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | LIST CAMPAIGNS
    |--------------------------------------------------------------------------
    */

    public function index($request)
    {
        $query = Campaign::query()
            ->withCount('items')
            ->withSum('items', 'registered_quantity')
            ->withSum('items', 'limit_quantity');

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if ($request->keyword) {

            $query->where(function ($q) use ($request) {

                $q->where('title', 'like', '%' . $request->keyword . '%')
                    ->orWhere(
                        'description',
                        'like',
                        '%' . $request->keyword . '%'
                    );
            });
        }

        /*
        |--------------------------------------------------------------------------
        | STATUS
        |--------------------------------------------------------------------------
        */

        if ($request->status) {

            switch ($request->status) {

                case 'upcoming':

                    $query->where(
                        'start_date',
                        '>',
                        now()
                    );

                    break;

                case 'active':

                    $query->where(
                        'start_date',
                        '<=',
                        now()
                    )->where(
                        'end_date',
                        '>=',
                        now()
                    );

                    break;

                case 'ended':

                    $query->where(
                        'end_date',
                        '<',
                        now()
                    );

                    break;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | SORT
        |--------------------------------------------------------------------------
        */

        switch ($request->sort) {

            case 'ending_soon':

                $query->orderBy('end_date');

                break;

            case 'popular':

                $query->orderByDesc(
                    'items_sum_registered_quantity'
                );

                break;

            default:

                $query->latest();
        }

        $campaigns = $query->paginate(
            $request->per_page ?? 10
        );

        /*
        |--------------------------------------------------------------------------
        | TRANSFORM
        |--------------------------------------------------------------------------
        */

        $data = collect($campaigns->items())
            ->map(function ($campaign) {

                $registeredQuantity =
                    $campaign->items_sum_registered_quantity ?? 0;

                $limitQuantity =
                    $campaign->items_sum_limit_quantity ?? 0;

                return [
                    'id' => $campaign->id,

                    'title' => $campaign->title,

                    'slug' => $campaign->slug,

                    'description'
                        => $campaign->description,

                    'banner'
                        => $campaign->banner,

                    'thumbnail'
                        => $campaign->thumbnail,

                    'start_date'
                        => $campaign->start_date,

                    'end_date'
                        => $campaign->end_date,

                    'status'
                        => $campaign->status,

                    'countdown_seconds' => $campaign->end_date
                        ? now()->diffInSeconds($campaign->end_date, false)
                        : null,

                    'total_items'
                        => $campaign->items_count,

                    'registered_quantity'
                        => (int) $registeredQuantity,

                    'remaining_quantity'
                        => (int) ($limitQuantity - $registeredQuantity),
                ];
            })->values();

        return [
            'success' => true,

            'message'
                => 'Lấy danh sách campaign thành công',

            'data'
                => $data,

            'meta' => [
                'current_page'
                    => $campaigns->currentPage(),

                'last_page'
                    => $campaigns->lastPage(),

                'per_page'
                    => $campaigns->perPage(),

                'total'
                    => $campaigns->total(),
            ]
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW CAMPAIGN
    |--------------------------------------------------------------------------
    */

    public function show($identifier)
    {
        $campaign = Campaign::with([
            'items.productVariant.product.images',
            'items.productVariant',
        ])
            ->when(
                is_numeric($identifier),
                fn ($q) => $q->where('id', $identifier),
                fn ($q) => $q->where('slug', $identifier)
            )
            ->firstOrFail();

        $registeredQuantity = $campaign->items->sum('registered_quantity');

        $limitQuantity = $campaign->items->sum('limit_quantity');

        return [
            'id' => $campaign->id,

            'title' => $campaign->title,

            'slug' => $campaign->slug,

            'description' => $campaign->description,

            'banner' => $campaign->banner,

            'thumbnail' => $campaign->thumbnail,

            'start_date' => $campaign->start_date,

            'end_date' => $campaign->end_date,

            'status' => $campaign->status,

            'countdown_seconds' => $campaign->end_date
                ? now()->diffInSeconds($campaign->end_date, false)
                : null,

            'registered_quantity' => (int) $registeredQuantity,

            'remaining_quantity' => (int) ($limitQuantity - $registeredQuantity),

            'items' => $campaign->items->map(function ($item) {
                $variant = $item->productVariant;

                $product = $variant?->product;

                $thumbnail = optional(
                    $product?->images?->where('type', 'thumbnail')->first()
                )->url ?? optional($product?->images?->first())->url;

                return [
                    'id' => $item->id,

                    'price' => (float) $item->price,

                    'limit_quantity' => (int) $item->limit_quantity,

                    'registered_quantity' => (int) $item->registered_quantity,

                    'remaining_quantity' => (int) (
                        $item->limit_quantity - $item->registered_quantity
                    ),

                    'product' => [
                        'id' => $product?->id,
                        'name' => $product?->name,
                        'slug' => $product?->slug,
                        'thumbnail' => $thumbnail,
                    ],

                    'variant' => [
                        'id' => $variant?->id,
                        'sku' => $variant?->sku,
                        'size' => $variant?->size,
                        'color' => $variant?->color,
                        'stock' => $variant?->stock,
                    ],
                ];
            })->values(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | CAMPAIGN ITEMS
    |--------------------------------------------------------------------------
    */

    public function items($id)
    {
        $campaign = Campaign::with([
            'items.productVariant.product'
        ])->findOrFail($id);

        $items = collect($campaign->items)->map(
            function ($item) {

                return [

                    'id' => $item->id,

                    'price' => $item->price,

                    'limit_quantity'
                        => $item->limit_quantity,

                    'registered_quantity'
                        => (int) $item->registered_quantity,

                    'remaining_quantity'
                        => (int) ($item->limit_quantity
                            -
                            $item->registered_quantity),

                    'product_variant' => [

                        'id'
                            => $item->productVariant->id,

                        'size'
                            => $item->productVariant->size,

                        'color'
                            => $item->productVariant->color,

                        'stock'
                            => $item->productVariant->stock,

                        'product' => [

                            'id'
                                => $item->productVariant->product->id,

                            'name'
                                => $item->productVariant->product->name,
                        ]
                    ]
                ];
            }
        );

        return [
            'success' => true,

            'message'
                => 'Lấy campaign items thành công',

            'data' => $items->values(),

            'meta' => [
                'total' => $items->count()
            ]
        ];
    }
}