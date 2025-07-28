<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
$conn = new mysqli("localhost", "root", "", "koncepto1");

$data = json_decode(file_get_contents("php://input"));
$id = $data->id;

$sql = "DELETE FROM messages WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "error" => $conn->error]);
}
$conn->close();
?>
