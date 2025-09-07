<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

// Include centralized DB connection
include __DIR__ . '/db_connection.php';

$product_id = isset($_GET['product_id']) ? intval($_GET['product_id']) : null;

if (!$product_id) {
    echo json_encode(["success" => false, "message" => "Missing product_id"]);
    exit;
}

$sql = "
    SELECT f.star, f.feedback, f.created_at, CONCAT(u.f_name, ' ', u.l_name) AS user_name
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

$stmt->close();
$conn->close();
?>
