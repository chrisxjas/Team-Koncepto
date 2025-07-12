<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "koncepto_db");

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$f_name = $data['f_name'] ?? '';
$l_name = $data['l_name'] ?? '';
$cp_no = $data['cp_no'] ?? '';
$role = $data['role'] ?? 'user';
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';
$remarks = $data['remarks'] ?? 'active';

if (!$f_name || !$l_name || !$cp_no || !$role || !$email || !$password || !$remarks) {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
    exit();
}

$check = $conn->prepare("SELECT id FROM users WHERE email = ?");
$check->bind_param("s", $email);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Email already exists"]);
    $check->close();
    exit();
}
$check->close();

// Directly store password in plain text (⚠️ Not recommended for production)
$stmt = $conn->prepare("INSERT INTO users (f_name, l_name, cp_no, role, email, password, remarks, date_joined) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
$stmt->bind_param("sssssss", $f_name, $l_name, $cp_no, $role, $email, $password, $remarks);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Registered successfully"]);
} else {
    echo json_encode(["success" => false, "message" => "Registration failed: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
