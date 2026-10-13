<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * The AI designer on the Custom Orders page: Google Gemini (free tier) chats
 * with the customer and keeps a structured draft of the piece, which becomes a
 * custom order request when the customer sends it.
 */
class DesignChatController extends Controller
{
    // Limits that keep a public endpoint within the free tier.
    private const MAX_MESSAGES = 30;

    private const MAX_MESSAGE_CHARS = 2000;

    private const BUDGETS = ['', 'under-30', '30-75', '75-150', '150-plus'];

    private const UNAVAILABLE = 'The AI designer is not available right now. Please use the form instead.';

    private const FAILED = "The designer couldn't answer just now. Please try again.";

    private const BUSY = 'The designer is busy right now. Please try again in a minute, or use the form.';

    // Gemini answers 503 when the model is overloaded; these spikes usually pass in seconds.
    private const RETRY_DELAYS_MS = [1000, 3000];

    private const RETRY_STATUSES = [500, 502, 503, 504];

    // GET /api/design-chat - whether the designer is switched on
    public function status()
    {
        return ['enabled' => (bool) config('shop.gemini_api_key')];
    }

    // POST /api/design-chat  { messages: [{ role: "user"|"assistant", content: "..." }, ...] }
    public function reply(Request $request)
    {
        $key = config('shop.gemini_api_key');
        if (! $key) {
            return $this->error(self::UNAVAILABLE, 503);
        }

        $messages = $this->validMessages($request->input('messages'));
        if ($messages === null) {
            return $this->error('Something about that conversation looks wrong. Please start again.', 400);
        }
        if (count($messages) > self::MAX_MESSAGES) {
            return $this->error('This conversation is getting long. Please send your design or start a new one.', 400);
        }

        $categories = Category::orderBy('sort_order')->orderBy('name')->pluck('name')->all();
        $model = config('shop.gemini_model');

        try {
            $response = Http::withHeaders(['x-goog-api-key' => $key])
                ->timeout(30)
                ->retry(
                    self::RETRY_DELAYS_MS,
                    when: fn ($e) => $e instanceof ConnectionException
                        || ($e instanceof RequestException
                            && in_array($e->response->status(), self::RETRY_STATUSES, true)),
                    throw: false,
                )
                ->post(config('shop.gemini_base_url')."/v1beta/models/{$model}:generateContent", [
                    'systemInstruction' => ['parts' => [['text' => $this->systemPrompt($categories)]]],
                    'contents' => array_map(fn ($m) => [
                        'role' => $m['role'] === 'assistant' ? 'model' : 'user',
                        'parts' => [['text' => $m['content']]],
                    ], $messages),
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                        'responseSchema' => $this->schema($categories),
                    ],
                ]);
        } catch (ConnectionException $e) {
            Log::error('AI designer: could not reach Gemini', ['exception' => $e]);

            return $this->error(self::FAILED, 502);
        }

        if ($response->status() === 429) {
            // Free-tier quota (per minute or per day) used up.
            return $this->error(self::BUSY, 429);
        }
        if ($response->status() === 503) {
            // Still overloaded after the retries.
            Log::warning('AI designer: Gemini overloaded after retries');

            return $this->error(self::BUSY, 503);
        }
        if (in_array($response->status(), [400, 401, 403], true) && str_contains($response->body(), 'API_KEY')) {
            Log::error('AI designer: Gemini rejected the API key', ['status' => $response->status()]);

            return $this->error(self::UNAVAILABLE, 503);
        }
        if ($response->failed()) {
            Log::error('AI designer: Gemini request failed', [
                'status' => $response->status(),
                'body' => mb_substr($response->body(), 0, 500),
            ]);

            return $this->error(self::FAILED, 502);
        }

