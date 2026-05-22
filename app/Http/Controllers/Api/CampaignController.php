<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Services\CampaignService;
use App\Services\MyCampaignService;

use Illuminate\Database\Eloquent\ModelNotFoundException;

class CampaignController extends Controller
{
    protected $campaignService;
    protected $myCampaignService;

    public function __construct(CampaignService $campaignService, MyCampaignService $myCampaignService)
    {
        $this->campaignService = $campaignService;
        $this->myCampaignService = $myCampaignService;
    }

    /**
     * Checkout campaign - tạo đơn hàng từ chiến dịch đã đăng ký
     */
    public function checkout(Request $request)
    {
        try {

            $request->validate([

                'items' => 'required|array|min:1',

                'items.*.user_campaign_item_id'
                    => 'required|exists:user_campaign_items,id',

                'items.*.quantity'
                    => 'required|integer|min:1',

                'address_id' => 'required|exists:addresses,id',

                // 'shipping_name'
                //     => 'required|string',

                // 'shipping_phone'
                //     => 'required|string',

                // 'shipping_address'
                //     => 'required|string',
            ]);

            $result = $this->campaignService->checkout(
                $request->user(),
                $request->all()
            );

            return response()->json([
                'success' => true,
                'message' => 'Checkout campaign thành công',
                'data' => $result
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null
            ], 400);
        }
    }

    /**
     * Đăng ký tham gia chiến dịch (tạo user_campaign + user_campaign_items)
     */
    public function register(Request $request, $id)
    {
        $request->validate([
            'items' => 'required|array|min:1',

            'items.*.campaign_item_id' => 'required|exists:campaign_items,id',

            'items.*.quantity' => 'required|integer|min:1',
        ]);

        try {

            $result = $this->campaignService->register(
                $request->user(),
                $id,
                $request->all()
            );

            return response()->json($result);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null
            ], 400);
        }
    }

    /**
     * Danh sách chiến dịch của tôi (đã đăng ký, đã checkout)
     */
    public function myCampaigns(Request $request)
    {
        try {

            $campaigns = $this->myCampaignService->list(
                $request->user(),
                $request->all()
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy campaigns thành công',
                'data' => $campaigns->items(),
                'meta' => [
                    'current_page' => $campaigns->currentPage(),
                    'last_page' => $campaigns->lastPage(),
                    'per_page' => $campaigns->perPage(),
                    'total' => $campaigns->total(),
                ]
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null
            ], 400);
        }
    }

    /**
     * Chi tiết chiến dịch của tôi (đã đăng ký, đã checkout)
     */
    public function myCampaignDetail(Request $request, $id)
    {
        try {

            $campaign = $this->myCampaignService->detail(
                $request->user(),
                $id
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy campaign detail thành công',
                'data' => $campaign
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null
            ], 400);
        }
    }

    /**
     * Danh sách chiến dịch đang mở (chưa đăng ký, chưa checkout) - có thể tham gia đăng ký hoặc checkout trực tiếp
     */
    public function index(Request $request)
    {
        try {

            $result = $this->campaignService->index($request);

            return response()->json($result);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách campaign',
                'error' => app()->environment('local')
                    ? $e->getMessage()
                    : null,
            ], 500);
        }
    }

    /**
     * Chi tiết chiến dịch (dùng cho trang detail)
     */
    public function show($identifier)
    {
        try {

            $result = $this->campaignService->show($identifier);

            return response()->json($result);

        } catch (ModelNotFoundException $e) {

            return response()->json([
                'success' => false,
                'message' => 'Campaign không tồn tại',
            ], 404);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy chi tiết campaign',
                'error' => app()->environment('local')
                    ? $e->getMessage()
                    : null,
            ], 500);
        }
    }

    /**
     * Danh sách items của chiến dịch (dùng cho trang detail, hoặc checkout) - có thể lấy theo campaign_id hoặc user_campaign_id
     */
    public function items($id)
    {
        try {

            $result = $this->campaignService->items($id);

            return response()->json($result);

        } catch (ModelNotFoundException $e) {

            return response()->json([
                'success' => false,
                'message' => 'Campaign không tồn tại',
            ], 404);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy campaign items',
                'error' => app()->environment('local')
                    ? $e->getMessage()
                    : null,
            ], 500);
        }
    }
}