<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "koncepto1");

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {
    echo json_encode(["success" => false, "message" => "Missing user_id"]);
    exit;
}

$cartRes = $conn->query("SELECT id FROM carts WHERE user_id = $user_id");
if ($cartRes->num_rows === 0) {
    echo json_encode(["success" => true, "items" => []]);
    exit;
}

$cart = $cartRes->fetch_assoc();
$cart_id = $cart['id'];

$sql = "
    SELECT 
        ci.id,
        ci.quantity,
        p.id as product_id,
        p.productName,
        p.price,
        p.image,
        ci.created_at
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.cart_id = $cart_id
    ORDER BY ci.created_at DESC, ci.id DESC
";

$result = $conn->query($sql);
$items = [];

while ($row = $result->fetch_assoc()) {
    $items[] = $row;
}

// --- START DEBUGGING CODE ---
// error_log("Raw cart items fetched: " . print_r($items, true)); 
// You can uncomment the above line to log to your PHP error log file.
// Or, for direct output (REMOVE IN PRODUCTION):
// header("Content-Type: text/plain"); // Change header temporarily
// echo "DEBUGGING PHP OUTPUT:\n";
// print_r($items);
// exit;
// --- END DEBUGGING CODE ---

echo json_encode(["success" => true, "items" => $items]);
$conn->close();