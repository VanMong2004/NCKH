<?php

namespace App\Services;

use App\Models\Contact;

class ContactService
{
    public function __construct(
        protected WebhookService $webhook
    ) {}

    public function info()
    {
        return [
            'school_name' => 'Trường Đại học Kỹ thuật - Công nghệ Cần Thơ',
            'address' => '256 Nguyễn Văn Cừ, Quận Ninh Kiều, TP. Cần Thơ',
            'email' => 'contact@ctuet.edu.vn',
            'phone' => '0292 3891 698',
            'website' => 'https://ctuet.edu.vn/',
            'map_url' => 'https://maps.app.goo.gl/uArkPsittm4Eu4NS6',
        ];
    }

    public function submit(array $data)
    {
        $contact = Contact::create([
            'full_name' => $data['full_name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'subject' => $data['subject'],
            'message' => $data['message'],
            'status' => 'pending',
        ]);

        $this->webhook->send('contact_submitted', [
            'contact_id' => $contact->id,
            'full_name' => $contact->full_name,
            'email' => $contact->email,
            'phone' => $contact->phone,
            'subject' => $contact->subject,
            'message' => $contact->message,
            'status' => $contact->status,
            'created_at' => optional($contact->created_at)->format('d/m/Y H:i'),
        ]);

        return [
            'id' => $contact->id,
            'full_name' => $contact->full_name,
            'email' => $contact->email,
            'phone' => $contact->phone,
            'subject' => $contact->subject,
            'message' => $contact->message,
            'status' => $contact->status,
            'created_at' => optional($contact->created_at)->format('d/m/Y H:i'),
        ];
    }
}