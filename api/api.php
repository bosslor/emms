<?php
/* ========================================================
  
 
   Usage: api.php?action=login  (POST)
          api.php?action=members (GET)
          etc.
======================================================== */

require_once __DIR__ . '/config.php';

// Allow requests from same origin
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

// Get action from URL
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Route to the correct handler
switch ($action) {

    // ===== AUTHENTICATION =====
    case 'login':
        if ($method !== 'POST') jsonResponse(['error'=>'POST required'], 405);
        $input = json_decode(file_get_contents('php://input'), true);
        $username = trim($input['username'] ?? '');
        $password = $input['password'] ?? '';

        if (!$username) jsonResponse(['error'=>'Username required'], 400);

        $db = getDB();

        // Rate limiting: check failed attempts
        checkLoginRateLimit($username, $db);

        $stmt = $db->prepare('SELECT u.*, r.role_key, r.role_name, r.can_create, r.can_approve, r.can_view_audit, r.can_assign, r.is_consumer, r.is_worker, r.approval_level FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.username = ? AND u.is_active = 1');
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if (!$user) {
            recordFailedLogin($username, $db);
            jsonResponse(['error'=>'Invalid username or password'], 401);
        }

        // Verify password
        if (!password_verify($password, $user['password_hash'])) {
            recordFailedLogin($username, $db);
            jsonResponse(['error'=>'Invalid username or password'], 401);
        }

        // Clear failed attempts on successful login
        clearLoginAttempts($username, $db);

        // Get linked member/worker data
        $memberData = null; $workerData = null;
        if ($user['is_consumer']) {
            $stmt2 = $db->prepare('SELECT * FROM members WHERE user_id = ?');
            $stmt2->execute([$user['user_id']]);
            $memberData = $stmt2->fetch();
        }
        if ($user['is_worker']) {
            $stmt3 = $db->prepare('SELECT * FROM workers WHERE user_id = ?');
            $stmt3->execute([$user['user_id']]);
            $workerData = $stmt3->fetch();
        }

        // Update last login
        $db->prepare('UPDATE users SET last_login = NOW() WHERE user_id = ?')->execute([$user['user_id']]);

        // Regenerate session ID to prevent session fixation
        session_regenerate_id(true);

        // Store in session with timestamps
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

        // Generate CSRF token for this session
        $csrfToken = generateCSRFToken();

        addAudit('LOGIN', 'User ' . $user['full_name'] . ' logged in as ' . $user['role_name']);

        jsonResponse([
            'success' => true,
            'user'    => $_SESSION['user'],
            'csrf_token' => $csrfToken
        ]);
        break;

    case 'logout':
        $user = getCurrentUser();
        if ($user) addAudit('LOGOUT', 'User ' . $user['full_name'] . ' logged out');
        session_destroy();
        jsonResponse(['success' => true]);
        break;

    case 'session':
        // Check if logged in
        $user = getCurrentUser();
        if ($user) {
            // Check idle timeout
            if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity']) > SESSION_IDLE_TIMEOUT) {
                session_destroy();
                jsonResponse(['loggedIn'=>false, 'error'=>'Session expired'], 401);
            }
            $_SESSION['last_activity'] = time();
            jsonResponse(['loggedIn'=>true, 'user'=>$user, 'csrf_token'=>generateCSRFToken()]);
        }
        else jsonResponse(['loggedIn'=>false], 401);
        break;


    // ===== MEMBERS =====
    case 'members':
        requireLogin();
        $db = getDB();

        if ($method === 'GET') {
            $stmt = $db->query('SELECT m.member_id as id, m.account_no as account, CONCAT(m.last_name, ", ", m.first_name, IFNULL(CONCAT(" ", m.middle_initial), "")) as name, CONCAT_WS(", ", m.address_brgy, m.address_muni) as address, m.meter_no as meter, m.connection_type as connType, m.status, m.phone, m.registered_at as dateRegistered FROM members m LEFT JOIN users u ON m.user_id = u.user_id WHERE m.status IN ("Active","Disconnected") AND (u.is_active = 1 OR m.user_id IS NULL) ORDER BY m.member_id');
            jsonResponse($stmt->fetchAll());

        } elseif ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            $user = getCurrentUser();

            $acctNum = trim($input['account'] ?? '');
            $meterNum = trim($input['meter'] ?? '');
            $municipality = trim($input['municipality'] ?? '');

            if (!$acctNum || !$meterNum) jsonResponse(['error'=>'Account number and meter number are required'], 400);

            // Check uniqueness
            $check = $db->prepare('SELECT member_id FROM members WHERE account_no = ?');
            $check->execute([$acctNum]);
            if ($check->fetch()) jsonResponse(['error'=>'Account number already exists'], 400);

            $check2 = $db->prepare('SELECT member_id FROM members WHERE meter_no = ?');
            $check2->execute([$meterNum]);
            if ($check2->fetch()) jsonResponse(['error'=>'Meter number already exists'], 400);

            $stmt = $db->prepare('INSERT INTO members (account_no, first_name, last_name, middle_initial, address_brgy, address_muni, latitude, longitude, phone, email, meter_no, connection_type, status, registered_at, registered_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,CURDATE(),?)');
            $stmt->execute([
                $acctNum,
                $input['firstName'] ?? '',
                $input['lastName'] ?? '',
                $input['middleInitial'] ?? null,
                $input['address'] ?? '',
                $municipality ?: null,
                $input['latitude'] ?? null,
                $input['longitude'] ?? null,
                $input['phone'] ?? null,
                $input['email'] ?? null,
                $meterNum,
                $input['connType'] ?? 'Residential',
                'Active',
                $user['user_id']
            ]);

            $memberId = $db->lastInsertId();
            $fullName = ($input['lastName'] ?? '') . ', ' . ($input['firstName'] ?? '');
            addAudit('CREATE', 'Registered member: ' . $fullName . ' (' . $acctNum . ')', 'members', $memberId);

            jsonResponse(['success'=>true, 'id'=>$memberId, 'account'=>$acctNum, 'meter'=>$meterNum]);
        }
        break;


    // ===== SERVICE REQUESTS =====
    case 'service_requests':
        requireLogin();
        $db = getDB();

        if ($method === 'GET') {
            $user = getCurrentUser();
            $sql = 'SELECT sr.sr_id, sr.sr_number as id, CONCAT(m.last_name, ", ", m.first_name) as consumer, m.meter_no as meter, m.account_no as account, sr.nature, sr.status, sr.landmark, sr.remarks, COALESCE(m.latitude, sr.latitude) as latitude, COALESCE(m.longitude, sr.longitude) as longitude, CONCAT_WS(", ", m.address_brgy, m.address_muni) as location, sr.decline_reason as declineReason, DATE_FORMAT(sr.declined_at, "%Y-%m-%d %H:%i") as declinedAt, IFNULL(du.full_name, "") as declinedBy, DATE_FORMAT(sr.filed_at, "%Y-%m-%d") as filed, sr.assigned_worker_id as assignedWorker, DATE_FORMAT(sr.assigned_at, "%Y-%m-%d") as assignedAt, IFNULL(wu.full_name, "") as workerName, sr.member_id FROM service_requests sr JOIN members m ON sr.member_id = m.member_id LEFT JOIN users du ON sr.declined_by = du.user_id LEFT JOIN workers w ON sr.assigned_worker_id = w.worker_id LEFT JOIN users wu ON w.user_id = wu.user_id';

            // If consumer, show only their own
            if ($user['is_consumer'] && $user['member_data']) {
                $sql .= ' WHERE sr.member_id = ' . (int)$user['member_data']['member_id'];
            }
            // If worker, show only assigned to them
            if ($user['is_worker'] && $user['worker_data']) {
                $sql .= ' WHERE sr.assigned_worker_id = ' . (int)$user['worker_data']['worker_id'];
            }

            $sql .= ' ORDER BY sr.sr_id DESC';
            jsonResponse($db->query($sql)->fetchAll());

        } elseif ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            $user = getCurrentUser();

            // Generate SR number
            $year = date('Y');
            $stmt = $db->query("SELECT COUNT(*) as cnt FROM service_requests WHERE sr_number LIKE 'SR-$year%'");
            $count = $stmt->fetch()['cnt'] + 1;
            $srNumber = 'SR-' . $year . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);

            // Find member_id
            $memberId = $input['memberId'] ?? null;
            if (!$memberId && ($input['account'] ?? '')) {
                $stmt2 = $db->prepare('SELECT member_id FROM members WHERE account_no = ?');
                $stmt2->execute([$input['account']]);
                $row = $stmt2->fetch();
                if ($row) $memberId = $row['member_id'];
            }

            if (!$memberId) jsonResponse(['error'=>'Member not found'], 400);

            // Disconnected members can only submit Reconnection requests
            $nature = $input['nature'] ?? 'Others';
            $memCheck = $db->prepare('SELECT status FROM members WHERE member_id = ?');
            $memCheck->execute([$memberId]);
            $memRow = $memCheck->fetch();
            if ($memRow && $memRow['status'] === 'Disconnected' && $nature !== 'Reconnection') {
                jsonResponse(['error'=>'Your account is disconnected. You can only submit a Reconnection request.'], 400);
            }

            // Consumers can only have one active request at a time (anti-spam)
            if ($user['is_consumer']) {
                $activeCheck = $db->prepare('SELECT sr_number FROM service_requests WHERE member_id = ? AND status NOT IN ("Completed","Declined","Cancelled") LIMIT 1');
                $activeCheck->execute([$memberId]);
                $activeRow = $activeCheck->fetch();
                if ($activeRow) {
                    jsonResponse(['error'=>'You already have an active request (' . $activeRow['sr_number'] . '). Please wait until it is completed before submitting a new one.'], 400);
                }
            }

            $stmt = $db->prepare('INSERT INTO service_requests (sr_number, member_id, nature, status, landmark, remarks, contact_phone, latitude, longitude, filed_by, filed_at) VALUES (?,?,?,?,?,?,?,?,?,?,CURDATE())');
            $stmt->execute([
                $srNumber,
                $memberId,
                $input['nature'] ?? 'Others',
                'New',
                $input['landmark'] ?? null,
                $input['remarks'] ?? null,
                $input['phone'] ?? null,
                $input['latitude'] ?? null,
                $input['longitude'] ?? null,
                $user['user_id']
            ]);

            addAudit('CREATE', 'Created ' . $srNumber . ' — ' . ($input['nature'] ?? ''), 'service_requests', $db->lastInsertId());
            jsonResponse(['success'=>true, 'id'=>$srNumber]);
        }
        break;

    case 'update_sr_status':
        requireLogin();
        $input = json_decode(file_get_contents('php://input'), true);
        $db = getDB();

        $stmt = $db->prepare('UPDATE service_requests SET status = ?, updated_at = NOW() WHERE sr_number = ?');
        $stmt->execute([$input['status'], $input['id']]);

        if ($input['status'] === 'Completed') {
            $db->prepare('UPDATE service_requests SET completed_at = NOW() WHERE sr_number = ?')->execute([$input['id']]);

            // Auto-reactivate member if this was a Reconnection SR
            $srCheck = $db->prepare('SELECT sr.member_id, sr.nature, m.status as member_status, m.account_no, CONCAT(m.last_name, ", ", m.first_name) as member_name FROM service_requests sr JOIN members m ON sr.member_id = m.member_id WHERE sr.sr_number = ?');
            $srCheck->execute([$input['id']]);
            $srRow = $srCheck->fetch();
            if ($srRow && $srRow['nature'] === 'Reconnection' && $srRow['member_status'] === 'Disconnected') {
                $db->prepare('UPDATE members SET status = "Active" WHERE member_id = ?')->execute([$srRow['member_id']]);
                addAudit('UPDATE', 'Auto-reactivated member: ' . $srRow['member_name'] . ' (' . $srRow['account_no'] . ') after Reconnection SR ' . $input['id'] . ' completed', 'members', $srRow['member_id']);
            }
        }

        addAudit('UPDATE', $input['id'] . ' → ' . $input['status'], 'service_requests');
        jsonResponse(['success'=>true]);
        break;


    // ===== RECONNECTION ORDERS =====
    case 'reconnections':
        requireLogin();
        $db = getDB();

        if ($method === 'GET') {
            $user = getCurrentUser();
            $sql = 'SELECT ro.ro_id, ro.ro_number as id, CONCAT(m.last_name, ", ", m.first_name) as consumer, m.account_no as account, m.meter_no as meter, ro.landmark, ro.tor_cr_no as tor, ro.power_bills as bills, ro.surcharge, ro.recon_fee as reconFee, ro.meter_seal_fee as seal, ro.others_vat as others, ro.total_amount as total, ro.status, DATE_FORMAT(ro.created_at, "%Y-%m-%d") as date, ro.assigned_worker_id as assignedWorker, DATE_FORMAT(ro.assigned_at, "%Y-%m-%d") as assignedAt, m.latitude, m.longitude, CONCAT_WS(", ", m.address_brgy, m.address_muni) as location, u1.full_name as prepared_name, u2.full_name as checked_name, u3.full_name as approved_name FROM reconnection_orders ro JOIN members m ON ro.member_id = m.member_id LEFT JOIN users u1 ON ro.prepared_by = u1.user_id LEFT JOIN users u2 ON ro.checked_by = u2.user_id LEFT JOIN users u3 ON ro.approved_by = u3.user_id';

            if ($user['is_worker'] && $user['worker_data']) {
                $sql .= ' WHERE ro.assigned_worker_id = ' . (int)$user['worker_data']['worker_id'];
            }

            $sql .= ' ORDER BY ro.ro_id DESC';
            $rows = $db->query($sql)->fetchAll();

            // Format approval object like the frontend expects
            foreach ($rows as &$r) {
                $r['approval'] = [
                    'prepared' => $r['prepared_name'],
                    'checked'  => $r['checked_name'],
                    'approved' => $r['approved_name'],
                ];
                unset($r['prepared_name'], $r['checked_name'], $r['approved_name']);
            }

            jsonResponse($rows);

        } elseif ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            $user = getCurrentUser();

            $year = date('Y');
            $stmt = $db->query("SELECT COUNT(*) as cnt FROM reconnection_orders WHERE ro_number LIKE 'RO-$year%'");
            $count = $stmt->fetch()['cnt'] + 1;
            $roNumber = 'RO-' . $year . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);

            // Find member
            $memberId = null;
            if ($input['account'] ?? '') {
                $stmt2 = $db->prepare('SELECT member_id FROM members WHERE account_no = ?');
                $stmt2->execute([$input['account']]);
                $row = $stmt2->fetch();
                if ($row) $memberId = $row['member_id'];
            }
            if (!$memberId) jsonResponse(['error'=>'Member not found'], 400);

            $stmt = $db->prepare('INSERT INTO reconnection_orders (ro_number, member_id, landmark, tor_cr_no, power_bills, surcharge, recon_fee, meter_seal_fee, others_vat, status, prepared_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
            $stmt->execute([
                $roNumber, $memberId,
                $input['landmark'] ?? '', $input['tor'] ?? '',
                $input['bills'] ?? 0, $input['surcharge'] ?? 0,
                $input['reconFee'] ?? 150, $input['seal'] ?? 90,
                $input['others'] ?? 0, 'Pending',
                $user['user_id']
            ]);

            $total = ($input['bills']??0)+($input['surcharge']??0)+($input['reconFee']??150)+($input['seal']??90)+($input['others']??0);
            addAudit('CREATE', 'Created ' . $roNumber . ' — ₱' . number_format($total,2), 'reconnection_orders', $db->lastInsertId());
            jsonResponse(['success'=>true, 'id'=>$roNumber]);
        }
        break;


    // ===== METER CHANGE ORDERS =====
    case 'meter_changes':
        requireLogin();
        $db = getDB();

        if ($method === 'GET') {
            $sql = 'SELECT mc.mc_id, mc.mc_number as id, CONCAT(m.last_name, ", ", m.first_name) as consumer, m.account_no as account, CONCAT_WS(", ", m.address_brgy, m.address_muni) as address, mc.reason, mc.status, mc.remarks, DATE_FORMAT(mc.created_at, "%Y-%m-%d") as date FROM meter_change_orders mc JOIN members m ON mc.member_id = m.member_id ORDER BY mc.mc_id DESC';
            $rows = $db->query($sql)->fetchAll();

            // Get meter data for each
            foreach ($rows as &$row) {
                $stmtOld = $db->prepare('SELECT brand, meter_no as no, last_reading as reading, ampere, volts, multiplier as mult FROM meters WHERE meter_id = (SELECT old_meter_id FROM meter_change_orders WHERE mc_id = ?)');
                $stmtOld->execute([$row['mc_id']]);
                $row['oldMeter'] = $stmtOld->fetch() ?: ['brand'=>'—','no'=>'—','reading'=>'0','ampere'=>'—','volts'=>'—','mult'=>'1'];

                $stmtNew = $db->prepare('SELECT brand, meter_no as no, last_reading as reading, ampere, volts, seal_no as seal FROM meters WHERE meter_id = (SELECT new_meter_id FROM meter_change_orders WHERE mc_id = ?)');
                $stmtNew->execute([$row['mc_id']]);
                $row['newMeter'] = $stmtNew->fetch() ?: ['brand'=>'—','no'=>'—','reading'=>'0','ampere'=>'—','volts'=>'—','seal'=>'—'];
            }

            jsonResponse($rows);

        } elseif ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            $user = getCurrentUser();

            $year = date('Y');
            $stmt = $db->query("SELECT COUNT(*) as cnt FROM meter_change_orders WHERE mc_number LIKE 'MC-$year%'");
            $count = $stmt->fetch()['cnt'] + 1;
            $mcNumber = 'MC-' . $year . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);

            // Find member
            $memberId = null;
            if ($input['account'] ?? '') {
                $s = $db->prepare('SELECT member_id FROM members WHERE account_no = ?');
                $s->execute([$input['account']]);
                $row = $s->fetch();
                if ($row) $memberId = $row['member_id'];
            }
            if (!$memberId) jsonResponse(['error'=>'Member not found'], 400);

            // Insert old meter
            $db->prepare('INSERT INTO meters (brand, meter_no, last_reading, ampere, volts, multiplier, is_active) VALUES (?,?,?,?,?,?,0)')->execute([
                $input['oldBrand']??'—', $input['oldMeterNo']??'—', $input['oldReading']??0, $input['oldAmpere']??'—', $input['oldVolts']??'—', $input['oldMult']??'1'
            ]);
            $oldMeterId = $db->lastInsertId();

            // Insert new meter
            $db->prepare('INSERT INTO meters (brand, meter_no, last_reading, ampere, volts, seal_no, is_active) VALUES (?,?,?,?,?,?,1)')->execute([
                $input['newBrand']??'—', $input['newMeterNo']??'—', $input['newReading']??0, $input['newAmpere']??'—', $input['newVolts']??'—', $input['newSeal']??'—'
            ]);
            $newMeterId = $db->lastInsertId();

            $db->prepare('INSERT INTO meter_change_orders (mc_number, member_id, reason, old_meter_id, new_meter_id, status, remarks, created_by) VALUES (?,?,?,?,?,?,?,?)')->execute([
                $mcNumber, $memberId, $input['reason']??'Others', $oldMeterId, $newMeterId, 'Pending', $input['remarks']??'', $user['user_id']
            ]);

            addAudit('CREATE', 'Created ' . $mcNumber, 'meter_change_orders', $db->lastInsertId());
            jsonResponse(['success'=>true, 'id'=>$mcNumber]);
        }
        break;


    // ===== SENIOR CITIZEN DISCOUNTS =====
    case 'senior_discounts':
        requireLogin();
        $db = getDB();

        if ($method === 'GET') {
            $user = getCurrentUser();
            $sql = 'SELECT sc.sc_id, sc.sc_number as id, CONCAT(m.last_name, ", ", m.first_name) as applicant, m.account_no as account, sc.osca_id as scId, sc.age, DATE_FORMAT(sc.date_of_birth, "%Y-%m-%d") as dob, sc.status, DATE_FORMAT(sc.created_at, "%Y-%m-%d") as date FROM senior_citizen_discounts sc JOIN members m ON sc.member_id = m.member_id';

            if ($user['is_consumer'] && $user['member_data']) {
                $sql .= ' WHERE sc.member_id = ' . (int)$user['member_data']['member_id'];
            }

            $sql .= ' ORDER BY sc.sc_id DESC';
            $rows = $db->query($sql)->fetchAll();

            // Get doc counts
            foreach ($rows as &$row) {
                $s = $db->prepare('SELECT COUNT(*) as cnt FROM sc_document_checklist WHERE sc_id = ? AND is_submitted = 1');
                $s->execute([$row['sc_id']]);
                $row['docsCount'] = (int)$s->fetch()['cnt'];
                $row['docsComplete'] = $row['docsCount'] >= 4;
            }

            jsonResponse($rows);

        } elseif ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            $user = getCurrentUser();

            $year = date('Y');
            $stmt = $db->query("SELECT COUNT(*) as cnt FROM senior_citizen_discounts WHERE sc_number LIKE 'SC-$year%'");
            $count = $stmt->fetch()['cnt'] + 1;
            $scNumber = 'SC-' . $year . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);

            $memberId = $input['memberId'] ?? null;
            if (!$memberId && ($input['account'] ?? '')) {
                $s = $db->prepare('SELECT member_id FROM members WHERE account_no = ?');
                $s->execute([$input['account']]);
                $row = $s->fetch();
                if ($row) $memberId = $row['member_id'];
            }
            if (!$memberId) jsonResponse(['error'=>'Member not found'], 400);

            $db->prepare('INSERT INTO senior_citizen_discounts (sc_number, member_id, osca_id, date_of_birth, age, status, created_by) VALUES (?,?,?,?,?,?,?)')->execute([
                $scNumber, $memberId, $input['scId']??'', $input['dob']??null, $input['age']??0, 'Pending', $user['user_id']
            ]);

            $scId = $db->lastInsertId();

            // Insert doc checklist
            $docTypes = ['Proof of Age & Citizenship','Proof of Residence','Proof of Billing','Authorization Letter'];
            $docsSubmitted = $input['docsSubmitted'] ?? [];
            foreach ($docTypes as $i => $dtype) {
                $submitted = in_array($i, $docsSubmitted) ? 1 : 0;
                $db->prepare('INSERT INTO sc_document_checklist (sc_id, doc_type, is_submitted, submitted_at) VALUES (?,?,?,?)')->execute([
                    $scId, $dtype, $submitted, $submitted ? date('Y-m-d H:i:s') : null
                ]);
            }

            addAudit('CREATE', 'Created ' . $scNumber, 'senior_citizen_discounts', $scId);
            jsonResponse(['success'=>true, 'id'=>$scNumber, 'sc_id'=>$scId]);
        }
        break;


    // ===== APPROVALS =====
    case 'approve':
        requireLogin();
        $user = getCurrentUser();
        if (!$user['can_approve']) jsonResponse(['error'=>'No permission'], 403);

        $input = json_decode(file_get_contents('php://input'), true);
        $type = $input['type'] ?? '';
        $id = $input['id'] ?? '';
        $db = getDB();

        if ($type === 'Reconnection') {
            $ro = $db->prepare('SELECT * FROM reconnection_orders WHERE ro_number = ?');
            $ro->execute([$id]);
            $row = $ro->fetch();
            if (!$row) jsonResponse(['error'=>'Not found'], 404);

            if (!$row['checked_by']) {
                $db->prepare('UPDATE reconnection_orders SET checked_by = ?, checked_at = NOW() WHERE ro_number = ?')->execute([$user['user_id'], $id]);
                addAudit('APPROVE', 'Checked ' . $id . ' (step 2/3)', 'reconnection_orders', $row['ro_id']);
            } elseif (!$row['approved_by']) {
                $db->prepare('UPDATE reconnection_orders SET approved_by = ?, approved_at = NOW(), status = "Approved" WHERE ro_number = ?')->execute([$user['user_id'], $id]);
                addAudit('APPROVE', 'Approved ' . $id, 'reconnection_orders', $row['ro_id']);
            }
        } elseif ($type === 'Meter Change') {
            $db->prepare('UPDATE meter_change_orders SET status = "Approved", approved_by = ?, approved_at = NOW() WHERE mc_number = ?')->execute([$user['user_id'], $id]);
            addAudit('APPROVE', 'Approved ' . $id, 'meter_change_orders');
        } elseif ($type === 'Senior Discount') {
            $db->prepare('UPDATE senior_citizen_discounts SET status = "Approved", approved_by = ?, approved_at = NOW() WHERE sc_number = ?')->execute([$user['user_id'], $id]);
            addAudit('APPROVE', 'Approved ' . $id, 'senior_citizen_discounts');
        }

        jsonResponse(['success'=>true]);
        break;

    case 'reject':
        requireLogin();
        $user = getCurrentUser();
        if (!$user['can_approve']) jsonResponse(['error'=>'No permission'], 403);

        $input = json_decode(file_get_contents('php://input'), true);
        $type = $input['type'] ?? '';
        $id = $input['id'] ?? '';
        $db = getDB();

        if ($type === 'Reconnection') {
            $db->prepare('UPDATE reconnection_orders SET status = "Rejected", rejected_by = ?, rejected_at = NOW() WHERE ro_number = ?')->execute([$user['user_id'], $id]);
        } elseif ($type === 'Meter Change') {
            $db->prepare('UPDATE meter_change_orders SET status = "Rejected", rejected_by = ?, rejected_at = NOW() WHERE mc_number = ?')->execute([$user['user_id'], $id]);
        } elseif ($type === 'Senior Discount') {
            $db->prepare('UPDATE senior_citizen_discounts SET status = "Rejected", rejected_by = ?, rejected_at = NOW() WHERE sc_number = ?')->execute([$user['user_id'], $id]);
        }

        addAudit('REJECT', 'Rejected ' . $id);
        jsonResponse(['success'=>true]);
        break;


    // ===== WORKERS =====
    case 'workers':
        requireLogin();
        $db = getDB();

        if ($method === 'GET') {
            $sql = 'SELECT w.worker_id, CONCAT("W", LPAD(w.worker_id, 3, "0")) as id, u.full_name as name, w.team_name as team, w.specialty, w.phone, w.status FROM workers w JOIN users u ON w.user_id = u.user_id ORDER BY w.worker_id';
            jsonResponse($db->query($sql)->fetchAll());

        } elseif ($method === 'POST') {
            $user = getCurrentUser();
            if ($user['role_key'] !== 'admin') jsonResponse(['error'=>'Admin only'], 403);

            $input = json_decode(file_get_contents('php://input'), true);
            $name = trim($input['name'] ?? '');
            $username = trim($input['username'] ?? '');
            $team = $input['team'] ?? '';
            $specialty = $input['specialty'] ?? 'General Maintenance';
            $phone = $input['phone'] ?? '';
            $status = $input['status'] ?? 'Available';

            if (!$name || !$username || !$team) jsonResponse(['error'=>'Name, username, and team required'], 400);

            // Check username exists
            $check = $db->prepare('SELECT user_id FROM users WHERE username = ?');
            $check->execute([$username]);
            if ($check->fetch()) jsonResponse(['error'=>'Username already taken'], 400);

            // Get worker role_id
            $roleStmt = $db->prepare('SELECT role_id FROM roles WHERE role_key = "worker"');
            $roleStmt->execute();
            $roleId = $roleStmt->fetch()['role_id'];

            // Create user account with random default password
            $defaultPass = 'Esam' . rand(1000, 9999) . '!';
            $hash = password_hash($defaultPass, PASSWORD_DEFAULT);
            $db->prepare('INSERT INTO users (username, password_hash, password_change_required, full_name, role_id) VALUES (?,?,TRUE,?,?)')->execute([
                $username, $hash, $name, $roleId
            ]);
            $userId = $db->lastInsertId();

            // Create worker profile
            $db->prepare('INSERT INTO workers (user_id, team_name, specialty, phone, status, created_by) VALUES (?,?,?,?,?,?)')->execute([
                $userId, $team, $specialty, $phone, $status, $user['user_id']
            ]);

            $workerId = $db->lastInsertId();
            addAudit('CREATE', 'Added worker: ' . $name . ' (W' . str_pad($workerId,3,'0',STR_PAD_LEFT) . ') — ' . $team, 'workers', $workerId);
            jsonResponse(['success'=>true, 'id'=>'W' . str_pad($workerId,3,'0',STR_PAD_LEFT), 'defaultPassword'=>$defaultPass]);
        }
        break;

    case 'update_worker_status':
        requireLogin();
        $input = json_decode(file_get_contents('php://input'), true);
        $db = getDB();
        $user = getCurrentUser();

        $workerId = (int)str_replace('W', '', $input['id'] ?? '');
        $newStatus = $input['status'] ?? '';

        // Workers can only update their own status
        if ($user['is_worker'] && $user['worker_data']) {
            if ((int)$user['worker_data']['worker_id'] !== $workerId) {
                jsonResponse(['error'=>'You can only update your own status'], 403);
            }
        }

        // Get worker name for audit
        $wStmt = $db->prepare('SELECT u.full_name FROM workers w JOIN users u ON w.user_id = u.user_id WHERE w.worker_id = ?');
        $wStmt->execute([$workerId]);
        $wRow = $wStmt->fetch();
        $wName = $wRow ? $wRow['full_name'] : 'Unknown';

        $db->prepare('UPDATE workers SET status = ? WHERE worker_id = ?')->execute([$newStatus, $workerId]);
        addAudit('UPDATE', 'Worker ' . $wName . ' status → ' . $newStatus . ($user['is_worker'] ? ' (self-update)' : ''), 'workers', $workerId);
        jsonResponse(['success'=>true]);
        break;


    // ===== ASSIGN WORKER =====
    case 'assign_worker':
        requireLogin();
        $input = json_decode(file_get_contents('php://input'), true);
        $db = getDB();
        $user = getCurrentUser();

        $refType = $input['type'] ?? '';  // 'sr' or 'ro'
        $refId = $input['refId'] ?? '';
        $workerId = $input['workerId'] ?? null;
        $wNum = $workerId ? (int)str_replace('W', '', $workerId) : null;

        if ($refType === 'sr') {
            if ($workerId) {
                $db->prepare('UPDATE service_requests SET assigned_worker_id = ?, assigned_by = ?, assigned_at = NOW() WHERE sr_number = ?')->execute([$wNum, $user['user_id'], $refId]);
                // Auto set to In Progress
                $db->prepare('UPDATE service_requests SET status = "In Progress" WHERE sr_number = ? AND status = "New"')->execute([$refId]);
            } else {
                $db->prepare('UPDATE service_requests SET assigned_worker_id = NULL, assigned_by = NULL, assigned_at = NULL WHERE sr_number = ?')->execute([$refId]);
            }
        } elseif ($refType === 'ro') {
            if ($workerId) {
                $db->prepare('UPDATE reconnection_orders SET assigned_worker_id = ?, assigned_by = ?, assigned_at = NOW() WHERE ro_number = ?')->execute([$wNum, $user['user_id'], $refId]);
            } else {
                $db->prepare('UPDATE reconnection_orders SET assigned_worker_id = NULL, assigned_by = NULL, assigned_at = NULL WHERE ro_number = ?')->execute([$refId]);
            }
        }

        addAudit('ASSIGN', ($workerId ? 'Assigned ' . $workerId : 'Unassigned') . ' on ' . $refId);
        jsonResponse(['success'=>true]);
        break;


    // ===== AUDIT LOG =====
    case 'audit_log':
        requireLogin();
        $user = getCurrentUser();
        if (!$user['can_view_audit']) jsonResponse(['error'=>'No permission'], 403);

        $db = getDB();
        $filter = $_GET['filter'] ?? '';
        $sql = 'SELECT DATE_FORMAT(al.created_at, "%Y-%m-%d %H:%i:%s") as timestamp, IFNULL(u.full_name, "System") as user, IFNULL(r.role_key, "system") as role, al.action, al.details FROM audit_log al LEFT JOIN users u ON al.user_id = u.user_id LEFT JOIN roles r ON u.role_id = r.role_id';
        if ($filter) $sql .= ' WHERE al.action = ' . $db->quote($filter);
        $sql .= ' ORDER BY al.log_id DESC LIMIT 200';
        jsonResponse($db->query($sql)->fetchAll());
        break;


    // ===== BILLING HISTORY (consumer) =====
    case 'billing':
        requireLogin();
        $user = getCurrentUser();
        if (!$user['member_data']) jsonResponse([]);

        $db = getDB();
        $stmt = $db->prepare('SELECT DATE_FORMAT(period_start, "%b %d") as period_start, DATE_FORMAT(period_end, "%b %d, %Y") as period_end, kwh_used, amount, DATE_FORMAT(due_date, "%b %d, %Y") as due_date, payment_status as status FROM billing_history WHERE member_id = ? ORDER BY period_start DESC');
        $stmt->execute([$user['member_data']['member_id']]);
        jsonResponse($stmt->fetchAll());
        break;


    // ===== DASHBOARD STATS =====
    case 'dashboard_stats':
        requireLogin();
        $db = getDB();
        jsonResponse([
            'totalMembers'     => (int)$db->query('SELECT COUNT(*) FROM members')->fetchColumn(),
            'openSR'           => (int)$db->query("SELECT COUNT(*) FROM service_requests WHERE status IN ('New','In Progress')")->fetchColumn(),
            'pendingRecon'     => (int)$db->query("SELECT COUNT(*) FROM reconnection_orders WHERE status = 'Pending'")->fetchColumn(),
            'pendingApprovals' => (int)$db->query("SELECT COUNT(*) FROM reconnection_orders WHERE status='Pending'")->fetchColumn()
                               + (int)$db->query("SELECT COUNT(*) FROM meter_change_orders WHERE status='Pending'")->fetchColumn()
                               + (int)$db->query("SELECT COUNT(*) FROM senior_citizen_discounts WHERE status='Pending'")->fetchColumn(),
            'totalWorkers'     => (int)$db->query('SELECT COUNT(*) FROM workers')->fetchColumn(),
        ]);
        break;


    // ===== SC DOCUMENT FILES =====
    case 'sc_documents':
        requireLogin();
        $db = getDB();
        $scId = $_GET['sc_id'] ?? '';
        if (!$scId) jsonResponse([]);

        $stmt = $db->prepare('SELECT d.document_id, d.file_name, d.file_path, d.file_size_kb, d.mime_type, d.description as doc_type FROM documents d WHERE d.ref_type = "senior_discount" AND d.ref_id = ? ORDER BY d.uploaded_at');
        $stmt->execute([$scId]);
        jsonResponse($stmt->fetchAll());
        break;

    case 'upload_sc_docs':
        requireLogin();
        $user = getCurrentUser();

        if (empty($_FILES['files'])) jsonResponse(['error'=>'No files uploaded'], 400);

        $scId = $_POST['sc_id'] ?? '';
        $scNumber = $_POST['sc_number'] ?? '';
        $docTypes = $_POST['doc_types'] ?? [];

        // Create uploads directory if needed
        $uploadDir = __DIR__ . '/../uploads/sc/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

        $db = getDB();
        $count = 0;
        $files = $_FILES['files'];

        for ($i = 0; $i < count($files['name']); $i++) {
            if ($files['error'][$i] !== UPLOAD_ERR_OK) continue;

            $origName = basename($files['name'][$i]);
            $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
            $allowed = ['pdf','jpg','jpeg','png'];
            if (!in_array($ext, $allowed)) continue;

            // Max 5MB
            if ($files['size'][$i] > 5 * 1024 * 1024) continue;

            // Unique filename
            $safeName = $scNumber . '_' . time() . '_' . $i . '.' . $ext;
            $destPath = $uploadDir . $safeName;
            $webPath = 'uploads/sc/' . $safeName;

            if (move_uploaded_file($files['tmp_name'][$i], $destPath)) {
                $docType = $docTypes[$i] ?? 'Supporting Document';
                $sizeKb = round($files['size'][$i] / 1024);
                $mime = $files['type'][$i] ?? 'application/octet-stream';

                // Find sc_id from sc_number if needed
                $realScId = $scId;
                if (!$realScId && $scNumber) {
                    $s = $db->prepare('SELECT sc_id FROM senior_citizen_discounts WHERE sc_number = ?');
                    $s->execute([$scNumber]);
                    $row = $s->fetch();
                    if ($row) $realScId = $row['sc_id'];
                }

                $db->prepare('INSERT INTO documents (ref_type, ref_id, file_name, file_path, file_size_kb, mime_type, description, uploaded_by) VALUES (?,?,?,?,?,?,?,?)')->execute([
                    'senior_discount', $realScId, $origName, $webPath, $sizeKb, $mime, $docType, $user['user_id']
                ]);
                $count++;
            }
        }

        addAudit('CREATE', 'Uploaded ' . $count . ' document(s) for ' . $scNumber, 'senior_citizen_discounts', $scId);
        jsonResponse(['success'=>true, 'count'=>$count]);
        break;

    // ===== GET SERVICE REQUEST PHOTOS =====
    case 'get_sr_photos':
        requireLogin();
        $db = getDB();
        $srNumber = $_GET['sr'] ?? '';
        if (!$srNumber) jsonResponse(['photos' => []]);

        $stmt = $db->prepare('SELECT sr_id FROM service_requests WHERE sr_number = ?');
        $stmt->execute([$srNumber]);
        $row = $stmt->fetch();
        if (!$row) jsonResponse(['photos' => []]);

        $stmt2 = $db->prepare('SELECT file_name, file_path, mime_type, file_size_kb FROM documents WHERE ref_type = "service_request" AND ref_id = ? ORDER BY document_id ASC');
        $stmt2->execute([$row['sr_id']]);
        jsonResponse(['photos' => $stmt2->fetchAll()]);
        break;

    // ===== UPLOAD SERVICE REQUEST PHOTOS =====
    case 'upload_sr_photos':
        requireLogin();
        $user = getCurrentUser();

        if (empty($_FILES['files'])) jsonResponse(['error'=>'No files uploaded'], 400);

        $srId     = $_POST['sr_id']     ?? '';
        $srNumber = $_POST['sr_number'] ?? '';

        $uploadDir = __DIR__ . '/../uploads/sr/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

        $db    = getDB();
        $count = 0;
        $files = $_FILES['files'];

        // HEIC/HEIF are re-saved as .jpg; everything else uses its own extension
        $heicTypes  = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];
        $finfo      = new finfo(FILEINFO_MIME_TYPE);
        $skipped    = [];

        for ($i = 0; $i < count($files['name']); $i++) {
            if ($files['error'][$i] !== UPLOAD_ERR_OK) {
                $skipped[] = 'file' . $i . ':php_error=' . $files['error'][$i];
                continue;
            }
            if ($files['size'][$i] > 10 * 1024 * 1024) {
                $skipped[] = 'file' . $i . ':too_large';
                continue;
            }

            // Detect real MIME type from file bytes (not the browser-reported value)
            $detectedMime = $finfo->file($files['tmp_name'][$i]);

            // Accept any image/* type; reject everything else
            if (!$detectedMime || strpos($detectedMime, 'image/') !== 0) {
                $skipped[] = 'file' . $i . ':bad_mime=' . $detectedMime;
                continue;
            }

            // Derive a safe extension
            if (in_array($detectedMime, $heicTypes)) {
                $ext = 'jpg'; // HEIC saved as JPEG container for browser compatibility
            } else {
                $parts = explode('/', $detectedMime);
                $ext   = strtolower(end($parts));      // e.g. image/webp → webp
                $ext   = preg_replace('/[^a-z0-9]/', '', $ext); // sanitize
            }

            $origName = basename($files['name'][$i]);
            $safeName = $srNumber . '_' . time() . '_' . $i . '.' . $ext;
            $destPath = $uploadDir . $safeName;
            $webPath  = 'uploads/sr/' . $safeName;

            if (!move_uploaded_file($files['tmp_name'][$i], $destPath)) {
                $skipped[] = 'file' . $i . ':move_failed:dir=' . $uploadDir;
                continue;
            }

            $sizeKb   = round($files['size'][$i] / 1024);
            $realSrId = $srId;
            if (!$realSrId && $srNumber) {
                $s = $db->prepare('SELECT sr_id FROM service_requests WHERE sr_number = ?');
                $s->execute([$srNumber]);
                $row = $s->fetch();
                if ($row) $realSrId = $row['sr_id'];
            }

            $db->prepare('INSERT INTO documents (ref_type, ref_id, file_name, file_path, file_size_kb, mime_type, description, uploaded_by) VALUES (?,?,?,?,?,?,?,?)')->execute([
                'service_request', $realSrId, $origName, $webPath, $sizeKb, $detectedMime, 'Request Photo', $user['user_id']
            ]);
            $count++;
        }

        addAudit('CREATE', 'Uploaded ' . $count . ' photo(s) for ' . $srNumber, 'service_requests', $srId);
        jsonResponse(['success'=>true, 'count'=>$count]);
        break;

    // ===== CANCEL SERVICE REQUEST (consumer) =====
    case 'cancel_sr':
        requireLogin();
        $user  = getCurrentUser();
        $input = json_decode(file_get_contents('php://input'), true);
        $db    = getDB();

        $srNumber = $input['id'] ?? '';
        if (!$srNumber) jsonResponse(['error'=>'SR number required'], 400);

        $stmt = $db->prepare('SELECT sr_id, member_id, status FROM service_requests WHERE sr_number = ?');
        $stmt->execute([$srNumber]);
        $sr = $stmt->fetch();
        if (!$sr) jsonResponse(['error'=>'Request not found'], 404);

        if ($sr['status'] !== 'New') {
            jsonResponse(['error'=>'Only "New" requests can be cancelled'], 400);
        }

        // Consumers may only cancel their own request
        if ($user['is_consumer'] && $user['member_data']) {
            if ((int)$sr['member_id'] !== (int)$user['member_data']['member_id']) {
                jsonResponse(['error'=>'Unauthorized'], 403);
            }
        }

        $db->prepare('UPDATE service_requests SET status = "Cancelled", updated_at = NOW() WHERE sr_number = ?')->execute([$srNumber]);
        addAudit('UPDATE', $srNumber . ' → Cancelled (by consumer)', 'service_requests', $sr['sr_id']);
        jsonResponse(['success'=>true]);
        break;


    // ===== DELETE WORKER =====
    case 'delete_worker':
        requireLogin();
        $user = getCurrentUser();
        if ($user['role_key'] !== 'admin') jsonResponse(['error'=>'Admin only'], 403);

        $input = json_decode(file_get_contents('php://input'), true);
        $workerId = $input['id'] ?? '';
        $wNum = (int)str_replace('W', '', $workerId);

        $db = getDB();

        // Get worker info for audit
        $stmt = $db->prepare('SELECT w.worker_id, u.full_name, u.user_id FROM workers w JOIN users u ON w.user_id = u.user_id WHERE w.worker_id = ?');
        $stmt->execute([$wNum]);
        $worker = $stmt->fetch();
        if (!$worker) jsonResponse(['error'=>'Worker not found'], 404);

        // Unassign from all service requests
        $db->prepare('UPDATE service_requests SET assigned_worker_id = NULL, assigned_by = NULL, assigned_at = NULL WHERE assigned_worker_id = ?')->execute([$wNum]);

        // Unassign from all reconnection orders
        $db->prepare('UPDATE reconnection_orders SET assigned_worker_id = NULL, assigned_by = NULL, assigned_at = NULL WHERE assigned_worker_id = ?')->execute([$wNum]);

        // Delete worker profile
        $db->prepare('DELETE FROM workers WHERE worker_id = ?')->execute([$wNum]);

        // Deactivate user account (don't fully delete to preserve audit trail)
        $db->prepare('UPDATE users SET is_active = 0 WHERE user_id = ?')->execute([$worker['user_id']]);

        addAudit('DELETE', 'Deleted worker: ' . $worker['full_name'] . ' (' . $workerId . ')', 'workers', $wNum);
        jsonResponse(['success'=>true]);
        break;


    // ===== USER MANAGEMENT (admin) =====
    case 'users':
        requireLogin();
        $user = getCurrentUser();
        if ($user['role_key'] !== 'admin') jsonResponse(['error'=>'Admin only'], 403);

        $db = getDB();
        $rows = $db->query('SELECT u.user_id, u.username, u.full_name, u.email, u.phone, u.is_active, r.role_key, r.role_name, DATE_FORMAT(u.created_at, "%Y-%m-%d") as created, DATE_FORMAT(u.last_login, "%Y-%m-%d %H:%i") as lastLogin FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.is_active = 1 ORDER BY r.role_id, u.full_name')->fetchAll();
        jsonResponse($rows);
        break;

    case 'create_user':
        requireLogin();
        $user = getCurrentUser();
        if ($user['role_key'] !== 'admin') jsonResponse(['error'=>'Admin only'], 403);

        $input = json_decode(file_get_contents('php://input'), true);
        $db = getDB();

        $fullName = trim($input['fullName'] ?? '');
        $username = trim($input['username'] ?? '');
        $password = $input['password'] ?? '';
        $roleKey  = $input['roleKey'] ?? '';
        $email    = $input['email'] ?? null;
        $phone    = $input['phone'] ?? null;

        if (!$fullName || !$username || !$password || !$roleKey) {
            jsonResponse(['error'=>'Full name, username, password, and role are required'], 400);
        }
        if (strlen($password) < 6) {
            jsonResponse(['error'=>'Password must be at least 6 characters'], 400);
        }

        // Validate password strength
        $pwErrors = validatePassword($password);
        if (!empty($pwErrors)) {
            jsonResponse(['error'=>implode('. ', $pwErrors)], 400);
        }

        // Check username uniqueness
        $check = $db->prepare('SELECT user_id FROM users WHERE username = ?');
        $check->execute([$username]);
        if ($check->fetch()) jsonResponse(['error'=>'Username already taken'], 400);

        // Get role_id
        $roleStmt = $db->prepare('SELECT role_id, is_consumer, is_worker FROM roles WHERE role_key = ?');
        $roleStmt->execute([$roleKey]);
        $role = $roleStmt->fetch();
        if (!$role) jsonResponse(['error'=>'Invalid role'], 400);

        $hash = password_hash($password, PASSWORD_DEFAULT);

        // Create user
        $db->prepare('INSERT INTO users (username, password_hash, full_name, email, phone, role_id) VALUES (?,?,?,?,?,?)')->execute([
            $username, $hash, $fullName, $email, $phone, $role['role_id']
        ]);
        $userId = $db->lastInsertId();

        $extra = '';

        // If worker role, also create worker profile
        if ($role['is_worker']) {
            $team = $input['team'] ?? 'Crew Alpha';
            $specialty = $input['specialty'] ?? 'General Maintenance';
            $db->prepare('INSERT INTO workers (user_id, team_name, specialty, phone, status, created_by) VALUES (?,?,?,?,?,?)')->execute([
                $userId, $team, $specialty, $phone, 'Available', $user['user_id']
            ]);
            $wId = $db->lastInsertId();
            $extra = ' | Worker W' . str_pad($wId, 3, '0', STR_PAD_LEFT) . ' (' . $team . ')';
        }

        // If consumer role, also create member profile
        if ($role['is_consumer']) {
            $lastName = $input['lastName'] ?? $fullName;
            $firstName = $input['firstName'] ?? '';
            $address = $input['address'] ?? '';
            $municipality = $input['municipality'] ?? '';
            $connType = $input['connType'] ?? 'Residential';
            $acctNum = trim($input['account'] ?? '');
            $meterNum = trim($input['meter'] ?? '');

            if (!$acctNum || !$meterNum) jsonResponse(['error'=>'Account number and meter number are required for consumers'], 400);

            // Check uniqueness
            $chk = $db->prepare('SELECT member_id FROM members WHERE account_no = ?');
            $chk->execute([$acctNum]);
            if ($chk->fetch()) jsonResponse(['error'=>'Account number already exists'], 400);

            $chk2 = $db->prepare('SELECT member_id FROM members WHERE meter_no = ?');
            $chk2->execute([$meterNum]);
            if ($chk2->fetch()) jsonResponse(['error'=>'Meter number already exists'], 400);

            $db->prepare('INSERT INTO members (user_id, account_no, first_name, last_name, address_brgy, address_muni, latitude, longitude, phone, email, meter_no, connection_type, status, registered_at, registered_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,CURDATE(),?)')->execute([
                $userId, $acctNum, $firstName, $lastName, $address, $municipality ?: null, $input['latitude'] ?? null, $input['longitude'] ?? null, $phone, $email, $meterNum, $connType, 'Active', $user['user_id']
            ]);
            $extra = ' | Account ' . $acctNum;
        }

        addAudit('CREATE', 'Created user: ' . $fullName . ' (' . $username . ') as ' . $roleKey . $extra, 'users', $userId);
        jsonResponse(['success'=>true, 'userId'=>$userId, 'username'=>$username]);
        break;


    // ===== BULK CREATE CONSUMER ACCOUNTS (admin/cwdo) =====
    case 'bulk_create_consumers':
        requireLogin();
        $user = getCurrentUser();
        if (!in_array($user['role_key'], ['admin', 'cwdo'])) jsonResponse(['error'=>'Admin or CWDO staff only'], 403);

        $input = json_decode(file_get_contents('php://input'), true);
        $consumers = $input['consumers'] ?? [];

        if (empty($consumers)) jsonResponse(['error'=>'No consumer data provided'], 400);
        if (count($consumers) > 500) jsonResponse(['error'=>'Maximum 500 consumers per batch'], 400);

        $db = getDB();

        // Get consumer role_id
        $roleStmt = $db->prepare('SELECT role_id FROM roles WHERE role_key = "consumer"');
        $roleStmt->execute();
        $consumerRoleId = $roleStmt->fetch()['role_id'];

        $created = 0;
        $skipped = 0;
        $errors = [];

        foreach ($consumers as $idx => $c) {
            $rowNum = $idx + 2; // Excel row (1-indexed header + data)
            $lastName = trim($c['lastName'] ?? '');
            $firstName = trim($c['firstName'] ?? '');
            $acctNum = trim($c['account'] ?? '');
            $meterNum = trim($c['meter'] ?? '');
            $address = trim($c['address'] ?? '');
            $municipality = trim($c['municipality'] ?? '');
            $phone = trim($c['phone'] ?? '');
            $email = trim($c['email'] ?? '');
            $connType = trim($c['connType'] ?? 'Residential');
            $latitude = isset($c['latitude']) && $c['latitude'] !== '' ? $c['latitude'] : null;
            $longitude = isset($c['longitude']) && $c['longitude'] !== '' ? $c['longitude'] : null;

            // Validate required fields
            if (!$lastName || !$firstName) {
                $skipped++;
                if (count($errors) < 20) $errors[] = 'Row ' . $rowNum . ': Missing name';
                continue;
            }
            if (!$acctNum || !$meterNum) {
                $skipped++;
                if (count($errors) < 20) $errors[] = 'Row ' . $rowNum . ': Missing account or meter number';
                continue;
            }

            // Check account uniqueness
            $chk = $db->prepare('SELECT member_id FROM members WHERE account_no = ?');
            $chk->execute([$acctNum]);
            if ($chk->fetch()) {
                $skipped++;
                if (count($errors) < 20) $errors[] = 'Row ' . $rowNum . ': Account ' . $acctNum . ' already exists';
                continue;
            }

            // Check meter uniqueness
            $chk2 = $db->prepare('SELECT member_id FROM members WHERE meter_no = ?');
            $chk2->execute([$meterNum]);
            if ($chk2->fetch()) {
                $skipped++;
                if (count($errors) < 20) $errors[] = 'Row ' . $rowNum . ': Meter ' . $meterNum . ' already exists';
                continue;
            }

            // Check username uniqueness (username = account number)
            $username = $acctNum;
            $chk3 = $db->prepare('SELECT user_id FROM users WHERE username = ?');
            $chk3->execute([$username]);
            if ($chk3->fetch()) {
                $skipped++;
                if (count($errors) < 20) $errors[] = 'Row ' . $rowNum . ': Username ' . $username . ' already exists';
                continue;
            }

            // Generate default password
            $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
            $defaultPass = 'Esam';
            for ($i = 0; $i < 4; $i++) $defaultPass .= $chars[random_int(0, strlen($chars) - 1)];
            $defaultPass .= '!';
            $hash = password_hash($defaultPass, PASSWORD_DEFAULT);

            $fullName = $lastName . ', ' . $firstName;

            try {
                // Create user account
                $db->prepare('INSERT INTO users (username, password_hash, password_change_required, full_name, email, phone, role_id) VALUES (?,?,TRUE,?,?,?,?)')->execute([
                    $username, $hash, $fullName, $email ?: null, $phone ?: null, $consumerRoleId
                ]);
                $userId = $db->lastInsertId();

                // Create member profile
                $db->prepare('INSERT INTO members (user_id, account_no, first_name, last_name, address_brgy, address_muni, latitude, longitude, phone, email, meter_no, connection_type, status, registered_at, registered_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,CURDATE(),?)')->execute([
                    $userId, $acctNum, $firstName, $lastName, $address, $municipality ?: null, $latitude, $longitude, $phone ?: null, $email ?: null, $meterNum, $connType ?: 'Residential', 'Active', $user['user_id']
                ]);

                $created++;
            } catch (Exception $e) {
                $skipped++;
                if (count($errors) < 20) $errors[] = 'Row ' . $rowNum . ': ' . $e->getMessage();
            }
        }

        addAudit('CREATE', 'Bulk imported ' . $created . ' consumer accounts (' . $skipped . ' skipped)', 'users');
        jsonResponse(['success'=>true, 'created'=>$created, 'skipped'=>$skipped, 'errors'=>$errors]);
        break;


    // ===== RESET PASSWORD (admin) =====
    case 'reset_password':
        requireLogin();
        $user = getCurrentUser();
        if ($user['role_key'] !== 'admin') jsonResponse(['error'=>'Admin only'], 403);

        $input = json_decode(file_get_contents('php://input'), true);
        $targetUserId = (int)($input['userId'] ?? 0);
        $customPassword = $input['newPassword'] ?? null;

        if (!$targetUserId) jsonResponse(['error'=>'User ID required'], 400);

        $db = getDB();

        // Get target user info
        $stmt = $db->prepare('SELECT u.full_name, u.username, r.role_key FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ?');
        $stmt->execute([$targetUserId]);
        $target = $stmt->fetch();
        if (!$target) jsonResponse(['error'=>'User not found'], 404);

        // Generate or use custom password
        if ($customPassword) {
            $pwErrors = validatePassword($customPassword);
            if (!empty($pwErrors)) jsonResponse(['error'=>implode('. ', $pwErrors)], 400);
            $newPass = $customPassword;
        } else {
            // Generate random password: Esam + 4 digits + special char
            $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
            $newPass = 'Esam';
            for ($i = 0; $i < 4; $i++) $newPass .= $chars[random_int(0, strlen($chars) - 1)];
            $newPass .= '!';
        }

        $hash = password_hash($newPass, PASSWORD_DEFAULT);
        $db->prepare('UPDATE users SET password_hash = ?, password_change_required = TRUE WHERE user_id = ?')
           ->execute([$hash, $targetUserId]);

        addAudit('SECURITY', 'Admin reset password for: ' . $target['full_name'] . ' (' . $target['username'] . ')', 'users', $targetUserId);
        jsonResponse(['success'=>true, 'newPassword'=>$newPass]);
        break;


    // ===== CHANGE PASSWORD =====
    case 'change_password':
        requireLogin();
        $user = getCurrentUser();
        $input = json_decode(file_get_contents('php://input'), true);
        $db = getDB();

        $currentPass = $input['currentPassword'] ?? '';
        $newPass = $input['newPassword'] ?? '';

        if (!$currentPass || !$newPass) jsonResponse(['error'=>'Current and new password required'], 400);

        // Validate new password strength
        $pwErrors = validatePassword($newPass);
        if (!empty($pwErrors)) {
            jsonResponse(['error'=>implode('. ', $pwErrors)], 400);
        }

        // Verify current password
        $stmt = $db->prepare('SELECT password_hash FROM users WHERE user_id = ?');
        $stmt->execute([$user['user_id']]);
        $row = $stmt->fetch();

        if (!$row || !password_verify($currentPass, $row['password_hash'])) {
            jsonResponse(['error'=>'Current password is incorrect'], 401);
        }

        // Update password and clear the forced-change flag
        $newHash = password_hash($newPass, PASSWORD_DEFAULT);
        $db->prepare('UPDATE users SET password_hash = ?, password_change_required = FALSE WHERE user_id = ?')
           ->execute([$newHash, $user['user_id']]);

        // Update session
        $_SESSION['user']['password_change_required'] = false;

        addAudit('SECURITY', 'User ' . $user['full_name'] . ' changed their password', 'users', $user['user_id']);
        jsonResponse(['success'=>true]);
        break;


    // ===== IMPORT COORDINATES (admin) =====
    case 'import_coordinates':
        requireLogin();
        $user = getCurrentUser();
        if ($method !== 'POST') jsonResponse(['error'=>'POST required'], 405);

        $input = json_decode(file_get_contents('php://input'), true);
        $coordinates = $input['coordinates'] ?? [];

        if (empty($coordinates)) jsonResponse(['error'=>'No coordinates provided'], 400);

        $db = getDB();
        $stmt = $db->prepare('UPDATE members SET latitude = ?, longitude = ? WHERE account_no = ?');

        $updated = 0;
        $notFound = 0;
        $notFoundList = [];

        foreach ($coordinates as $coord) {
            $acct = trim($coord['account'] ?? '');
            $lat = $coord['latitude'] ?? null;
            $lng = $coord['longitude'] ?? null;

            if (!$acct || $lat === null || $lng === null) continue;

            // Check if account exists
            $check = $db->prepare('SELECT member_id FROM members WHERE account_no = ?');
            $check->execute([$acct]);
            if ($check->fetch()) {
                $stmt->execute([$lat, $lng, $acct]);
                $updated++;
            } else {
                $notFound++;
                if (count($notFoundList) < 20) $notFoundList[] = $acct;
            }
        }

        addAudit('UPDATE', 'Imported coordinates for ' . $updated . ' members from Excel (' . $notFound . ' not found)', 'members');
        jsonResponse(['success'=>true, 'updated'=>$updated, 'not_found'=>$notFound, 'not_found_list'=>$notFoundList]);
        break;


    // ===== UPDATE MEMBER STATUS (admin/staff) =====
    case 'update_member_status':
        requireLogin();
        $user = getCurrentUser();
        if ($user['is_consumer'] || $user['is_worker']) jsonResponse(['error'=>'Not authorized'], 403);

        $input = json_decode(file_get_contents('php://input'), true);
        $memberId = (int)($input['memberId'] ?? 0);
        $newStatus = $input['status'] ?? '';
        $db = getDB();

        if (!$memberId || !in_array($newStatus, ['Active', 'Disconnected'])) {
            jsonResponse(['error'=>'Invalid member ID or status'], 400);
        }

        $stmt = $db->prepare('SELECT account_no, CONCAT(last_name, ", ", first_name) as name, status FROM members WHERE member_id = ?');
        $stmt->execute([$memberId]);
        $member = $stmt->fetch();
        if (!$member) jsonResponse(['error'=>'Member not found'], 404);

        if ($member['status'] === $newStatus) {
            jsonResponse(['error'=>'Member is already ' . $newStatus], 400);
        }

        $db->prepare('UPDATE members SET status = ? WHERE member_id = ?')->execute([$newStatus, $memberId]);
        addAudit('UPDATE', 'Changed member status: ' . $member['name'] . ' (' . $member['account_no'] . ') → ' . $newStatus, 'members', $memberId);
        jsonResponse(['success'=>true]);
        break;


    // ===== COMPLETE RECONNECTION ORDER (worker/staff) =====
    case 'complete_reconnection':
        requireLogin();
        $user = getCurrentUser();
        $input = json_decode(file_get_contents('php://input'), true);
        $db = getDB();

        $roNumber = $input['id'] ?? '';
        if (!$roNumber) jsonResponse(['error'=>'RO number required'], 400);

        $ro = $db->prepare('SELECT ro_id, member_id, status FROM reconnection_orders WHERE ro_number = ?');
        $ro->execute([$roNumber]);
        $row = $ro->fetch();
        if (!$row) jsonResponse(['error'=>'Reconnection order not found'], 404);

        // Mark the reconnection as completed
        $db->prepare('UPDATE reconnection_orders SET status = "Completed", completed_at = NOW() WHERE ro_number = ?')->execute([$roNumber]);
        addAudit('UPDATE', 'Completed reconnection ' . $roNumber, 'reconnection_orders', $row['ro_id']);

        // Auto-reactivate the member if disconnected
        $memberId = $row['member_id'];
        $memberStmt = $db->prepare('SELECT account_no, CONCAT(last_name, ", ", first_name) as name, status FROM members WHERE member_id = ?');
        $memberStmt->execute([$memberId]);
        $member = $memberStmt->fetch();
        $reactivated = false;

        if ($member && $member['status'] === 'Disconnected') {
            $db->prepare('UPDATE members SET status = "Active" WHERE member_id = ?')->execute([$memberId]);
            addAudit('UPDATE', 'Auto-reactivated member: ' . $member['name'] . ' (' . $member['account_no'] . ') after reconnection ' . $roNumber, 'members', $memberId);
            $reactivated = true;
        }

        jsonResponse(['success'=>true, 'memberReactivated' => $reactivated]);
        break;


    // ===== DECLINE SERVICE REQUEST (worker) =====
    case 'decline_sr':
        requireLogin();
        $user = getCurrentUser();
        $input = json_decode(file_get_contents('php://input'), true);
        $db = getDB();

        $srNumber = $input['id'] ?? '';
        $reason = trim($input['reason'] ?? '');

        if (!$reason) jsonResponse(['error'=>'Please provide a reason for declining'], 400);

        // Update SR status to Declined with reason
        $db->prepare('UPDATE service_requests SET status = "Declined", decline_reason = ?, declined_by = ?, declined_at = NOW(), assigned_worker_id = NULL, assigned_by = NULL, assigned_at = NULL WHERE sr_number = ?')->execute([
            $reason, $user['user_id'], $srNumber
        ]);

        $workerName = $user['full_name'] ?? 'Worker';
        addAudit('UPDATE', $workerName . ' declined ' . $srNumber . ': ' . $reason, 'service_requests');
        jsonResponse(['success'=>true]);
        break;


    // ===== DELETE USER (admin) =====
    case 'delete_user':
        requireLogin();
        $user = getCurrentUser();
        if ($user['role_key'] !== 'admin') jsonResponse(['error'=>'Admin only'], 403);

        $input = json_decode(file_get_contents('php://input'), true);
        $userId = (int)($input['userId'] ?? 0);

        if (!$userId) jsonResponse(['error'=>'User ID required'], 400);

        // Cannot delete yourself
        if ($userId === (int)$user['user_id']) {
            jsonResponse(['error'=>'You cannot delete your own account'], 400);
        }

        $db = getDB();

        // Get user info for audit
        $stmt = $db->prepare('SELECT u.full_name, u.username, r.role_key, r.is_worker FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ?');
        $stmt->execute([$userId]);
        $targetUser = $stmt->fetch();
        if (!$targetUser) jsonResponse(['error'=>'User not found'], 404);

        // If user is a worker, unassign all their jobs and delete worker profile
        if ($targetUser['is_worker']) {
            $wStmt = $db->prepare('SELECT worker_id FROM workers WHERE user_id = ?');
            $wStmt->execute([$userId]);
            $worker = $wStmt->fetch();
            if ($worker) {
                $wId = $worker['worker_id'];
                $db->prepare('UPDATE service_requests SET assigned_worker_id = NULL, assigned_by = NULL, assigned_at = NULL WHERE assigned_worker_id = ?')->execute([$wId]);
                $db->prepare('UPDATE reconnection_orders SET assigned_worker_id = NULL, assigned_by = NULL, assigned_at = NULL WHERE assigned_worker_id = ?')->execute([$wId]);
                $db->prepare('DELETE FROM workers WHERE worker_id = ?')->execute([$wId]);
            }
        }

        // Deactivate user (preserve audit trail)
        $db->prepare('UPDATE users SET is_active = 0 WHERE user_id = ?')->execute([$userId]);

        // If consumer, also deactivate their member record
        $db->prepare('UPDATE members SET status = "Inactive" WHERE user_id = ?')->execute([$userId]);

        addAudit('DELETE', 'Deleted user: ' . $targetUser['full_name'] . ' (' . $targetUser['username'] . ', ' . $targetUser['role_key'] . ')', 'users', $userId);
        jsonResponse(['success'=>true]);
        break;


    // ===== SYNC HASH (for real-time polling) =====
    case 'sync_hash':
        $db = getDB();
        $hash = '';
        $tables = ['service_requests', 'members', 'reconnection_orders', 'meter_change_orders', 'senior_citizen_discounts', 'workers', 'users'];
        foreach ($tables as $t) {
            try {
                $row = $db->query("SELECT COUNT(*) as c, MAX(IFNULL(created_at,'')) as m FROM $t")->fetch();
                $hash .= $t . ':' . ($row['c'] ?? 0) . ':' . ($row['m'] ?? '') . '|';
            } catch (Exception $e) {}
        }
        try {
            $aRow = $db->query("SELECT COUNT(*) as c FROM audit_log")->fetch();
            $hash .= 'audit:' . ($aRow['c'] ?? 0);
        } catch (Exception $e) {}
        jsonResponse(['hash' => md5($hash)]);
        break;


    // ===== PURGE PREVIEW (admin) =====
    case 'purge_preview':
        requireLogin();
        $user = getCurrentUser();
        if ($user['role_key'] !== 'admin') jsonResponse(['error'=>'Admin only'], 403);

        $db = getDB();
        $cutoff = date('Y-m-d', strtotime('-1 year'));

        $srCount = $db->prepare("SELECT COUNT(*) as c FROM service_requests WHERE status IN ('Completed','Declined') AND filed_at < ?");
        $srCount->execute([$cutoff]);

        $roCount = $db->prepare("SELECT COUNT(*) as c FROM reconnection_orders WHERE status = 'Completed' AND created_at < ?");
        $roCount->execute([$cutoff]);

        $auditCount = $db->prepare("SELECT COUNT(*) as c FROM audit_log WHERE created_at < ?");
        $auditCount->execute([$cutoff]);

        jsonResponse([
            'service_requests' => (int)$srCount->fetch()['c'],
            'reconnections' => (int)$roCount->fetch()['c'],
            'audit_log' => (int)$auditCount->fetch()['c'],
            'cutoff_date' => $cutoff
        ]);
        break;


    // ===== PURGE OLD RECORDS (admin) =====
    case 'purge_old_records':
        requireLogin();
        $user = getCurrentUser();
        if ($user['role_key'] !== 'admin') jsonResponse(['error'=>'Admin only'], 403);

        $db = getDB();
        $cutoff = date('Y-m-d', strtotime('-1 year'));
        $total = 0;

        // Delete completed/declined service requests older than 1 year
        $stmt1 = $db->prepare("DELETE FROM service_requests WHERE status IN ('Completed','Declined') AND filed_at < ?");
        $stmt1->execute([$cutoff]);
        $srDel = $stmt1->rowCount();
        $total += $srDel;

        // Delete completed reconnection orders older than 1 year
        $stmt2 = $db->prepare("DELETE FROM reconnection_orders WHERE status = 'Completed' AND created_at < ?");
        $stmt2->execute([$cutoff]);
        $roDel = $stmt2->rowCount();
        $total += $roDel;

        // Delete audit log entries older than 1 year
        $stmt3 = $db->prepare("DELETE FROM audit_log WHERE created_at < ?");
        $stmt3->execute([$cutoff]);
        $auDel = $stmt3->rowCount();
        $total += $auDel;

        // Log the purge action itself
        addAudit('PURGE', 'Purged ' . $total . ' old records (before ' . $cutoff . '): ' . $srDel . ' SRs, ' . $roDel . ' ROs, ' . $auDel . ' audit entries', 'system');

        jsonResponse(['success'=>true, 'total_deleted'=>$total, 'service_requests'=>$srDel, 'reconnections'=>$roDel, 'audit_log'=>$auDel]);
        break;


    default:
        jsonResponse(['error' => 'Unknown action: ' . $action], 404);
}
