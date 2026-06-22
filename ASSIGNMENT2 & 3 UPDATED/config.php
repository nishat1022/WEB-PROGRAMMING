<?php

$host     = "localhost";
$user     = "root";        // Your MySQL username
$password = "";            // Your MySQL password
$database = "news_editor"; // Your database name

$conn = mysqli_connect($host, $user, $password, $database);

if (!$conn) {
    error_log("Database connection failed: " . mysqli_connect_error());
    http_response_code(500);
    header("Content-Type: application/json");
    echo json_encode(["error" => "Database connection failed. Please try again later."]);
    exit;
}
?>