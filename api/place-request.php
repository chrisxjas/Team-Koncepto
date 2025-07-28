<?php
header("Content-Type: application/json");
ini_set('display_errors', 1);
error_reporting(E_ALL);

$servername = "localhost";
$username = "root";
$password = "";
$database = "koncepto1";

$conn = new mysqli($servername, $username, $password, $database);
if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]));
}

$response = [];

try {
    if (
        !isset($_POST['user_id']) ||
        !isset($_POST['school_id']) ||
        !isset($_POST['order_date']) ||
        !isset($_POST['ship_date']) ||
        !isset($_POST['payment_method']) ||
        !isset($_POST['total_price'])
    ) {
        throw new Exception('Missing required fields.');
    }

    $userId = $_POST['user_id'];
    $schoolId = $_POST['school_id'];
    $orderDate = $_POST['order_date'];
    $shipDate = $_POST['ship_date'];
    $paymentMethod = $_POST['payment_method'];
    $totalPrice = $_POST['total_price'];
    $status = ($paymentMethod === 'GCash') ? 'to confirm' : 'to pay';

    $selectedItems = isset($_POST['items']) ? json_decode($_POST['items'], true) : [];

    $conn->begin_transaction();

    // Insert Order
    $orderSql = "INSERT INTO orders (user_id, school_id, Orderdate, Shipdate, status, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, NOW(), NOW())";
    $orderStmt = $conn->prepare($orderSql);
    $orderStmt->bind_param("iisss", $userId, $schoolId, $orderDate, $shipDate, $status);
    $orderStmt->execute();
    $orderId = $orderStmt->insert_id;

    if (!empty($selectedItems)) {
        foreach ($selectedItems as $item) {
            $productId = $item['product_id'];
            $quantity = $item['quantity'];
            $price = $item['price'];

            $detailSql = "INSERT INTO order_detail (order_id, product_id, quantity, price, created_at, updated_at)
                          VALUES (?, ?, ?, ?, NOW(), NOW())";
            $detailStmt = $conn->prepare($detailSql);
            $detailStmt->bind_param("iiid", $orderId, $productId, $quantity, $price);
            $detailStmt->execute();
        }

        // Remove items from cart_items
        $cartSql = "SELECT id FROM carts WHERE user_id = ?";
        $cartStmt = $conn->prepare($cartSql);
        $cartStmt->bind_param("i", $userId);
        $cartStmt->execute();
        $cartResult = $cartStmt->get_result();
        $cartRow = $cartResult->fetch_assoc();
        $cartId = $cartRow ? $cartRow['id'] : null;

        if ($cartId) {
            foreach ($selectedItems as $item) {
                $productId = $item['product_id'];
                $deleteItemSql = "DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?";
                $deleteItemStmt = $conn->prepare($deleteItemSql);
                $deleteItemStmt->bind_param("ii", $cartId, $productId);
                $deleteItemStmt->execute();
            }

            // Delete cart if empty
            $checkEmptySql = "SELECT 1 FROM cart_items WHERE cart_id = ?";
            $checkEmptyStmt = $conn->prepare($checkEmptySql);
            $checkEmptyStmt->bind_param("i", $cartId);
            $checkEmptyStmt->execute();
            $checkEmptyResult = $checkEmptyStmt->get_result();
            if ($checkEmptyResult->num_rows === 0) {
                $deleteCartSql = "DELETE FROM carts WHERE id = ?";
                $deleteCartStmt = $conn->prepare($deleteCartSql);
                $deleteCartStmt->bind_param("i", $cartId);
                $deleteCartStmt->execute();
            }
        }
    } else {
        // Fallback: Process Whole Cart
        $cartSql = "SELECT id FROM carts WHERE user_id = ?";
        $cartStmt = $conn->prepare($cartSql);
        $cartStmt->bind_param("i", $userId);
        $cartStmt->execute();
        $cartResult = $cartStmt->get_result();
        $cartRow = $cartResult->fetch_assoc();
        if (!$cartRow) {
            throw new Exception('Cart not found.');
        }
        $cartId = $cartRow['id'];

        $itemSql = "SELECT product_id, quantity FROM cart_items WHERE cart_id = ?";
        $itemStmt = $conn->prepare($itemSql);
        $itemStmt->bind_param("i", $cartId);
        $itemStmt->execute();
        $itemResult = $itemStmt->get_result();
        $items = $itemResult->fetch_all(MYSQLI_ASSOC);

        if (empty($items)) {
            throw new Exception('Cart is empty.');
        }

        foreach ($items as $item) {
            $productId = $item['product_id'];
            $quantity = $item['quantity'];

            $priceStmt = $conn->prepare("SELECT price FROM products WHERE id = ?");
            $priceStmt->bind_param("i", $productId);
            $priceStmt->execute();
            $priceResult = $priceStmt->get_result();
            $priceRow = $priceResult->fetch_assoc();
            $price = $priceRow ? $priceRow['price'] : 0;

            $detailSql = "INSERT INTO order_detail (order_id, product_id, quantity, price, created_at, updated_at)
                          VALUES (?, ?, ?, ?, NOW(), NOW())";
            $detailStmt = $conn->prepare($detailSql);
            $detailStmt->bind_param("iiid", $orderId, $productId, $quantity, $price);
            $detailStmt->execute();
        }

        $deleteCartItemsSql = "DELETE FROM cart_items WHERE cart_id = ?";
        $deleteCartItemsStmt = $conn->prepare($deleteCartItemsSql);
        $deleteCartItemsStmt->bind_param("i", $cartId);
        $deleteCartItemsStmt->execute();

        $cleanCartSql = "DELETE FROM carts WHERE id = ? AND NOT EXISTS (
                            SELECT 1 FROM cart_items WHERE cart_items.cart_id = carts.id
                        )";
        $cleanCartStmt = $conn->prepare($cleanCartSql);
        $cleanCartStmt->bind_param("i", $cartId);
        $cleanCartStmt->execute();
    }

    // GCash payment proof
    if ($paymentMethod === 'GCash' && isset($_FILES["payment_proof"])) {
        $targetDir = "../assets/payment_proof/";
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0777, true);
        }
        $fileName = uniqid() . "_" . basename($_FILES["payment_proof"]["name"]);
        $targetFilePath = $targetDir . $fileName;
        move_uploaded_file($_FILES["payment_proof"]["tmp_name"], $targetFilePath);
        $paymentProofPath = "assets/payment_proof/" . $fileName;

        $paymentSql = "INSERT INTO payments (order_id, payment_method, payment_proof, created_at, updated_at)
                       VALUES (?, ?, ?, NOW(), NOW())";
        $paymentStmt = $conn->prepare($paymentSql);
        $paymentStmt->bind_param("iss", $orderId, $paymentMethod, $paymentProofPath);
        $paymentStmt->execute();
    }

    $conn->commit();

    $response['success'] = true;
    $response['message'] = "Request placed successfully.";
    $response['screen'] = ($paymentMethod === 'GCash') ? 'to-confirm' : 'to-pay';
} catch (Exception $e) {
    $conn->rollback();
    $response['success'] = false;
    $response['message'] = "Error: " . $e->getMessage();
}

echo json_encode($response);
?>
