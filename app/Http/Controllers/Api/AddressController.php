<?php

namespace App\Http\Controllers\Api;

use Exception;
use Illuminate\Http\Request;
use App\Services\AddressService;
use App\Http\Controllers\Controller;

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

            return response()->json(
                $this->addressService->index(
                    $request->user()
                )
            );

        } catch (Exception $e) {

            return response()->json([

                'success' => false,

                'message'
                    => $e->getMessage(),

                'data'
                    => null,

            ], 400);
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

                'full_name'
                    => 'required|string|max:255',

                'phone'
                    => 'required|string|max:20',

                'province'
                    => 'required|string|max:255',

                'district'
                    => 'required|string|max:255',

                'ward'
                    => 'required|string|max:255',

                'address_line'
                    => 'required|string|max:500',

                'postal_code'
                    => 'nullable|string|max:20',

                'is_default'
                    => 'nullable|boolean',
            ]);

            return response()->json(
                $this->addressService->store(
                    $request->user(),
                    $validated
                )
            );

        } catch (Exception $e) {

            return response()->json([

                'success' => false,

                'message'
                    => $e->getMessage(),

                'data'
                    => null,

            ], 400);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    public function update(
        Request $request,
        $id
    ) {
        try {

            $validated = $request->validate([

                'full_name'
                    => 'required|string|max:255',

                'phone'
                    => 'required|string|max:20',

                'province'
                    => 'required|string|max:255',

                'district'
                    => 'required|string|max:255',

                'ward'
                    => 'required|string|max:255',

                'address_line'
                    => 'required|string|max:500',

                'postal_code'
                    => 'nullable|string|max:20',

                'is_default'
                    => 'nullable|boolean',
            ]);

            return response()->json(
                $this->addressService->update(
                    $request->user(),
                    $id,
                    $validated
                )
            );

        } catch (Exception $e) {

            return response()->json([

                'success' => false,

                'message'
                    => $e->getMessage(),

                'data'
                    => null,

            ], 400);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    public function destroy(
        Request $request,
        $id
    ) {
        try {

            return response()->json(
                $this->addressService->destroy(
                    $request->user(),
                    $id
                )
            );

        } catch (Exception $e) {

            return response()->json([

                'success' => false,

                'message'
                    => $e->getMessage(),

                'data'
                    => null,

            ], 400);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SET DEFAULT
    |--------------------------------------------------------------------------
    */

    public function setDefault(
        Request $request,
        $id
    ) {
        try {

            return response()->json(
                $this->addressService->setDefault(
                    $request->user(),
                    $id
                )
            );

        } catch (Exception $e) {

            return response()->json([

                'success' => false,

                'message'
                    => $e->getMessage(),

                'data'
                    => null,

            ], 400);
        }
    }
}