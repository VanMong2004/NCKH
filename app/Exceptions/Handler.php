<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
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
            if ($e instanceof ThrottleRequestsException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.',
                    'errors' => [
                        'rate_limit' => ['Vui lòng chờ rồi thử lại.'],
                    ],
                    'data' => null,
                ], 429);
            }

            return response()->json([
                'message' => $e->getMessage()
            ], 400);
        }

        return parent::render($request, $e);
    }
}
