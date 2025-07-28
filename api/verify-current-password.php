<?php
// IMPORTANT: This script should be run ONCE to hash existing plain-text passwords.
// After running, DELETE this file from your server for security reasons.

header('Content-Type: text/plain'); // Output as plain text for easier viewing of results

// Database connection details
$servername = "localhost";
$username = "root"; // Your database username
$password = "";     // Your database password
$dbname = "koncepto1"; // Your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

echo "Starting password hashing process...\n";

// 1. Fetch all users with their current (plain-text) passwords
$sql_select = "SELECT id, password FROM users";
$result = $conn->query($sql_select);

if ($result->num_rows > 0) {
    $update_count = 0;
    echo "Found " . $result->num_rows . " users.\n";

    // Prepare update statement outside the loop for efficiency
    $sql_update = "UPDATE users SET password = ? WHERE id = ?";
    $stmt = $conn->prepare($sql_update);

    if ($stmt === false) {
        die("Failed to prepare update statement: " . $conn->error);
    }

    while ($row = $result->fetch_assoc()) {
        $userId = $row['id'];
        $plainTextPassword = $row['password'];

        // Hash the plain-text password
        // PASSWORD_DEFAULT uses the strongest available algorithm (currently bcrypt)
        $hashedPassword = password_hash($plainTextPassword, PASSWORD_DEFAULT);

        // Update the database with the hashed password
        $stmt->bind_param("si", $hashedPassword, $userId); // "s" for string (hashed password), "i" for integer (user ID)

        if ($stmt->execute()) {
            echo "User ID " . $userId . ": Password hashed and updated successfully.\n";
            $update_count++;
        } else {
            echo "User ID " . $userId . ": Error updating password: " . $stmt->error . "\n";
        }
    }
    $stmt->close();
    echo "\nPassword hashing process completed. Total updated: " . $update_count . " users.\n";
} else {
    echo "No users found in the database to hash passwords for.\n";
}

$conn->close();
?>
