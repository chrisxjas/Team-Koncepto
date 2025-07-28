<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$conn = new mysqli("localhost", "root", "", "koncepto1");

$user_id = $_GET["user_id"] ?? null;

if (!$user_id) {
    echo json_encode(["success" => false, "message" => "Missing user_id"]);
    exit;
}

$sql = "
    SELECT 
        orders.id AS order_id,
        orders.Orderdate AS order_date,
        orders.status,
        products.productName,
        products.brandName,
        products.image,
        products.description,
        products.id AS product_id,
        SUM(order_detail.quantity * order_detail.price) AS total_price
    FROM orders
    JOIN order_detail ON orders.id = order_detail.order_id
    JOIN products ON order_detail.product_id = products.id
    WHERE orders.user_id = '$user_id' AND orders.status = 'order success'
    GROUP BY orders.id, products.id
";

$result = $conn->query($sql);

if (!$result) {
    echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
    exit;
}

$orders = [];
while ($row = $result->fetch_assoc()) {
    $orders[] = [
        "id" => $row["order_id"],
        "date" => $row["order_date"],
        "status" => $row["status"],
        "productName" => $row["productName"],
        "brandName" => $row["brandName"],
        "image" => $row["image"],
        "description" => $row["description"],
        "product_id" => $row["product_id"],
        "total_price" => $row["total_price"],
    ];
}

echo json_encode(["success" => true, "orders" => $orders]);
