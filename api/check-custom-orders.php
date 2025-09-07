<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

// include db connection (same folder: api/)
include __DIR__ . '/db_connection.php';

// Get user_id from GET request
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if ($user_id === 0) {
    echo json_encode(['success' => false, 'message' => 'User ID is missing or invalid.']);
    exit();
}

try {
    // Prepare SQL statement to check for custom orders for the given user_id
    $stmt = $conn->prepare("SELECT COUNT(*) FROM custom_orders WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $stmt->bind_result($orderCount);
    $stmt->fetch();
    $stmt->close();

    // Determine if the user has custom orders
    $hasOrders = $orderCount > 0;

    echo json_encode(['success' => true, 'has_orders' => $hasOrders]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error checking custom orders: ' . $e->getMessage()]);
} finally {
    $conn->close();
}
?>
