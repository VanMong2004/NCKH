<?php

namespace App\Services\Admin;

use RuntimeException;
use App\Models\User;

class AdminUserService
{
    public function index(array $filters = []): array
    {
        $query = User::query()
            ->select([
                'id',
                'name',
                'email',
                'phone',
                'mssv',
                'role',
                'avatar',
                'locked_at',
                'created_at',
                'deleted_at',
            ])
            ->withCount([
                'orders',
                'reviews',
            ]);

        if (!empty($filters['with_deleted'])) {
            $query->withTrashed();
        }

        if (!empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        if (!empty($filters['keyword'])) {
            $keyword = $filters['keyword'];

            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                    ->orWhere('email', 'like', "%{$keyword}%")
                    ->orWhere('phone', 'like', "%{$keyword}%")
                    ->orWhere('mssv', 'like', "%{$keyword}%");
            });
        }

        ($filters['sort'] ?? 'latest') === 'oldest'
            ? $query->oldest()
            : $query->latest();

        $perPage = min(max((int) ($filters['per_page'] ?? 10), 1), 100);

        $users = $query->paginate($perPage);

        $users->setCollection(
            $users->getCollection()
                ->map(fn ($user) => $this->formatListItem($user))
        );

        return [
            'success' => true,
            'message' => 'Lấy danh sách người dùng thành công',
            'data' => $users,
        ];
    }

    public function show(int $id): array
    {
        $user = User::withTrashed()
            ->select([
                'id',
                'name',
                'email',
                'phone',
                'mssv',
                'role',
                'avatar',
                'locked_at',
                'created_at',
                'deleted_at',
            ])
            ->with([
                'addresses:id,user_id,full_name,phone,province,district,ward,address_line,postal_code,is_default',
                'orders' => function ($q) {
                    $q->select([
                        'id',
                        'user_id',
                        'order_code',
                        'status',
                        'total',
                        'created_at',
                    ])
                        ->latest()
                        ->limit(10);
                },
            ])
            ->withCount([
                'orders',
                'reviews',
            ])
            ->find($id);

        if (!$user) {
            throw new RuntimeException('Người dùng không tồn tại', 404);
        }

        return [
            'success' => true,
            'message' => 'Lấy chi tiết người dùng thành công',
            'data' => $this->formatDetail($user),
        ];
    }

    public function updateRole(int $id, string $role): array
    {
        $user = User::find($id);

        if (!$user) {
            throw new RuntimeException('Người dùng không tồn tại', 404);
        }

        if ($user->id === auth()->id() && $role !== 'admin') {
            throw new RuntimeException(
                'Không thể tự hạ quyền quản trị của chính mình',
                400
            );
        }

        $user->update([
            'role' => $role,
        ]);

        return [
            'success' => true,
            'message' => 'Cập nhật vai trò người dùng thành công',
            'data' => $this->formatDetail($user->fresh()),
        ];
    }

    public function destroy(int $id): array
    {
        $user = User::find($id);

        if (!$user) {
            throw new RuntimeException('Người dùng không tồn tại', 404);
        }

        if ($user->id === auth()->id()) {
            throw new RuntimeException('Không thể xóa tài khoản của chính mình', 400);
        }

        $user->delete();

        return [
            'success' => true,
            'message' => 'Xóa tài khoản người dùng thành công',
            'data' => null,
        ];
    }

    public function lock(int $id): array
    {
        $user = User::withTrashed()->find($id);

        if (!$user) {
            throw new RuntimeException('Người dùng không tồn tại', 404);
        }

        if ($user->trashed()) {
            throw new RuntimeException('Tài khoản đã bị xóa, không thể khóa', 400);
        }

        if ($user->id === auth()->id()) {
            throw new RuntimeException('Không thể khóa tài khoản của chính mình', 400);
        }

        if ($user->locked_at) {
            throw new RuntimeException('Tài khoản này đã bị khóa', 400);
        }

        $user->update([
            'locked_at' => now(),
        ]);

        return [
            'success' => true,
            'message' => 'Khóa tài khoản người dùng thành công',
            'data' => $this->formatDetail($user->fresh()),
        ];
    }

    public function unlock(int $id): array
    {
        $user = User::withTrashed()->find($id);

        if (!$user) {
            throw new RuntimeException('Người dùng không tồn tại', 404);
        }

        if ($user->trashed()) {
            throw new RuntimeException('Tài khoản đã bị xóa, không thể mở khóa', 400);
        }

        if (!$user->locked_at) {
            throw new RuntimeException('Tài khoản này chưa bị khóa', 400);
        }

        $user->update([
            'locked_at' => null,
        ]);

        return [
            'success' => true,
            'message' => 'Mở khóa tài khoản người dùng thành công',
            'data' => $this->formatDetail($user->fresh()),
        ];
    }

    private function formatListItem(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'mssv' => $user->mssv,
            'role' => $user->role,
            'avatar_url' => $user->avatar_url,
            'orders_count' => $user->orders_count ?? 0,
            'reviews_count' => $user->reviews_count ?? 0,
            'is_deleted' => !is_null($user->deleted_at),
            'created_at' => optional($user->created_at)->format('d/m/Y H:i'),
            'is_locked' => !is_null($user->locked_at),
            'locked_at' => optional($user->locked_at)->format('d/m/Y H:i'),
        ];
    }

    private function formatDetail(User $user): array
    {
        return [
            ...$this->formatListItem($user),

            'addresses' => collect($user->addresses)->map(fn ($address) => [
                'id' => $address->id,
                'name' => $address->full_name ?? null,
                'phone' => $address->phone ?? null,
                'address' => $this->formatAddressLine($address),
                'province' => $address->province ?? null,
                'district' => $address->district ?? null,
                'ward' => $address->ward ?? null,
                'address_line' => $address->address_line ?? null,
                'postal_code' => $address->postal_code ?? null,
                'is_default' => (bool) ($address->is_default ?? false),
            ])->values()->toArray(),

            'recent_orders' => $user->orders?->map(fn ($order) => [
                'id' => $order->id,
                'order_code' => $order->order_code,
                'status' => $order->status,
                'total' => (float) $order->total,
                'created_at' => optional($order->created_at)->format('d/m/Y H:i'),
            ])->values(),
        ];
    }

    private function formatAddressLine($address): string
    {
        return collect([
            $address->address_line ?? null,
            $address->ward ?? null,
            $address->district ?? null,
            $address->province ?? null,
        ])
            ->filter(fn ($part) => filled($part))
            ->implode(', ');
    }

    public function restore(int $id): array
    {
        $user = User::withTrashed()->find($id);

        if (!$user) {
            throw new RuntimeException('Người dùng không tồn tại', 404);
        }

        if (!$user->trashed()) {
            throw new RuntimeException('Tài khoản này chưa bị xóa', 400);
        }

        $user->restore();

        return [
            'success' => true,
            'message' => 'Khôi phục tài khoản người dùng thành công',
            'data' => $this->formatDetail($user->fresh()),
        ];
    }
}
