<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$conn = new mysqli("localhost", "root", "", "koncepto1");

// Check connection
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]);
    exit();
}

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if ($user_id === 0) {
    echo json_encode(["success" => false, "message" => "Invalid user_id"]);
    exit();
}

// Get orders with status 'To Pay' for the user including status field
$order_sql = "SELECT id AS order_id, Orderdate, status 
              FROM orders 
              WHERE user_id = $user_id AND status = 'To Pay' 
              ORDER BY Orderdate DESC";

$order_result = $conn->query($order_sql);
$orders = [];

if ($order_result && $order_result->num_rows > 0) {
    while ($order = $order_result->fetch_assoc()) {
        $order_id = $order['order_id'];
        $current_order_total_price = 0; // Initialize total for this order

        // Get order items for this order
        $items_sql = "SELECT 
                          p.productName, 
                          od.quantity, 
                          od.price, 
                          p.image,
                          od.product_id
                      FROM order_detail od
                      JOIN products p ON od.product_id = p.id
                      WHERE od.order_id = $order_id";

        $items_result = $conn->query($items_sql);
        $items = [];

        if ($items_result && $items_result->num_rows > 0) {
            while ($item = $items_result->fetch_assoc()) {
                // Ensure price and quantity are numeric for calculation
                $item_price = floatval($item['price']);
                $item_quantity = intval($item['quantity']);
                
                // Calculate subtotal for each item and add to current order total
                $item_subtotal = $item_price * $item_quantity;
                $current_order_total_price += $item_subtotal;

                // Add formatted subtotal to the item for frontend display if needed
                // (Optional, frontend can also calculate this)
                $item['subtotal'] = number_format($item_subtotal, 2, '.', ''); 
                
                $items[] = $item;
            }
        }

        $order['items'] = $items;
        // Add the calculated total_price for the entire order
        $order['total_price'] = number_format($current_order_total_price, 2, '.', ''); 
        $orders[] = $order;
    }
}

echo json_encode([
    "success" => true,
    "orders" => $orders
]);

$conn->close();
?>