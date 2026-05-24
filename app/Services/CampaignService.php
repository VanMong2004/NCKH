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
use RuntimeException;

class CampaignService
{
    public function checkout($user, array $data)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        $order = DB::transaction(function () use ($user, $data) {
            $total = 0;

            $address = Address::query()
                ->where('user_id', $user->id)
                ->find($data['address_id']);

            if (!$address) {
                throw new RuntimeException('Địa chỉ giao hàng không tồn tại', 404);
            }

            $order = Order::create([
                'user_id' => $user->id,

                'type' => 'campaign',

                'status' => 'pending',

                'order_code' => 'CP-' . strtoupper(Str::random(8)),

                'shipping_name' => $address->full_name,

                'shipping_phone' => $address->phone,

                'shipping_address' => implode(', ', [
                    $address->address_line,
                    $address->ward,
                    $address->district,
                    $address->province,
                ]),

                'total' => 0,

                'shipping_fee' => 0,
            ]);

            event(new \App\Events\OrderCreated($order));

            foreach ($data['items'] as $inputItem) {
                $userCampaignItem = UserCampaignItem::with([
                    'campaignItem.productVariant.product',
                    'userCampaign.campaign',
                ])
                    ->lockForUpdate()
                    ->find($inputItem['user_campaign_item_id']);

                if (!$userCampaignItem) {
                    throw new RuntimeException('Sản phẩm campaign không tồn tại', 404);
                }

                if (!$userCampaignItem->userCampaign) {
                    throw new RuntimeException('Thông tin đăng ký campaign không hợp lệ', 400);
                }

                if ((int) $userCampaignItem->userCampaign->user_id !== (int) $user->id) {
                    throw new RuntimeException('Bạn không có quyền checkout sản phẩm này', 403);
                }

                if ($userCampaignItem->status !== 'approved') {
                    throw new RuntimeException('Sản phẩm campaign chưa được duyệt', 400);
                }

                if (
                    $userCampaignItem->userCampaign->expires_at
                    && now()->gt($userCampaignItem->userCampaign->expires_at)
                ) {
                    throw new RuntimeException('Campaign đã hết hạn checkout', 400);
                }

                $remain =
                    $userCampaignItem->approved_quantity
                    - $userCampaignItem->paid_quantity
                    - $userCampaignItem->reserved_quantity;

                if ($inputItem['quantity'] > $remain) {
                    throw new RuntimeException(
                        "Chỉ còn {$remain} sản phẩm có thể checkout",
                        400
                    );
                }

                $campaignItem = $userCampaignItem->campaignItem;

                if (!$campaignItem) {
                    throw new RuntimeException('Thông tin sản phẩm campaign không hợp lệ', 400);
                }

                $variant = $campaignItem->productVariant;

                if (!$variant) {
                    throw new RuntimeException('Biến thể sản phẩm không tồn tại', 404);
                }

                $available = $variant->stock - $variant->reserved_stock;

                if ($available < $inputItem['quantity']) {
                    $productName = $variant->product?->name ?? 'Sản phẩm';

                    throw new RuntimeException(
                        "Sản phẩm {$productName} không đủ tồn kho",
                        400
                    );
                }

                $variant->increment(
                    'reserved_stock',
                    $inputItem['quantity']
                );

                $price = $campaignItem->price;

                $lineTotal = $price * $inputItem['quantity'];

                OrderItem::create([
                    'order_id' => $order->id,

                    'product_variant_id' => $variant->id,

                    'campaign_item_id' => $campaignItem->id,

                    'user_campaign_item_id' => $userCampaignItem->id,

                    'price' => $price,

                    'quantity' => $inputItem['quantity'],

                    'product_name' => $variant->product?->name ?? 'Sản phẩm',

                    'variant_snapshot' => "Size: {$variant->size}, Color: {$variant->color}",
                ]);

                $userCampaignItem->increment(
                    'reserved_quantity',
                    $inputItem['quantity']
                );

                $total += $lineTotal;
            }

            $order->update([
                'total' => $total,
            ]);

            return $order;
        });

        CancelPendingOrderJob::dispatch($order->id)
            ->delay(
                now()->addMinutes(
                    config('app.order_auto_cancel_minutes')
                )
            );

