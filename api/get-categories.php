<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$servername = "localhost";
$username = "root";
$password = ""; // your DB password if any
$dbname = "koncepto1"; // make sure this matches your DB

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
  echo json_encode(["success" => false, "message" => "Database connection failed"]);
  exit();
}

$sql = "SELECT id, categoryName FROM categories";
$result = $conn->query($sql);

$categories = [];
while ($row = $result->fetch_assoc()) {
  $categories[] = $row;
}

echo json_encode(["success" => true, "categories" => $categories]);
$conn->close();
?>
