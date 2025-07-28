<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$conn = new mysqli("localhost", "root", "", "koncepto1");

$data = json_decode(file_get_contents("php://input"), true);
$sender_id = $data["sender_id"] ?? null;
$message = $data["message"] ?? '';

if (!$sender_id || !$message) {
    echo json_encode(["success" => false, "message" => "Missing sender or message"]);
    exit;
}

$admin_result = $conn->query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
$admin = $admin_result->fetch_assoc();
$receiver_id = $admin['id'] ?? null;

if (!$receiver_id) {
    echo json_encode(["success" => false, "message" => "No admin found"]);
    exit;
}

$stmt = $conn->prepare("INSERT INTO messages (sender_id, receiver_id, message, is_read, created_at, updated_at) VALUES (?, ?, ?, 0, NOW(), NOW())");
$stmt->bind_param("iis", $sender_id, $receiver_id, $message);
$stmt->execute();

echo json_encode(["success" => true]);
?>
