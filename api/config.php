<?php
/* ========================================================
   ESAMELCO MMS — Configuration & Security Layer
   config.php — Include this FIRST in api.php
======================================================== */

// ===== DATABASE CONFIGURATIONS =====
define('DB_HOST', 'localhost');
define('DB_NAME', 'esamelco_mms');
define('DB_USER', 'root');         // Change in production!
define('DB_PASS', '');             // Change in production!

// ===== SECURITY SETTINGS =====
define('SESSION_LIFETIME', 28800);       // 8 hours in seconds
define('SESSION_IDLE_TIMEOUT', 1800);    // 30 minutes idle timeout
define('MAX_LOGIN_ATTEMPTS', 5);         // Lock after 5 failed attempts
define('LOGIN_LOCKOUT_MINUTES', 15);     // Lockout duration
define('CSRF_TOKEN_NAME', 'esamelco_csrf');
define('PASSWORD_MIN_LENGTH', 8);

// ===== SECURE SESSION SETUP =====
ini_set('session.cookie_httponly', 1);   // Prevent JS access to session cookie
ini_set('session.cookie_samesite', 'Strict'); // Prevent CSRF via cookies
ini_set('session.use_strict_mode', 1);   // Reject uninitialized session IDs
ini_set('session.gc_maxlifetime', SESSION_LIFETIME);

// Enable secure cookies when on HTTPS
if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
    ini_set('session.cookie_secure', 1);
}

session_start();


// ===== DATABASE CONNECTION =====
function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                DB_USER, DB_PASS,
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE  => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES    => false,  // Use real prepared statements
                ]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit;
        }
    }
    return $pdo;
}


// ===== JSON RESPONSE HELPER =====
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}


// ===== AUTHENTICATION HELPERS =====
function getCurrentUser() {
    return $_SESSION['user'] ?? null;
}

function requireLogin() {
    // Check session exists
    if (empty($_SESSION['user'])) {
        jsonResponse(['error' => 'Not logged in'], 401);
    }
    // Check idle timeout
    if (isset($_SESSION['last_activity'])) {
        $idle = time() - $_SESSION['last_activity'];
        if ($idle > SESSION_IDLE_TIMEOUT) {
            session_destroy();
            jsonResponse(['error' => 'Session expired (idle timeout). Please log in again.'], 401);
        }
    }
    // Check absolute session lifetime
    if (isset($_SESSION['login_time'])) {
        $elapsed = time() - $_SESSION['login_time'];
        if ($elapsed > SESSION_LIFETIME) {
            session_destroy();
            jsonResponse(['error' => 'Session expired. Please log in again.'], 401);
        }
    }
    // Update last activity
    $_SESSION['last_activity'] = time();
}


// ===== CSRF PROTECTION =====
function generateCSRFToken() {
    if (empty($_SESSION[CSRF_TOKEN_NAME])) {
        $_SESSION[CSRF_TOKEN_NAME] = bin2hex(random_bytes(32));
    }
    return $_SESSION[CSRF_TOKEN_NAME];
}

function validateCSRF() {
    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'];

    // Only enforce on POST/PUT/DELETE (state-changing requests)
    if ($method === 'GET' || $method === 'OPTIONS') return;

    // Skip CSRF check for login (no session yet) and file uploads
    $skipActions = ['login'];
    if (in_array($action, $skipActions)) return;

    // Check header, JSON body, or multipart form data (file uploads) for token
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!$token) {
        $token = $_POST['_csrf'] ?? '';
    }
    if (!$token) {
        $input = json_decode(file_get_contents('php://input'), true);
        $token = $input['_csrf'] ?? '';
    }

    if (!$token || !isset($_SESSION[CSRF_TOKEN_NAME]) || !hash_equals($_SESSION[CSRF_TOKEN_NAME], $token)) {
        jsonResponse(['error' => 'Invalid security token. Please refresh the page.'], 403);
    }
}


