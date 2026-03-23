<?php
/* ========================================================
   ESAMELCO MMS — Configuration & Security Layer
   config.php — Include this FIRST in api.php
======================================================== */

// ===== DATABASE CONFIGURATION =====
// Works on Railway (env vars) and locally (fallback values)

define('DB_HOST', getenv('MYSQLHOST') ?: '127.0.0.1');
define('DB_PORT', getenv('MYSQLPORT') ?: '3306');
define('DB_NAME', getenv('MYSQLDATABASE') ?: 'esamelco_mms');
define('DB_USER', getenv('MYSQLUSER') ?: 'root');
define('DB_PASS', getenv('MYSQLPASSWORD') ?: '');          // Change in production!

// ===== SECURITY SETTINGS =====
define('SESSION_LIFETIME', 28800);       // 8 hours in seconds
define('SESSION_IDLE_TIMEOUT', 1800);    // 30 minutes idle timeout
define('MAX_LOGIN_ATTEMPTS', 5);         // Lock after 5 failed attempts
define('LOGIN_LOCKOUT_MINUTES', 15);     // Lockout duration
define('CSRF_TOKEN_NAME', 'esamelco_csrf');
define('PASSWORD_MIN_LENGTH', 8);

// ===== SECURE SESSION SETUP =====
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.use_strict_mode', 1);
ini_set('session.gc_maxlifetime', SESSION_LIFETIME);
ini_set('session.cookie_lifetime', SESSION_LIFETIME);

if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
    ini_set('session.cookie_secure', 1);
}

// Ensure writable session path (Railway/cloud fix)
$defaultPath = session_save_path();
if (empty($defaultPath) || !is_writable($defaultPath)) {
    $altPath = sys_get_temp_dir() . '/esamelco_sessions';
    if (!is_dir($altPath)) @mkdir($altPath, 0700, true);
    if (is_dir($altPath) && is_writable($altPath)) {
        session_save_path($altPath);
    }
}

session_start();


// ===== PERSISTENT AUTH TOKEN (survives session loss) =====
function generateAuthToken($userId, $db) {
    $token = bin2hex(random_bytes(32));
    $hash = hash('sha256', $token);
    $expires = date('Y-m-d H:i:s', time() + SESSION_LIFETIME);
    // Ensure auth_tokens table exists
    try {
        $db->exec('CREATE TABLE IF NOT EXISTS auth_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token_hash VARCHAR(64) NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX(token_hash),
            INDEX(user_id)
        )');
    } catch (Exception $e) {}
    // Clean old tokens for this user
    try { $db->prepare('DELETE FROM auth_tokens WHERE user_id = ? OR expires_at < NOW()')->execute([$userId]); } catch (Exception $e) {}
    // Store new token
    try { $db->prepare('INSERT INTO auth_tokens (user_id, token_hash, expires_at) VALUES (?,?,?)')->execute([$userId, $hash, $expires]); } catch (Exception $e) {}
    // Set cookie
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    setcookie('esamelco_auth', $token, [
        'expires' => time() + SESSION_LIFETIME,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    return $token;
}

function restoreSessionFromToken($db) {
    $token = $_COOKIE['esamelco_auth'] ?? null;
    if (!$token) return false;
    $hash = hash('sha256', $token);
    try {
        $stmt = $db->prepare('SELECT at.user_id, at.expires_at FROM auth_tokens at WHERE at.token_hash = ? AND at.expires_at > NOW()');
        $stmt->execute([$hash]);
        $row = $stmt->fetch();
        if (!$row) return false;
        // Restore session from DB
        $userId = $row['user_id'];
        $userStmt = $db->prepare('SELECT u.*, r.role_key, r.role_name, r.can_create, r.can_approve, r.can_view_audit, r.can_assign, r.is_consumer, r.is_worker, r.approval_level FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ? AND u.is_active = 1');
        $userStmt->execute([$userId]);
        $user = $userStmt->fetch();
        if (!$user) return false;
        // Get linked member/worker data
        $memberData = null; $workerData = null;
        if ($user['is_consumer']) {
            $s = $db->prepare('SELECT * FROM members WHERE user_id = ?');
            $s->execute([$userId]);
            $memberData = $s->fetch();
        }
        if ($user['is_worker']) {
            $s = $db->prepare('SELECT * FROM workers WHERE user_id = ?');
            $s->execute([$userId]);
            $workerData = $s->fetch();
        }
        // Rebuild session
        $_SESSION['user'] = [
            'user_id'     => $user['user_id'],
            'username'    => $user['username'],
            'full_name'   => $user['full_name'],
            'role_key'    => $user['role_key'],
            'role_name'   => $user['role_name'],
            'can_create'  => (bool)$user['can_create'],
            'can_approve' => (bool)$user['can_approve'],
            'can_view_audit' => (bool)$user['can_view_audit'],
            'can_assign'  => (bool)$user['can_assign'],
            'is_consumer' => (bool)$user['is_consumer'],
            'is_worker'   => (bool)$user['is_worker'],
            'approval_level' => (int)$user['approval_level'],
            'member_data' => $memberData,
            'worker_data' => $workerData,
            'password_change_required' => (bool)($user['password_change_required'] ?? false),
        ];
        $_SESSION['login_time'] = time();
        $_SESSION['last_activity'] = time();
        return true;
    } catch (Exception $e) {
        return false;
    }
}

function clearAuthToken($db) {
    $token = $_COOKIE['esamelco_auth'] ?? null;
    if ($token) {
        $hash = hash('sha256', $token);
        try { $db->prepare('DELETE FROM auth_tokens WHERE token_hash = ?')->execute([$hash]); } catch (Exception $e) {}
    }
    setcookie('esamelco_auth', '', ['expires' => time() - 3600, 'path' => '/', 'samesite' => 'Lax']);
}


// ===== DATABASE CONNECTION =====
function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
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
        // Try to restore from persistent auth token
        try {
            $db = getDB();
            if (!restoreSessionFromToken($db)) {
                jsonResponse(['error' => 'Not logged in'], 401);
            }
        } catch (Exception $e) {
            jsonResponse(['error' => 'Not logged in'], 401);
        }
    }
    // Check idle timeout
    if (isset($_SESSION['last_activity'])) {
        $idle = time() - $_SESSION['last_activity'];
        if ($idle > SESSION_IDLE_TIMEOUT) {
            try { $db = getDB(); clearAuthToken($db); } catch (Exception $e) {}
            session_destroy();
            jsonResponse(['error' => 'Session expired (idle timeout). Please log in again.'], 401);
        }
    }
    // Check absolute session lifetime
    if (isset($_SESSION['login_time'])) {
        $elapsed = time() - $_SESSION['login_time'];
        if ($elapsed > SESSION_LIFETIME) {
            try { $db = getDB(); clearAuthToken($db); } catch (Exception $e) {}
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

    // Check header, JSON body, or POST field (multipart/form-data uploads)
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!$token) {
        $input = json_decode(file_get_contents('php://input'), true);
        $token = $input['_csrf'] ?? '';
    }
    if (!$token) {
        // For multipart/form-data, php://input is unavailable; read from $_POST instead
        $token = $_POST['_csrf'] ?? '';
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
