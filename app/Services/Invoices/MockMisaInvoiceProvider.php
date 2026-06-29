<?php

namespace App\Services\Invoices;

use App\Models\VatInvoiceRequest;
use Barryvdh\DomPDF\Facade\Pdf;

class MockMisaInvoiceProvider
{
    public function download(VatInvoiceRequest $request)
    {
        $request->loadMissing([
            'order.items',
            'order.payments',
        ]);

        $order = $request->order;
        $payment = $order?->payments
            ?->sortByDesc('created_at')
            ->first();

        $invoiceNo = 'MISA-MOCK-' . str_pad((string) $request->id, 6, '0', STR_PAD_LEFT);

        $pdf = Pdf::loadView('pdf.vat-invoice-mock', [
            'request' => $request,
            'order' => $order,
            'payment' => $payment,
            'items' => $order?->items ?? collect(),
            'invoiceNo' => $invoiceNo,
            'issuedAt' => $request->issued_at ?: now(),
        ]);

        return $pdf->download("vat-invoice-{$request->order_code}.pdf");
    }
}
