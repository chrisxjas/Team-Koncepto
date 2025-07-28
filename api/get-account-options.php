<?php
// get_account_options.php

header('Content-Type: application/json'); // Set header to return JSON response
include 'db_connect.php'; // Include your database connection file

$response = array(); // Initialize response array

// Check if user_id is provided in the GET request
if (isset($_GET['user_id'])) {
    $userId = $_GET['user_id'];

    // Prepare a SQL statement to prevent SQL injection
    // Select only the email for display
    $stmt = $conn->prepare("SELECT email FROM users WHERE id = ?");
    // 'i' denotes integer type for user_id
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result(); // Get the result set

    // Check if a user with the given ID was found
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc(); // Fetch the user data
        $response['success'] = true;
        $response['email'] = $user['email']; // Add email to the response
        $response['message'] = "Account options fetched successfully.";
    } else {
        $response['success'] = false;
        $response['message'] = "User not found.";
    }
    $stmt->close(); // Close the prepared statement
} else {
    $response['success'] = false;
    $response['message'] = "User ID not provided.";
}

$conn->close(); // Close the database connection
echo json_encode($response); // Encode and output the JSON response
?>
