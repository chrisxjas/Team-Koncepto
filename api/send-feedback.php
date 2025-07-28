<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$conn = new mysqli("localhost", "root", "", "koncepto1");

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Connection failed"]);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

$user_id = $data['user_id'] ?? null;
$order_id = $data['order_id'] ?? null;
$product_id = $data['product_id'] ?? null;
$feedback = $data['feedback'] ?? '';
$star = $data['star'] ?? null;

if (!$user_id || !$order_id || !$product_id || trim($feedback) === '' || !$star) {
    echo json_encode(["success" => false, "message" => "Missing required fields."]);
    exit();
}

$stmt = $conn->prepare("INSERT INTO feedbacks (user_id, order_id, product_id, feedback, star, created_at, updated_at) 
VALUES (?, ?, ?, ?, ?, NOW(), NOW())
ON DUPLICATE KEY UPDATE feedback = VALUES(feedback), star = VALUES(star), updated_at = NOW()");
$stmt->bind_param("iiisi", $user_id, $order_id, $product_id, $feedback, $star);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Feedback saved."]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to save feedback."]);
}

$conn->close();
