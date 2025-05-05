<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'forecast_db');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

// API configuration
define('API_RATE_LIMIT', 100); // requests per minute
define('API_TOKEN_SECRET', 'your_secret_key_here'); // Change this to a secure random string

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization'); 