<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Only POST is allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(["error" => "Method not allowed. Use POST."], 405);
    exit;
}

// ── Load .env file ──────────────────────────────────────
 $GEMINI_API_KEY = '';

 $envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;       // skip comments
        if (strpos($line, '=') === false) continue;          // skip invalid lines
        list($key, $value) = explode('=', $line, 2);
        $key   = trim($key);
        $value = trim($value);
        // Remove surrounding quotes if present
        if (preg_match('/^["\'](.*)["\']\s*$/', $value, $m)) {
            $value = $m[1];
        }
        if ($key === 'GEMINI_API_KEY' && $value !== '') {
            $GEMINI_API_KEY = $value;
        }
    }
}

// ── Read JSON body ───────────────────────────────────────
 $rawBody = file_get_contents("php://input");
 $data    = json_decode($rawBody, true);

if (!$data || !isset($data['text']) || trim($data['text']) === '') {
    sendJSON(["error" => "Text is required. Send { \"text\": \"your content here\" }."], 400);
    exit;
}

 $text = trim($data['text']);
 $action = isset($_GET['action']) ? $_GET['action'] : '';

// ── Validate API key ─────────────────────────────────────
if (empty($GEMINI_API_KEY) || $GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    sendJSON(["error" => "Gemini API key is not configured. Set GEMINI_API_KEY in .env."], 500);
    exit;
}

// ── Route to the correct AI feature ──────────────────────
switch ($action) {

    case 'improve':
        $reqTitle     = trim($data['title'] ?? '');
        $reqCategory  = trim($data['category'] ?? '');
        handleImproveWriting($text, $reqTitle, $reqCategory);
        break;

    case 'summarize':
        $reqTitle     = trim($data['title'] ?? '');
        $reqCategory  = trim($data['category'] ?? '');
        handleSummarize($text, $reqTitle, $reqCategory);
        break;

    default:
        sendJSON(["error" => "Invalid or missing action. Use ?action=improve or ?action=summarize."], 400);
        break;
}


function handleImproveWriting($text, $title = '', $category = '') {
    global $GEMINI_API_KEY;

    $contextBlock = '';
    if (!empty($title) || !empty($category)) {
        $contextBlock = "\nContext for this content:\n";
        if (!empty($title))    $contextBlock .= "- Title: {$title}\n";
        if (!empty($category)) $contextBlock .= "- Category: {$category}\n";
        $contextBlock .= "\n";
    }

    $prompt = <<<PROMPT
You are a professional academic writing assistant for a university professor's news and activities page.
{$contextBlock}
Your task: Improve the writing quality of the following text. Apply these rules:
1. Enhance vocabulary — replace informal or generic words with more precise, academic alternatives
2. Fix grammar, punctuation, and sentence structure issues
3. Improve clarity and flow while preserving the original meaning
4. Maintain the academic/professional tone appropriate for a university audience
5. Do NOT add new information that was not in the original text
6. Do NOT change the overall meaning or factual claims
7. Return ONLY the improved text — no explanations, no markdown formatting, no preamble

Original text:
{$text}
PROMPT;

    $response = callGeminiAPI($prompt);

    if (isset($response['error'])) {
        sendJSON(["error" => $response['error']], $response['code'] ?? 500);
        return;
    }

    $improved = extractGeminiText($response);

    // Count approximate word-level differences for the change count
    $originalWords = array_unique(preg_split('/\s+/', strtolower($text)));
    $improvedWords = array_unique(preg_split('/\s+/', strtolower($improved)));
    $changes = count(array_diff($improvedWords, $originalWords));

    sendJSON([
        "original"  => $text,
        "improved"  => $improved,
        "changes"   => $changes,
        "meta"      => "{$changes} word-level improvements applied"
    ]);
}


