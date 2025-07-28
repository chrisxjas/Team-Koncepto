<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$conn = new mysqli("localhost", "root", "", "koncepto1");

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$cart_item_id = $data["cart_item_id"] ?? null;

if (!$cart_item_id) {
    echo json_encode(["success" => false, "message" => "Missing cart_item_id"]);
    exit;
}

// Secure the ID
$cart_item_id = intval($cart_item_id);

// Get the cart_id of the item to be deleted
$get_cart = $conn->query("SELECT cart_id FROM cart_items WHERE id = $cart_item_id");
if ($get_cart->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Cart item not found"]);
    exit;
}
$cart_id = $get_cart->fetch_assoc()['cart_id'];

// Delete the item
$conn->query("DELETE FROM cart_items WHERE id = $cart_item_id");

// Optionally delete the cart if it has no more items
$conn->query("DELETE FROM carts WHERE id = $cart_id AND NOT EXISTS (
    SELECT 1 FROM cart_items WHERE cart_id = $cart_id
)");

echo json_encode(["success" => true, "message" => "Item removed from cart"]);
$conn->close();
