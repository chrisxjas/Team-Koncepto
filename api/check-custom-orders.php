<?php
header('Content-Type: application/json');

// Database connection parameters
$servername = "localhost";
$username = "root"; // Your database username
$password = "";     // Your database password
$dbname = "koncepto"; // Your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit();
}

// Get user_id from GET request
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if ($user_id === 0) {
    echo json_encode(['success' => false, 'message' => 'User ID is missing or invalid.']);
    exit();
}

try {
    // Prepare SQL statement to check for custom orders for the given user_id
    // We only need to know if at least one record exists, so COUNT(*) is efficient.
    $stmt = $conn->prepare("SELECT COUNT(*) FROM custom_order WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $stmt->bind_result($orderCount);
    $stmt->fetch();
    $stmt->close();

    // Determine if the user has custom orders
    $hasOrders = $orderCount > 0;

    echo json_encode(['success' => true, 'has_orders' => $hasOrders]);

} catch (Exception $e) {
    // Catch any exceptions during the database operation
    echo json_encode(['success' => false, 'message' => 'Error checking custom orders: ' . $e->getMessage()]);
} finally {
    // Close the database connection
    $conn->close();
}
?>