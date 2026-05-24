<?php

namespace App\Http\Controllers\Api;

use Exception;
use Illuminate\Http\Request;
use App\Services\AddressService;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class AddressController extends Controller
{
    public function __construct( 
        protected AddressService $addressService
    ) {}

    /*
    |--------------------------------------------------------------------------
    | LIST
    |--------------------------------------------------------------------------
    */

    public function index(Request $request)
    {
        try {
            $result = $this->addressService->index(
                $request->user()
            );

            return response()->json($result);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 401);

        } catch (QueryException $e) {
            Log::error('Get address list database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Get address list system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'full_name' => 'required|string|max:255',
                'phone' => 'required|string|max:20',
                'province' => 'required|string|max:255',
                'district' => 'required|string|max:255',
                'ward' => 'required|string|max:255',
                'address_line' => 'required|string|max:500',
                'postal_code' => 'nullable|string|max:20',
                'is_default' => 'nullable|boolean',
            ], [
                'full_name.required' => 'Vui lòng nhập họ tên người nhận',
                'phone.required' => 'Vui lòng nhập số điện thoại',
                'province.required' => 'Vui lòng nhập tỉnh/thành phố',
                'district.required' => 'Vui lòng nhập quận/huyện',
                'ward.required' => 'Vui lòng nhập phường/xã',
                'address_line.required' => 'Vui lòng nhập địa chỉ chi tiết',
            ]);

            $result = $this->addressService->store(
                $request->user(),
                $validated
            );

            return response()->json($result);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu địa chỉ không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 401);

        } catch (QueryException $e) {
            Log::error('Create address database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Create address system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    public function update(Request $request, $id)
    {
        try {
            $request->merge([
                'address_id' => $id,
            ]);

            $validated = $request->validate([
                'address_id' => 'required|integer|min:1',
                'full_name' => 'required|string|max:255',
                'phone' => 'required|string|max:20',
                'province' => 'required|string|max:255',
                'district' => 'required|string|max:255',
                'ward' => 'required|string|max:255',
                'address_line' => 'required|string|max:500',
                'postal_code' => 'nullable|string|max:20',
                'is_default' => 'nullable|boolean',
            ], [
                'address_id.required' => 'Địa chỉ không hợp lệ',
                'address_id.integer' => 'Địa chỉ không hợp lệ',
                'address_id.min' => 'Địa chỉ không hợp lệ',

                'full_name.required' => 'Vui lòng nhập họ tên người nhận',
                'phone.required' => 'Vui lòng nhập số điện thoại',
                'province.required' => 'Vui lòng nhập tỉnh/thành phố',
                'district.required' => 'Vui lòng nhập quận/huyện',
                'ward.required' => 'Vui lòng nhập phường/xã',
                'address_line.required' => 'Vui lòng nhập địa chỉ chi tiết',
            ]);

            $result = $this->addressService->update(
                $request->user(),
                $validated['address_id'],
                $validated
            );

            return response()->json($result);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu địa chỉ không hợp lệ',
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
            Log::error('Update address database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Update address system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    public function destroy(Request $request, $id)
    {
        try {
            $request->merge([
                'address_id' => $id,
            ]);

            $data = $request->validate([
                'address_id' => 'required|integer|min:1',
            ], [
                'address_id.required' => 'Địa chỉ không hợp lệ',
                'address_id.integer' => 'Địa chỉ không hợp lệ',
                'address_id.min' => 'Địa chỉ không hợp lệ',
            ]);

            $result = $this->addressService->destroy(
                $request->user(),
                $data['address_id']
            );

            return response()->json($result);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu địa chỉ không hợp lệ',
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
            Log::error('Delete address database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Delete address system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SET DEFAULT
    |--------------------------------------------------------------------------
    */

    public function setDefault(Request $request, $id)
    {
        try {
            $request->merge([
                'address_id' => $id,
            ]);

            $data = $request->validate([
                'address_id' => 'required|integer|min:1',
            ], [
                'address_id.required' => 'Địa chỉ không hợp lệ',
                'address_id.integer' => 'Địa chỉ không hợp lệ',
                'address_id.min' => 'Địa chỉ không hợp lệ',
            ]);

            $result = $this->addressService->setDefault(
                $request->user(),
                $data['address_id']
            );

            return response()->json($result);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu địa chỉ không hợp lệ',
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
            Log::error('Set default address database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Set default address system error', [
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