<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "koncepto1";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
  die(json_encode(["success" => false, "message" => "Connection failed"]));
}

// Fetch all necessary product fields
$sql = "SELECT id, productName, brandName, description, price, image, category_id FROM products";
$result = $conn->query($sql);

$products = [];

if ($result->num_rows > 0) {
  while ($row = $result->fetch_assoc()) {
    $products[] = $row;
  }
  echo json_encode(["success" => true, "products" => $products]);
} else {
  echo json_encode(["success" => false, "products" => []]);
}

$conn->close();
?>
