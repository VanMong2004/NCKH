<?php

namespace App\Http\Controllers\Api\Admin;

use Throwable;
use RuntimeException;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Services\Admin\AdminUserService;
use Illuminate\Validation\ValidationException;

class AdminUserController extends Controller
{
    public function __construct(
        protected AdminUserService $service
    ) {}

    public function index(Request $request)
    {
        try {
            $filters = $request->validate([
                'keyword' => 'nullable|string|max:255',
                'role' => 'nullable|string|in:user,admin',
                'per_page' => 'nullable|integer|min:1|max:100',
                'sort' => 'nullable|string|max:50',
                'with_deleted' => 'nullable|boolean',
            ]);

            return response()->json(
                $this->service->index($filters)
            );
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bộ lọc người dùng không hợp lệ',
                'errors' => $e->errors(),
            ], 422);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách người dùng',
                'data' => null,
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            return response()->json(
                $this->service->show((int) $id)
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $this->httpStatus($e));
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy chi tiết người dùng',
                'data' => null,
            ], 500);
        }
    }

    public function updateRole(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'role' => 'required|string|in:user,admin',
            ]);

            return response()->json(
                $this->service->updateRole((int) $id, $data['role'])
            );
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Vai trò người dùng không hợp lệ',
                'errors' => $e->errors(),
            ], 422);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $this->httpStatus($e));
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật vai trò người dùng',
                'data' => null,
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            return response()->json(
                $this->service->destroy((int) $id)
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $this->httpStatus($e));
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi khóa tài khoản người dùng',
                'data' => null,
            ], 500);
        }
    }

    public function lock($id)
    {
        try {
            return response()->json(
                $this->service->lock((int) $id)
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $this->httpStatus($e));
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi khóa tài khoản người dùng',
                'data' => null,
            ], 500);
        }
    }

    public function unlock($id)
    {
        try {
            return response()->json(
                $this->service->unlock((int) $id)
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $this->httpStatus($e));
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi mở khóa tài khoản người dùng',
                'data' => null,
            ], 500);
        }
    }

    public function restore($id)
    {
        try {
            return response()->json(
                $this->service->restore((int) $id)
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $this->httpStatus($e));
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi mở khóa tài khoản người dùng',
                'data' => null,
            ], 500);
        }
    }

    private function httpStatus(Throwable $e, int $fallback = 400): int
    {
        $code = $e->getCode();

        return is_int($code) && in_array($code, [400, 401, 403, 404, 409, 422, 500], true)
            ? $code
            : $fallback;
    }
}
