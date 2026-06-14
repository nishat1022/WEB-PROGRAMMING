<?php

$host     = "localhost";
$user     = "root";
$password = "";
$database = "newstry";

$conn = mysqli_connect($host, $user, $password, $database);

if (!$conn) {
    http_response_code(500);
    header("Content-Type: application/json");
    echo json_encode(["error" => "Database connection failed: " . mysqli_connect_error()]);
    exit;
}
?>