// ===== RATE LIMITING (Login Brute Force Protection) =====
function checkLoginRateLimit($username, $db) {
    // Clean old attempts (older than lockout window)
    $cutoff = date('Y-m-d H:i:s', strtotime('-' . LOGIN_LOCKOUT_MINUTES . ' minutes'));
    try {
        $db->prepare('DELETE FROM login_attempts WHERE attempted_at < ?')->execute([$cutoff]);
    } catch (Exception $e) {
        // Table might not exist yet — skip silently
        return;
    }

    // Count recent failures
    $stmt = $db->prepare('SELECT COUNT(*) as cnt FROM login_attempts WHERE username = ? AND attempted_at >= ?');
    $stmt->execute([$username, $cutoff]);
    $count = (int)$stmt->fetch()['cnt'];

    if ($count >= MAX_LOGIN_ATTEMPTS) {
        jsonResponse([
            'error' => 'Too many failed login attempts. Account locked for ' . LOGIN_LOCKOUT_MINUTES . ' minutes.'
        ], 429);
    }
}

function recordFailedLogin($username, $db) {
    try {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $db->prepare('INSERT INTO login_attempts (username, ip_address, attempted_at) VALUES (?, ?, NOW())')
           ->execute([$username, $ip]);
    } catch (Exception $e) {
        // Silent fail if table doesn't exist
    }
}

function clearLoginAttempts($username, $db) {
    try {
        $db->prepare('DELETE FROM login_attempts WHERE username = ?')->execute([$username]);
    } catch (Exception $e) {}
}


// ===== INPUT SANITIZATION (XSS Protection) =====
function sanitize($value) {
    if (is_null($value)) return null;
    if (is_array($value)) {
        return array_map('sanitize', $value);
    }
    return htmlspecialchars(trim((string)$value), ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

function sanitizeInput($input) {
    if (!is_array($input)) return sanitize($input);
    $clean = [];
    foreach ($input as $key => $value) {
        // Don't sanitize passwords (they get hashed, not displayed)
        if (stripos($key, 'password') !== false) {
            $clean[$key] = $value;
        } else {
            $clean[$key] = sanitize($value);
        }
    }
    return $clean;
}


// ===== PASSWORD VALIDATION =====
function validatePassword($password) {
    $errors = [];
    if (strlen($password) < PASSWORD_MIN_LENGTH) {
        $errors[] = 'Password must be at least ' . PASSWORD_MIN_LENGTH . ' characters';
    }
    if (!preg_match('/[A-Z]/', $password)) {
        $errors[] = 'Password must contain at least one uppercase letter';
    }
    if (!preg_match('/[a-z]/', $password)) {
        $errors[] = 'Password must contain at least one lowercase letter';
    }
    if (!preg_match('/[0-9]/', $password)) {
        $errors[] = 'Password must contain at least one number';
    }
    return $errors;
}


// ===== AUDIT LOG HELPER =====
function addAudit($action, $details, $module = null, $refId = null) {
    try {
        $db = getDB();
        $user = getCurrentUser();
        $userId = $user ? $user['user_id'] : null;
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        $ua = isset($_SERVER['HTTP_USER_AGENT']) ? substr($_SERVER['HTTP_USER_AGENT'], 0, 500) : null;

        // Sanitize details for storage
        $details = strip_tags($details);

        $stmt = $db->prepare('INSERT INTO audit_log (user_id, action, module, ref_id, details, ip_address, user_agent) VALUES (?,?,?,?,?,?,?)');
        $stmt->execute([$userId, $action, $module, $refId, $details, $ip, $ua]);
    } catch (Exception $e) {
        // Don't let audit failures break the app
        error_log('Audit log error: ' . $e->getMessage());
    }
}


// ===== FILE UPLOAD VALIDATION =====
function validateUploadedFile($tmpPath, $originalName, $maxSizeKB = 5120) {
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $allowed = ['pdf', 'jpg', 'jpeg', 'png'];

    if (!in_array($ext, $allowed)) {
        return 'File type not allowed: ' . $ext;
    }

    // Check actual file content (not just extension)
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($tmpPath);
    $allowedMimes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
    ];
    if (!in_array($mimeType, $allowedMimes)) {
        return 'File content does not match extension (detected: ' . $mimeType . ')';
    }

    // Check size
    $sizeKB = filesize($tmpPath) / 1024;
    if ($sizeKB > $maxSizeKB) {
        return 'File too large (' . round($sizeKB) . 'KB, max ' . $maxSizeKB . 'KB)';
    }

    return null; // Valid
}


// ===== RUN CSRF VALIDATION ON EVERY REQUEST =====
validateCSRF();