<?php
// Enable full error reporting (for development only)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Allow cross-origin requests
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// 1. CONNECT TO DATABASE
$conn = new mysqli("localhost", "root", "", "koncepto1");

// 2. CHECK CONNECTION
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed: " . $conn->connect_error
    ]);
    exit();
}

// 3. EXECUTE QUERY TO FETCH id AND school_name FROM schools
$sql = "SELECT id, school_name FROM schools";
$result = $conn->query($sql);

// 4. COLLECT RESULTS
$schools = [];

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $schools[] = $row;
    }

    echo json_encode([
        "success" => true,
        "schools" => $schools
    ]);
} else {
    echo json_encode([
        "success" => true,
        "schools" => []
    ]);
}

// 5. CLOSE CONNECTION
$conn->close();
?>
