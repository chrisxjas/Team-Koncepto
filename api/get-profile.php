<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$conn = new mysqli('localhost', 'root', '', 'koncepto1');

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Connection failed']);
    exit;
}

$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'Missing user_id']);
    exit;
}

$sql = "
    SELECT 
        users.first_name,
        users.last_name,
        users.email,
        users.cp_no,
        users.role,
        users.profilepic,
        users.created_at,
        schools.school_name,
        schools.school_email
    FROM users
    LEFT JOIN schools ON users.school_id = schools.id
    WHERE users.id = ?
";

$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}

$user = $result->fetch_assoc();

// --- GET ORDER COUNTS ---
$orderSql = "
    SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'to rate' THEN 1 ELSE 0 END) AS to_rate
    FROM orders
    WHERE user_id = ?
";
$orderStmt = $conn->prepare($orderSql);
$orderStmt->bind_param('i', $user_id);
$orderStmt->execute();
$orderResult = $orderStmt->get_result()->fetch_assoc();

$user['orders'] = $orderResult;

echo json_encode(['success' => true, 'user' => $user]);
?>
