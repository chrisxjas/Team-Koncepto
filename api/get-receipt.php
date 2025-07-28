<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "koncepto1");

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit;
}

$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {
    echo json_encode(["success" => false, "message" => "Missing user_id"]);
    exit;
}

// Fetch all receipts for the user, ordered by latest date
$receipts_sql = "SELECT id, order_id, total_amount, created_at FROM receipts WHERE user_id = ? ORDER BY created_at DESC";
$stmt_receipts = $conn->prepare($receipts_sql);
$stmt_receipts->bind_param("i", $user_id);
$stmt_receipts->execute();
$receipts_result = $stmt_receipts->get_result();

$receipts = [];
while ($receipt_row = $receipts_result->fetch_assoc()) {
    $receipt_id = $receipt_row['id'];
    $receipt_data = [
        "id" => $receipt_row['id'],
        "order_id" => $receipt_row['order_id'],
        "total_amount" => $receipt_row['total_amount'],
        "receipt_date" => $receipt_row['created_at'], // Using created_at for receipt date
        "items" => []
    ];

    // Fetch items for each receipt
    $items_sql = "
        SELECT 
            ri.id as item_id,
            ri.quantity,
            ri.price_at_purchase,
            p.id as product_id,
            p.productName,
            p.image
        FROM receipt_items ri
        JOIN products p ON ri.product_id = p.id
        WHERE ri.receipt_id = ?
    ";
    $stmt_items = $conn->prepare($items_sql);
    $stmt_items->bind_param("i", $receipt_id);
    $stmt_items->execute();
    $items_result = $stmt_items->get_result();

    while ($item_row = $items_result->fetch_assoc()) {
        $item_total = (float)$item_row['quantity'] * (float)$item_row['price_at_purchase'];
        $item_row['item_total'] = number_format($item_total, 2, '.', ''); // Format to 2 decimal places
        $receipt_data['items'][] = $item_row;
    }
    $stmt_items->close();
    $receipts[] = $receipt_data;
}
$stmt_receipts->close();

echo json_encode(["success" => true, "receipts" => $receipts]);
$conn->close();
?>