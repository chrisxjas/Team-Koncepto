<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Include DB connection
include __DIR__ . '/db_connection.php';

$data = json_decode(file_get_contents('php://input'), true);
$user_id = isset($data['user_id']) ? intval($data['user_id']) : 0;
$first_name = $data['first_name'] ?? '';
$last_name = $data['last_name'] ?? '';
$cp_no = $data['cp_no'] ?? '';
$school_id = isset($data['school_id']) ? intval($data['school_id']) : 0;

if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'Missing user_id']);
    exit;
}

$sql = "UPDATE users SET first_name = ?, last_name = ?, cp_no = ?, school_id = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('sssii', $first_name, $last_name, $cp_no, $school_id, $user_id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update profile: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
