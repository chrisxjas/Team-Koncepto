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

// Get user_id from GET request (used to exclude items already frequently purchased by this user)
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

// First, get the product IDs that the user frequently purchased to exclude them
$frequentlyPurchasedProductIds = [];
if ($user_id > 0) {
    $sixMonthsAgo = date('Y-m-d H:i:s', strtotime('-6 months'));
    $sql_fp = "
        SELECT
            p.id
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
            p.id
        ORDER BY
            COUNT(od.product_id) DESC
        LIMIT 3;
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

// Build the exclusion clause for the main query
$exclusion_clause = '';
if (!empty($frequentlyPurchasedProductIds)) {
    $placeholders = implode(',', array_fill(0, count($frequentlyPurchasedProductIds), '?'));
    $exclusion_clause = " AND p.id NOT IN ($placeholders) ";
}


// SQL query to get the top 2 overall most purchased items (excluding items frequently bought by the user)
$sql = "
    SELECT
        p.id AS product_id_actual, -- Use 'product_id_actual' to avoid conflict with order_detail.product_id
        p.productName AS name,
        p.price,
        p.image,
        COUNT(od.product_id) AS total_purchase_count
    FROM
        order_detail od
    JOIN
        products p ON od.product_id = p.id
    WHERE 1=1 " . $exclusion_clause . "
    GROUP BY
        p.id, p.productName, p.price, p.image
    ORDER BY
        total_purchase_count DESC
    LIMIT 2; -- Get top 2 overall purchased items (consider these as 'starter pack')
";

$stmt = $conn->prepare($sql);
if ($stmt === false) {
    echo json_encode(['success' => false, 'message' => 'Failed to prepare statement for starter pack: ' . $conn->error]);
    $conn->close();
    exit();
}

if (!empty($frequentlyPurchasedProductIds)) {
    $types = str_repeat('i', count($frequentlyPurchasedProductIds));
    $stmt->bind_param($types, ...$frequentlyPurchasedProductIds);
}

$stmt->execute();
$result = $stmt->get_result();

$items = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        // Ensure the ID passed to the frontend is unique for FlatList keying
        $row['id'] = 'sp_' . $row['product_id_actual'];
        $items[] = $row;
    }
}

// Fallback: If no starter pack items are found (e.g., very few orders),
// you could add some static default items here.
if (empty($items)) {
    // Example of static fallback items:
    // $items[] = ['id' => 'sp_fallback_1', 'product_id_actual' => '1001', 'name' => 'Essential Notebook', 'price' => '75.00', 'image' => 'notebook.jpg'];
    // $items[] = ['id' => 'sp_fallback_2', 'product_id_actual' => '1002', 'name' => 'Basic Pen Set', 'price' => '30.00', 'image' => 'pen_set.jpg'];
}


echo json_encode(['success' => true, 'items' => $items]);

$stmt->close();
$conn->close();
?>