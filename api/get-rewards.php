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

$response = ['success' => false, 'message' => '', 'rewards' => []];

$sql = "SELECT id, reward_name, required_points, description, image, stock, status FROM rewards WHERE status = 'active' ORDER BY required_points ASC";
$result = $conn->query($sql);

if ($result) {
    $rewards = [];
    while ($row = $result->fetch_assoc()) {
        $rewards[] = $row;
    }
    $response['rewards'] = $rewards;
    $response['success'] = true;
    $response['message'] = "Rewards fetched successfully.";
} else {
    $response['message'] = "Failed to fetch rewards: " . $conn->error;
}

echo json_encode($response);
$conn->close();
?>