function handleSummarize($text, $title = '', $category = '') {
    global $GEMINI_API_KEY;

    $contextBlock = '';
    if (!empty($title) || !empty($category)) {
        $contextBlock = "\nContext for this content:\n";
        if (!empty($title))    $contextBlock .= "- Title: {$title}\n";
        if (!empty($category)) $contextBlock .= "- Category: {$category}\n";
        $contextBlock .= "\n";
    }

    $prompt = <<<PROMPT
You are a professional academic writing assistant for a university professor's news and activities page.
{$contextBlock}
Your task: Write a concise summary of the following text. Apply these rules:
1. Capture the key points — who, what, when, where, and why
2. Keep the summary to 2-3 sentences maximum and the word count to a maximum of 30-40 words
3. Maintain a professional, academic tone
4. Do NOT add information not present in the original
5. Return ONLY the summary text — no explanations, no markdown formatting, no preamble

Original text:
{$text}
PROMPT;

    $response = callGeminiAPI($prompt);

    if (isset($response['error'])) {
        sendJSON(["error" => $response['error']], $response['code'] ?? 500);
        return;
    }

    $summary = extractGeminiText($response);

    $originalWordCount = count(preg_split('/\s+/', $text));
    $summaryWordCount  = count(preg_split('/\s+/', $summary));
    $reduction = $originalWordCount > 0
        ? round((1 - $summaryWordCount / $originalWordCount) * 100)
        : 0;

    sendJSON([
        "original"   => $text,
        "summary"    => $summary,
        "wordCounts" => [
            "original"  => $originalWordCount,
            "summary"   => $summaryWordCount,
            "reduction" => $reduction
        ],
        "meta" => "Reduced from {$originalWordCount} to {$summaryWordCount} words ({$reduction}% reduction)"
    ]);
}


// Call the Gemini 2.5 Flash API with the given prompt.
function callGeminiAPI($prompt) {
    global $GEMINI_API_KEY;

    $model  = "gemini-2.5-flash"; 
    $url    = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent";
    
    $payload = [
        "contents" => [
            [
                "parts" => [
                    ["text" => $prompt]
                ]
            ]
        ],
        "generationConfig" => [
            "temperature"     => 0.4,
            "maxOutputTokens" => 8192,
            "topP"            => 0.95
        ]
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_HTTPHEADER     => ["Content-Type: application/json", "x-goog-api-key: " . $GEMINI_API_KEY],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 120,
        CURLOPT_CONNECTTIMEOUT => 10
    ]);

    $body      = curl_exec($ch);
    $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    // cURL-level error
    if ($curlError) {
        error_log("Gemini API cURL error: {$curlError}");
        return ["error" => "Failed to connect to AI service: {$curlError}", "code" => 502];
    }

    $decoded = json_decode($body, true);

    // Non-200 from Gemini
    if ($httpCode !== 200 || isset($decoded['error'])) {
        $errMsg = $decoded['error']['message'] ?? "AI service returned error (HTTP {$httpCode})";
        error_log("Gemini API error (HTTP {$httpCode}): {$errMsg}");
        return ["error" => "AI service error: {$errMsg}", "code" => 502];
    }

    return $decoded;
}


/**
 * Extract the generated text from Gemini's response structure.
 * Detects truncation (MAX_TOKENS) and safety blocks.
 */
function extractGeminiText($response) {
    if (isset($response['candidates'][0]['content']['parts'][0]['text'])) {
        $text = trim($response['candidates'][0]['content']['parts'][0]['text']);
        
        $finishReason = $response['candidates'][0]['finishReason'] ?? '';
        if ($finishReason === 'MAX_TOKENS') {
            $text .= "\n\n⚠️ [Response may be incomplete — content exceeded processing limit]";
        }
        
        return $text;
    }
    
    // Fallback: check for safety block or empty response
    if (isset($response['candidates'][0]['finishReason']) 
        && $response['candidates'][0]['finishReason'] === 'SAFETY') {
        return "The AI response was blocked by safety filters. Please rephrase your content and try again.";
    }
    
    return "No response received from AI.";
}


// Helper
function sendJSON($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
}
?>