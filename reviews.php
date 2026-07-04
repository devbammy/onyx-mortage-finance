<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight OPTIONS requests for CORS if needed
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$reviewsFile = __DIR__ . '/reviews.json';

// Initialize the file if it does not exist
if (!file_exists($reviewsFile)) {
    file_put_contents($reviewsFile, json_encode([], JSON_PRETTY_PRINT));
}

// GET handler
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $data = file_get_contents($reviewsFile);
    if ($data === false) {
        http_response_code(500);
        echo json_encode(["error" => "Could not read reviews file."]);
        exit;
    }
    echo $data;
    exit;
}

// POST handler
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Read raw request body
    $json = file_get_contents('php://input');
    $newReview = json_decode($json, true);

    // Validate request data
    if (!$newReview || !isset($newReview['name']) || !isset($newReview['location']) || !isset($newReview['rating']) || !isset($newReview['text'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required fields (name, location, rating, text)."]);
        exit;
    }

    // Read existing reviews
    $data = file_get_contents($reviewsFile);
    $reviews = json_decode($data, true);
    if (!is_array($reviews)) {
        $reviews = [];
    }

    // Ensure safe values and default date
    $newReview['date'] = isset($newReview['date']) ? htmlspecialchars($newReview['date']) : date('Y-m-d');
    $newReview['rating'] = (int)$newReview['rating'];
    $newReview['name'] = htmlspecialchars($newReview['name']);
    $newReview['location'] = htmlspecialchars($newReview['location']);
    $newReview['text'] = htmlspecialchars($newReview['text']);

    $reviews[] = $newReview;

    // Write back to file with lock
    if (file_put_contents($reviewsFile, json_encode($reviews, JSON_PRETTY_PRINT), LOCK_EX) !== false) {
        http_response_code(201);
        echo json_encode($newReview);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Could not write review to data file. Please verify folder permissions."]);
    }
    exit;
}

http_response_code(405);
echo json_encode(["error" => "Method not allowed."]);
?>
