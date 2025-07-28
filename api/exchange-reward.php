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

$response = ['success' => false, 'message' => ''];

// Get POST data
$data = json_decode(file_get_contents("php://input"));

if (isset($data->user_id) && isset($data->reward_id) && isset($data->required_points)) {
    $userId = $conn->real_escape_string($data->user_id);
    $rewardId = $conn->real_escape_string($data->reward_id);
    $requiredPoints = (int)$data->required_points;

    // Start a transaction for atomicity
    $conn->begin_transaction();

    try {
        // 1. Check user's current points balance
        // This assumes the 'points_balance' column exists in your 'users' table.
        // Use FOR UPDATE to lock the row and prevent race conditions
        $sqlCheckBalance = "SELECT points_balance FROM users WHERE id = '$userId' FOR UPDATE";
        $resultBalance = $conn->query($sqlCheckBalance);

        if (!$resultBalance || $resultBalance->num_rows === 0) {
            throw new Exception("User not found.");
        }
        $user = $resultBalance->fetch_assoc();
        $currentBalance = (int)$user['points_balance'];

        if ($currentBalance < $requiredPoints) {
            throw new Exception("Insufficient points.");
        }

        // 2. Check reward stock and status
        // Use FOR UPDATE to lock the row and prevent race conditions
        $sqlCheckReward = "SELECT reward_name, stock FROM rewards WHERE id = '$rewardId' AND status = 'active' FOR UPDATE";
        $resultReward = $conn->query($sqlCheckReward);

        if (!$resultReward || $resultReward->num_rows === 0) {
            throw new Exception("Reward not found or is inactive.");
        }
        $reward = $resultReward->fetch_assoc();
        $rewardName = $reward['reward_name'];
        $currentStock = (int)$reward['stock'];

        if ($currentStock <= 0) {
            throw new Exception("Reward is out of stock.");
        }

        // 3. Deduct points from user
        $newBalance = $currentBalance - $requiredPoints;
        $sqlUpdateUser = "UPDATE users SET points_balance = $newBalance WHERE id = '$userId'";
        if (!$conn->query($sqlUpdateUser)) {
            throw new Exception("Failed to update user points: " . $conn->error);
        }

        // 4. Decrease reward stock
        $newStock = $currentStock - 1;
        $sqlUpdateReward = "UPDATE rewards SET stock = $newStock WHERE id = '$rewardId'";
        if (!$conn->query($sqlUpdateReward)) {
            throw new Exception("Failed to update reward stock: " . $conn->error);
        }

        // 5. Record the transaction in your 'points' table
        // For exchange, we use a negative earned_points, and product_id/order_id will be NULL as it's not a purchase.
        $sqlRecordTransaction = "INSERT INTO points (user_id, product_id, order_id, earned_points, created_at, updated_at) VALUES (?, NULL, NULL, ?, NOW(), NOW())";
        $stmt = $conn->prepare($sqlRecordTransaction);
        if (!$stmt) {
             throw new Exception("Failed to prepare statement for points record: " . $conn->error);
        }
        $pointsChange = -$requiredPoints; // Negative for points deduction during exchange
        $stmt->bind_param("ii", $userId, $pointsChange);
        if (!$stmt->execute()) {
            throw new Exception("Failed to record points transaction: " . $stmt->error);
        }
        $stmt->close();

        // Commit the transaction if all steps are successful
        $conn->commit();
        $response['success'] = true;
        $response['message'] = "Reward '" . $rewardName . "' exchanged successfully!";

    } catch (Exception $e) {
        // Rollback on any error
        $conn->rollback();
        $response['message'] = $e->getMessage();
    } finally {
        $conn->close();
    }
} else {
    $response['message'] = "Invalid request data.";
}

echo json_encode($response);
?>