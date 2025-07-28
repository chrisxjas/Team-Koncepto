<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Allow all origins, adjust in production

// Database connection details (UPDATE THESE)
$servername = "localhost";
$username = "root"; // e.g., "root"
$password = ""; // e.g., ""
$dbname = "koncepto1";     // e.g., "koncepto-app"

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
    echo json_encode(['success' => false, 'message' => 'User ID is required.']);
    exit();
}

// Calculate date 6 months ago
$sixMonthsAgo = date('Y-m-d H:i:s', strtotime('-6 months'));

// SQL query to get frequently purchased items by the user in the last 6 months
// We join orders and order_detail to products to count purchases
$sql = "
    SELECT
        p.id AS product_id_actual, -- Use 'product_id_actual' to avoid conflict with order_detail.product_id
        p.productName AS name,
        p.price,
        p.image,
        COUNT(od.product_id) AS purchase_count
    FROM
        orders o
    JOIN
        order_detail od ON o.id = od.order_id
    JOIN
        products p ON od.product_id = p.id
    WHERE
        o.user_id = ?
        AND o.Orderdate >= ?
    GROUP BY
        p.id, p.productName, p.price, p.image
    ORDER BY
        purchase_count DESC
    LIMIT 3; -- Get top 3 frequently purchased items
";

$stmt = $conn->prepare($sql);
if ($stmt === false) {
    echo json_encode(['success' => false, 'message' => 'Failed to prepare statement: ' . $conn->error]);
    $conn->close();
    exit();
}

$stmt->bind_param("is", $user_id, $sixMonthsAgo);
$stmt->execute();
$result = $stmt->get_result();

$items = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        // Ensure the ID passed to the frontend is unique for FlatList keying,
        // using a combination of product_id and a prefix
        $row['id'] = 'fp_' . $row['product_id_actual'];
        $items[] = $row;
    }
}

// If no items found, you might want to provide some default popular items or leave it empty.
// For now, it will return an empty array if no frequent purchases are found.

echo json_encode(['success' => true, 'items' => $items]);

$stmt->close();
$conn->close();
?>