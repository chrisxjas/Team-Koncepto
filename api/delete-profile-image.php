<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$uploadDir = "../uploads/";

// Validate request
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
    exit;
}

if (!isset($_GET['user_id']) || empty($_GET['user_id'])) {
    echo json_encode(["success" => false, "message" => "Missing user ID"]);
    exit;
}

$user_id = intval($_GET['user_id']);

// DB connection
$conn = new mysqli("localhost", "root", "", "koncepto1");
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

// Get current profilepic
$result = $conn->query("SELECT profilepic FROM users WHERE id = $user_id");
if ($result && $row = $result->fetch_assoc()) {
    $profilepic = $row['profilepic'];

    // Delete file from server
    if ($profilepic && file_exists($uploadDir . $profilepic)) {
        unlink($uploadDir . $profilepic);
    }

    // Update DB
    $update = $conn->query("UPDATE users SET profilepic = NULL WHERE id = $user_id");
    if ($update) {
        echo json_encode(["success" => true, "message" => "Profile picture deleted"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update database"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "User not found"]);
}

$conn->close();
