<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Services\CampaignService;
use App\Services\MyCampaignService;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;
use Illuminate\Support\Facades\Log;

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
            $data = $request->validate([
                'items' => 'required|array|min:1',

                'items.*.user_campaign_item_id' => 'required|integer|exists:user_campaign_items,id',

                'items.*.quantity' => 'required|integer|min:1',

                'address_id' => 'required|integer|exists:addresses,id',
            ], [
                'items.required' => 'Vui lòng chọn sản phẩm campaign cần checkout',
                'items.array' => 'Danh sách sản phẩm campaign không hợp lệ',
                'items.min' => 'Vui lòng chọn ít nhất một sản phẩm campaign',

                'items.*.user_campaign_item_id.required' => 'Sản phẩm campaign không hợp lệ',
                'items.*.user_campaign_item_id.integer' => 'Sản phẩm campaign không hợp lệ',
                'items.*.user_campaign_item_id.exists' => 'Sản phẩm campaign không tồn tại',

                'items.*.quantity.required' => 'Vui lòng nhập số lượng',
                'items.*.quantity.integer' => 'Số lượng không hợp lệ',
                'items.*.quantity.min' => 'Số lượng phải lớn hơn hoặc bằng 1',

                'address_id.required' => 'Vui lòng chọn địa chỉ giao hàng',
                'address_id.integer' => 'Địa chỉ giao hàng không hợp lệ',
                'address_id.exists' => 'Địa chỉ giao hàng không tồn tại',
            ]);

            $result = $this->campaignService->checkout(
                $request->user(),
                $data
            );

            return response()->json([
                'success' => true,
                'message' => 'Checkout campaign thành công',
                'data' => $result,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu checkout campaign không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 403, 404, 409])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Campaign checkout database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Campaign checkout system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    /**
     * Đăng ký tham gia chiến dịch (tạo user_campaign + user_campaign_items)
     */
    public function register(Request $request, $id)
    {
        try {
            $request->merge([
                'campaign_id' => $id,
            ]);

            $data = $request->validate([
                'campaign_id' => 'required|integer|min:1',

                'items' => 'required|array|min:1',

                'items.*.campaign_item_id' => 'required|integer|exists:campaign_items,id',

                'items.*.quantity' => 'required|integer|min:1',
            ], [
                'campaign_id.required' => 'Campaign không hợp lệ',
                'campaign_id.integer' => 'Campaign không hợp lệ',
                'campaign_id.min' => 'Campaign không hợp lệ',

                'items.required' => 'Vui lòng chọn sản phẩm campaign',
                'items.array' => 'Danh sách sản phẩm campaign không hợp lệ',
                'items.min' => 'Vui lòng chọn ít nhất một sản phẩm campaign',

                'items.*.campaign_item_id.required' => 'Sản phẩm campaign không hợp lệ',
                'items.*.campaign_item_id.integer' => 'Sản phẩm campaign không hợp lệ',
                'items.*.campaign_item_id.exists' => 'Sản phẩm campaign không tồn tại',

                'items.*.quantity.required' => 'Vui lòng nhập số lượng',
                'items.*.quantity.integer' => 'Số lượng không hợp lệ',
                'items.*.quantity.min' => 'Số lượng phải lớn hơn hoặc bằng 1',
            ]);

            $result = $this->campaignService->register(
                $request->user(),
                $data['campaign_id'],
                $data
            );

            return response()->json($result);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu đăng ký campaign không hợp lệ',
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 403, 404, 409])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Register campaign database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Register campaign system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    /**
     * Danh sách chiến dịch của tôi (đã đăng ký, đã checkout)
     */
    public function myCampaigns(Request $request)
    {
        try {
            $filters = $request->validate([
                'status' => 'nullable|string|max:50',
                'keyword' => 'nullable|string|max:255',
                'campaign_id' => 'nullable|integer|min:1',
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1',
            ], [
                'status.string' => 'Trạng thái đăng ký không hợp lệ',
                'status.max' => 'Trạng thái đăng ký không hợp lệ',

                'keyword.string' => 'Từ khóa tìm kiếm không hợp lệ',
                'keyword.max' => 'Từ khóa tìm kiếm không được vượt quá 255 ký tự',

                'campaign_id.integer' => 'Campaign không hợp lệ',
                'campaign_id.min' => 'Campaign không hợp lệ',

                'page.integer' => 'Số trang không hợp lệ',
                'page.min' => 'Số trang phải lớn hơn hoặc bằng 1',

                'per_page.integer' => 'Số campaign mỗi trang không hợp lệ',
                'per_page.min' => 'Số campaign mỗi trang phải lớn hơn hoặc bằng 1',
            ]);

            $campaigns = $this->myCampaignService->list(
                $request->user(),
                $filters
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
                ],
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bộ lọc campaign không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 404])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Get my campaigns database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Get my campaigns system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    /**
     * Chi tiết chiến dịch của tôi (đã đăng ký, đã checkout)
     */
    public function myCampaignDetail(Request $request, $id)
    {
        try {
            $request->merge([
                'user_campaign_id' => $id,
            ]);

            $data = $request->validate([
                'user_campaign_id' => 'required|integer|min:1',
            ], [
                'user_campaign_id.required' => 'Campaign đăng ký không hợp lệ',
                'user_campaign_id.integer' => 'Campaign đăng ký không hợp lệ',
                'user_campaign_id.min' => 'Campaign đăng ký không hợp lệ',
            ]);

            $campaign = $this->myCampaignService->myCampaignDetail(
                $request->user(),
                $data['user_campaign_id']
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy campaign detail thành công',
                'data' => $campaign,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu campaign không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 404])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Get my campaign detail database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Get my campaign detail system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    /**
     * Danh sách chiến dịch đang mở (chưa đăng ký, chưa checkout) - có thể tham gia đăng ký hoặc checkout trực tiếp
     */
    public function index(Request $request)
    {
        try {
            $filters = $request->validate([
                'keyword' => 'nullable|string|max:255',

                'status' => 'nullable|in:upcoming,active,ended',

                'sort' => 'nullable|in:latest,ending_soon,popular',

                'page' => 'nullable|integer|min:1',

                'per_page' => 'nullable|integer|min:1',
            ], [
                'keyword.string' => 'Từ khóa tìm kiếm không hợp lệ',
                'keyword.max' => 'Từ khóa tìm kiếm không được vượt quá 255 ký tự',

                'status.in' => 'Trạng thái campaign không hợp lệ',

                'sort.in' => 'Kiểu sắp xếp không hợp lệ',

                'page.integer' => 'Số trang không hợp lệ',
                'page.min' => 'Số trang phải lớn hơn hoặc bằng 1',

                'per_page.integer' => 'Số campaign mỗi trang không hợp lệ',
                'per_page.min' => 'Số campaign mỗi trang phải lớn hơn hoặc bằng 1',
            ]);

            $result = $this->campaignService->index($filters);

            return response()->json($result);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bộ lọc campaign không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 403, 404, 409])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Get campaign list database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Get campaign list system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    /**
     * Chi tiết chiến dịch (dùng cho trang detail)
     */
    public function show(Request $request, $identifier)
    {
        try {
            $request->merge([
                'identifier' => $identifier,
            ]);

            $data = $request->validate([
                'identifier' => 'required|string|max:255',
            ], [
                'identifier.required' => 'Campaign không hợp lệ',
                'identifier.string' => 'Campaign không hợp lệ',
                'identifier.max' => 'Campaign không hợp lệ',
            ]);

            $result = $this->campaignService->show(
                $data['identifier']
            );

            return response()->json($result);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Campaign không hợp lệ',
            ], 422);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 404])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Get campaign detail database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
            ], 500);

        } catch (Throwable $e) {
            Log::error('Get campaign detail system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
            ], 500);
        }
    }

    /**
     * Danh sách items của chiến dịch (dùng cho trang detail, hoặc checkout) - có thể lấy theo campaign_id hoặc user_campaign_id
     */
    public function items(Request $request, $id)
    {
        try {
            $request->merge([
                'campaign_id' => $id,
            ]);

            $data = $request->validate([
                'campaign_id' => 'required|integer|min:1',
            ], [
                'campaign_id.required' => 'Campaign không hợp lệ',
                'campaign_id.integer' => 'Campaign không hợp lệ',
                'campaign_id.min' => 'Campaign không hợp lệ',
            ]);

            $result = $this->campaignService->items(
                $data['campaign_id']
            );

            return response()->json($result);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Campaign không hợp lệ',
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 404])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Get campaign items database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Get campaign items system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }
}