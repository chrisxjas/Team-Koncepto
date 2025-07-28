<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$conn = new mysqli("localhost", "root", "", "koncepto1");

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "DB connection failed: " . $conn->connect_error]);
    exit;
}

$product_id = $_GET["product_id"] ?? null;

if (!$product_id) {
    echo json_encode(["success" => false, "message" => "Missing product_id"]);
    exit;
}

$sql = "
    SELECT f.star, f.feedback, f.created_at, CONCAT(u.first_name, ' ', u.last_name) AS user_name
    FROM feedbacks f
    JOIN users u ON u.id = f.user_id
    WHERE f.product_id = ?
";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $product_id);
$stmt->execute();
$result = $stmt->get_result();

$feedbacks = [];
while ($row = $result->fetch_assoc()) {
    $feedbacks[] = $row;
}

echo json_encode([
    "success" => true,
    "data" => $feedbacks
]);
?>
