<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$conn = new mysqli("localhost", "root", "", "koncepto1");

$data = json_decode(file_get_contents("php://input"), true);

$feedback_id = $data["feedback_id"] ?? null;
$action = $data["action"] ?? null;

if (!$feedback_id || !$action) {
    echo json_encode(["success" => false, "message" => "Missing feedback_id or action."]);
    exit;
}

// SAFELY ESCAPE `like`
$sql = "";

if ($action === 'like') {
    $sql = "UPDATE feedbacks SET `like` = `like` + 1 WHERE id = ?";
} elseif ($action === 'unlike') {
    $sql = "UPDATE feedbacks SET `like` = GREATEST(`like` - 1, 0) WHERE id = ?";
} else {
    echo json_encode(["success" => false, "message" => "Invalid action."]);
    exit;
}

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $feedback_id);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => "No changes made."]);
}
?>
