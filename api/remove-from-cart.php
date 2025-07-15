<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$conn = new mysqli("localhost", "root", "", "koncepto1");

$data = json_decode(file_get_contents("php://input"), true);

$user_id = $data["user_id"] ?? null;
$product_id = $data["product_id"] ?? null;

if (!$user_id || !$product_id) {
  echo json_encode(["success" => false, "message" => "Missing user_id or product_id"]);
  exit;
}

// Delete from cart_items
$conn->query("DELETE FROM cart_items WHERE user_id = '$user_id' AND product_id = '$product_id'");

// Optionally: delete from main cart if empty
$conn->query("DELETE FROM cart WHERE user_id = '$user_id' AND id NOT IN (SELECT cart_id FROM cart_items)");

echo json_encode(["success" => true, "message" => "Item removed from cart"]);
?>
