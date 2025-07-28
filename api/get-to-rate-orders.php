<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$conn = new mysqli("localhost", "root", "", "koncepto1");

// Check connection
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Connection failed"]);
    exit();
}

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if ($user_id === 0) {
    echo json_encode(["success" => false, "message" => "Invalid user_id"]);
    exit();
}

$order_sql = "SELECT id AS order_id, Orderdate, status 
              FROM orders 
              WHERE user_id = $user_id AND status = 'To Rate' 
              ORDER BY Orderdate DESC";

$order_result = $conn->query($order_sql);
$orders = [];

if ($order_result && $order_result->num_rows > 0) {
    while ($order = $order_result->fetch_assoc()) {
        $order_id = $order['order_id'];

        $items_sql = "SELECT 
                        p.productName, 
                        od.quantity, 
                        od.price, 
                        p.image,
                        od.product_id
                      FROM order_detail od
                      JOIN products p ON od.product_id = p.id
                      WHERE od.order_id = $order_id
                      AND od.product_id NOT IN (
                          SELECT product_id 
                          FROM feedbacks 
                          WHERE order_id = $order_id AND user_id = $user_id
                      )";

        $items_result = $conn->query($items_sql);
        $items = [];

        if ($items_result && $items_result->num_rows > 0) {
            while ($item = $items_result->fetch_assoc()) {
                $items[] = $item;
            }
        }

        if (!empty($items)) {
            $order['items'] = $items;
            $orders[] = $order;
        }
    }
}

echo json_encode([
    "success" => true,
    "orders" => $orders
]);

$conn->close();
?>
