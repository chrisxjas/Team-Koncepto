<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "koncepto1";

$conn = new mysqli($servername, $username, $password, $dbname);

$data = json_decode(file_get_contents("php://input"), true);
$user_id = $data['user_id'];
$product_id = $data['product_id'];
$quantity = $data['quantity'];

if ($conn->connect_error) {
  die(json_encode(["success" => false, "message" => "Connection failed"]));
}

// Check if cart already exists
$cartCheck = $conn->query("SELECT id FROM cart WHERE user_id = $user_id AND status = 'open'");
if ($cartCheck->num_rows > 0) {
  $cartRow = $cartCheck->fetch_assoc();
  $cart_id = $cartRow['id'];
} else {
  $conn->query("INSERT INTO cart (user_id, status) VALUES ($user_id, 'open')");
  $cart_id = $conn->insert_id;
}

// Add to cart_items
$conn->query("INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($cart_id, $product_id, $quantity)");

echo json_encode(["success" => true]);

$conn->close();
?>
