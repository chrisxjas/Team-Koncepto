<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$conn = new mysqli('localhost', 'root', '', 'koncepto1');

$data = json_decode(file_get_contents('php://input'), true);
$user_id = $data['user_id'];
$first_name = $data['first_name'];
$last_name = $data['last_name'];
$cp_no = $data['cp_no'];
$school_id = $data['school_id'];

if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'Missing user_id']);
    exit;
}

$sql = "UPDATE users SET first_name = ?, last_name = ?, cp_no = ?, school_id = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('sssii', $first_name, $last_name, $cp_no, $school_id, $user_id);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update profile.']);
}
