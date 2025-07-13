<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$conn = new mysqli("localhost", "root", "", "koncepto1");

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Connection failed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$user_id = $data["user_id"] ?? null;
$product_id = $data["product_id"] ?? null;
$quantity = $data["quantity"] ?? 1;

if (!$user_id || !$product_id) {
    echo json_encode(["success" => false, "message" => "Missing user or product info"]);
    exit();
}

// Find or create cart for user
$result = $conn->query("SELECT id FROM carts WHERE user_id = $user_id");
if ($result->num_rows > 0) {
    $cart = $result->fetch_assoc();
    $cart_id = $cart["id"];
} else {
    $conn->query("INSERT INTO carts (user_id, created_at, updated_at) VALUES ($user_id, NOW(), NOW())");
    $cart_id = $conn->insert_id;
}

// Check if item already in cart
$result = $conn->query("SELECT id, quantity FROM cart_items WHERE cart_id = $cart_id AND product_id = $product_id");
if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $newQty = $row['quantity'] + $quantity;
    $conn->query("UPDATE cart_items SET quantity = $newQty, updated_at = NOW() WHERE id = " . $row['id']);
} else {
    $conn->query("INSERT INTO cart_items (cart_id, product_id, quantity, created_at, updated_at) 
                  VALUES ($cart_id, $product_id, $quantity, NOW(), NOW())");
}

echo json_encode(["success" => true, "message" => "Item added to cart"]);
$conn->close();
?>