        return [
            'order_id' => $order->id,
            'order_code' => $order->order_code,
            'total' => $order->total,
        ];
    }

    public function register($user, $campaignId, array $data)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        return DB::transaction(function () use ($user, $campaignId, $data) {
            $campaign = Campaign::with('items')
                ->find($campaignId);

            if (!$campaign) {
                throw new RuntimeException('Campaign không tồn tại', 404);
            }

            if (!$campaign->isActive()) {
                throw new RuntimeException('Campaign hiện không hoạt động', 400);
            }

            $exists = UserCampaign::where('user_id', $user->id)
                ->where('campaign_id', $campaignId)
                ->exists();

            if ($exists) {
                throw new RuntimeException('Bạn đã đăng ký campaign này', 409);
            }

            if ($campaign->limit) {
                $count = UserCampaign::where('campaign_id', $campaignId)
                    ->count();

                if ($count >= $campaign->limit) {
                    throw new RuntimeException('Campaign đã đủ số lượng đăng ký', 400);
                }
            }

            $userCampaign = UserCampaign::create([
                'user_id' => $user->id,
                'campaign_id' => $campaignId,
                'status' => 'pending',
            ]);

            foreach ($data['items'] as $itemData) {
                $campaignItem = CampaignItem::lockForUpdate()
                    ->find($itemData['campaign_item_id']);

                if (!$campaignItem) {
                    throw new RuntimeException('Sản phẩm campaign không tồn tại', 404);
                }

                if ((int) $campaignItem->campaign_id !== (int) $campaignId) {
                    throw new RuntimeException('Sản phẩm không thuộc campaign này', 400);
                }

                if ($itemData['quantity'] <= 0) {
                    throw new RuntimeException('Số lượng đăng ký không hợp lệ', 400);
                }

                if ($campaignItem->limit_quantity) {
                    $registered = UserCampaignItem::where(
                        'campaign_item_id',
                        $campaignItem->id
                    )->sum('quantity');

                    if (($registered + $itemData['quantity']) > $campaignItem->limit_quantity) {
                        throw new RuntimeException(
                            "Sản phẩm {$campaignItem->id} đã hết slot",
                            400
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
                'data' => $userCampaign->load('items'),
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | LIST CAMPAIGNS
    |--------------------------------------------------------------------------
    */

    public function index(array $filters)
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

        if (!empty($filters['keyword'])) {
            $keyword = $filters['keyword'];

            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', '%' . $keyword . '%')
                    ->orWhere(
                        'description',
                        'like',
                        '%' . $keyword . '%'
                    );
            });
        }

        /*
        |--------------------------------------------------------------------------
        | STATUS
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['status'])) {
            switch ($filters['status']) {
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

        switch ($filters['sort'] ?? 'latest') {
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
                break;
        }

        /*
        |--------------------------------------------------------------------------
        | PAGINATION
        |--------------------------------------------------------------------------
        */

        $campaigns = $query->paginate(
            $filters['per_page'] ?? 10
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

                    'description' => $campaign->description,

                    'banner' => $campaign->banner,

                    'thumbnail' => $campaign->thumbnail,

                    'start_date' => $campaign->start_date,

                    'end_date' => $campaign->end_date,

                    'status' => $campaign->status,

                    'countdown_seconds' => $campaign->end_date
                        ? now()->diffInSeconds($campaign->end_date, false)
                        : null,

                    'total_items' => $campaign->items_count,

                    'registered_quantity' => (int) $registeredQuantity,

                    'remaining_quantity' => (int) ($limitQuantity - $registeredQuantity),
                ];
            })
            ->values();

        return [
            'success' => true,

            'message' => 'Lấy danh sách campaign thành công',

            'data' => $data,

            'meta' => [
                'current_page' => $campaigns->currentPage(),

                'last_page' => $campaigns->lastPage(),

                'per_page' => $campaigns->perPage(),

                'total' => $campaigns->total(),
            ],
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
            ->first();

        if (!$campaign) {
            throw new RuntimeException('Campaign không tồn tại', 404);
        }

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
            'items.productVariant.product',
        ])->find($id);

        if (!$campaign) {
            throw new RuntimeException('Campaign không tồn tại', 404);
        }

        $items = collect($campaign->items)->map(
            function ($item) {
                $variant = $item->productVariant;

                if (!$variant || !$variant->product) {
                    throw new RuntimeException('Dữ liệu sản phẩm campaign không hợp lệ', 400);
                }

                return [
                    'id' => $item->id,

                    'price' => $item->price,

                    'limit_quantity' => $item->limit_quantity,

                    'registered_quantity' => (int) $item->registered_quantity,

                    'remaining_quantity' => (int) (
                        $item->limit_quantity - $item->registered_quantity
                    ),

                    'product_variant' => [
                        'id' => $variant->id,

                        'size' => $variant->size,

                        'color' => $variant->color,

                        'stock' => $variant->stock,

                        'product' => [
                            'id' => $variant->product->id,

                            'name' => $variant->product->name,
                        ],
                    ],
                ];
            }
        );

        return [
            'success' => true,

            'message' => 'Lấy campaign items thành công',

            'data' => $items->values(),

            'meta' => [
                'total' => $items->count(),
            ],
        ];
    }
}