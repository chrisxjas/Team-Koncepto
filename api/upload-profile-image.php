<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$targetDir = "../uploads/";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['photo']) && isset($_POST['id'])) {
        $id = $_POST['id'];
        $image = $_FILES['photo'];
        $fileName = basename($image["name"]);
        $targetFile = $targetDir . $fileName;
        $imageFileType = strtolower(pathinfo($targetFile, PATHINFO_EXTENSION));

        // Optional: validate image type
        $allowedTypes = ['jpg', 'jpeg', 'png', 'gif'];
        if (!in_array($imageFileType, $allowedTypes)) {
            echo json_encode(["success" => false, "message" => "Invalid file type."]);
            exit;
        }

        // Move uploaded file
        if (move_uploaded_file($image["tmp_name"], $targetFile)) {
            // Save to DB
            $conn = new mysqli("localhost", "root", "", "koncepto_db");
            if ($conn->connect_error) {
                echo json_encode(["success" => false, "message" => "Database connection failed"]);
                exit;
            }

            $stmt = $conn->prepare("UPDATE users SET image_url = ? WHERE id = ?");
            $stmt->bind_param("si", $fileName, $id);
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "image_url" => $fileName]);
            } else {
                echo json_encode(["success" => false, "message" => "Failed to update database"]);
            }
            $stmt->close();
            $conn->close();
        } else {
            echo json_encode(["success" => false, "message" => "Failed to move uploaded file"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Missing file or user ID"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}
