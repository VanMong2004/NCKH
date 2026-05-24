<?php

namespace App\Traits;

use Throwable;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

trait ApiResponseTrait
{
    protected function success(
        $data = null,
        string $message = 'Thực hiện thành công',
        int $code = 200
    ) {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    protected function error(
        string $message = 'Có lỗi xảy ra',
        int $code = 400,
        $data = null
    ) {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    protected function errorFromException(Throwable $e)
    {
        if ($e instanceof ValidationException) {
            return $this->error(
                $e->validator->errors()->first(),
                422,
                $e->validator->errors()
            );
        }

        if ($e instanceof ModelNotFoundException) {
            return $this->error(
                'Dữ liệu không tồn tại',
                404
            );
        }

        if ($e instanceof HttpExceptionInterface) {
            return $this->error(
                $e->getMessage() ?: 'Có lỗi xảy ra',
                $e->getStatusCode()
            );
        }

        $message = config('app.debug')
            ? $e->getMessage()
            : 'Có lỗi xảy ra, vui lòng thử lại';

        return $this->error(
            $message,
            400
        );
    }
}