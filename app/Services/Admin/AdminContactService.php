<?php

namespace App\Services\Admin;

use App\Models\Contact;
use RuntimeException;

class AdminContactService
{
    private const STATUSES = ['pending', 'processing', 'replied', 'closed'];

    public function index(array $filters = []): array
    {
        $query = Contact::query();

        if (!empty($filters['with_deleted'])) {
            $query->withTrashed();
        }

        $this->applyFilters($query, $filters);

        match ($filters['sort'] ?? 'latest') {
            'oldest' => $query->oldest(),
            default => $query->latest(),
        };

        $perPage = min(max((int) ($filters['per_page'] ?? 10), 1), 100);
        $contacts = $query->paginate($perPage);

        $contacts->setCollection(
            $contacts->getCollection()->map(fn ($contact) => $this->formatDetail($contact))
        );

        return [
            'success' => true,
            'message' => 'Lấy danh sách liên hệ thành công',
            'data' => [
                'contacts' => $contacts,
                'stats' => $this->stats(),
            ],
        ];
    }

    public function show(int $id): array
    {
        $contact = Contact::withTrashed()->find($id);

        if (!$contact) {
            throw new RuntimeException('Liên hệ không tồn tại', 404);
        }

        return [
            'success' => true,
            'message' => 'Lấy chi tiết liên hệ thành công',
            'data' => $this->formatDetail($contact),
        ];
    }

    public function updateStatus(int $id, string $status): array
    {
        if (!in_array($status, self::STATUSES, true)) {
            throw new RuntimeException('Trạng thái liên hệ không hợp lệ', 422);
        }

        $contact = Contact::find($id);

        if (!$contact) {
            throw new RuntimeException('Liên hệ không tồn tại', 404);
        }

        $data = ['status' => $status];

        if ($status === 'replied' && !$contact->replied_at) {
            $data['replied_at'] = now();
        }

        $contact->update($data);

        return [
            'success' => true,
            'message' => 'Đã cập nhật trạng thái liên hệ',
            'data' => $this->formatDetail($contact->fresh()),
        ];
    }

    public function updateNote(int $id, ?string $note): array
    {
        $contact = Contact::find($id);

        if (!$contact) {
            throw new RuntimeException('Liên hệ không tồn tại', 404);
        }

        $contact->update([
            'admin_note' => $note,
        ]);

        return [
            'success' => true,
            'message' => 'Đã lưu ghi chú liên hệ',
            'data' => $this->formatDetail($contact->fresh()),
        ];
    }

    public function destroy(int $id): array
    {
        $contact = Contact::find($id);

        if (!$contact) {
            throw new RuntimeException('Liên hệ không tồn tại', 404);
        }

        $contact->delete();

        return [
            'success' => true,
            'message' => 'Đã xóa liên hệ',
            'data' => null,
        ];
    }

    private function applyFilters($query, array $filters): void
    {
        if (!empty($filters['keyword'])) {
            $keyword = trim($filters['keyword']);

            $query->where(function ($q) use ($keyword) {
                $q->where('full_name', 'like', "%{$keyword}%")
                    ->orWhere('email', 'like', "%{$keyword}%")
                    ->orWhere('phone', 'like', "%{$keyword}%")
                    ->orWhere('subject', 'like', "%{$keyword}%")
                    ->orWhere('message', 'like', "%{$keyword}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['subject'])) {
            $query->where('subject', 'like', '%' . trim($filters['subject']) . '%');
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }
    }

    private function stats(): array
    {
        $counts = Contact::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return [
            'total' => (int) Contact::query()->count(),
            'pending' => (int) ($counts['pending'] ?? 0),
            'processing' => (int) ($counts['processing'] ?? 0),
            'replied' => (int) (($counts['replied'] ?? 0) + ($counts['resolved'] ?? 0)),
            'closed' => (int) ($counts['closed'] ?? 0),
        ];
    }

    private function formatDetail(Contact $contact): array
    {
        return [
            'id' => $contact->id,
            'full_name' => $contact->full_name,
            'email' => $contact->email,
            'phone' => $contact->phone,
            'subject' => $contact->subject,
            'subject_text' => $contact->subject,
            'message' => $contact->message,
            'status' => $contact->status,
            'status_text' => $this->statusText($contact->status),
            'admin_note' => $contact->admin_note,
            'replied_at' => optional($contact->replied_at)->format('d/m/Y H:i'),
            'created_at' => optional($contact->created_at)->format('d/m/Y H:i'),
            'updated_at' => optional($contact->updated_at)->format('d/m/Y H:i'),
            'deleted_at' => optional($contact->deleted_at)->format('d/m/Y H:i'),
            'is_deleted' => !is_null($contact->deleted_at),
        ];
    }

    private function statusText(?string $status): string
    {
        return [
            'pending' => 'Chờ xử lý',
            'processing' => 'Đang xử lý',
            'replied' => 'Đã phản hồi',
            'resolved' => 'Đã phản hồi',
            'closed' => 'Đã đóng',
        ][$status] ?? 'Không rõ';
    }
}
