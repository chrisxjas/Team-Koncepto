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
    orders.Orderdate,
    orders.status,
    products.id AS product_id,
    products.productName,
    products.image,
    order_detail.quantity,
    order_detail.price,
    feedbacks.star,
    feedbacks.feedback
FROM orders
JOIN order_detail ON orders.id = order_detail.order_id
JOIN products ON order_detail.product_id = products.id
JOIN feedbacks ON orders.id = feedbacks.order_id AND products.id = feedbacks.product_id
WHERE orders.user_id = ?
ORDER BY orders.Orderdate DESC
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

$orders = [];
while ($row = $result->fetch_assoc()) {
    $order_id = $row["order_id"];
    if (!isset($orders[$order_id])) {
        $orders[$order_id] = [
            "order_id" => $row["order_id"],
            "Orderdate" => $row["Orderdate"],
            "status" => $row["status"],
            "items" => [],
        ];
    }

    $orders[$order_id]["items"][] = [
        "product_id" => $row["product_id"],
        "productName" => $row["productName"],
        "quantity" => $row["quantity"],
        "price" => $row["price"],
        "image" => $row["image"],
        "star" => $row["star"],
        "feedback" => $row["feedback"],
    ];
}

echo json_encode([
    "success" => true,
    "orders" => array_values($orders),
]);
?>
