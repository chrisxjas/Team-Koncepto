<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$conn = new mysqli("localhost", "root", "", "koncepto1");

$user_id = $_GET["user_id"] ?? null;
if (!$user_id) {
    echo json_encode(["success" => false, "message" => "Missing user_id"]);
    exit;
}

// Get admin id
$admin_result = $conn->query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
$admin = $admin_result->fetch_assoc();
$admin_id = $admin['id'] ?? null;
if (!$admin_id) {
    echo json_encode(["success" => false, "message" => "No admin found"]);
    exit;
}

$sql = "
    SELECT * FROM messages
    WHERE (sender_id = $user_id AND receiver_id = $admin_id)
       OR (sender_id = $admin_id AND receiver_id = $user_id)
    ORDER BY created_at ASC
";
$result = $conn->query($sql);

$messages = [];
while ($row = $result->fetch_assoc()) {
    $messages[] = [
        'id' => $row['id'],
        'sender' => $row['sender_id'] == $user_id ? 'You' : 'Admin',
        'message' => $row['message'],
        'time' => date('h:i A', strtotime($row['created_at'])),
        'type' => $row['sender_id'] == $user_id ? 'sent' : 'received'
    ];
}
echo json_encode(["success" => true, "messages" => $messages]);
?>
