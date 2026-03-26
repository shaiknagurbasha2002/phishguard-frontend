<?php
require __DIR__ . '/_cors.php';

echo json_encode([
    'ok' => true,
    'message' => 'API working',
]);
