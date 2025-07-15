<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "koncepto1");

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "DB connection failed"]);
    exit;
}

$user_id = $_GET['id'] ?? null;

if (!$user_id) {
    echo json_encode(["success" => false, "message" => "Missing user_id"]);
    exit;
}

// Fetch user with JOIN to get school_name
$query = $conn->prepare("
    SELECT 
        u.id, u.first_name, u.last_name, u.email, u.cp_no, 
        u.role, u.school_id, u.profilepic, s.school_name 
    FROM users u 
    LEFT JOIN schools s ON u.school_id = s.id 
    WHERE u.id = ?
");
$query->bind_param("i", $user_id);
$query->execute();
$result = $query->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();

    // Ensure school_name is always present in the response
    $user['school_name'] = $user['school_name'] ?? null;

    echo json_encode(["success" => true, "user" => $user]);
} else {
    echo json_encode(["success" => false, "message" => "User not found"]);
}

$conn->close();
