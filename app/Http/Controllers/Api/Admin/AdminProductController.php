<?php

namespace App\Http\Controllers\Api\Admin;

use Exception;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use App\Services\Admin\AdminProductService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;

class AdminProductController extends Controller
{
    protected $adminProductService;

    public function __construct(
        AdminProductService $adminProductService
    ) {
        $this->adminProductService = $adminProductService;
    }

    public function index(Request $request)
    {
        try {

            return response()->json(
                $this->adminProductService->index($request)
            );

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách sản phẩm',
                'error' => app()->environment('local')
                    ? $e->getMessage()
                    : null,
            ], 500);
        }
    }

    public function show($id)
    {
        try {

            return response()->json(
                $this->adminProductService->show($id)
            );

        } catch (ModelNotFoundException $e) {

            return response()->json([
                'success' => false,
                'message' => 'Sản phẩm không tồn tại',
            ], 404);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy chi tiết sản phẩm',
                'error' => app()->environment('local')
                    ? $e->getMessage()
                    : null,
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {

            validator($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'category_id' => 'required|exists:categories,id',
                'is_active' => 'required|boolean',
                'is_featured' => 'required|boolean',
                'department_id' => 'nullable|exists:departments,id',
                'author' => 'nullable|string|max:255',

                'images' => 'required|array|min:1|max:10',
                'images.*' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
                
                'variants' => 'required|array|min:1',
                'variants.*.id' => 'nullable|integer|exists:product_variants,id',
                'variants.*.sku' => 'nullable|string|max:100',
                'variants.*.attributes' => 'nullable|array',
                'variants.*.size' => 'nullable|string|max:50',
                'variants.*.color' => 'nullable|string|max:50',
                'variants.*.price' => 'required|numeric|min:0',
                'variants.*.stock' => 'required|integer|min:0',
                'variants.*.is_active' => 'nullable|boolean',

            ], $this->validationMessages())->validate();

            // dd($request->all());

            return response()->json(
                $this->adminProductService->store($request)
            );

        } catch (ValidationException $e) {

            return $this->validationError($e);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => app()->environment('local')
                    ? $e->getMessage()
                    : null,
            ], 400);
        }
    }

    public function update(Request $request, $id)
    {
        try {

            validator($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'department_id' => 'nullable|exists:departments,id',
                'author' => 'nullable|string|max:255',
                'category_id' => 'required|exists:categories,id',
                'is_active' => 'required|boolean',
                'is_featured' => 'required|boolean',

                'images' => 'nullable|array|min:1|max:10',
                'images.*' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
                
                'variants' => 'nullable|array|min:1',
                'variants.*.id' => 'nullable|integer|exists:product_variants,id',
                'variants.*.sku' => 'nullable|string|max:100',
                'variants.*.attributes' => 'nullable|array',
                'variants.*.size' => 'nullable|string|max:50',
                'variants.*.color' => 'nullable|string|max:50',
                'variants.*.price' => 'nullable|numeric|min:0',
                'variants.*.stock' => 'nullable|integer|min:0',
                'variants.*.is_active' => 'nullable|boolean',
                
            ], $this->validationMessages())->validate();

            return response()->json(
                $this->adminProductService->update(
                    $request,
                    $id
                )
            );

        } catch (ValidationException $e) {

            return $this->validationError($e);

        } catch (ModelNotFoundException $e) {

            return response()->json([
                'success' => false,
                'message' => 'Sản phẩm không tồn tại',
            ], 404);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => app()->environment('local')
                    ? $e->getMessage()
                    : null,
            ], 400);
        }
    }

    public function destroy($id)
    {
        try {

            return response()->json(
                $this->adminProductService->destroy($id)
            );

        } catch (ModelNotFoundException $e) {

            return response()->json([
                'success' => false,
                'message' => 'Sản phẩm không tồn tại',
            ], 404);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => app()->environment('local')
                    ? $e->getMessage()
                    : null,
            ], 400);
        }
    }

    public function toggleProductSale(Request $request, $id)
    {
        try {
            $isActive = $this->booleanInput(
                $request,
                ['is_active', 'isActive', 'active'],
                'Vui lòng truyền trạng thái mở bán',
                'Trạng thái mở bán không hợp lệ'
            );

            $result = $this->adminProductService->toggleProductSale($id, $isActive);
            $result['message'] = $isActive ? 'Đã mở bán sản phẩm' : 'Đã tắt bán sản phẩm';

            return response()->json($result);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 400);
        }
    }

    public function toggleVariantSale(Request $request, $id)
    {
        try {
            $isActive = $this->booleanInput(
                $request,
                ['is_active', 'isActive', 'active'],
                'Vui lòng truyền trạng thái mở bán',
                'Trạng thái mở bán không hợp lệ'
            );

            if ($isActive) {
                $variant = ProductVariant::with('product')->findOrFail($id);

                if (!$variant->product?->is_active) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Không thể mở bán biến thể khi sản phẩm đang bị tắt bán',
                        'data' => null,
                    ], 400);
                }
            }

            $result = $this->adminProductService->toggleVariantSale($id, $isActive);
            $result['message'] = $isActive ? 'Đã mở bán biến thể sản phẩm' : 'Đã tắt bán biến thể sản phẩm';

            return response()->json($result);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 400);
        }
    }

    public function generateFacebookCaption(Request $request, $id)
    {
        try {
            $data = validator($request->all(), [
                'style' => 'nullable|string|in:intro,promotion,sales',
            ], $this->validationMessages())->validate();

            $result = $this->adminProductService->generateFacebookCaption($id, $data['style'] ?? 'intro');
            $result['message'] = 'Đã tạo nội dung bài đăng bằng AI';

            return response()->json($result);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 400);
        }
    }

    public function postFacebook(Request $request, $id)
    {
        try {
            $data = validator($request->all(), [
                'content' => 'nullable|string|max:5000',
                'style' => 'nullable|string|in:intro,promotion,sales',
            ], $this->validationMessages())->validate();

            $result = $this->adminProductService->postFacebook($id, $data);
            $result['message'] = 'Đã gửi yêu cầu đăng Facebook sang n8n';

            return response()->json($result);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 400);
        }
    }

    private function booleanInput(Request $request, array $keys, string $requiredMessage, string $invalidMessage): bool
    {
        foreach ($keys as $key) {
            if (!$request->has($key)) {
                continue;
            }

            $value = $request->input($key);

            if (is_bool($value)) {
                return $value;
            }

            if (is_int($value)) {
                return $value === 1;
            }

            if (is_string($value)) {
                $normalized = strtolower(trim($value));

                if (in_array($normalized, ['1', 'true', 'on', 'yes'], true)) {
                    return true;
                }

                if (in_array($normalized, ['0', 'false', 'off', 'no'], true)) {
                    return false;
                }
            }

            throw new Exception($invalidMessage);
        }

        throw new Exception($requiredMessage);
    }

    private function validationMessages(): array
    {
        return [
            'name.required' => 'Vui lòng nhập tên sản phẩm',
            'name.max' => 'Tên sản phẩm không được vượt quá 255 ký tự',
            'category_id.required' => 'Vui lòng chọn danh mục sản phẩm',
            'category_id.exists' => 'Danh mục sản phẩm không tồn tại',
            'is_active.required' => 'Vui lòng truyền trạng thái mở bán',
            'is_active.boolean' => 'Trạng thái mở bán không hợp lệ',
            'is_featured.required' => 'Vui lòng truyền trạng thái nổi bật',
            'is_featured.boolean' => 'Trạng thái nổi bật không hợp lệ',
            'active.required' => 'Vui lòng truyền trạng thái',
            'active.boolean' => 'Trạng thái không hợp lệ',
            'images.required' => 'Vui lòng chọn ít nhất một ảnh sản phẩm',
            'images.array' => 'Danh sách ảnh sản phẩm không hợp lệ',
            'images.min' => 'Vui lòng chọn ít nhất một ảnh sản phẩm',
            'images.max' => 'Chỉ được tải lên tối đa 10 ảnh sản phẩm',
            'images.*.image' => 'File tải lên phải là hình ảnh',
            'images.*.mimes' => 'Ảnh sản phẩm chỉ hỗ trợ jpg, jpeg, png, webp',
            'images.*.max' => 'Mỗi ảnh sản phẩm không được vượt quá 5MB',
            'variants.required' => 'Vui lòng thêm ít nhất một biến thể sản phẩm',
            'variants.array' => 'Danh sách biến thể không hợp lệ',
            'variants.min' => 'Vui lòng thêm ít nhất một biến thể sản phẩm',
            'variants.*.price.required' => 'Vui lòng nhập giá biến thể',
            'variants.*.price.numeric' => 'Giá biến thể không hợp lệ',
            'variants.*.price.min' => 'Giá biến thể không được âm',
            'variants.*.stock.required' => 'Vui lòng nhập tồn kho biến thể',
            'variants.*.stock.integer' => 'Tồn kho biến thể không hợp lệ',
            'variants.*.stock.min' => 'Tồn kho biến thể không được âm',
            'variants.*.is_active.boolean' => 'Trạng thái biến thể không hợp lệ',
            'content.max' => 'Nội dung bài đăng không được vượt quá 5000 ký tự',
            'style.in' => 'Phong cách nội dung không hợp lệ',
        ];
    }

    private function validationError(ValidationException $e)
    {
        $firstError = collect($e->errors())->flatten()->first();

        return response()->json([
            'success' => false,
            'message' => $firstError ?: 'Dữ liệu không hợp lệ',
            'errors' => $e->errors(),
            'data' => null,
        ], 422);
    }
}
