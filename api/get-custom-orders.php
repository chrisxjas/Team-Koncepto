<?php
header('Content-Type: application/json');

// Database Connection Details
$servername = "localhost";
$username = "root"; // Your database username
$password = "";     // Your database password
$dbname = "koncepto1"; // <<< MAKE SURE THIS IS YOUR ACTUAL DATABASE NAME

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$response = ['success' => false, 'message' => '', 'custom_orders' => []];

// Get user_id from GET request
$userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if ($userId === 0) {
    $response['message'] = "User ID is missing or invalid.";
    echo json_encode($response);
    $conn->close();
    exit();
}

try {
    // SQL query to select the specified columns for the given user_id
    // and order by created_at (newer to older).
    // We explicitly select 'created_at' to help with client-side grouping by date.
    $stmt = $conn->prepare("
        SELECT
            productName,
            brandName,
            category_id,
            unit,
            quantity,
            notes,
            status,
            code,
            created_at
        FROM
            custom_order
        WHERE
            user_id = ?
        ORDER BY
            created_at DESC
    ");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    $customOrders = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $customOrders[] = $row;
        }
        $response['custom_orders'] = $customOrders;
        $response['success'] = true;
        $response['message'] = "Custom orders fetched successfully.";
    } else {
        $response['message'] = "Failed to fetch custom orders: " . $conn->error;
    }

    $stmt->close();

} catch (Exception $e) {
    $response['message'] = 'Error fetching custom orders: ' . $e->getMessage();
} finally {
    $conn->close();
}

echo json_encode($response);
?>