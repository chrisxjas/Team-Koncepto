<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$conn = new mysqli("localhost", "root", "", "koncepto1");

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Missing email or password"]);
    exit();
}

$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    $storedPassword = $user['password'];

    // If you're using password_hash() for storing passwords, use password_verify() here instead:
    // if (password_verify($password, $storedPassword)) {
    if ($password === $storedPassword) {
        echo json_encode([
            "success" => true,
            "user" => [
                "id" => $user["id"],
                "first_name" => $user["first_name"],
                "last_name" => $user["last_name"],
                "email" => $user["email"],
                "role" => $user["role"],
                "school_id" => $user["school_id"],
                "date_joined" => $user["created_at"]
            ]
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Incorrect password"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Email not found"]);
}

$stmt->close();
$conn->close();
?>
