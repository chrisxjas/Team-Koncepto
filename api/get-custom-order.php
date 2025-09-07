<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Include centralized DB connection
include __DIR__ . '/db_connection.php';

// Get POST data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!isset($data['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User ID is required.']);
    exit;
}

$userId = intval($data['user_id']);

try {
    // Fetch custom orders for the user
    $stmtOrders = $conn->prepare("
        SELECT id AS order_id, user_id, created_at, updated_at
        FROM custom_orders
        WHERE user_id = ?
        ORDER BY created_at DESC
    ");
    $stmtOrders->bind_param("i", $userId);
    $stmtOrders->execute();
    $ordersResult = $stmtOrders->get_result();
    $stmtOrders->close();

    $customOrders = [];
    while ($order = $ordersResult->fetch_assoc()) {
        // Fetch items for each order
        $stmtItems = $conn->prepare("
            SELECT ci.id AS item_id, ci.name AS item_name, ci.brand, ci.unit, ci.quantity, ci.price, ci.total_price, ci.photo, ci.description, c.categoryName AS category_name
            FROM custom_order_items ci
            LEFT JOIN categories c ON ci.category_id = c.id
            WHERE ci.custom_order_id = ?
            ORDER BY ci.id ASC
        ");
        $stmtItems->bind_param("i", $order['order_id']);
        $stmtItems->execute();
        $itemsResult = $stmtItems->get_result();
        $order['items'] = $itemsResult->fetch_all(MYSQLI_ASSOC);
        $stmtItems->close();

        $customOrders[] = $order;
    }

    echo json_encode(['success' => true, 'data' => $customOrders]);

} catch (Exception $e) {
    error_log("Error in get-custom-orders.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An error occurred while retrieving custom orders.']);
}

$conn->close();
?>
