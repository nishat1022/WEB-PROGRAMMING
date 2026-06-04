<?php
include 'config.php'; //  path for configure database connection
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') exit(0);



$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;
$search = isset($_GET['search']) ? $_GET['search'] : '';
$category = isset($_GET['category']) ? $_GET['category'] : 'all';

switch($method) {
    case 'GET':
        $sql = "SELECT * FROM documents WHERE 1=1";
        $params = [];
        $types = "";
        
        if($search){
            $sql .= " AND title LIKE ?";
            $params[] = "%$search%";
            $types .= "s";
        }
        if($category != 'all'){
            $sql .= " AND category = ?";
            $params[] = $category;
            $types .= "s";
        }
        if($id){
            $sql .= " AND id = ?";
            $params[] = $id;
            $types .= "i";
        }
        $sql .= " ORDER BY created_at DESC";
        $stmt = $conn->prepare($sql);
        if($params) $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $conn->prepare("INSERT INTO documents (title, content, category) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $data['title'], $data['content'], $data['category']);
        $stmt->execute();
        echo json_encode(["id" => $conn->insert_id, "message" => "Created"]);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $conn->prepare("UPDATE documents SET title=?, content=?, category=? WHERE id=?");
        $stmt->bind_param("sssi", $data['title'], $data['content'], $data['category'], $id);
        $stmt->execute();
        echo json_encode(["message" => "Updated"]);
        break;

    case 'DELETE':
        $stmt = $conn->prepare("DELETE FROM documents WHERE id=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        echo json_encode(["message" => "Deleted"]);
        break;
}
$conn->close();
?>
