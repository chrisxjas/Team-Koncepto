<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

include __DIR__ . '/db_connection.php';

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

// Step 1: Get IDs of user's frequently purchased products (last 6 months)
$frequentlyPurchasedProductIds = [];

if ($user_id > 0) {
    $sixMonthsAgo = date('Y-m-d H:i:s', strtotime('-6 months'));
    $sql_fp = "
        SELECT p.id
        FROM orders o
        JOIN order_details od ON o.id = od.order_id
        JOIN products p ON od.product_id = p.id
        WHERE o.user_id = ? AND o.Orderdate >= ?
        GROUP BY p.id
        ORDER BY COUNT(od.product_id) DESC
        LIMIT 3
    ";
    $stmt_fp = $conn->prepare($sql_fp);
    if ($stmt_fp) {
        $stmt_fp->bind_param("is", $user_id, $sixMonthsAgo);
        $stmt_fp->execute();
        $result_fp = $stmt_fp->get_result();
        while ($row_fp = $result_fp->fetch_assoc()) {
            $frequentlyPurchasedProductIds[] = $row_fp['id'];
        }
        $stmt_fp->close();
    }
}

// Step 2: Fetch top 2 overall products from the view, excluding user’s frequent ones
$sql = "SELECT * FROM overall_top_products WHERE 1=1 ";
if (!empty($frequentlyPurchasedProductIds)) {
    $placeholders = implode(',', array_fill(0, count($frequentlyPurchasedProductIds), '?'));
    $sql .= " AND product_id_actual NOT IN ($placeholders) ";
}
$sql .= " LIMIT 2";

$stmt = $conn->prepare($sql);
if ($stmt === false) {
    echo json_encode(['success' => false, 'message' => 'Failed to prepare statement: ' . $conn->error]);
    $conn->close();
    exit();
}

// Bind exclusion parameters if any
if (!empty($frequentlyPurchasedProductIds)) {
    $types = str_repeat('i', count($frequentlyPurchasedProductIds));
    $stmt->bind_param($types, ...$frequentlyPurchasedProductIds);
}

$stmt->execute();
$result = $stmt->get_result();

$items = [];
while ($row = $result->fetch_assoc()) {
    $row['id'] = 'sp_' . $row['product_id_actual']; // frontend expects an 'id'
    $items[] = $row;
}

$stmt->close();
$conn->close();

// Step 3: Fallback if no items were found
if (empty($items)) {
    $items[] = [
        'id' => 'sp_fallback_1',
        'product_id_actual' => '1001',
        'name' => 'Default Notebook',
        'price' => '75.00',
        'image' => 'notebook.jpg',
        'total_purchase_count' => 0
    ];
    $items[] = [
        'id' => 'sp_fallback_2',
        'product_id_actual' => '1002',
        'name' => 'Default Pen Set',
        'price' => '30.00',
        'image' => 'pen_set.jpg',
        'total_purchase_count' => 0
    ];
}

echo json_encode(['success' => true, 'items' => $items]);
