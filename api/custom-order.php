<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Database connection
$conn = new mysqli("localhost", "root", "", "koncepto1"); // Adjust your database credentials here

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit;
}

// Function to generate a random 8-character alphanumeric code
function generateRandomCode($length = 8) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, $charactersLength - 1)];
    }
    return $randomString;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $productName = $data['productName'] ?? '';
    $brandName = $data['brandName'] ?? '';
    $category_id = $data['category_id'] ?? null; // Should be the ID, not name
    $unit = $data['unit'] ?? '';
    $quantity = $data['quantity'] ?? '';
    $notes = $data['notes'] ?? null; // Optional
    $user_id = $data['user_id'] ?? null;

    // Basic validation
    if (empty($productName) || empty($brandName) || empty($category_id) || empty($unit) || empty($quantity) || empty($user_id)) {
        echo json_encode(["success" => false, "message" => "Please fill all required fields (Product Name, Brand, Category, Unit, Quantity, User ID)."]);
        exit;
    }

    // Generate unique code
    $code = generateRandomCode();
    // Optional: Add a loop to ensure code uniqueness in the database if collisions are a concern
    // while (true) {
    //     $checkCodeSql = "SELECT COUNT(*) FROM custom_order WHERE code = ?";
    //     $stmt = $conn->prepare($checkCodeSql);
    //     $stmt->bind_param("s", $code);
    //     $stmt->execute();
    //     $result = $stmt->get_result();
    //     $row = $result->fetch_row();
    //     if ($row[0] == 0) {
    //         break; // Code is unique
    //     }
    //     $code = generateRandomCode(); // Generate a new one if not unique
    // }

    $sql = "INSERT INTO custom_order (productName, brandName, category_id, unit, quantity, notes, code, user_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";

    $stmt = $conn->prepare($sql);

    if ($stmt === false) {
        echo json_encode(["success" => false, "message" => "Prepare failed: " . $conn->error]);
        exit;
    }

    $stmt->bind_param("ssiisssi", $productName, $brandName, $category_id, $unit, $quantity, $notes, $code, $user_id);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Custom order submitted successfully!", "code" => $code]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to submit custom order: " . $stmt->error]);
    }

    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
}

$conn->close();
?>