<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PolicyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use RuntimeException;
use Throwable;

class PolicyController extends Controller
{
    public function __construct(
        protected PolicyService $policyService
    ) {}

    public function index(Request $request)
    {
        try {
            $filters = $request->validate([
                'type' => 'nullable|string|max:100',
            ], [
                'type.string' => 'Loại chính sách không hợp lệ',
                'type.max' => 'Loại chính sách không hợp lệ',
            ]);

            $result = $this->policyService->list($filters);

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách chính sách thành công',
                'data' => $result,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bộ lọc chính sách không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (Throwable $e) {
            Log::error('Get policy list error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function show(Request $request, $slug)
    {
        try {
            $request->merge([
                'slug' => $slug,
            ]);

            $data = $request->validate([
                'slug' => 'required|string|max:255',
            ], [
                'slug.required' => 'Chính sách không hợp lệ',
                'slug.string' => 'Chính sách không hợp lệ',
                'slug.max' => 'Chính sách không hợp lệ',
            ]);

            $result = $this->policyService->show($data['slug']);

            return response()->json([
                'success' => true,
                'message' => 'Lấy chi tiết chính sách thành công',
                'data' => $result,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Chính sách không hợp lệ',
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 404);

        } catch (Throwable $e) {
            Log::error('Get policy detail error', [
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