<?php
header('Content-Type: application/json');

$servername = "localhost";
$username = "root"; // Your database username
$password = "";     // Your database password
$dbname = "koncepto1"; // <<< MAKE SURE THIS IS YOUR ACTUAL DATABASE NAME

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$response = ['success' => false, 'message' => '', 'balance' => 0, 'earned_points' => []];

if (isset($_GET['user_id'])) {
    $userId = $conn->real_escape_string($_GET['user_id']);

    $sqlBalance = "SELECT points_balance FROM users WHERE id = '$userId'";
    $resultBalance = $conn->query($sqlBalance);

    if ($resultBalance && $resultBalance->num_rows > 0) {
        $user = $resultBalance->fetch_assoc();
        $response['balance'] = (int)$user['points_balance'];
    } else {
        $response['message'] = "User not found or no balance recorded.";
        echo json_encode($response);
        $conn->close();
        exit();
    }

    $sqlEarnedPoints = "
        SELECT
            p.id AS transaction_id,
            p.earned_points,
            p.created_at AS order_date,
            COALESCE(prod.productName, 'Generic Purchase') AS product_name
        FROM
            points p
        LEFT JOIN
            products prod ON p.product_id = prod.id
        WHERE
            p.user_id = '$userId'
        ORDER BY
            p.created_at DESC
    ";

    $resultEarnedPoints = $conn->query($sqlEarnedPoints);

    if ($resultEarnedPoints) {
        $earnedPoints = [];
        while ($row = $resultEarnedPoints->fetch_assoc()) {
            if ($row['earned_points'] > 0) { // Only show positive earnings here
                 $earnedPoints[] = $row;
            }
        }
        $response['earned_points'] = $earnedPoints;
        $response['success'] = true;
        $response['message'] = "Points data fetched successfully.";
    } else {
        $response['message'] = "Failed to fetch earned points history: " . $conn->error;
    }
} else {
    $response['message'] = "User ID not provided.";
}

echo json_encode($response);
$conn->close();
?>