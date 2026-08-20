<?php

namespace App\Console\Commands;

use App\Models\ChatMessage;
use App\Services\Chat\OpenAiHybridRagChatService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class EvaluateChatbot extends Command
{
    protected $signature = 'chatbot:evaluate
        {--dataset= : Đường dẫn file dataset PHP trả về mảng case}
        {--group= : Chạy case có key chứa chuỗi này}
        {--report= : Tên file report JSON}
        {--keep-conversations : Giữ lại hội thoại evaluation thay vì tạo guest token mới mỗi case}';

    protected $description = 'Chạy bộ đánh giá chatbot CTUT UniShop trên luồng service thật';

    public function handle(OpenAiHybridRagChatService $chatService): int
    {
        $datasetPath = $this->resolveDatasetPath();

        if (!File::exists($datasetPath)) {
            $this->error('Không tìm thấy dataset đánh giá chatbot: ' . $datasetPath);

            return Command::FAILURE;
        }

        $cases = require $datasetPath;

        if (!is_array($cases) || empty($cases)) {
            $this->error('Dataset chatbot không hợp lệ hoặc đang rỗng.');

            return Command::FAILURE;
        }

        $group = trim((string) $this->option('group'));
        if ($group !== '') {
            $cases = array_values(array_filter($cases, fn ($case) => str_contains((string) ($case['key'] ?? ''), $group)));
        }

        if (empty($cases)) {
            $this->warn('Không có case nào khớp bộ lọc hiện tại.');

            return Command::SUCCESS;
        }

        $runId = now()->format('Ymd_His');
        $reportCases = [];
        $summaryRows = [];
        $totalMessages = 0;
        $passedMessages = 0;
        $groupStats = [];

        foreach ($cases as $caseIndex => $case) {
            $caseKey = (string) ($case['key'] ?? 'case_' . ($caseIndex + 1));
            $label = (string) ($case['label'] ?? $caseKey);
            $group = $this->detectGroup($caseKey);
            $messages = $case['messages'] ?? [];
            $guestToken = $this->option('keep-conversations')
                ? 'chatbot-eval-shared'
                : 'chatbot-eval-' . Str::slug($caseKey) . '-' . Str::lower(Str::random(8));

            $this->line("Đang chạy case: {$caseKey} - {$label}");

            $conversationId = null;
            $messageReports = [];

            foreach ($messages as $stepIndex => $step) {
                $input = trim((string) ($step['input'] ?? ''));
                if ($input === '') {
                    continue;
                }

                $result = $chatService->sendMessage(null, $guestToken, $conversationId, $input);
                $conversationId = (int) ($result['conversation_id'] ?? 0);

                $assistant = ChatMessage::query()->find($result['message_id'] ?? 0);
                $metadata = $assistant?->metadata ?? [];
                $expect = is_array($step['expect'] ?? null) ? $step['expect'] : [];
                $evaluation = $this->evaluateStep($result, $metadata, $expect);

                $totalMessages++;
                if ($evaluation['passed']) {
                    $passedMessages++;
                }

                $messageReports[] = [
                    'step' => $stepIndex + 1,
                    'input' => $input,
                    'answer' => $result['answer'] ?? null,
                    'intent' => data_get($metadata, 'intent'),
                    'debug' => data_get($metadata, 'debug', []),
                    'products_count' => count($result['products'] ?? []),
                    'promotions_count' => count($result['promotions'] ?? []),
                    'expect' => $expect,
                    'evaluation' => $evaluation,
                ];
            }

            $casePassed = collect($messageReports)->every(fn ($item) => (bool) data_get($item, 'evaluation.passed'));

            $reportCases[] = [
                'key' => $caseKey,
                'label' => $label,
                'group' => $group,
                'guest_token' => $guestToken,
                'conversation_id' => $conversationId,
                'passed' => $casePassed,
                'messages' => $messageReports,
            ];

            $summaryRows[] = [
                $caseKey,
                $label,
                $casePassed ? 'PASS' : 'FAIL',
                count($messageReports),
            ];

            if (!isset($groupStats[$group])) {
                $groupStats[$group] = [
                    'cases_total' => 0,
                    'cases_passed' => 0,
                    'messages_total' => 0,
                    'messages_passed' => 0,
                ];
            }

            $groupStats[$group]['cases_total']++;
            $groupStats[$group]['messages_total'] += count($messageReports);

            if ($casePassed) {
                $groupStats[$group]['cases_passed']++;
            }

            foreach ($messageReports as $messageReport) {
                if ((bool) data_get($messageReport, 'evaluation.passed')) {
                    $groupStats[$group]['messages_passed']++;
                }
            }
        }

        $summary = [
            'cases_total' => count($reportCases),
            'cases_passed' => collect($reportCases)->where('passed', true)->count(),
            'messages_total' => $totalMessages,
            'messages_passed' => $passedMessages,
            'case_pass_rate' => $this->percentage(
                collect($reportCases)->where('passed', true)->count(),
                count($reportCases)
            ),
            'message_pass_rate' => $this->percentage($passedMessages, $totalMessages),
            'groups' => collect($groupStats)
                ->map(function (array $stats, string $group) {
                    return [
                        'group' => $group,
                        ...$stats,
                        'case_pass_rate' => $this->percentage($stats['cases_passed'], $stats['cases_total']),
                        'message_pass_rate' => $this->percentage($stats['messages_passed'], $stats['messages_total']),
                    ];
                })
                ->sortBy('group')
                ->values()
                ->toArray(),
        ];

        $report = [
            'generated_at' => now()->toIso8601String(),
            'dataset_path' => $datasetPath,
            'summary' => $summary,
            'cases' => $reportCases,
        ];

        $reportPath = $this->writeReport($report, $runId);
        $groupRows = collect($summary['groups'])
            ->map(fn ($row) => [
                $row['group'],
                $row['cases_passed'] . '/' . $row['cases_total'],
                $row['case_pass_rate'] . '%',
                $row['messages_passed'] . '/' . $row['messages_total'],
                $row['message_pass_rate'] . '%',
            ])
            ->toArray();

        $this->newLine();
        $this->table(['Case', 'Nhãn', 'Kết quả', 'Số bước'], $summaryRows);
        $this->newLine();
        $this->table(
            ['Nhóm', 'Case đạt', 'Tỷ lệ case', 'Bước đạt', 'Tỷ lệ bước'],
            $groupRows
        );
        $this->info('Tỷ lệ pass tổng theo case: ' . $summary['cases_passed'] . '/' . $summary['cases_total'] . ' (' . $summary['case_pass_rate'] . '%)');
        $this->info('Tỷ lệ pass tổng theo bước: ' . $summary['messages_passed'] . '/' . $summary['messages_total'] . ' (' . $summary['message_pass_rate'] . '%)');
        $this->info('Đã ghi report đánh giá chatbot: ' . $reportPath);
        $this->line('Tổng số bước đạt: ' . $passedMessages . '/' . $totalMessages);

        return collect($reportCases)->every('passed')
            ? Command::SUCCESS
            : Command::FAILURE;
    }

    private function resolveDatasetPath(): string
    {
        $custom = trim((string) $this->option('dataset'));

        if ($custom !== '') {
            return $custom;
        }

        return database_path('seeders/data/chatbot_evaluation_cases.php');
    }

    private function evaluateStep(array $result, array $metadata, array $expect): array
    {
        $answer = mb_strtolower((string) ($result['answer'] ?? ''));
        $intent = (string) data_get($metadata, 'intent', '');
        $toolNames = collect(data_get($metadata, 'debug.tool_names', []))
            ->filter()
            ->values()
            ->toArray();
        $productsCount = count($result['products'] ?? []);
        $promotionsCount = count($result['promotions'] ?? []);
        $checks = [];

        if (!empty($expect['intent_in'])) {
            $checks['intent_in'] = in_array($intent, (array) $expect['intent_in'], true);
        }

        if (!empty($expect['answer_contains_all'])) {
            $checks['answer_contains_all'] = collect((array) $expect['answer_contains_all'])
                ->every(fn ($needle) => str_contains($answer, mb_strtolower((string) $needle)));
        }

        if (!empty($expect['answer_contains_any'])) {
            $checks['answer_contains_any'] = collect((array) $expect['answer_contains_any'])
                ->contains(fn ($needle) => str_contains($answer, mb_strtolower((string) $needle)));
        }

        if (!empty($expect['answer_not_contains'])) {
            $checks['answer_not_contains'] = collect((array) $expect['answer_not_contains'])
                ->every(fn ($needle) => !str_contains($answer, mb_strtolower((string) $needle)));
        }

        if (array_key_exists('products_min', $expect)) {
            $checks['products_min'] = $productsCount >= (int) $expect['products_min'];
        }

        if (array_key_exists('promotions_min', $expect)) {
            $checks['promotions_min'] = $promotionsCount >= (int) $expect['promotions_min'];
        }

        if (!empty($expect['tool_names_contains'])) {
            $checks['tool_names_contains'] = collect((array) $expect['tool_names_contains'])
                ->every(fn ($needle) => in_array($needle, $toolNames, true));
        }

        $passed = !in_array(false, $checks, true);

        return [
            'passed' => $passed,
            'checks' => $checks,
            'observed' => [
                'intent' => $intent,
                'tool_names' => $toolNames,
                'products_count' => $productsCount,
                'promotions_count' => $promotionsCount,
            ],
        ];
    }

    private function writeReport(array $report, string $runId): string
    {
        $directory = storage_path('app/chatbot-evaluations');
        File::ensureDirectoryExists($directory);

        $reportName = trim((string) $this->option('report'));
        $reportName = $reportName !== '' ? $reportName : "chatbot_evaluation_{$runId}.json";

        $path = $directory . DIRECTORY_SEPARATOR . $reportName;

        File::put(
            $path,
            json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        );

        return $path;
    }

    private function detectGroup(string $caseKey): string
    {
        foreach (['product', 'promotion', 'policy', 'small_talk', 'off_topic', 'guest'] as $group) {
            if (str_starts_with($caseKey, $group . '_')) {
                return $group;
            }
        }

        return 'other';
    }

    private function percentage(int $passed, int $total): float
    {
        if ($total <= 0) {
            return 0.0;
        }

        return round(($passed / $total) * 100, 2);
    }
}
