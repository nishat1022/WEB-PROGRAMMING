<?php

include 'config.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method  = $_SERVER['REQUEST_METHOD'];
$id      = isset($_GET['id']) ? intval($_GET['id']) : null;
$search  = isset($_GET['search']) ? trim($_GET['search']) : '';
$category = isset($_GET['category']) ? trim($_GET['category']) : 'all';
$isUpload = isset($_GET['upload']) && $_GET['upload'] === '1';

// Helper: convert a DB row (snake_case) to frontend format (camelCase)
function formatDoc($row) {
    return [
        'id'         => (int) $row['id'],
        'title'      => $row['title'],
        'content'    => $row['content'],
        'details'    => $row['details'],
        'category'   => $row['category'],
        'displayDate' => $row['display_date'],
        'imageUrl'   => $row['image_url'] ?? '',
        'createdAt'  => $row['created_at'],
        'updatedAt'  => $row['updated_at']
    ];
}

function sendJSON($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
}

// ==========================================
// FILE UPLOAD HANDLER
// ==========================================
if ($isUpload && $method === 'POST') {
    if (empty($_FILES['image'])) {
        sendJSON(["error" => "No file uploaded. Use the 'image' field name."], 400);
        exit;
    }

    $file = $_FILES['image'];

    // Check for upload errors
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errorMessages = [
            UPLOAD_ERR_INI_SIZE   => 'File exceeds the server upload_max_filesize limit.',
            UPLOAD_ERR_FORM_SIZE  => 'File exceeds the form MAX_FILE_SIZE limit.',
            UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded.',
            UPLOAD_ERR_NO_FILE    => 'No file was uploaded.',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder on server.',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
            UPLOAD_ERR_EXTENSION  => 'A PHP extension stopped the upload.',
        ];
        $msg = $errorMessages[$file['error']] ?? 'Unknown upload error.';
        sendJSON(["error" => $msg], 400);
        exit;
    }

    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $detectedType = $finfo->file($file['tmp_name']);

    if (!in_array($detectedType, $allowedTypes)) {
        sendJSON(["error" => "Invalid file type. Allowed: JPG, PNG, GIF, WebP, SVG."], 400);
        exit;
    }

    // Validate file size (max 5MB)
    $maxSize = 5 * 1024 * 1024; // 5MB
    if ($file['size'] > $maxSize) {
        sendJSON(["error" => "File too large. Maximum size is 5MB."], 400);
        exit;
    }

    // Generate unique filename to prevent conflicts
    $extMap = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/gif'  => 'gif',
        'image/webp' => 'webp',
        'image/svg+xml' => 'svg',
    ];
    $ext = $extMap[$detectedType] ?? 'jpg';
    $filename = uniqid('img_', true) . '.' . $ext;

    // Ensure uploads directory exists
    $uploadDir = __DIR__ . '/uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $destination = $uploadDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        sendJSON(["error" => "Failed to save the uploaded file."], 500);
        exit;
    }

    // Return the relative URL path that the frontend can use
    $imageUrl = 'uploads/' . $filename;
    sendJSON([
        "success"  => true,
        "imageUrl" => $imageUrl,
        "filename" => $filename,
        "size"     => $file['size'],
        "type"     => $detectedType
    ], 201);
    exit;
}

switch ($method) {

    // ==========================================
    // READ
    // ==========================================
    case 'GET':
        $sql   = "SELECT * FROM documents WHERE 1=1";
        $params = [];
        $types  = "";

        if ($search !== '') {
            $sql .= " AND (title LIKE ? OR content LIKE ? OR details LIKE ?)";
            $like = "%$search%";
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
            $types .= "sss";
        }

        if ($category !== 'all') {
            $sql .= " AND category = ?";
            $params[] = $category;
            $types .= "s";
        }

        if ($id !== null) {
            $sql .= " AND id = ?";
            $params[] = $id;
            $types .= "i";
        }

        $sql .= " ORDER BY display_date DESC, created_at DESC";

        $stmt = $conn->prepare($sql);
        if ($params) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();

        $docs = [];
        while ($row = $result->fetch_assoc()) {
            $docs[] = formatDoc($row);
        }

        // Single document? Return object instead of array
        if ($id !== null) {
            sendJSON(count($docs) > 0 ? $docs[0] : null);
        } else {
            sendJSON($docs);
        }
        break;

    // ==========================================
    // CREATE
    // ==========================================
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);

        if (!$data || empty($data['title'])) {
            sendJSON(["error" => "Title is required"], 400);
            break;
        }

        $title    = trim($data['title']);
        $content  = $data['content'] ?? '';
        $details  = $data['details'] ?? '';
        $category = $data['category'] ?? 'research';
        $dispDate = (!empty($data['displayDate'])) ? $data['displayDate'] : null;

        $imageUrl = $data['imageUrl'] ?? '';

        $stmt = $conn->prepare(
            "INSERT INTO documents (title, content, details, category, display_date, image_url)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("ssssss", $title, $content, $details, $category, $dispDate, $imageUrl);
        $stmt->execute();

        if ($stmt->error) {
            sendJSON(["error" => "Create failed: " . $stmt->error], 500);
            break;
        }

        $newId = $conn->insert_id;

        $fetch = $conn->prepare("SELECT * FROM documents WHERE id = ?");
        $fetch->bind_param("i", $newId);
        $fetch->execute();
        $row = $fetch->get_result()->fetch_assoc();

        sendJSON(formatDoc($row), 201);
        break;

    // ==========================================
    // UPDATE
    // ==========================================
    case 'PUT':
        if ($id === null) {
            sendJSON(["error" => "Document ID is required (use ?id=)"], 400);
            break;
        }

        $data = json_decode(file_get_contents("php://input"), true);

        if (!$data) {
            sendJSON(["error" => "Invalid JSON body"], 400);
            break;
        }

        // Sanitise values
        $title    = $data['title'] ?? '';
        $content  = $data['content'] ?? '';
        $details  = $data['details'] ?? '';
        $category = $data['category'] ?? 'research';
        $dispDate = (!empty($data['displayDate'])) ? $data['displayDate'] : null;

        $imageUrl = $data['imageUrl'] ?? '';

        $stmt = $conn->prepare(
            "UPDATE documents SET title = ?, content = ?, details = ?, category = ?, display_date = ?, image_url = ?
             WHERE id = ?"
        );
        $stmt->bind_param("ssssssi", $title, $content, $details, $category, $dispDate, $imageUrl, $id);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            sendJSON(["error" => "Document not found or no changes made"], 404);
            break;
        }

        $fetch = $conn->prepare("SELECT * FROM documents WHERE id = ?");
        $fetch->bind_param("i", $id);
        $fetch->execute();
        $row = $fetch->get_result()->fetch_assoc();

        sendJSON(formatDoc($row));
        break;

    // ==========================================
    // DELETE
    // ==========================================
    case 'DELETE':
        if ($id === null) {
            sendJSON(["error" => "Document ID is required (use ?id=)"], 400);
            break;
        }

        $stmt = $conn->prepare("DELETE FROM documents WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            sendJSON(["error" => "Document not found"], 404);
        } else {
            sendJSON(["message" => "Deleted", "id" => $id]);
        }
        break;

    default:
        sendJSON(["error" => "Method not allowed"], 405);
        break;
}

$conn->close();
?>