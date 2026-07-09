<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    public function render($request, Throwable $e)
    {
        if ($request->is('api/*')) {
            if ($e instanceof HttpResponseException) {
                return $e->getResponse();
            }

            if ($e instanceof ThrottleRequestsException || $e instanceof TooManyRequestsHttpException) {
                return $this->tooManyRequestsResponse('Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.');
            }

            if ($e instanceof HttpExceptionInterface) {
                $status = $e->getStatusCode();

                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage() ?: $this->defaultHttpMessage($status),
                    'data' => null,
                ], $status);
            }

            return response()->json([
                'message' => $e->getMessage()
            ], 400);
        }

        return parent::render($request, $e);
    }

    private function tooManyRequestsResponse(string $message)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => [
                'rate_limit' => ['Vui lòng chờ rồi thử lại.'],
            ],
            'data' => null,
        ], 429);
    }

    private function defaultHttpMessage(int $status): string
    {
        return match ($status) {
            401 => 'Vui lòng đăng nhập',
            403 => 'Bạn không có quyền thực hiện thao tác này',
            404 => 'Không tìm thấy dữ liệu',
            422 => 'Dữ liệu không hợp lệ',
            429 => 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.',
            default => 'Đã xảy ra lỗi, vui lòng thử lại',
        };
    }
}