        // Blocked by Gemini's safety filters, before or while answering.
        $finish = $response->json('candidates.0.finishReason');
        if ($response->json('promptFeedback.blockReason')
            || in_array($finish, ['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'RECITATION'], true)) {
            return [
                'reply' => "Sorry, I can't help with that. I can help you design a crochet piece. What would you like made?",
                'design' => null,
                'ready' => false,
            ];
        }

        $text = collect($response->json('candidates.0.content.parts', []))
            ->reject(fn ($part) => $part['thought'] ?? false)
            ->pluck('text')
            ->implode('');
        $data = json_decode($text, true);

        if (! is_array($data) || ! isset($data['reply'], $data['design']) || ! is_array($data['design'])) {
            Log::warning('AI designer: unexpected Gemini response', ['finish_reason' => $finish]);

            return $this->error(self::FAILED, 502);
        }

        return [
            'reply' => (string) $data['reply'],
            'design' => $this->cleanDesign($data['design'], $categories),
            'ready' => (bool) ($data['ready'] ?? false),
        ];
    }

    /** Only plain user/assistant text turns, alternating, starting and ending with the customer. */
    private function validMessages(mixed $input): ?array
    {
        if (! is_array($input) || $input === [] || ! array_is_list($input)) {
            return null;
        }

        $messages = [];
        foreach ($input as $i => $message) {
            $role = $message['role'] ?? null;
            $content = $message['content'] ?? null;
            $expected = $i % 2 === 0 ? 'user' : 'assistant';

            if ($role !== $expected || ! is_string($content) || trim($content) === '') {
                return null;
            }
            $messages[] = ['role' => $role, 'content' => mb_substr(trim($content), 0, self::MAX_MESSAGE_CHARS)];
        }

        return end($messages)['role'] === 'user' ? $messages : null;
    }

    private function systemPrompt(array $categories): string
    {
        $types = implode(', ', $categories);
        $today = now()->toDateString();

        return <<<PROMPT
You are the design assistant for Strand, a small shop selling handmade crochet pieces. You chat with a customer on the shop's Custom Orders page and help them shape an idea for a custom piece, which the maker then reviews and quotes.

About the shop:
- Everything is crocheted by hand in small batches. The shop's categories are: {$types}. Customers can also ask for something else ("Other") if it can reasonably be crocheted.
- Most custom pieces take 2–4 weeks. Payment is cash on delivery.
- The maker confirms the final price and details by email within 2–3 business days. You never promise a price, a date, or that something is possible; you can say what's typical.
- Budget ranges the shop uses: under \$30, \$30–\$75, \$75–\$150, \$150+.
- Today's date is {$today}.

How to talk:
- Warm, brief and practical: two to four short sentences per reply, plain text, no markdown or lists.
- Reply in the language the customer writes in.
- Ask at most two questions at a time, starting with what matters most: what the item is, then colours, size, quantity, and any deadline or budget.
- Offer concrete ideas when the customer is unsure, for example a colourway, a stitch style (granny squares, ribbing, mesh) or a size.
- Don't ask for their name, email or phone; the page collects those when they send the design.
- Keep to helping design a crochet piece for this shop. If asked about anything else, say briefly that you can only help with their custom piece.

Every reply also carries the design so far:
- Fill in what the customer has told you or agreed to, and leave unknown text fields as empty strings. Quantity defaults to 1.
- "description" is a clear summary the maker can work from: the item, its style, colours, size and any details, in one to three sentences, written in English.
- "title" is a short name for the piece, e.g. "Ocean wave tote".
- Set "ready" to true once you know the item, colours and roughly the size, and tell the customer they can send the design whenever they're happy with it. They can keep refining it after that.
PROMPT;
    }

    /** Gemini's response schema (an OpenAPI-style subset: upper-case types, no additionalProperties). */
    private function schema(array $categories): array
    {
        $text = ['type' => 'STRING'];

        return [
            'type' => 'OBJECT',
            'properties' => [
                'reply' => ['type' => 'STRING', 'description' => 'Your message to the customer.'],
                'design' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'title' => $text,
                        'product_type' => [
                            'type' => 'STRING',
                            'enum' => array_values(array_unique([...$categories, 'Other', 'Not decided'])),
                        ],
                        'description' => $text,
                        'preferred_colors' => $text,
                        'preferred_size' => $text,
                        'quantity' => ['type' => 'INTEGER'],
                        'budget_range' => [
                            'type' => 'STRING',
                            'enum' => ['not-set', 'under-30', '30-75', '75-150', '150-plus'],
                        ],
                        'deadline' => ['type' => 'STRING', 'description' => 'YYYY-MM-DD, or empty if none.'],
                        'additional_notes' => $text,
                    ],
                    'required' => [
                        'title', 'product_type', 'description', 'preferred_colors', 'preferred_size',
                        'quantity', 'budget_range', 'deadline', 'additional_notes',
                    ],
                    'propertyOrdering' => [
                        'title', 'product_type', 'description', 'preferred_colors', 'preferred_size',
                        'quantity', 'budget_range', 'deadline', 'additional_notes',
                    ],
                ],
                'ready' => ['type' => 'BOOLEAN'],
            ],
            'required' => ['reply', 'design', 'ready'],
            'propertyOrdering' => ['reply', 'design', 'ready'],
        ];
    }

    /** The design as the custom order form expects it, with anything out of range dropped. */
    private function cleanDesign(array $design, array $categories): array
    {
        $str = fn (string $key, int $max = 1000) => mb_substr(trim((string) ($design[$key] ?? '')), 0, $max);

        $type = $str('product_type', 100);
        $budget = $str('budget_range', 20);
        $deadline = $str('deadline', 10);

        return [
            'title' => $str('title', 120),
            'product_type' => in_array($type, [...$categories, 'Other'], true) ? $type : '',
            'description' => $str('description', 2000),
            'preferred_colors' => $str('preferred_colors', 300),
            'preferred_size' => $str('preferred_size', 300),
            'quantity' => max(1, min(50, (int) ($design['quantity'] ?? 1))),
            'budget_range' => in_array($budget, self::BUDGETS, true) ? $budget : '',
            'deadline' => preg_match('/^\d{4}-\d{2}-\d{2}$/', $deadline) && $deadline >= now()->toDateString() ? $deadline : '',
            'additional_notes' => $str('additional_notes', 2000),
        ];
    }
}
