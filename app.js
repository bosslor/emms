// ===== API CONFIGURATION =====
const API = "api/api.php"; // Path to the PHP backend
var csrfToken = ""; // CSRF token from server

// Helper: call the API
async function api(action, method = "GET", body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
  };
  if (body) {
    // Inject CSRF token into POST body
    if (method === "POST" && csrfToken) body._csrf = csrfToken;
    opts.body = JSON.stringify(body);
  }
  // Also send CSRF as header
  if (method === "POST" && csrfToken) opts.headers["X-CSRF-Token"] = csrfToken;

  const url = API + "?action=" + action;
  try {
    const res = await fetch(url, opts);
    const data = await res.json();

    // Handle session expired
    if (
      res.status === 401 &&
      data.error &&
      data.error.indexOf("expired") !== -1
    ) {
      showToast("error", "Session expired. Please log in again.");
      setTimeout(handleLogout, 1500);
      return null;
    }

    if (!res.ok && data.error) {
      if (!isSyncRefresh) showToast("error", data.error);
      return null;
    }
    // Notify other tabs when data is modified
    if (method === "POST" && data && data.success) {
      notifyOtherTabs();
      lastSyncHash = "";
    }
    // Update CSRF token if returned
    if (data && data.csrf_token) csrfToken = data.csrf_token;
    return data;
  } catch (e) {
    console.error("API Error:", e);
    if (!isSyncRefresh)
      showToast("error", "Cannot reach server. Is XAMPP running?");
    return null;
  }
}

// ===== LOCAL CACHE (loaded from DB, kept in sync) =====
const DB = {
  currentUser: null,
  members: [],
  serviceRequests: [],
  reconnections: [],
  meterChanges: [],
  seniorDiscounts: [],
  auditLog: [],
  workers: [],
};

const ROLES = {
  admin: {
    label: "System Administrator",
    color: "#3B82F6",
    canApprove: true,
    canCreate: true,
    canViewAudit: true,
    level: 5,
    isConsumer: false,
    isWorker: false,
  },
  cwdo: {
    label: "CWDO Staff",
    color: "#10B981",
    canApprove: false,
    canCreate: true,
    canViewAudit: false,
    level: 1,
    isConsumer: false,
    isWorker: false,
  },
  cao_disco: {
    label: "CAO Disco Head",
    color: "#F59E0B",
    canApprove: true,
    canCreate: true,
    canViewAudit: true,
    level: 2,
    isConsumer: false,
    isWorker: false,
  },
  cao_manager: {
    label: "CAO Area Manager",
    color: "#8B5CF6",
    canApprove: true,
    canCreate: true,
    canViewAudit: true,
    level: 3,
    isConsumer: false,
    isWorker: false,
  },
  gm: {
    label: "General Manager",
    color: "#EF4444",
    canApprove: true,
    canCreate: false,
    canViewAudit: true,
    level: 4,
    isConsumer: false,
    isWorker: false,
  },
  worker: {
    label: "Field Worker / Crew",
    color: "#06B6D4",
    canApprove: false,
    canCreate: false,
    canViewAudit: false,
    level: 0,
    isConsumer: false,
    isWorker: true,
  },
  consumer: {
    label: "Member / Consumer",
    color: "#22C55E",
    canApprove: false,
    canCreate: false,
    canViewAudit: false,
    level: 0,
    isConsumer: true,
    isWorker: false,
  },
};

// ===== XSS PROTECTION =====
function esc(str) {
  if (str === null || str === undefined) return "";
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

// ===== REAL-TIME SYNC =====
var syncInterval = null;
var syncChannel = null;

function startSync() {
  // Reset sync state
  lastSyncHash = "";
  syncInitialized = false;
  // Poll server every 5 seconds for fresh data
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(syncData, 3000);

  // BroadcastChannel for cross-tab sync (same browser)
  try {
    syncChannel = new BroadcastChannel("esamelco_sync");
    syncChannel.onmessage = function (e) {
      if (e.data && e.data.type === "data_changed") {
        refreshCurrentPage();
      }
    };
  } catch (ex) {
    /* BroadcastChannel not supported */
  }
}

function stopSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  if (syncChannel) {
    syncChannel.close();
    syncChannel = null;
  }
}

function notifyOtherTabs() {
  try {
    if (syncChannel) syncChannel.postMessage({ type: "data_changed" });
  } catch (ex) {}
}

var lastSyncHash = "";
var syncInitialized = false;
async function syncData() {
  if (!DB.currentUser) return;
  try {
    var res = await fetch(API + "?action=sync_hash", {
      credentials: "same-origin",
    });
    if (!res.ok) return;
    var data = await res.json();
    if (data && data.hash) {
      if (!syncInitialized) {
        // First poll — just record the hash, don't refresh (page already rendered)
        lastSyncHash = data.hash;
        syncInitialized = true;
      } else if (data.hash !== lastSyncHash) {
        lastSyncHash = data.hash;
        refreshCurrentPage();
      }
    }
  } catch (e) {
    /* silent fail on polling */
  }
}

var isSyncRefresh = false;

function refreshCurrentPage() {
  var activePage = document.querySelector(".page.active");
  if (!activePage) return;
  var pageId = activePage.id.replace("page-", "");
  isSyncRefresh = true;
  // Re-render whatever page is currently showing
  switch (pageId) {
    case "dashboard":
      renderDashboard();
      break;
    case "members":
      renderMembers();
      break;
    case "service-requests":
      renderServiceRequests();
      break;
    case "reconnections":
      renderReconnections();
      break;
    case "meter-changes":
      renderMeterChanges();
      break;
    case "senior-discount":
      renderSeniorDiscounts();
      break;
    case "workers":
      renderWorkers();
      break;
    case "approvals":
      renderApprovals();
      break;
    case "audit":
      renderAuditLog();
      break;
    case "user-mgmt":
      renderUsers();
      break;
    case "c-dashboard":
      renderConsumerDashboard();
      break;
    case "c-new-request":
      setupConsumerRequestForm();
      break;
    case "c-my-requests":
      renderConsumerRequests();
      break;
    case "c-senior":
      renderConsumerSenior();
      break;
    case "w-dashboard":
      renderWorkerDashboard();
      break;
    case "w-assignments":
      renderWorkerAssignments();
      break;
    case "w-map":
      if (typeof renderWorkerMap === "function") renderWorkerMap();
      break;
    case "w-completed":
      renderWorkerCompleted();
      break;
  }
  setTimeout(function () {
    isSyncRefresh = false;
  }, 3000);
}

function init() {
  document.getElementById("currentDate").textContent =
    new Date().toLocaleDateString("en-PH", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  document.getElementById("loginPass").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });
  // Check if already logged in (session)
  checkSession();
}

async function checkSession() {
  // Session check is GET — no CSRF needed, just check if still logged in
  try {
    var res = await fetch(API + "?action=session", {
      credentials: "same-origin",
    });
    var data = await res.json();
    if (data && data.loggedIn) {
      DB.currentUser = mapUser(data.user);
      if (data.csrf_token) csrfToken = data.csrf_token;
      enterApp();
      if (data.user.password_change_required) {
        setTimeout(showForcePasswordChange, 500);
      }
    }
  } catch (e) {
    console.log("Session check failed:", e);
  }
}

function mapUser(u) {
  return {
    userId: u.user_id,
    username: u.username,
    name: u.full_name,
    role: u.role_key,
    canApprove: u.can_approve,
    canCreate: u.can_create,
    canViewAudit: u.can_view_audit,
    isConsumer: u.is_consumer,
    isWorker: u.is_worker,
    memberData: u.member_data,
    workerData: u.worker_data,
  };
}

// ===== AUTH =====
async function handleLogin() {
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value;
  if (!user || !pass) {
    document.getElementById("loginError").style.display = "block";
    document.getElementById("loginError").textContent =
      "Please enter your username and password.";
    return;
  }

  const data = await api("login", "POST", {
    username: user,
    password: pass,
  });
  if (!data || !data.success) {
    document.getElementById("loginError").style.display = "block";
    document.getElementById("loginError").textContent =
      (data && data.error) || "Login failed.";
    return;
  }

  DB.currentUser = mapUser(data.user);
  document.getElementById("loginError").style.display = "none";
  // Store CSRF token
  if (data.csrf_token) csrfToken = data.csrf_token;
  enterApp();
  showToast("success", "Welcome, " + DB.currentUser.name);
  // Check if password change is required
  if (data.user.password_change_required) {
    setTimeout(showForcePasswordChange, 500);
  }
}

function enterApp() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("app").style.display = "block";

  const isConsumer = DB.currentUser.isConsumer;
  const isWorker = DB.currentUser.isWorker;
  document.getElementById("sidebar").style.display =
    !isConsumer && !isWorker ? "flex" : "none";
  document.getElementById("consumerSidebar").style.display = isConsumer
    ? "flex"
    : "none";
  document.getElementById("workerSidebar").style.display = isWorker
    ? "flex"
    : "none";

  if (isConsumer) {
    document.getElementById("cUserName").textContent = DB.currentUser.name;
    document.getElementById("cUserRole").textContent = "Member";
    document.getElementById("cUserAvatar").textContent =
      DB.currentUser.name.charAt(0);
    navigateTo("c-dashboard");
  } else if (isWorker) {
    document.getElementById("wUserName").textContent = DB.currentUser.name;
    document.getElementById("wUserRole").textContent = "Field Crew";
    document.getElementById("wUserAvatar").textContent =
      DB.currentUser.name.charAt(0);
    navigateTo("w-dashboard");
  } else {
    document.getElementById("userName").textContent = DB.currentUser.name;
    document.getElementById("userRole").textContent =
      ROLES[DB.currentUser.role].label;
    document.getElementById("userAvatar").textContent =
      DB.currentUser.name.charAt(0);
    document.getElementById("userAvatar").style.background =
      ROLES[DB.currentUser.role].color;
    const auditNav = document.querySelector('[data-page="audit"]');
    if (auditNav)
      auditNav.style.display = DB.currentUser.canViewAudit ? "flex" : "none";
    const workersNav = document.querySelector('[data-page="workers"]');
    if (workersNav)
      workersNav.style.display =
        DB.currentUser.role === "admin" || DB.currentUser.canCreate
          ? "flex"
          : "none";
    const userMgmtNav = document.querySelector('[data-page="user-mgmt"]');
    if (userMgmtNav)
      userMgmtNav.style.display =
        DB.currentUser.role === "admin" ? "flex" : "none";
    navigateTo("dashboard");
  }
  startSync();
}

async function handleLogout() {
  stopSync();
  await api("logout", "POST");
  DB.currentUser = null;
  document.getElementById("app").style.display = "none";
  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
  document.getElementById("loginError").style.display = "none";
  document.getElementById("sidebar").style.display = "flex";
  document.getElementById("consumerSidebar").style.display = "none";
  document.getElementById("workerSidebar").style.display = "none";
}

// ===== NAVIGATION =====
function navigateTo(page) {
  closeSidebar();

  // ===== ROUTE ACCESS CONTROL =====
  // Define which roles can access which pages
  var u = DB.currentUser;
  if (u) {
    var adminOnly = ["user-mgmt"];
    var staffPages = [
      "dashboard",
      "members",
      "service-requests",
      "reconnection",
      "meter-change",
      "senior-discount",
      "workers",
      "approvals",
      "audit",
    ];
    var workerPages = [
      "w-dashboard",
      "w-assignments",
      "w-map",
      "w-completed",
      "w-status",
    ];
    var consumerPages = [
      "c-dashboard",
      "c-new-request",
      "c-my-requests",
      "c-senior",
    ];

    // Block consumers from staff/worker/admin pages
    if (u.isConsumer && !consumerPages.includes(page)) {
      showToast("error", "⛔ Access denied");
      return;
    }
    // Block workers from staff/consumer/admin pages
    if (u.isWorker && !workerPages.includes(page)) {
      showToast("error", "⛔ Access denied");
      return;
    }
    // Block non-admin staff from admin-only pages
    if (!u.isConsumer && !u.isWorker) {
      if (adminOnly.includes(page) && u.role !== "admin") {
        showToast("error", "⛔ Admin access only");
        return;
      }
      // Block staff from consumer/worker pages
      if (consumerPages.includes(page) || workerPages.includes(page)) {
        showToast("error", "⛔ Access denied");
        return;
      }
      // Audit log — only those with permission
      if (page === "audit" && !u.canViewAudit) {
        showToast("error", "⛔ No permission to view audit log");
        return;
      }
    }
  }

  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  const pageEl = document.getElementById("page-" + page);
  const navEl = document.querySelector('[data-page="' + page + '"]');
  if (pageEl) pageEl.classList.add("active");
  if (navEl) navEl.classList.add("active");
  const titles = {
    dashboard: "Dashboard",
    members: "Member Registration",
    "service-requests": "Service Requests",
    reconnection: "Reconnection Orders",
    "meter-change": "Change Meter Orders",
    "senior-discount": "Senior Citizen Discount",
    workers: "Worker Management",
    "user-mgmt": "User Management",
    approvals: "Approval Queue",
    audit: "Audit Log",
    "c-dashboard": "My Account",
    "c-new-request": "Submit a Request",
    "c-my-requests": "My Requests",
    "c-senior": "Senior Citizen Discount",
    "w-dashboard": "My Dashboard",
    "w-assignments": "My Assignments",
    "w-map": "Job Map",
    "w-completed": "Completed Jobs",
    "w-status": "My Status",
  };
  document.getElementById("pageTitle").textContent =
    titles[page] || "Dashboard";
  switch (page) {
    case "dashboard":
      renderDashboard();
      break;
    case "members":
      renderMembers();
      break;
    case "service-requests":
      renderServiceRequests();
      break;
    case "reconnection":
      renderReconnections();
      break;
    case "meter-change":
      renderMeterChanges();
      break;
    case "senior-discount":
      renderSeniorDiscounts();
      break;
    case "workers":
      renderWorkers();
      break;
    case "user-mgmt":
      renderUsers();
      break;
    case "approvals":
      renderApprovals();
      break;
    case "audit":
      renderAuditLog();
      break;
    case "c-dashboard":
      renderConsumerDashboard();
      break;
    case "c-new-request":
      setupConsumerRequestForm();
      break;
    case "c-my-requests":
      renderConsumerRequests();
      break;
    case "c-senior":
      renderConsumerSenior();
      break;
    case "w-dashboard":
      renderWorkerDashboard();
      break;
    case "w-assignments":
      renderWorkerAssignments();
      break;
    case "w-map":
      renderWorkerMap();
      break;
    case "w-completed":
      renderWorkerCompleted();
      break;
    case "w-status":
      renderWorkerMyStatus();
      break;
  }
}
function toggleSidebar() {
  var isConsumer = DB.currentUser && DB.currentUser.isConsumer;
  var isWorker = DB.currentUser && DB.currentUser.isWorker;
  var sb = document.getElementById(
    isConsumer ? "consumerSidebar" : isWorker ? "workerSidebar" : "sidebar",
  );
  var isMobile = window.innerWidth < 1024;

  if (isMobile) {
    // Mobile: slide in/out with overlay
    sb.classList.toggle("open");
    var overlay = document.getElementById("sidebarOverlay");
    if (overlay)
      overlay.classList.toggle("active", sb.classList.contains("open"));
  } else {
    // Desktop: collapse/expand sidebar
    sb.classList.toggle("collapsed");
    document.querySelector(".main").classList.toggle("sidebar-collapsed");
  }
}

function closeSidebar() {
  document
    .querySelectorAll(".sidebar, #consumerSidebar, #workerSidebar")
    .forEach(function (sb) {
      sb.classList.remove("open");
    });
  var overlay = document.getElementById("sidebarOverlay");
  if (overlay) overlay.classList.remove("active");
}

// ===== DASHBOARD =====
async function renderDashboard() {
  const stats = await api("dashboard_stats");
  if (!stats) return;
  document.getElementById("statMembers").textContent =
    stats.totalMembers.toLocaleString();
  document.getElementById("statSR").textContent = stats.openSR;
  document.getElementById("statRecon").textContent = stats.pendingRecon;
  document.getElementById("statApproval").textContent = stats.pendingApprovals;
  document.getElementById("approvalBadge").textContent = stats.pendingApprovals;
  document.getElementById("srBadge").textContent = stats.openSR;
  var wBadge = document.getElementById("workerBadge");
  if (wBadge) wBadge.textContent = stats.totalWorkers;

  const chartData = [
    { label: "High Bill", value: 5, color: "#EF4444" },
    { label: "No Light", value: 4, color: "#F59E0B" },
    { label: "Meter Err", value: 3, color: "#3B82F6" },
    { label: "Loose", value: 3, color: "#8B5CF6" },
    { label: "Recon", value: 3, color: "#10B981" },
    { label: "Busted XF", value: 1, color: "#F97316" },
    { label: "New Conn", value: 2, color: "#06B6D4" },
    { label: "SDW", value: 1, color: "#EC4899" },
    { label: "Others", value: 2, color: "#64748B" },
  ];
  const maxVal = Math.max(...chartData.map((d) => d.value));
  document.getElementById("srChart").innerHTML = chartData
    .map(
      (d) =>
        '<div class="chart-bar" style="height:' +
        (d.value / maxVal) * 160 +
        "px;background:" +
        d.color +
        ';" data-label="' +
        d.label +
        '" data-value="' +
        d.value +
        '"></div>',
    )
    .join("");

  document.getElementById("recentActivity").innerHTML =
    '<div style="text-align:center;color:var(--text-muted);padding:20px;font-size:13px;">Loading recent activity...</div>';
  const audit = await api("audit_log");
  if (audit && audit.length) {
    var colors = {
      CREATE: "var(--accent-blue)",
      APPROVE: "var(--accent-green)",
      UPDATE: "var(--accent-yellow)",
      REJECT: "var(--accent-red)",
      LOGIN: "var(--accent-purple)",
    };
    document.getElementById("recentActivity").innerHTML = audit
      .slice(0, 5)
      .map(
        (a) =>
          '<div class="activity-item"><div class="activity-dot" style="background:' +
          (colors[a.action] || "var(--accent-blue)") +
          '"></div><div><div class="activity-text">' +
          a.details +
          '</div><div class="activity-time">' +
          a.timestamp +
          "</div></div></div>",
      )
      .join("");
  }
}

// ===== RENDER TABLES (from API) =====
function mono(t) {
  return (
    "<span style=\"font-family:'JetBrains Mono',monospace;font-size:12px;\">" +
    t +
    "</span>"
  );
}

async function renderMembers() {
  const members = await api("members");
  if (!members) return;
  DB.members = members;
  // Show import coordinates button for admin
  var importBtn = document.getElementById("btnImportCoordsNav");
  if (importBtn)
    importBtn.style.display =
      DB.currentUser &&
      (DB.currentUser.role === "admin" || DB.currentUser.canCreate)
        ? "inline-flex"
        : "none";
  document.getElementById("memberTableBody").innerHTML = members
    .map(
      (m) =>
        "<tr><td>" +
        mono(m.account) +
        '</td><td style="color:var(--text-primary);font-weight:500;">' +
        m.name +
        "</td><td>" +
        m.address +
        "</td><td>" +
        mono(m.meter) +
        "</td><td>" +
        m.connType +
        '</td><td><span class="badge badge-' +
        (m.status === "Active"
          ? "approved"
          : m.status === "Pending"
            ? "pending"
            : "rejected") +
        '">' +
        m.status +
        '</span></td><td><button class="btn btn-ghost btn-sm" onclick="viewMember(\'' +
        m.id +
        "')\">View</button></td></tr>",
    )
    .join("");
}

async function renderServiceRequests() {
  const [srs, workers] = await Promise.all([
    api("service_requests"),
    api("workers"),
  ]);
  if (!srs) return;
  DB.serviceRequests = srs;
  DB.workers = workers || [];
  document.getElementById("srTableBody").innerHTML = srs
    .map((s) => {
      var worker = s.assignedWorker
        ? DB.workers.find(
            (w) => parseInt(w.worker_id) === parseInt(s.assignedWorker),
          )
        : null;
      var workerCell = worker
        ? '<span style="display:inline-flex;align-items:center;gap:5px;"><span style="display:inline-flex;width:20px;height:20px;border-radius:5px;background:#06B6D4;color:#fff;font-size:9px;font-weight:700;align-items:center;justify-content:center;">' +
          worker.name.charAt(0) +
          '</span><span style="font-size:12px;">' +
          worker.name.split(" ")[0] +
          "</span></span>"
        : '<span style="color:var(--text-muted);font-size:11px;">Unassigned</span>';
      return (
        '<tr><td style="color:var(--accent-blue);">' +
        mono(s.id) +
        '</td><td style="color:var(--text-primary);font-weight:500;">' +
        s.consumer +
        "</td><td>" +
        mono(s.meter) +
        "</td><td>" +
        s.nature +
        "</td><td>" +
        workerCell +
        '</td><td><span class="badge badge-' +
        (s.status === "New"
          ? "new"
          : s.status === "In Progress"
            ? "in-progress"
            : s.status === "Declined"
              ? "rejected"
              : s.status === "Cancelled"
                ? "cancelled"
                : "completed") +
        '">' +
        s.status +
        "</span></td><td>" +
        s.filed +
        '</td><td><button class="btn btn-ghost btn-sm" onclick="viewServiceRequest(\'' +
        s.id +
        "')\">View</button>" +
        (s.status !== "Completed"
          ? ' <button class="btn btn-sm btn-outline" onclick="updateSRStatus(\'' +
            s.id +
            "')\">Update</button>"
          : "") +
        "</td></tr>"
      );
    })
    .join("");
}

async function renderReconnections() {
  const [ros, workers] = await Promise.all([
    api("reconnections"),
    api("workers"),
  ]);
  if (!ros) return;
  DB.reconnections = ros;
  DB.workers = workers || [];
  document.getElementById("reconTableBody").innerHTML = ros
    .map((r) => {
      var worker = r.assignedWorker
        ? DB.workers.find(
            (w) => parseInt(w.worker_id) === parseInt(r.assignedWorker),
          )
        : null;
      var workerCell = worker
        ? '<span style="display:inline-flex;align-items:center;gap:5px;"><span style="display:inline-flex;width:20px;height:20px;border-radius:5px;background:#06B6D4;color:#fff;font-size:9px;font-weight:700;align-items:center;justify-content:center;">' +
          worker.name.charAt(0) +
          '</span><span style="font-size:12px;">' +
          worker.name.split(" ")[0] +
          "</span></span>"
        : '<span style="color:var(--text-muted);font-size:11px;">Unassigned</span>';
      return (
        '<tr><td style="color:var(--accent-blue);">' +
        mono(r.id) +
        '</td><td style="color:var(--text-primary);font-weight:500;">' +
        r.consumer +
        "</td><td>" +
        mono(r.account) +
        "</td><td>" +
        mono(r.meter) +
        "</td><td style=\"font-family:'JetBrains Mono',monospace;font-weight:600;\">₱" +
        parseFloat(r.total).toFixed(2) +
        "</td><td>" +
        workerCell +
        '</td><td><span class="badge badge-' +
        (r.status === "Pending"
          ? "pending"
          : r.status === "Completed"
            ? "completed"
            : "approved") +
        '">' +
        r.status +
        "</span></td><td>" +
        renderApprovalDots(r.approval) +
        '</td><td><button class="btn btn-ghost btn-sm" onclick="viewReconnection(\'' +
        r.id +
        "')\">View</button></td></tr>"
      );
    })
    .join("");
}

async function renderMeterChanges() {
  const mcs = await api("meter_changes");
  if (!mcs) return;
  DB.meterChanges = mcs;
  document.getElementById("meterTableBody").innerHTML = mcs
    .map(
      (m) =>
        '<tr><td style="color:var(--accent-blue);">' +
        mono(m.id) +
        '</td><td style="color:var(--text-primary);font-weight:500;">' +
        m.consumer +
        "</td><td>" +
        mono(m.account) +
        "</td><td>" +
        m.reason +
        "</td><td>" +
        mono(m.oldMeter.no) +
        "</td><td>" +
        mono(m.newMeter.no) +
        '</td><td><span class="badge badge-' +
        (m.status === "Pending" ? "pending" : "completed") +
        '">' +
        m.status +
        '</span></td><td><button class="btn btn-ghost btn-sm" onclick="viewMeterChange(\'' +
        m.id +
        "')\">View</button></td></tr>",
    )
    .join("");
}

async function renderSeniorDiscounts() {
  const sds = await api("senior_discounts");
  if (!sds) return;
  DB.seniorDiscounts = sds;
  document.getElementById("seniorTableBody").innerHTML = sds
    .map(
      (s) =>
        '<tr><td style="color:var(--accent-blue);">' +
        mono(s.id) +
        '</td><td style="color:var(--text-primary);font-weight:500;">' +
        s.applicant +
        "</td><td>" +
        mono(s.account) +
        "</td><td>" +
        mono(s.scId) +
        "</td><td>" +
        s.age +
        "</td><td>" +
        (s.docsComplete
          ? '<span style="color:var(--accent-green);">✓ Complete</span>'
          : '<span style="color:var(--accent-yellow);">' +
            s.docsCount +
            "/4</span>") +
        '</td><td><span class="badge badge-' +
        (s.status === "Pending"
          ? "pending"
          : s.status === "Approved"
            ? "approved"
            : "rejected") +
        '">' +
        s.status +
        '</span></td><td><button class="btn btn-ghost btn-sm" onclick="viewSeniorDiscount(\'' +
        s.id +
        "')\">View</button></td></tr>",
    )
    .join("");
}

function renderApprovalDots(a) {
  var steps = [
    { l: "P", d: !!a.prepared },
    { l: "C", d: !!a.checked },
    { l: "A", d: !!a.approved },
  ];
  return (
    '<div style="display:flex;gap:4px;">' +
    steps
      .map(
        (s) =>
          '<div style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;' +
          (s.d
            ? "background:var(--accent-green);color:#fff;"
            : "background:var(--bg-input);color:var(--text-muted);border:1px solid var(--border);") +
          '">' +
          s.l +
          "</div>",
      )
      .join("") +
    "</div>"
  );
}

// ===== APPROVALS =====
async function renderApprovals(filter) {
  var list = document.getElementById("approvalList"),
    items = [];
  const [ros, mcs, sds] = await Promise.all([
    api("reconnections"),
    api("meter_changes"),
    api("senior_discounts"),
  ]);

  if (!filter || filter === "all" || filter === "reconnection")
    (ros || [])
      .filter((r) => r.status === "Pending")
      .forEach((r) =>
        items.push({
          type: "Reconnection",
          id: r.id,
          consumer: r.consumer,
          detail: "₱" + parseFloat(r.total).toFixed(2),
          date: r.date,
          viewFn: "viewReconnection('" + r.id + "')",
        }),
      );
  if (!filter || filter === "all" || filter === "meter")
    (mcs || [])
      .filter((m) => m.status === "Pending")
      .forEach((m) =>
        items.push({
          type: "Meter Change",
          id: m.id,
          consumer: m.consumer,
          detail: m.reason,
          date: m.date,
          viewFn: "viewMeterChange('" + m.id + "')",
        }),
      );
  if (!filter || filter === "all" || filter === "senior")
    (sds || [])
      .filter((s) => s.status === "Pending")
      .forEach((s) =>
        items.push({
          type: "Senior Discount",
          id: s.id,
          consumer: s.applicant,
          detail: "Age " + s.age,
          date: s.date,
          viewFn: "viewSeniorDiscount('" + s.id + "')",
        }),
      );

  if (!items.length) {
    list.innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-text">No pending approvals</div></div>';
    return;
  }
  list.innerHTML = items
    .map(
      (i) =>
        '<div class="approval-card"><div class="approval-card-header"><div class="approval-card-type" style="color:' +
        (i.type === "Reconnection"
          ? "var(--accent-purple)"
          : i.type === "Meter Change"
            ? "var(--accent-orange)"
            : "var(--accent-blue)") +
        ';">' +
        i.type +
        '</div><span class="badge badge-pending">Pending</span></div><div class="approval-card-body"><div class="approval-card-id">' +
        mono(i.id) +
        '</div><div class="approval-card-consumer">' +
        i.consumer +
        '</div><div class="approval-card-detail">' +
        i.detail +
        '</div></div><div class="approval-card-footer"><span style="font-size:12px;color:var(--text-muted);">' +
        i.date +
        '</span><div><button class="btn btn-ghost btn-sm" onclick="' +
        i.viewFn +
        '">View</button><button class="btn btn-success btn-sm" onclick="approveItem(\'' +
        i.type +
        "','" +
        i.id +
        '\')">Approve</button><button class="btn btn-danger btn-sm" onclick="rejectItem(\'' +
        i.type +
        "','" +
        i.id +
        "')\">Reject</button></div></div></div>",
    )
    .join("");
}
function switchApprovalTab(f, el) {
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  el.classList.add("active");
  renderApprovals(f);
}

async function approveItem(type, id) {
  const data = await api("approve", "POST", { type, id });
  if (data && data.success) {
    showToast("success", id + " approved");
    renderApprovals();
    renderDashboard();
  }
}
async function rejectItem(type, id) {
  const data = await api("reject", "POST", { type, id });
  if (data && data.success) {
    showToast("info", id + " rejected");
    renderApprovals();
    renderDashboard();
  }
}

// ===== AUDIT LOG =====
async function renderAuditLog() {
  var filter = document.getElementById("auditFilter")
    ? document.getElementById("auditFilter").value
    : "";
  const log = await api("audit_log" + (filter ? "&filter=" + filter : ""));
  if (!log) return;
  var icons = {
    CREATE: "📝",
    UPDATE: "✏️",
    APPROVE: "✅",
    REJECT: "❌",
    LOGIN: "🔑",
    LOGOUT: "🚪",
    ASSIGN: "👷",
    DELETE: "🗑️",
    PURGE: "🧹",
  };
  document.getElementById("auditLogBody").innerHTML = log
    .map(
      (e) =>
        '<div class="audit-entry"><div class="audit-icon">' +
        (icons[e.action] || "📋") +
        '</div><div class="audit-info"><div class="audit-action">' +
        e.action +
        " — <strong>" +
        e.user +
        '</strong> <span style="color:var(--text-muted);font-size:11px;">(' +
        e.role +
        ')</span></div><div class="audit-details">' +
        e.details +
        '</div></div><div class="audit-time">' +
        e.timestamp +
        "</div></div>",
    )
    .join("");
  // Show purge button for admin only
  var purgeBtn = document.getElementById("purgeBtn");
  if (purgeBtn)
    purgeBtn.style.display =
      DB.currentUser && DB.currentUser.role === "admin"
        ? "inline-flex"
        : "none";
}

async function previewPurge() {
  const data = await api("purge_preview");
  if (!data) return;
  var total =
    (data.service_requests || 0) +
    (data.reconnections || 0) +
    (data.audit_log || 0);
  var cutoff = data.cutoff_date || "1 year ago";
  document.getElementById("detailModalTitle").textContent =
    "🧹 Purge Old Records";
  document.getElementById("detailModalBody").innerHTML =
    '<div style="text-align:center;padding:10px 0;">' +
    '<div style="font-size:40px;margin-bottom:12px;">🗑️</div>' +
    '<div style="font-size:15px;font-weight:600;margin-bottom:4px;">Delete records older than 1 year?</div>' +
    '<div style="font-size:12px;color:var(--text-muted);margin-bottom:20px;">Cutoff date: <strong>' +
    cutoff +
    "</strong></div>" +
    '<div style="text-align:left;padding:16px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:16px;">' +
    '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);"><span>Completed Service Requests</span><strong style="color:var(--accent-red);">' +
    (data.service_requests || 0) +
    "</strong></div>" +
    '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);"><span>Completed Reconnection Orders</span><strong style="color:var(--accent-red);">' +
    (data.reconnections || 0) +
    "</strong></div>" +
    '<div style="display:flex;justify-content:space-between;padding:8px 0;"><span>Audit Log Entries</span><strong style="color:var(--accent-red);">' +
    (data.audit_log || 0) +
    "</strong></div>" +
    '<div style="display:flex;justify-content:space-between;padding:10px 0;margin-top:8px;border-top:2px solid var(--border);font-size:14px;"><strong>Total to delete</strong><strong style="color:var(--accent-red);font-size:16px;">' +
    total +
    "</strong></div>" +
    "</div>" +
    (total === 0
      ? '<div style="color:var(--accent-green);font-size:13px;">✅ No old records to purge. Everything is less than 1 year old.</div>'
      : '<div style="padding:12px 16px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-sm);font-size:12px;color:var(--accent-red);line-height:1.6;">' +
        "⚠️ This action is <strong>permanent and irreversible</strong>. Deleted records cannot be recovered. Only completed/declined service requests and completed reconnection orders will be removed." +
        "</div>") +
    "</div>";
  document.getElementById("detailModalFooter").innerHTML =
    (total > 0
      ? '<button class="btn btn-danger btn-sm" onclick="executePurge()">Yes, Purge ' +
        total +
        " Records</button>"
      : "") +
    '<button class="btn btn-ghost btn-sm" onclick="hideModal(\'detailModal\')">Cancel</button>';
  showModal("detailModal");
}

async function executePurge() {
  const data = await api("purge_old_records", "POST", {});
  if (data && data.success) {
    hideModal("detailModal");
    showToast("success", "Purged " + data.total_deleted + " old records");
    await renderAuditLog();
    await renderDashboard();
    await renderServiceRequests();
  }
}

// ===== VIEW DETAIL MODALS =====
function viewMember(id) {
  var m = DB.members.find((x) => x.id == id);
  if (!m) return;
  document.getElementById("detailModalTitle").textContent = "Member: " + m.name;
  document.getElementById("detailModalBody").innerHTML =
    '<div class="form-row form-row-2"><div><div class="form-label">Account No.</div><div>' +
    mono(m.account) +
    '</div></div><div><div class="form-label">Meter No.</div><div>' +
    mono(m.meter) +
    '</div></div></div><div class="form-row form-row-2" style="margin-top:16px;"><div><div class="form-label">Address</div><div>' +
    m.address +
    '</div></div><div><div class="form-label">Connection</div><div>' +
    m.connType +
    '</div></div></div><div class="form-row form-row-2" style="margin-top:16px;"><div><div class="form-label">Phone</div><div>' +
    (m.phone || "—") +
    '</div></div><div><div class="form-label">Status</div><span class="badge badge-' +
    (m.status === "Active" ? "approved" : "rejected") +
    '">' +
    m.status +
    "</span></div></div>";
  var footerHtml =
    '<button class="btn btn-ghost btn-sm" onclick="hideModal(\'detailModal\')">Close</button>';
  var u = DB.currentUser;
  if (u && !u.isConsumer && !u.isWorker) {
    if (m.status === "Active") {
      footerHtml +=
        ' <button class="btn btn-danger btn-sm" onclick="confirmMemberStatusChange(' +
        m.id +
        ",'Disconnected','" +
        esc(m.name) +
        "','" +
        esc(m.account) +
        "')\">\u26A1 Disconnect</button>";
    } else if (m.status === "Disconnected") {
      footerHtml +=
        ' <button class="btn btn-success btn-sm" onclick="confirmMemberStatusChange(' +
        m.id +
        ",'Active','" +
        esc(m.name) +
        "','" +
        esc(m.account) +
        "')\">\uD83D\uDD0C Reactivate</button>";
    }
  }
  document.getElementById("detailModalFooter").innerHTML = footerHtml;
  showModal("detailModal");
}

function confirmMemberStatusChange(memberId, newStatus, name, account) {
  var action = newStatus === "Disconnected" ? "disconnect" : "reactivate";
  var icon = newStatus === "Disconnected" ? "\u26A1" : "\uD83D\uDD0C";
  var color =
    newStatus === "Disconnected" ? "var(--accent-red)" : "var(--accent-green)";
  document.getElementById("detailModalBody").innerHTML =
    '<div style="text-align:center;padding:20px;">' +
    '<div style="font-size:40px;margin-bottom:12px;">' +
    icon +
    "</div>" +
    '<div style="font-size:16px;font-weight:600;margin-bottom:8px;">' +
    action.charAt(0).toUpperCase() +
    action.slice(1) +
    " this member?</div>" +
    '<div style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">' +
    "<strong>" +
    name +
    "</strong><br>Account: " +
    account +
    "</div>" +
    (newStatus === "Disconnected"
      ? '<div style="font-size:12px;color:var(--accent-yellow);background:var(--accent-yellow-dim);padding:10px 14px;border-radius:8px;border:1px solid rgba(245,158,11,0.2);margin-bottom:16px;">\u26A0\uFE0F The consumer will not be able to use services until reconnected.</div>'
      : "") +
    "</div>";
  document.getElementById("detailModalFooter").innerHTML =
    '<button class="btn btn-ghost btn-sm" onclick="hideModal(\'detailModal\')">Cancel</button>' +
    '<button class="btn btn-sm" style="background:' +
    color +
    ';color:#fff;" onclick="updateMemberStatus(' +
    memberId +
    ",'" +
    newStatus +
    "')\">" +
    "Yes, " +
    action +
    "</button>";
}

async function updateMemberStatus(memberId, newStatus) {
  var data = await api("update_member_status", "POST", {
    memberId: memberId,
    status: newStatus,
  });
  if (data && data.success) {
    hideModal("detailModal");
    showToast("success", "Member status changed to " + newStatus);
    await renderMembers();
    await renderDashboard();
  }
}

async function viewServiceRequest(id) {
  var s = DB.serviceRequests.find((x) => x.id === id);
  if (!s) return;
  var worker = s.assignedWorker
    ? DB.workers.find(
        (w) => parseInt(w.worker_id) === parseInt(s.assignedWorker),
      )
    : null;
  var assignHtml = "";
  var isStaff =
    DB.currentUser && !DB.currentUser.isConsumer && !DB.currentUser.isWorker;
  if (isStaff && s.status !== "Completed") {
    assignHtml =
      '<div style="margin-top:20px;padding:16px;background:var(--bg-input);border-radius:var(--radius-sm);border:1px solid var(--border);">' +
      '<div style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">👷 Assign Field Worker</div>' +
      '<div style="display:flex;gap:10px;align-items:center;">' +
      '<div class="assign-dropdown"><select id="assignWorkerSelect_' +
      id +
      '" style="min-width:200px;">' +
      '<option value="">— Select a worker —</option>' +
      DB.workers
        .filter((w) => w.status !== "Off Duty")
        .map(
          (w) =>
            '<option value="' +
            w.id +
            '"' +
            (parseInt(s.assignedWorker) === parseInt(w.worker_id)
              ? " selected"
              : "") +
            ">" +
            w.name +
            " (" +
            w.team +
            ") — " +
            w.specialty +
            "</option>",
        )
        .join("") +
      "</select></div>" +
      '<button class="btn btn-sm" style="background:#06B6D4;color:#fff;" onclick="assignWorkerToSR(\'' +
      id +
      "')\">Assign</button>" +
      (s.assignedWorker
        ? '<button class="btn btn-ghost btn-sm" onclick="unassignWorkerFromSR(\'' +
          id +
          "')\">Remove</button>"
        : "") +
      "</div>" +
      (worker
        ? '<div style="margin-top:8px;font-size:12px;color:#06B6D4;">✓ Currently assigned to <strong>' +
          worker.name +
          "</strong> (" +
          worker.team +
          ")</div>"
        : "") +
      "</div>";
  } else if (worker) {
    assignHtml =
      '<div style="margin-top:16px;"><div class="form-label">Assigned Worker</div><div>' +
      worker.name +
      " — " +
      worker.team +
      "</div></div>";
  }
  // Fetch photos first so they can be included in the initial render
  var photosHtml = "";
  try {
    var photoRes = await fetch(
      API + "?action=get_sr_photos&sr=" + encodeURIComponent(id),
      { credentials: "same-origin" },
    );
    var photoData = await photoRes.json();
    if (photoData.photos && photoData.photos.length) {
      photosHtml =
        '<div style="margin-top:20px;border-top:1px solid var(--border);padding-top:16px;">' +
        '<div class="form-label" style="margin-bottom:10px;">📷 Attached Photos (' +
        photoData.photos.length +
        ")</div>" +
        '<div style="display:flex;flex-wrap:wrap;gap:10px;">' +
        photoData.photos
          .map(function (p) {
            var safe = p.file_path.replace(/'/g, "\\'");
            var safeName = p.file_name.replace(/'/g, "\\'");
            return (
              '<div style="cursor:pointer;" onclick="previewScDoc(\'' +
              safe +
              "','" +
              safeName +
              "')\">" +
              '<img src="' +
              p.file_path +
              '" style="width:120px;height:90px;object-fit:cover;border-radius:6px;border:1px solid var(--border);" onerror="this.parentNode.style.display=\'none\'">' +
              '<div style="font-size:10px;color:var(--text-muted);margin-top:3px;text-align:center;width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
              p.file_name +
              "</div></div>"
            );
          })
          .join("") +
        "</div></div>";
    }
  } catch (e) {
    /* ignore */
  }

  document.getElementById("detailModalTitle").textContent =
    "Service Request: " + s.id;
  var declineHtml = "";
  if (s.status === "Declined" && s.declineReason) {
    declineHtml =
      '<div style="margin-top:16px;padding:12px 16px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;"><div style="font-size:12px;font-weight:600;color:var(--accent-red);margin-bottom:4px;">❌ Declined' +
      (s.declinedBy ? " by " + s.declinedBy : "") +
      '</div><div style="font-size:12px;color:var(--text-muted);">' +
      s.declineReason +
      "</div></div>";
  }
  document.getElementById("detailModalBody").innerHTML =
    '<div class="form-row form-row-2"><div><div class="form-label">Consumer</div><div style="font-weight:600;">' +
    s.consumer +
    '</div></div><div><div class="form-label">Account</div><div>' +
    mono(s.account) +
    '</div></div></div><div class="form-row form-row-2" style="margin-top:16px;"><div><div class="form-label">Nature</div><div>' +
    s.nature +
    '</div></div><div><div class="form-label">Status</div><span class="badge badge-' +
    (s.status === "New"
      ? "new"
      : s.status === "In Progress"
        ? "in-progress"
        : s.status === "Declined"
          ? "rejected"
          : s.status === "Cancelled"
            ? "cancelled"
            : "completed") +
    '">' +
    s.status +
    '</span></div></div><div style="margin-top:16px;"><div class="form-label">Meter No.</div><div>' +
    mono(s.meter) +
    '</div></div><div style="margin-top:16px;"><div class="form-label">Landmark</div><div>' +
    (s.landmark || "—") +
    '</div></div><div style="margin-top:16px;"><div class="form-label">Remarks</div><div>' +
    (s.remarks || "—") +
    '</div></div><div style="margin-top:16px;"><div class="form-label">Date Filed</div><div>' +
    s.filed +
    "</div></div>" +
    declineHtml +
    photosHtml +
    assignHtml;
  document.getElementById("detailModalFooter").innerHTML =
    '<button class="btn btn-ghost btn-sm" onclick="hideModal(\'detailModal\')">Close</button>';
  showModal("detailModal");
}

function viewReconnection(id) {
  var r = DB.reconnections.find((x) => x.id === id);
  if (!r) return;
  var worker = r.assignedWorker
    ? DB.workers.find(
        (w) => parseInt(w.worker_id) === parseInt(r.assignedWorker),
      )
    : null;
  var assignHtml = "";
  var isStaff =
    DB.currentUser && !DB.currentUser.isConsumer && !DB.currentUser.isWorker;
  if (isStaff && r.status !== "Completed" && r.status !== "Rejected") {
    assignHtml =
      '<div style="margin-top:20px;padding:16px;background:var(--bg-input);border-radius:var(--radius-sm);border:1px solid var(--border);">' +
      '<div style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">👷 Assign Reconnection Crew</div>' +
      '<div style="display:flex;gap:10px;align-items:center;">' +
      '<div class="assign-dropdown"><select id="assignWorkerSelect_' +
      id +
      '">' +
      '<option value="">— Select a worker —</option>' +
      DB.workers
        .filter((w) => w.status !== "Off Duty")
        .map(
          (w) =>
            '<option value="' +
            w.id +
            '"' +
            (parseInt(r.assignedWorker) === parseInt(w.worker_id)
              ? " selected"
              : "") +
            ">" +
            w.name +
            " (" +
            w.team +
            ") — " +
            w.specialty +
            "</option>",
        )
        .join("") +
      "</select></div>" +
      '<button class="btn btn-sm" style="background:#06B6D4;color:#fff;" onclick="assignWorkerToRO(\'' +
      id +
      "')\">Assign</button>" +
      (r.assignedWorker
        ? '<button class="btn btn-ghost btn-sm" onclick="unassignWorkerFromRO(\'' +
          id +
          "')\">Remove</button>"
        : "") +
      "</div>" +
      (worker
        ? '<div style="margin-top:8px;font-size:12px;color:#06B6D4;">✓ Currently assigned to <strong>' +
          worker.name +
          "</strong> (" +
          worker.team +
          ")</div>"
        : "") +
      "</div>";
  } else if (worker) {
    assignHtml =
      '<div style="margin-top:16px;"><div class="form-label">Assigned Worker</div><div>' +
      worker.name +
      " — " +
      worker.team +
      "</div></div>";
  }
  document.getElementById("detailModalTitle").textContent =
    "Reconnection: " + r.id;
  var wf =
    '<div class="workflow-steps">' +
    '<div class="workflow-step ' +
    (r.approval.prepared ? "completed" : "active") +
    '"><div class="workflow-step-dot">' +
    (r.approval.prepared ? "✓" : "1") +
    '</div><div class="workflow-step-info"><div class="workflow-step-label">Prepared</div><div class="workflow-step-by">' +
    (r.approval.prepared || "Pending") +
    "</div></div></div>" +
    '<div class="workflow-connector ' +
    (r.approval.prepared ? "completed" : "") +
    '"></div>' +
    '<div class="workflow-step ' +
    (r.approval.checked ? "completed" : r.approval.prepared ? "active" : "") +
    '"><div class="workflow-step-dot">' +
    (r.approval.checked ? "✓" : "2") +
    '</div><div class="workflow-step-info"><div class="workflow-step-label">Checked</div><div class="workflow-step-by">' +
    (r.approval.checked || "CAO Disco Head") +
    "</div></div></div>" +
    '<div class="workflow-connector ' +
    (r.approval.checked ? "completed" : "") +
    '"></div>' +
    '<div class="workflow-step ' +
    (r.approval.approved ? "completed" : r.approval.checked ? "active" : "") +
    '"><div class="workflow-step-dot">' +
    (r.approval.approved ? "✓" : "3") +
    '</div><div class="workflow-step-info"><div class="workflow-step-label">Approved</div><div class="workflow-step-by">' +
    (r.approval.approved || "CAO Manager") +
    "</div></div></div></div>";
  document.getElementById("detailModalBody").innerHTML =
    '<div class="form-row form-row-2"><div><div class="form-label">Consumer</div><div style="font-weight:600;">' +
    r.consumer +
    '</div></div><div><div class="form-label">Account</div><div>' +
    mono(r.account) +
    '</div></div></div><div style="margin-top:20px;font-size:13px;font-weight:600;margin-bottom:8px;">Fee Breakdown</div><div style="background:var(--bg-input);border-radius:var(--radius-sm);padding:12px 16px;font-family:\'JetBrains Mono\',monospace;font-size:12px;line-height:2;">Power Bills: ₱' +
    parseFloat(r.bills).toFixed(2) +
    "<br>Surcharge: ₱" +
    parseFloat(r.surcharge).toFixed(2) +
    "<br>Recon Fee: ₱" +
    parseFloat(r.reconFee).toFixed(2) +
    "<br>Mtr Seal/SF: ₱" +
    parseFloat(r.seal).toFixed(2) +
    "<br>Others/VAT: ₱" +
    parseFloat(r.others).toFixed(2) +
    '<br><strong style="color:var(--accent-green);">TOTAL: ₱' +
    parseFloat(r.total).toFixed(2) +
    '</strong></div><div style="margin-top:20px;font-size:13px;font-weight:600;margin-bottom:8px;">Approval Workflow</div>' +
    wf +
    assignHtml;
  var canA = DB.currentUser.canApprove && r.status === "Pending";
  document.getElementById("detailModalFooter").innerHTML =
    (canA
      ? "<button class=\"btn btn-success btn-sm\" onclick=\"approveItem('Reconnection','" +
        r.id +
        "');hideModal('detailModal');\">Approve</button><button class=\"btn btn-danger btn-sm\" onclick=\"rejectItem('Reconnection','" +
        r.id +
        "');hideModal('detailModal');\">Reject</button>"
      : "") +
    '<button class="btn btn-ghost btn-sm" onclick="hideModal(\'detailModal\')">Close</button>';
  showModal("detailModal");
}

function viewMeterChange(id) {
  var m = DB.meterChanges.find((x) => x.id === id);
  if (!m) return;
  document.getElementById("detailModalTitle").textContent =
    "Meter Change: " + m.id;
  document.getElementById("detailModalBody").innerHTML =
    '<div class="form-row form-row-2"><div><div class="form-label">Consumer</div><div style="font-weight:600;">' +
    m.consumer +
    '</div></div><div><div class="form-label">Account</div><div>' +
    mono(m.account) +
    '</div></div></div><div style="margin-top:20px;font-size:13px;font-weight:600;margin-bottom:8px;">Removed Meter</div><div style="background:var(--bg-input);border-radius:var(--radius-sm);padding:12px 16px;font-size:12px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;"><div><span style="color:var(--text-muted);">Brand:</span> ' +
    m.oldMeter.brand +
    '</div><div><span style="color:var(--text-muted);">No:</span> ' +
    mono(m.oldMeter.no) +
    '</div><div><span style="color:var(--text-muted);">Reading:</span> ' +
    m.oldMeter.reading +
    ' kWh</div></div><div style="margin-top:16px;font-size:13px;font-weight:600;margin-bottom:8px;">New Meter</div><div style="background:var(--accent-green-dim);border-radius:var(--radius-sm);padding:12px 16px;font-size:12px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;"><div><span style="color:var(--text-muted);">Brand:</span> ' +
    m.newMeter.brand +
    '</div><div><span style="color:var(--text-muted);">No:</span> ' +
    mono(m.newMeter.no) +
    '</div><div><span style="color:var(--text-muted);">Reading:</span> ' +
    m.newMeter.reading +
    " kWh</div></div>";
  var canA = DB.currentUser.canApprove && m.status === "Pending";
  document.getElementById("detailModalFooter").innerHTML =
    (canA
      ? "<button class=\"btn btn-success btn-sm\" onclick=\"approveItem('Meter Change','" +
        m.id +
        "');hideModal('detailModal');\">Approve</button><button class=\"btn btn-danger btn-sm\" onclick=\"rejectItem('Meter Change','" +
        m.id +
        "');hideModal('detailModal');\">Reject</button>"
      : "") +
    '<button class="btn btn-ghost btn-sm" onclick="hideModal(\'detailModal\')">Close</button>';
  showModal("detailModal");
}

async function viewSeniorDiscount(id) {
  // Fix: ensure data is loaded (may be empty if called from Approvals tab)
  if (!DB.seniorDiscounts || !DB.seniorDiscounts.length) {
    var sds = await api("senior_discounts");
    if (sds) DB.seniorDiscounts = sds;
  }
  var s = DB.seniorDiscounts.find((x) => x.id === id);
  if (!s) {
    showToast("error", "Record not found");
    return;
  }
  // Fetch uploaded documents
  var docs = (await api("sc_documents&sc_id=" + s.sc_id)) || [];
  var docsHtml =
    '<div style="margin-top:16px;"><div class="form-label">Submitted Documents</div>';
  if (docs.length) {
    docsHtml += docs
      .map((d) => {
        var icon =
          d.mime_type && d.mime_type.startsWith("image/") ? "🖼️" : "📄";
        var viewBtn =
          d.mime_type && d.mime_type.startsWith("image/")
            ? ' <button class="btn btn-ghost btn-sm" onclick="previewScDoc(\'' +
              d.file_path +
              "','" +
              d.file_name +
              "')\">👁️ Preview</button>"
            : "";
        return (
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg-input);border-radius:var(--radius-sm);margin-bottom:6px;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span style="font-size:18px;">' +
          icon +
          "</span>" +
          '<div><div style="font-size:12px;font-weight:500;color:var(--text-primary);">' +
          d.file_name +
          "</div>" +
          '<div style="font-size:11px;color:var(--text-muted);">' +
          d.doc_type +
          " · " +
          (d.file_size_kb || 0) +
          " KB</div></div>" +
          "</div>" +
          '<div><a href="' +
          d.file_path +
          '" target="_blank" class="btn btn-sm btn-outline" download>⬇ Download</a>' +
          viewBtn +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  } else {
    docsHtml +=
      '<div style="padding:12px;color:var(--text-muted);font-size:12px;background:var(--bg-input);border-radius:var(--radius-sm);text-align:center;">' +
      (s.docsCount > 0
        ? "✓ " + s.docsCount + "/4 documents checked (no files uploaded)"
        : "No documents submitted yet") +
      "</div>";
  }
  docsHtml += "</div>";

  document.getElementById("detailModalTitle").textContent =
    "Senior Discount: " + s.id;
  document.getElementById("detailModalBody").innerHTML =
    '<div class="form-row form-row-2"><div><div class="form-label">Applicant</div><div style="font-weight:600;">' +
    s.applicant +
    '</div></div><div><div class="form-label">Account</div><div>' +
    mono(s.account) +
    '</div></div></div><div class="form-row form-row-3" style="margin-top:16px;"><div><div class="form-label">OSCA ID</div><div>' +
    mono(s.scId) +
    '</div></div><div><div class="form-label">Age</div><div>' +
    s.age +
    '</div></div><div><div class="form-label">DOB</div><div>' +
    s.dob +
    '</div></div></div><div style="margin-top:16px;"><div class="form-label">Document Checklist</div><div>' +
    (s.docsComplete
      ? '<span style="color:var(--accent-green);">✓ Complete (4/4)</span>'
      : '<span style="color:var(--accent-yellow);">' +
        s.docsCount +
        "/4 submitted</span>") +
    "</div></div>" +
    docsHtml;
  var canA = DB.currentUser.canApprove && s.status === "Pending";
  document.getElementById("detailModalFooter").innerHTML =
    (canA
      ? "<button class=\"btn btn-success btn-sm\" onclick=\"approveItem('Senior Discount','" +
        s.id +
        "');hideModal('detailModal');\">Approve</button><button class=\"btn btn-danger btn-sm\" onclick=\"rejectItem('Senior Discount','" +
        s.id +
        "');hideModal('detailModal');\">Reject</button>"
      : "") +
    '<button class="btn btn-ghost btn-sm" onclick="hideModal(\'detailModal\')">Close</button>';
  showModal("detailModal");
}

function previewScDoc(filePath, fileName) {
  document.getElementById("detailModalTitle").textContent = "📄 " + fileName;
  document.getElementById("detailModalBody").innerHTML =
    '<div style="text-align:center;"><img src="' +
    filePath +
    '" alt="' +
    fileName +
    '" style="max-width:100%;max-height:500px;border-radius:8px;border:1px solid var(--border);"></div>';
  document.getElementById("detailModalFooter").innerHTML =
    '<a href="' +
    filePath +
    '" target="_blank" class="btn btn-sm btn-outline" download>⬇ Download</a> <button class="btn btn-ghost btn-sm" onclick="hideModal(\'detailModal\')">Close</button>';
  showModal("detailModal");
}

async function viewSRPhotos(id) {
  try {
    var res = await fetch(
      API + "?action=get_sr_photos&sr=" + encodeURIComponent(id),
      { credentials: "same-origin" },
    );
    var data = await res.json();
    if (!data.photos || !data.photos.length) {
      showToast("info", "No photos attached to this request");
      return;
    }
    document.getElementById("detailModalTitle").textContent =
      "📷 Photos — " + id;
    document.getElementById("detailModalBody").innerHTML =
      '<div style="display:flex;flex-wrap:wrap;gap:12px;">' +
      data.photos
        .map(function (p) {
          var safe = p.file_path.replace(/'/g, "\\'");
          var safeName = p.file_name.replace(/'/g, "\\'");
          return (
            '<div style="cursor:pointer;" onclick="previewScDoc(\'' +
            safe +
            "','" +
            safeName +
            "')\">" +
            '<img src="' +
            p.file_path +
            '" style="width:150px;height:112px;object-fit:cover;border-radius:8px;border:1px solid var(--border);" onerror="this.parentNode.style.display=\'none\'">' +
            '<div style="font-size:10px;color:var(--text-muted);margin-top:4px;text-align:center;width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
            p.file_name +
            "</div></div>"
          );
        })
        .join("") +
      "</div>";
    document.getElementById("detailModalFooter").innerHTML =
      '<button class="btn btn-ghost btn-sm" onclick="hideModal(\'detailModal\')">Close</button>';
    showModal("detailModal");
  } catch (e) {
    showToast("error", "Could not load photos");
  }
}

// ===== FORM SUBMISSIONS (to API) =====
async function submitMember() {
  var last = document.getElementById("memLastName").value.trim(),
    first = document.getElementById("memFirstName").value.trim();
  var account = document.getElementById("memAccount").value.trim(),
    meter = document.getElementById("memMeter").value.trim();
  if (!last || !first) {
    showToast("error", "Please fill in name fields");
    return;
  }
  if (!account || !meter) {
    showToast("error", "Account number and meter number are required");
    return;
  }
  var muni = document.getElementById("memMuni")
    ? document.getElementById("memMuni").value.trim()
    : "";
  var lat = document.getElementById("memLat")
    ? parseFloat(document.getElementById("memLat").value) || null
    : null;
  var lng = document.getElementById("memLng")
    ? parseFloat(document.getElementById("memLng").value) || null
    : null;
  const data = await api("members", "POST", {
    lastName: last,
    firstName: first,
    middleInitial: "",
    account: account,
    meter: meter,
    address: document.getElementById("memAddress").value,
    municipality: muni,
    phone: document.getElementById("memPhone").value,
    email: document.getElementById("memEmail").value,
    connType: document.getElementById("memConnType").value || "Residential",
    latitude: lat,
    longitude: lng,
  });
  if (data && data.success) {
    hideModal("memberModal");
    clearForm("memberModal");
    showToast("success", "Member registered! Account: " + data.account);
    renderMembers();
    renderDashboard();
  }
}

async function submitServiceRequest() {
  var name = document.getElementById("srName").value.trim(),
    nature = document.getElementById("srNature").value;
  if (!name || !nature) {
    showToast("error", "Fill in name and request type");
    return;
  }
  const data = await api("service_requests", "POST", {
    account: document.getElementById("srAccount").value,
    nature: nature,
    landmark: document.getElementById("srLandmark").value,
    remarks: document.getElementById("srRemarks").value,
    memberId: null,
  });
  if (data && data.success) {
    hideModal("srModal");
    clearForm("srModal");
    showToast("success", "Service Request " + data.id + " created");
    renderServiceRequests();
    renderDashboard();
  }
}

async function submitReconnection() {
  var name = document.getElementById("roName").value.trim();
  if (!name) {
    showToast("error", "Fill in consumer name");
    return;
  }
  const data = await api("reconnections", "POST", {
    account: document.getElementById("roAccount").value,
    landmark: document.getElementById("roLandmark").value,
    tor: document.getElementById("roTOR").value,
    bills: parseFloat(document.getElementById("roBills").value) || 0,
    surcharge: parseFloat(document.getElementById("roSurcharge").value) || 0,
    reconFee: parseFloat(document.getElementById("roReconFee").value) || 150,
    seal: parseFloat(document.getElementById("roSeal").value) || 90,
    others: parseFloat(document.getElementById("roOthers").value) || 0,
  });
  if (data && data.success) {
    hideModal("reconModal");
    clearForm("reconModal");
    showToast("success", "Reconnection " + data.id + " created");
    renderReconnections();
    renderDashboard();
  }
}

async function submitMeterChange() {
  var name = document.getElementById("mcName").value.trim();
  if (!name) {
    showToast("error", "Fill in consumer name");
    return;
  }
  const data = await api("meter_changes", "POST", {
    account: document.getElementById("mcAccount").value,
    reason: document.getElementById("mcReason").value || "Others",
    oldBrand: document.getElementById("mcOldBrand").value,
    oldMeterNo: document.getElementById("mcOldMeter").value,
    oldReading: document.getElementById("mcOldReading").value,
    oldAmpere: document.getElementById("mcOldAmpere").value,
    oldVolts: document.getElementById("mcOldVolts").value,
    oldMult: document.getElementById("mcOldMult").value,
    newBrand: document.getElementById("mcNewBrand").value,
    newMeterNo: document.getElementById("mcNewMeter").value,
    newReading: document.getElementById("mcNewReading").value,
    newAmpere: document.getElementById("mcNewAmpere").value,
    newVolts: document.getElementById("mcNewVolts").value,
    newSeal: document.getElementById("mcSealNo").value,
    remarks: document.getElementById("mcRemarks").value,
  });
  if (data && data.success) {
    hideModal("meterModal");
    clearForm("meterModal");
    showToast("success", "Meter Change " + data.id + " created");
    renderMeterChanges();
    renderDashboard();
  }
}

async function submitSeniorDiscount() {
  var name = document.getElementById("scName").value.trim(),
    age = parseInt(document.getElementById("scAge").value);
  if (!name) {
    showToast("error", "Fill in applicant name");
    return;
  }
  if (age && age < 60) {
    showToast("error", "Applicant must be 60+");
    return;
  }
  var docsSubmitted = [];
  ["scDoc1", "scDoc2", "scDoc3", "scDoc4"].forEach((id, i) => {
    if (document.getElementById(id).checked) docsSubmitted.push(i);
  });
  const data = await api("senior_discounts", "POST", {
    account: document.getElementById("scAccount").value,
    scId: document.getElementById("scMembership").value,
    dob: document.getElementById("scDOB").value,
    age: age || 0,
    docsSubmitted: docsSubmitted,
  });
  if (data && data.success) {
    hideModal("seniorModal");
    clearForm("seniorModal");
    showToast("success", "Application " + data.id + " submitted");
    renderSeniorDiscounts();
    renderDashboard();
  }
}

// ===== WORKER MANAGEMENT (Admin) =====
async function renderWorkers() {
  var canAdd = DB.currentUser && DB.currentUser.role === "admin";
  var btnAdd = document.getElementById("btnAddWorker");
  if (btnAdd) btnAdd.style.display = canAdd ? "inline-flex" : "none";

  const workers = await api("workers");
  if (!workers) return;
  DB.workers = workers;

  // Count active jobs per worker
  const srs = await api("service_requests");
  const ros = await api("reconnections");

  document.getElementById("workerTableBody").innerHTML = workers
    .map((w) => {
      var activeJobs =
        (srs || []).filter(
          (s) =>
            parseInt(s.assignedWorker) === parseInt(w.worker_id) &&
            s.status !== "Completed",
        ).length +
        (ros || []).filter(
          (r) =>
            parseInt(r.assignedWorker) === parseInt(w.worker_id) &&
            r.status !== "Completed" &&
            r.status !== "Rejected",
        ).length;
      var statusBadge =
        "badge-" +
        (w.status === "Available"
          ? "approved"
          : w.status === "On Job"
            ? "in-progress"
            : w.status === "Off Duty"
              ? "rejected"
              : "pending");
      var statusDot =
        '<span class="worker-status-dot ' +
        (w.status === "Available"
          ? "available"
          : w.status === "On Job"
            ? "on-job"
            : w.status === "Off Duty"
              ? "off-duty"
              : "on-leave") +
        '"></span>';
      return (
        '<tr><td style="color:#06B6D4;">' +
        mono(w.id) +
        '</td><td style="color:var(--text-primary);font-weight:500;">' +
        w.name +
        "</td><td>" +
        w.team +
        "</td><td>" +
        w.specialty +
        "</td><td>" +
        statusDot +
        '<span class="badge ' +
        statusBadge +
        '">' +
        w.status +
        "</span></td><td>" +
        mono(w.phone) +
        '</td><td style="text-align:center;">' +
        (activeJobs > 0
          ? '<span style="background:#06B6D4;color:#fff;padding:2px 10px;border-radius:10px;font-size:12px;font-weight:600;">' +
            activeJobs +
            "</span>"
          : "0") +
        '</td><td><button class="btn btn-ghost btn-sm" onclick="viewWorker(\'' +
        w.id +
        "')\">View</button>" +
        (canAdd
          ? ' <button class="btn btn-sm btn-outline" onclick="showChangeWorkerStatus(\'' +
            w.id +
            '\')">Status</button> <button class="btn btn-sm btn-danger" onclick="confirmDeleteWorker(\'' +
            w.id +
            "','" +
            w.name.replace(/'/g, "\\'") +
            "')\">✕</button>"
          : "") +
        "</td></tr>"
      );
    })
    .join("");
}

async function submitWorker() {
  var name = document.getElementById("wkName").value.trim();
  var username = document.getElementById("wkUsername").value.trim();
  var team = document.getElementById("wkTeam").value;
  if (!name || !username || !team) {
    showToast("error", "Please fill in name, username, and team");
    return;
  }

  const data = await api("workers", "POST", {
    name,
    username,
    team,
    specialty:
      document.getElementById("wkSpecialty").value || "General Maintenance",
    phone: document.getElementById("wkPhone").value,
    status: document.getElementById("wkStatus").value,
  });
  if (data && data.success) {
    hideModal("workerModal");
    clearForm("workerModal");
    showToast(
      "success",
      "Worker " +
        name +
        " added! Login: " +
        username +
        " / Password: " +
        (data.defaultPassword || "(set by admin)"),
    );
    renderWorkers();
    renderDashboard();
  }
}

function viewWorker(id) {
  var w = DB.workers.find((x) => x.id === id);
  if (!w) return;
  var canDelete = DB.currentUser && DB.currentUser.role === "admin";
  document.getElementById("detailModalTitle").textContent = "Worker: " + w.name;
  document.getElementById("detailModalBody").innerHTML =
    '<div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;"><div style="width:48px;height:48px;border-radius:12px;background:#06B6D4;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff;">' +
    w.name.charAt(0) +
    '</div><div><div style="font-size:16px;font-weight:600;">' +
    w.name +
    '</div><div style="font-size:12px;color:var(--text-muted);">' +
    w.team +
    " · " +
    w.specialty +
    '</div></div></div><div class="form-row form-row-2"><div><div class="form-label">Worker ID</div><div>' +
    mono(w.id) +
    '</div></div><div><div class="form-label">Phone</div><div>' +
    mono(w.phone) +
    '</div></div></div><div style="margin-top:16px;"><div class="form-label">Status</div><span class="badge badge-' +
    (w.status === "Available" ? "approved" : "pending") +
    '">' +
    w.status +
    "</span></div>";
  document.getElementById("detailModalFooter").innerHTML =
    (canDelete
      ? '<button class="btn btn-danger btn-sm" onclick="confirmDeleteWorker(\'' +
        w.id +
        "','" +
        w.name.replace(/'/g, "\\'") +
        "')\">🗑️ Delete Worker</button>"
      : "") +
    '<button class="btn btn-ghost btn-sm" onclick="hideModal(\'detailModal\')">Close</button>';
  showModal("detailModal");
}

function showChangeWorkerStatus(id) {
  var w = DB.workers.find((x) => x.id === id);
  if (!w) return;
  document.getElementById("detailModalTitle").textContent =
    "Update Status: " + w.name;
  document.getElementById("detailModalBody").innerHTML =
    '<div style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">Change availability for <strong>' +
    w.name +
    '</strong></div><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">' +
    '<button class="btn btn-outline btn-sm" onclick="setWorkerStatus(\'' +
    id +
    "','Available')\" style=\"padding:14px;justify-content:center;" +
    (w.status === "Available"
      ? "background:rgba(34,197,94,0.15);border-color:var(--accent-green);color:var(--accent-green);"
      : "") +
    '">✅ Available</button>' +
    '<button class="btn btn-outline btn-sm" onclick="setWorkerStatus(\'' +
    id +
    "','On Job')\" style=\"padding:14px;justify-content:center;" +
    (w.status === "On Job"
      ? "background:rgba(59,130,246,0.15);border-color:var(--accent-blue);color:var(--accent-blue);"
      : "") +
    '">🔧 On Job</button>' +
    '<button class="btn btn-outline btn-sm" onclick="setWorkerStatus(\'' +
    id +
    "','Off Duty')\" style=\"padding:14px;justify-content:center;" +
    (w.status === "Off Duty"
      ? "background:rgba(100,116,139,0.15);border-color:#64748B;color:#64748B;"
      : "") +
    '">🌙 Off Duty</button>' +
    '<button class="btn btn-outline btn-sm" onclick="setWorkerStatus(\'' +
    id +
    "','On Leave')\" style=\"padding:14px;justify-content:center;" +
    (w.status === "On Leave"
      ? "background:rgba(245,158,11,0.15);border-color:var(--accent-yellow);color:var(--accent-yellow);"
      : "") +
    '">📅 On Leave</button></div>';
  document.getElementById("detailModalFooter").innerHTML =
    '<button class="btn btn-ghost btn-sm" onclick="hideModal(\'detailModal\')">Close</button>';
  showModal("detailModal");
}

async function setWorkerStatus(id, newStatus) {
  const data = await api("update_worker_status", "POST", {
    id,
    status: newStatus,
  });
  if (data && data.success) {
    showToast("success", "Status updated");
    hideModal("detailModal");
    renderWorkers();
  }
}

function confirmDeleteWorker(id, name) {
  document.getElementById("detailModalTitle").textContent = "⚠️ Delete Worker";
  document.getElementById("detailModalBody").innerHTML =
    '<div style="text-align:center;padding:10px 0;">' +
    '<div style="font-size:40px;margin-bottom:12px;">🗑️</div>' +
    '<div style="font-size:15px;font-weight:600;margin-bottom:8px;">Are you sure you want to delete this worker?</div>' +
    '<div style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">' +
    name +
    " (" +
    id +
    ")</div>" +
    '<div style="padding:12px 16px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-sm);font-size:12px;color:var(--accent-red);line-height:1.6;">' +
    "⚠️ This will remove the worker and their login account. Any currently assigned jobs will be unassigned. This action cannot be undone." +
    "</div>" +
    "</div>";
  document.getElementById("detailModalFooter").innerHTML =
    '<button class="btn btn-danger btn-sm" onclick="deleteWorker(\'' +
    id +
    "')\">Yes, Delete Worker</button>" +
    '<button class="btn btn-ghost btn-sm" onclick="hideModal(\'detailModal\')">Cancel</button>';
  showModal("detailModal");
}

async function deleteWorker(id) {
  const data = await api("delete_worker", "POST", { id });
  if (data && data.success) {
    showToast("success", "Worker deleted");
    hideModal("detailModal");
    renderWorkers();
    renderDashboard();
  }
}

// ===== WORKER ASSIGNMENT =====
async function assignWorkerToSR(srId) {
  var sel = document.getElementById("assignWorkerSelect_" + srId);
  if (!sel || !sel.value) {
    showToast("error", "Please select a worker");
    return;
  }
  const data = await api("assign_worker", "POST", {
    type: "sr",
    refId: srId,
    workerId: sel.value,
  });
  if (data && data.success) {
    showToast("success", "Worker assigned");
    hideModal("detailModal");
    renderServiceRequests();
  }
}
async function unassignWorkerFromSR(srId) {
  const data = await api("assign_worker", "POST", {
    type: "sr",
    refId: srId,
    workerId: null,
  });
  if (data && data.success) {
    showToast("info", "Worker removed");
    hideModal("detailModal");
    renderServiceRequests();
  }
}
async function assignWorkerToRO(roId) {
  var sel = document.getElementById("assignWorkerSelect_" + roId);
  if (!sel || !sel.value) {
    showToast("error", "Please select a worker");
    return;
  }
  const data = await api("assign_worker", "POST", {
    type: "ro",
    refId: roId,
    workerId: sel.value,
  });
  if (data && data.success) {
    showToast("success", "Worker assigned");
    hideModal("detailModal");
    renderReconnections();
  }
}
async function unassignWorkerFromRO(roId) {
  const data = await api("assign_worker", "POST", {
    type: "ro",
    refId: roId,
    workerId: null,
  });
  if (data && data.success) {
    showToast("info", "Worker removed");
    hideModal("detailModal");
    renderReconnections();
  }
}

// ===== SR STATUS UPDATE =====
async function updateSRStatus(id) {
  var sr = DB.serviceRequests.find((s) => s.id === id);
  if (!sr) return;
  var newStatus =
    sr.status === "New"
      ? "In Progress"
      : sr.status === "In Progress"
        ? "Completed"
        : null;
  if (!newStatus) return;
  const data = await api("update_sr_status", "POST", { id, status: newStatus });
  if (data && data.success) {
    showToast("success", id + " → " + newStatus);
    renderServiceRequests();
    renderDashboard();
  }
}

// ===== WORKER PORTAL =====
async function renderWorkerDashboard() {
  destroyAllMiniMaps();
  const [srs, ros] = await Promise.all([
    api("service_requests"),
    api("reconnections"),
  ]);
  var activeSRs = (srs || []).filter((s) => s.status !== "Completed");
  var activeROs = (ros || []).filter(
    (r) => r.status !== "Completed" && r.status !== "Rejected",
  );
  var completedSRs = (srs || []).filter((s) => s.status === "Completed");
  var completedROs = (ros || []).filter((r) => r.status === "Completed");

  document.getElementById("wStatActive").textContent =
    activeSRs.length + activeROs.length;
  document.getElementById("wStatCompleted").textContent =
    completedSRs.length + completedROs.length;
  document.getElementById("wStatPending").textContent = (srs || []).filter(
    (s) => s.status === "New",
  ).length;
  document.getElementById("wAssignBadge").textContent =
    activeSRs.length + activeROs.length;

  var html = "";
  activeSRs.forEach((s) => {
    html += buildJobCard(
      s.id,
      "Service Request",
      s.nature,
      s.consumer,
      s.landmark,
      s.filed,
      s.status,
      true,
      s.declineReason,
      s.declinedBy,
      s.latitude,
      s.longitude,
      s.location,
    );
  });
  activeROs.forEach((r) => {
    html += buildJobCard(
      r.id,
      "Reconnection",
      "₱" + parseFloat(r.total).toFixed(2),
      r.consumer,
      r.landmark,
      r.date,
      r.status,
      true,
      null,
      null,
      r.latitude,
      r.longitude,
      r.location,
    );
  });
  if (!html)
    html =
      '<div class="empty-state" style="padding:24px;"><div class="empty-state-icon" style="font-size:32px;">✅</div><div style="font-size:13px;">No active jobs right now</div></div>';
  document.getElementById("wTodayJobs").innerHTML = html;
}

async function renderWorkerAssignments(filter) {
  destroyAllMiniMaps();
  const [srs, ros] = await Promise.all([
    api("service_requests"),
    api("reconnections"),
  ]);
  var html = "";
  if (!filter || filter === "all" || filter === "sr")
    (srs || [])
      .filter((s) => s.status !== "Completed" && s.status !== "Declined")
      .forEach((s) => {
        html += buildJobCard(
          s.id,
          "Service Request",
          s.nature,
          s.consumer,
          s.landmark,
          s.filed,
          s.status,
          true,
          s.declineReason,
          s.declinedBy,
          s.latitude,
          s.longitude,
          s.location,
        );
      });
  if (!filter || filter === "all" || filter === "ro")
    (ros || [])
      .filter((r) => r.status !== "Completed" && r.status !== "Rejected")
      .forEach((r) => {
        html += buildJobCard(
          r.id,
          "Reconnection",
          "₱" + parseFloat(r.total).toFixed(2),
          r.consumer,
          r.landmark,
          r.date,
          r.status,
          true,
          null,
          null,
          r.latitude,
          r.longitude,
          r.location,
        );
      });
  if (!html)
    html =
      '<div class="empty-state"><div class="empty-state-icon">📋</div><div>No active assignments</div></div>';
  document.getElementById("wAssignmentsList").innerHTML = html;
}

async function renderWorkerCompleted() {
  destroyAllMiniMaps();
  const [srs, ros] = await Promise.all([
    api("service_requests"),
    api("reconnections"),
  ]);
  var html = "";
  (srs || [])
    .filter((s) => s.status === "Completed" || s.status === "Declined")
    .forEach((s) => {
      html += buildJobCard(
        s.id,
        "Service Request",
        s.nature,
        s.consumer,
        s.landmark,
        s.filed,
        s.status,
        false,
        s.declineReason,
        s.declinedBy,
        s.latitude,
        s.longitude,
        s.location,
      );
    });
  (ros || [])
    .filter((r) => r.status === "Completed")
    .forEach((r) => {
      html += buildJobCard(
        r.id,
        "Reconnection",
        "₱" + parseFloat(r.total).toFixed(2),
        r.consumer,
        r.landmark,
        r.date,
        r.status,
        false,
        null,
        null,
        r.latitude,
        r.longitude,
        r.location,
      );
    });
  if (!html)
    html =
      '<div class="empty-state"><div class="empty-state-icon">📋</div><div>No completed jobs yet</div></div>';
  document.getElementById("wCompletedList").innerHTML = html;
}

async function renderWorkerMyStatus() {
  var wd = DB.currentUser.workerData;
  var currentStatus = wd ? wd.status : "Available";

  // Update badge
  var badgeEl = document.getElementById("wMyStatusBadge");
  var statusColors = {
    Available:
      "background:rgba(34,197,94,0.15);color:var(--accent-green);border:1px solid rgba(34,197,94,0.3);",
    "On Job":
      "background:rgba(59,130,246,0.15);color:var(--accent-blue);border:1px solid rgba(59,130,246,0.3);",
    "Off Duty":
      "background:rgba(100,116,139,0.15);color:#94A3B8;border:1px solid rgba(100,116,139,0.3);",
    "On Leave":
      "background:rgba(245,158,11,0.15);color:var(--accent-yellow);border:1px solid rgba(245,158,11,0.3);",
  };
  badgeEl.textContent = currentStatus;
  badgeEl.style.cssText = statusColors[currentStatus] || "";

  // Render status options
  var statuses = [
    {
      key: "Available",
      icon: "✅",
      label: "Available",
      desc: "Ready for new assignments",
      color: "var(--accent-green)",
      bg: "rgba(34,197,94,0.15)",
    },
    {
      key: "On Job",
      icon: "🔧",
      label: "On Job",
      desc: "Currently working on site",
      color: "var(--accent-blue)",
      bg: "rgba(59,130,246,0.15)",
    },
    {
      key: "Off Duty",
      icon: "🌙",
      label: "Off Duty",
      desc: "Not working today",
      color: "#94A3B8",
      bg: "rgba(100,116,139,0.15)",
    },
    {
      key: "On Leave",
      icon: "📅",
      label: "On Leave",
      desc: "On approved leave",
      color: "var(--accent-yellow)",
      bg: "rgba(245,158,11,0.15)",
    },
  ];
  document.getElementById("wMyStatusOptions").innerHTML = statuses
    .map((st) => {
      var isActive = currentStatus === st.key;
      return (
        '<button class="btn btn-outline btn-sm" onclick="setMyWorkerStatus(\'' +
        st.key +
        '\')" style="padding:16px 12px;justify-content:center;flex-direction:column;gap:4px;min-height:80px;' +
        (isActive
          ? "background:" +
            st.bg +
            ";border-color:" +
            st.color +
            ";color:" +
            st.color +
            ";box-shadow:0 0 0 2px " +
            st.bg +
            ";"
          : "") +
        '">' +
        '<div style="font-size:20px;">' +
        st.icon +
        "</div>" +
        '<div style="font-size:13px;font-weight:600;">' +
        st.label +
        "</div>" +
        '<div style="font-size:10px;opacity:0.7;">' +
        st.desc +
        "</div>" +
        "</button>"
      );
    })
    .join("");
}

async function setMyWorkerStatus(newStatus) {
  var wd = DB.currentUser.workerData;
  if (!wd) {
    showToast("error", "Worker data not found");
    return;
  }
  var workerId = "W" + String(wd.worker_id).padStart(3, "0");
  const data = await api("update_worker_status", "POST", {
    id: workerId,
    status: newStatus,
  });
  if (data && data.success) {
    DB.currentUser.workerData.status = newStatus;
    showToast("success", 'Your status is now "' + newStatus + '"');
    renderWorkerMyStatus();
  }
}

function buildJobCard(
  id,
  type,
  detail,
  consumer,
  landmark,
  date,
  status,
  showActions,
  declineReason,
  declinedBy,
  lat,
  lng,
  location,
) {
  var typeColor =
    type === "Service Request"
      ? "var(--accent-orange)"
      : "var(--accent-purple)";
  var typeBg =
    type === "Service Request"
      ? "var(--accent-orange-dim)"
      : "var(--accent-purple-dim)";
  var statusBadge =
    "badge-" +
    (status === "New"
      ? "new"
      : status === "In Progress"
        ? "in-progress"
        : status === "Completed"
          ? "completed"
          : status === "Declined"
            ? "rejected"
            : status === "Pending"
              ? "pending"
              : "approved");
  var html =
    '<div class="job-card"><div class="job-card-header"><div><span class="job-card-id">' +
    id +
    '</span> <span class="job-card-type" style="background:' +
    typeBg +
    ";color:" +
    typeColor +
    ';margin-left:8px;">' +
    type +
    '</span></div><span class="badge ' +
    statusBadge +
    '">' +
    status +
    '</span></div><div class="job-card-consumer">' +
    consumer +
    '</div><div class="job-card-detail">📋 ' +
    detail +
    '</div><div class="job-card-detail">📍 ' +
    (landmark || "No landmark") +
    "</div>" +
    (location ? '<div class="job-card-detail">🏠 ' + location + "</div>" : "") +
    '<div class="job-card-detail">📅 Filed: ' +
    date +
    "</div>";

  // Mini map preview if coordinates exist
  if (lat && lng && parseFloat(lat) && parseFloat(lng)) {
    var mapId = "minimap-" + id.replace(/[^a-zA-Z0-9]/g, "");
    html +=
      '<div class="job-card-map-wrapper" style="margin-top:12px;border-radius:8px;overflow:hidden;border:1px solid var(--border);position:relative;cursor:pointer;" onclick="openJobLocationModal(\'' +
      id +
      "'," +
      lat +
      "," +
      lng +
      ",'" +
      consumer.replace(/'/g, "\\'") +
      "','" +
      (landmark || "").replace(/'/g, "\\'") +
      "','" +
      (location || "").replace(/'/g, "\\'") +
      "')\">" +
      '<div id="' +
      mapId +
      '" style="height:160px;width:100%;"></div>' +
      '<div style="position:absolute;bottom:8px;left:8px;background:rgba(0,0,0,0.7);color:#fff;font-size:10px;padding:3px 8px;border-radius:4px;pointer-events:none;">📍 ' +
      parseFloat(lat).toFixed(5) +
      ", " +
      parseFloat(lng).toFixed(5) +
      "</div>" +
      '<div style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);color:#fff;font-size:10px;padding:3px 8px;border-radius:4px;pointer-events:none;">🔍 Tap to expand</div>' +
      "</div>";
    // Queue mini map initialization
    setTimeout(function () {
      initMiniMap(mapId, parseFloat(lat), parseFloat(lng));
    }, 100);
  }

  if (declineReason) {
    html +=
      '<div style="margin-top:8px;padding:10px 12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:6px;font-size:12px;"><span style="color:var(--accent-red);font-weight:600;">⚠️ Declined' +
      (declinedBy ? " by " + declinedBy : "") +
      ':</span> <span style="color:var(--text-muted);">' +
      declineReason +
      "</span></div>";
  }
  if (type === "Service Request") {
    html +=
      '<div style="margin-top:10px;">' +
      '<button class="btn btn-ghost btn-sm" style="font-size:11px;" onclick="viewSRPhotos(\'' +
      id +
      "')\">📷 View Photos</button></div>";
  }
  if (showActions && status !== "Completed" && status !== "Declined") {
    html += '<div class="job-card-actions">';
    if (id.startsWith("SR")) {
      if (status === "New")
        html +=
          '<button class="btn btn-sm" style="background:#06B6D4;color:#fff;" onclick="workerUpdateSR(\'' +
          id +
          "','In Progress')\">🔧 Start Work</button>";
      if (status === "In Progress")
        html +=
          '<button class="btn btn-success btn-sm" onclick="workerUpdateSR(\'' +
          id +
          "','Completed')\">✅ Mark Complete</button>";
      html +=
        '<button class="btn btn-sm" style="background:var(--accent-red);color:#fff;" onclick="showDeclineSR(\'' +
        id +
        "')\">❌ Cannot Service</button>";
    }
    if (id.startsWith("RO"))
      html +=
        '<button class="btn btn-success btn-sm" onclick="workerCompleteRO(\'' +
        id +
        "')\">✅ Mark Reconnected</button>";
    html += "</div>";
  }
  html += "</div>";
  return html;
}

async function workerUpdateSR(id, newStatus) {
  const data = await api("update_sr_status", "POST", { id, status: newStatus });
  if (data && data.success) {
    showToast("success", id + " → " + newStatus);
    renderWorkerDashboard();
    renderWorkerAssignments();
  }
}
async function workerCompleteRO(id) {
  // Mark RO as completed — backend will auto-reactivate disconnected member
  const data = await api("complete_reconnection", "POST", { id });
  if (data && data.success) {
    var msg = id + " marked as reconnected";
    if (data.memberReactivated) msg += " — Consumer reactivated!";
    showToast("success", msg);
    renderWorkerDashboard();
    renderWorkerAssignments();
  }
}

// ===== CONSUMER PORTAL =====
async function renderConsumerDashboard() {
  var md = DB.currentUser.memberData;
  if (!md) {
    document.getElementById("cHeroName").textContent = "Account not linked";
    return;
  }
  document.getElementById("cHeroName").textContent =
    md.last_name + ", " + md.first_name;
  document.getElementById("cHeroAccount").textContent = md.account_no;
  document.getElementById("cHeroMeter").textContent = md.meter_no;
  document.getElementById("cHeroAvatar").textContent = md.first_name.charAt(0);
  document.getElementById("cHeroStatus").textContent = md.status;
  // Update hero status badge color based on member status
  var heroStatusEl = document.getElementById("cHeroStatus");
  if (md.status === "Disconnected") {
    heroStatusEl.className = "badge badge-rejected";
    heroStatusEl.style.fontSize = "13px";
    heroStatusEl.style.padding = "5px 14px";
  } else {
    heroStatusEl.className = "badge badge-approved";
    heroStatusEl.style.fontSize = "13px";
    heroStatusEl.style.padding = "5px 14px";
  }
  document.getElementById("cInfoAddress").textContent =
    (md.address_brgy || "") + ", " + (md.address_muni || "");
  document.getElementById("cInfoConn").textContent = md.connection_type;
  document.getElementById("cInfoPhone").textContent = md.phone || "—";
  document.getElementById("cInfoSince").textContent = md.registered_at;

  // Active requests
  const srs = await api("service_requests");
  var active = (srs || []).filter(
    (s) => s.status !== "Completed" && s.status !== "Cancelled",
  );
  if (active.length) {
    document.getElementById("cActiveRequests").innerHTML = active
      .map((s) => {
        var badgeClass =
          s.status === "New"
            ? "new"
            : s.status === "In Progress"
              ? "in-progress"
              : s.status === "Declined"
                ? "rejected"
                : "pending";
        var html =
          '<div style="padding:10px;border-bottom:1px solid var(--border);font-size:12px;">' +
          '<span style="color:var(--accent-blue);font-weight:600;">' +
          s.id +
          "</span> — " +
          s.nature +
          ' <span class="badge badge-' +
          badgeClass +
          '" style="font-size:10px;">' +
          s.status +
          "</span>";
        if (s.status === "Declined" && s.declineReason) {
          html +=
            '<div style="margin-top:6px;padding:8px 10px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.15);border-radius:6px;">' +
            '<div style="font-size:11px;font-weight:600;color:var(--accent-red);">❌ Declined' +
            (s.declinedBy ? " by " + s.declinedBy : "") +
            "</div>" +
            '<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">' +
            s.declineReason +
            "</div>" +
            "</div>";
        }
        html += "</div>";
        return html;
      })
      .join("");
  }
}

async function renderConsumerRequests() {
  const srs = await api("service_requests");
  if (!srs || !srs.length) {
    document.getElementById("cMyRequestsList").innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">📋</div><div>No service requests yet</div><button class="btn btn-outline btn-sm" style="margin-top:12px;" onclick="navigateTo(\'c-new-request\')">Submit your first request</button></div>';
    return;
  }
  document.getElementById("cMyRequestsList").innerHTML = srs
    .map((s) => {
      var isDeclined = s.status === "Declined";
      var isCancelled = s.status === "Cancelled";
      var steps = [
        {
          label: "Request Filed",
          desc: "Your request has been received",
          done: true,
          time: s.filed,
        },
        {
          label: "Assigned to Crew",
          desc: "A team will be assigned",
          done: s.status === "In Progress" || s.status === "Completed",
          time: "",
        },
        {
          label: "Work In Progress",
          desc: "Crew is working on it",
          done: s.status === "In Progress" || s.status === "Completed",
          time: "",
        },
        {
          label: "Completed",
          desc: "Issue has been resolved",
          done: s.status === "Completed",
          time: "",
        },
      ];
      var badgeClass =
        s.status === "New"
          ? "new"
          : s.status === "In Progress"
            ? "in-progress"
            : s.status === "Declined"
              ? "rejected"
              : s.status === "Cancelled"
                ? "cancelled"
                : "completed";
      var declineHtml = "";
      if (isDeclined && s.declineReason) {
        declineHtml =
          '<div style="margin-top:12px;padding:12px 16px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;">' +
          '<div style="font-size:12px;font-weight:600;color:var(--accent-red);margin-bottom:4px;">❌ Service Declined' +
          (s.declinedBy ? " by " + s.declinedBy : "") +
          "</div>" +
          '<div style="font-size:12px;color:var(--text-muted);line-height:1.5;">' +
          s.declineReason +
          "</div>" +
          (s.declinedAt
            ? '<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">' +
              s.declinedAt +
              "</div>"
            : "") +
          "</div>";
      }
      var cancelledHtml = isCancelled
        ? '<div style="margin-top:12px;padding:12px 16px;background:rgba(107,114,128,0.08);border:1px solid rgba(107,114,128,0.2);border-radius:8px;font-size:12px;color:#9CA3AF;">🚫 This request was cancelled.</div>'
        : "";
      var cancelBtn =
        s.status === "New"
          ? '<button class="btn btn-ghost btn-sm" style="font-size:11px;color:var(--accent-red);border-color:rgba(239,68,68,0.3);margin-top:12px;" onclick="consumerCancelSR(\'' +
            s.id +
            "')\">Cancel Request</button>"
          : "";
      var bodyContent = isDeclined
        ? declineHtml
        : isCancelled
          ? cancelledHtml
          : '<div class="tracker">' +
            steps
              .map(
                (st) =>
                  '<div class="tracker-step ' +
                  (st.done ? "completed" : "") +
                  '"><div class="tracker-dot">' +
                  (st.done ? "✓" : "") +
                  '</div><div class="tracker-info"><div class="tracker-label">' +
                  st.label +
                  '</div><div class="tracker-desc">' +
                  st.desc +
                  "</div></div></div>",
              )
              .join("") +
            "</div>" +
            cancelBtn;
      return (
        '<div class="card" style="margin-bottom:16px;"><div class="card-header"><div class="card-title" style="display:flex;align-items:center;gap:10px;">' +
        mono(s.id) +
        " — " +
        s.nature +
        ' <span class="badge badge-' +
        badgeClass +
        '">' +
        s.status +
        '</span></div></div><div class="card-body">' +
        bodyContent +
        "</div></div>"
      );
    })
    .join("");
}

async function renderConsumerSenior() {
  const sds = await api("senior_discounts");
  if (sds && sds.length) {
    document.getElementById("cSeniorExisting").innerHTML = sds
      .map(
        (s) =>
          '<div class="card" style="margin-bottom:16px;"><div class="card-body"><div class="form-row form-row-2"><div><div class="form-label">Application No.</div><div>' +
          mono(s.id) +
          '</div></div><div><div class="form-label">Status</div><span class="badge badge-' +
          (s.status === "Pending"
            ? "pending"
            : s.status === "Approved"
              ? "approved"
              : "rejected") +
          '">' +
          s.status +
          "</span></div></div></div></div>",
      )
      .join("");
  }
}

async function setupConsumerRequestForm() {
  var md = DB.currentUser ? DB.currentUser.memberData : null;
  var selectEl = document.getElementById("cSrNature");
  if (!md || !selectEl) return;

  // Check if consumer already has an active request
  var warningId = "activeRequestWarning";
  var existingWarning = document.getElementById(warningId);
  if (existingWarning) existingWarning.remove();

  var disconnectedId = "disconnectedWarning";
  var existingDisconnected = document.getElementById(disconnectedId);
  if (existingDisconnected) existingDisconnected.remove();

  if (DB.currentUser.isConsumer) {
    var srs = await api("service_requests");
    var activeReq = (srs || []).find(function (s) {
      return (
        s.status !== "Completed" &&
        s.status !== "Declined" &&
        s.status !== "Cancelled"
      );
    });
    if (activeReq) {
      // Disable the entire form and show notice
      var formCard =
        selectEl.closest(".card-body") || selectEl.closest(".card");
      if (formCard) {
        var notice = document.createElement("div");
        notice.id = warningId;
        notice.style.cssText = "padding:20px;text-align:center;";
        notice.innerHTML =
          '<div style="font-size:36px;margin-bottom:12px;">📋</div>' +
          '<div style="font-size:15px;font-weight:600;margin-bottom:8px;">You already have an active request</div>' +
          '<div style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">' +
          'Your request <strong style="color:var(--accent-blue);">' +
          activeReq.id +
          "</strong> (" +
          activeReq.nature +
          ') is currently <span class="badge badge-' +
          (activeReq.status === "New"
            ? "new"
            : activeReq.status === "In Progress"
              ? "in-progress"
              : "pending") +
          '">' +
          activeReq.status +
          "</span>" +
          "</div>" +
          '<div style="font-size:12px;color:var(--text-muted);margin-bottom:20px;">You can only submit a new request once your current one is completed or declined.</div>' +
          '<button class="btn btn-outline btn-sm" onclick="navigateTo(\'c-my-requests\')" style="padding:10px 24px;">📋 Track My Request</button>';
        // Hide form fields, show notice
        Array.from(formCard.children).forEach(function (child) {
          if (child.id !== warningId) child.style.display = "none";
        });
        formCard.insertBefore(notice, formCard.firstChild);
      }
      return;
    } else {
      // No active request — make sure form is visible
      var formCard =
        selectEl.closest(".card-body") || selectEl.closest(".card");
      if (formCard) {
        Array.from(formCard.children).forEach(function (child) {
          child.style.display = "";
        });
      }
    }
  }

  // Disconnected consumer check
  if (md.status === "Disconnected") {
    selectEl.value = "Reconnection";
    Array.from(selectEl.options).forEach(function (opt) {
      if (opt.value && opt.value !== "Reconnection") {
        opt.disabled = true;
      }
    });
    var warning = document.createElement("div");
    warning.id = disconnectedId;
    warning.style.cssText =
      "padding:12px 16px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;margin-bottom:16px;font-size:12px;color:#EF4444;line-height:1.6;";
    warning.innerHTML =
      "⚠️ <strong>Your account is currently disconnected.</strong> You can only submit a Reconnection request. Once the reconnection is completed, your account will be automatically reactivated.";
    var formCard = selectEl.closest(".card-body") || selectEl.closest(".card");
    if (formCard) formCard.insertBefore(warning, formCard.firstChild);
  } else {
    Array.from(selectEl.options).forEach(function (opt) {
      opt.disabled = false;
    });
  }
}

async function consumerSubmitSR() {
  var nature = document.getElementById("cSrNature").value;
  if (!nature) {
    showToast("error", "Please select a request type");
    return;
  }
  var md = DB.currentUser.memberData;
  if (!md) {
    showToast("error", "Account not linked");
    return;
  }
  // Disconnected consumers can only submit Reconnection requests
  if (md.status === "Disconnected" && nature !== "Reconnection") {
    showToast(
      "error",
      "Your account is disconnected. You can only submit a Reconnection request.",
    );
    return;
  }
  // Check for active request (anti-spam — backend also enforces this)
  if (DB.currentUser.isConsumer) {
    var srs = await api("service_requests");
    var activeReq = (srs || []).find(function (s) {
      return (
        s.status !== "Completed" &&
        s.status !== "Declined" &&
        s.status !== "Cancelled"
      );
    });
    if (activeReq) {
      showToast(
        "error",
        "You already have an active request (" +
          activeReq.id +
          "). Please wait until it is completed.",
      );
      return;
    }
  }
  const data = await api("service_requests", "POST", {
    memberId: md.member_id,
    account: md.account_no,
    nature: nature,
    landmark: document.getElementById("cSrLandmark").value,
    remarks: document.getElementById("cSrRemarks").value,
    phone: document.getElementById("cSrPhone").value,
  });
  if (data && data.success) {
    // Upload photos if any were selected
    var photoInput = document.getElementById("cSrPhotos");
    if (photoInput && photoInput.files.length > 0) {
      var formData = new FormData();
      formData.append("sr_number", data.id);
      formData.append("_csrf", csrfToken);
      var maxPhotos = Math.min(photoInput.files.length, 5);
      for (var i = 0; i < maxPhotos; i++) {
        formData.append("files[]", photoInput.files[i]);
      }
      try {
        var uploadRes = await fetch(API + "?action=upload_sr_photos", {
          method: "POST",
          body: formData,
          credentials: "same-origin",
        });
        var uploadData = await uploadRes.json();
        if (uploadData && uploadData.success && uploadData.count > 0) {
          showToast("success", uploadData.count + " photo(s) uploaded");
        }
      } catch (e) {
        console.error("Photo upload error:", e);
      }
    }
    showToast("success", "Request " + data.id + " submitted!");
    navigateTo("c-my-requests");
  }
}

async function consumerSubmitSenior() {
  var md = DB.currentUser.memberData;
  if (!md) {
    showToast("error", "Account not linked");
    return;
  }
  var age = parseInt(document.getElementById("cScAge").value);
  if (age && age < 60) {
    showToast("error", "Must be 60+");
    return;
  }
  var docsSubmitted = [];
  ["cScDoc1", "cScDoc2", "cScDoc3", "cScDoc4"].forEach((id, i) => {
    if (document.getElementById(id).checked) docsSubmitted.push(i);
  });
  const data = await api("senior_discounts", "POST", {
    memberId: md.member_id,
    account: md.account_no,
    scId: document.getElementById("cScId").value,
    dob: document.getElementById("cScDob").value,
    age: age || 0,
    docsSubmitted: docsSubmitted,
  });
  if (data && data.success) {
    // Upload files if any were selected
    var fileInput = document.getElementById("cScFileInput");
    if (fileInput && fileInput.files.length > 0) {
      var formData = new FormData();
      formData.append("sc_id", data.sc_id || "");
      formData.append("sc_number", data.id);
      formData.append("_csrf", csrfToken);
      var docTypes = [
        "Proof of Age & Citizenship",
        "Proof of Residence",
        "Proof of Billing",
        "Authorization Letter",
      ];
      for (var i = 0; i < fileInput.files.length; i++) {
        formData.append("files[]", fileInput.files[i]);
        formData.append("doc_types[]", docTypes[i] || "Supporting Document");
      }
      try {
        var uploadRes = await fetch(API + "?action=upload_sc_docs", {
          method: "POST",
          body: formData,
          credentials: "same-origin",
        });
        var uploadData = await uploadRes.json();
        if (uploadData && uploadData.success)
          showToast("success", uploadData.count + " document(s) uploaded");
      } catch (e) {
        console.error("Upload error:", e);
      }
    }
    showToast("success", "Application " + data.id + " submitted!");
    navigateTo("c-senior");
  }
}

function handleSrPhotoSelect(input) {
  var preview = document.getElementById("cSrPhotoPreview");
  if (!preview) return;
  preview.innerHTML = "";
  var files = Array.from(input.files).slice(0, 5);
  var oversized = files.filter(function (f) { return f.size > 10 * 1024 * 1024; });
  if (oversized.length) {
    showToast("warning", oversized.length + " photo(s) exceed 10 MB and will be skipped");
  }
  files.forEach(function (file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var thumb = document.createElement("div");
      thumb.style.cssText =
        "width:80px;height:80px;border-radius:6px;overflow:hidden;border:1px solid var(--border);flex-shrink:0;";
      thumb.innerHTML =
        '<img src="' +
        e.target.result +
        '" style="width:100%;height:100%;object-fit:cover;">';
      preview.appendChild(thumb);
    };
    reader.readAsDataURL(file);
  });
  if (input.files.length > 5) {
    showToast("warning", "Only the first 5 photos will be uploaded");
  }
}

async function consumerCancelSR(srNumber) {
  if (!confirm("Cancel request " + srNumber + "?\nThis cannot be undone."))
    return;
  var res = await api("cancel_sr", "POST", { id: srNumber });
  if (res && res.success) {
    showToast("success", srNumber + " has been cancelled");
    renderConsumerRequests();
  }
}

// ===== USER MANAGEMENT =====
async function renderUsers() {
  const users = await api("users");
  if (!users) return;
  DB.allUsers = users;
  // Show bulk import button for admin and cwdo
  var bulkBtn = document.getElementById("btnBulkImportConsumers");
  if (bulkBtn) {
    bulkBtn.style.display =
      DB.currentUser &&
      (DB.currentUser.role === "admin" || DB.currentUser.role === "cwdo")
        ? "inline-flex"
        : "none";
  }
  var roleColors = {
    admin: "#3B82F6",
    cwdo: "#F97316",
    cao_disco: "#A855F7",
    cao_manager: "#22C55E",
    gm: "#F59E0B",
    worker: "#06B6D4",
    consumer: "#4ADE80",
  };
  document.getElementById("userTableBody").innerHTML = users
    .map((u) => {
      var color = roleColors[u.role_key] || "#94A3B8";
      var roleName =
        u.role_name ||
        (u.role_key === "consumer"
          ? "Consumer / Member"
          : u.role_key === "worker"
            ? "Field Worker / Crew"
            : u.role_key || "Unknown");
      var isCurrentUser = DB.currentUser && DB.currentUser.userId == u.user_id;
      var resetBtn =
        DB.currentUser.role === "admin"
          ? '<button class="btn btn-sm" style="background:#F59E0B;color:#fff;margin-right:4px;" onclick="showResetPassword(' +
            u.user_id +
            ",'" +
            esc(u.full_name).replace(/'/g, "\\'") +
            "','" +
            esc(u.username) +
            "')\">🔑</button>"
          : "";
      var deleteBtn =
        !isCurrentUser && DB.currentUser.role === "admin"
          ? '<button class="btn btn-sm btn-danger" onclick="confirmDeleteUser(' +
            u.user_id +
            ",'" +
            esc(u.full_name).replace(/'/g, "\\'") +
            "','" +
            esc(u.username) +
            "')\">✕</button>"
          : "";
      return (
        '<tr><td style="color:var(--accent-blue);">' +
        esc(u.username) +
        '</td><td style="color:var(--text-primary);font-weight:500;">' +
        esc(u.full_name) +
        '</td><td><span style="color:' +
        color +
        ';font-weight:500;">' +
        esc(roleName) +
        "</span></td><td>" +
        (u.email ? esc(u.email) : "—") +
        "</td><td>" +
        (u.phone ? esc(u.phone) : "—") +
        '</td><td><span class="badge badge-' +
        (u.is_active == 1 ? "approved" : "rejected") +
        '">' +
        (u.is_active == 1 ? "Active" : "Inactive") +
        "</span></td><td>" +
        (u.lastLogin || "Never") +
        '</td><td style="white-space:nowrap;">' +
        resetBtn +
        deleteBtn +
        "</td></tr>"
      );
    })
    .join("");
}

function confirmDeleteUser(userId, fullName, username) {
  document.getElementById("detailModalTitle").textContent = "⚠️ Delete User";
  document.getElementById("detailModalBody").innerHTML =
    '<div style="text-align:center;padding:10px 0;">' +
    '<div style="font-size:40px;margin-bottom:12px;">🗑️</div>' +
    '<div style="font-size:15px;font-weight:600;margin-bottom:8px;">Delete this user account?</div>' +
    '<div style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">' +
    fullName +
    ' (<span style="color:var(--accent-blue);">' +
    username +
    "</span>)</div>" +
    '<div style="padding:12px 16px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-sm);font-size:12px;color:var(--accent-red);line-height:1.6;">' +
    "⚠️ This will deactivate the account. The user will no longer be able to log in. If they are a worker, their assigned jobs will be unassigned." +
    "</div>" +
    "</div>";
  document.getElementById("detailModalFooter").innerHTML =
    '<button class="btn btn-danger btn-sm" onclick="deleteUser(' +
    userId +
    ')">Yes, Delete User</button>' +
    '<button class="btn btn-ghost btn-sm" onclick="hideModal(\'detailModal\')">Cancel</button>';
  showModal("detailModal");
}

async function deleteUser(userId) {
  const data = await api("delete_user", "POST", { userId });
  if (data && data.success) {
    showToast("success", "User deleted");
    hideModal("detailModal");
    await renderUsers();
    await renderMembers();
    await renderWorkers();
    await renderDashboard();
  }
}

function showResetPassword(userId, fullName, username) {
  document.getElementById("detailModalTitle").textContent = "🔑 Reset Password";
  document.getElementById("detailModalBody").innerHTML =
    '<div style="text-align:center;padding:10px 0 16px;">' +
    '<div style="font-size:36px;margin-bottom:8px;">🔑</div>' +
    '<div style="font-size:15px;font-weight:600;margin-bottom:4px;">' +
    esc(fullName) +
    "</div>" +
    '<div style="font-size:12px;color:var(--text-muted);margin-bottom:20px;">Username: <span style="color:var(--accent-blue);font-family:JetBrains Mono,monospace;">' +
    esc(username) +
    "</span></div>" +
    "</div>" +
    '<div style="display:flex;gap:8px;margin-bottom:16px;">' +
    '<button class="btn btn-sm" style="background:#F59E0B;color:#fff;flex:1;" onclick="executeResetPassword(' +
    userId +
    ",'auto')\">🎲 Generate Random Password</button>" +
    "</div>" +
    '<div style="text-align:center;font-size:11px;color:var(--text-muted);margin-bottom:12px;">— or set a custom password —</div>' +
    '<div class="form-group"><label class="form-label">New Password</label>' +
    '<input type="text" class="form-input" id="rpNewPass" placeholder="Min 8 chars, uppercase, lowercase, number" oninput="checkPasswordStrength(this.value)">' +
    "</div>" +
    '<div id="cpStrength" style="margin-top:-8px;margin-bottom:12px;"></div>' +
    '<div id="rpResult" style="display:none;margin-top:12px;"></div>';
  document.getElementById("detailModalFooter").innerHTML =
    '<button class="btn btn-sm" style="background:#06B6D4;color:#fff;" onclick="executeResetPassword(' +
    userId +
    ",'custom')\">Set Custom Password</button>" +
    '<button class="btn btn-ghost btn-sm" onclick="hideModal(\'detailModal\')">Close</button>';
  showModal("detailModal");
}

async function executeResetPassword(userId, mode) {
  var newPass = "";
  if (mode === "custom") {
    newPass = document.getElementById("rpNewPass").value;
    if (!newPass) {
      showToast("error", "Please enter a password");
      return;
    }
    if (
      newPass.length < 8 ||
      !/[A-Z]/.test(newPass) ||
      !/[a-z]/.test(newPass) ||
      !/[0-9]/.test(newPass)
    ) {
      showToast(
        "error",
        "Password must be 8+ chars with uppercase, lowercase, and number",
      );
      return;
    }
  }

  var data = await api("reset_password", "POST", {
    userId: userId,
    newPassword: mode === "custom" ? newPass : null,
  });
  if (data && data.success) {
    var generatedPass = data.newPassword || newPass;
    var resultEl = document.getElementById("rpResult");
    resultEl.innerHTML =
      '<div style="padding:16px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:8px;text-align:center;">' +
      '<div style="font-size:13px;font-weight:600;color:var(--accent-green);margin-bottom:10px;">✅ Password Reset Successful</div>' +
      '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">New password:</div>' +
      '<div style="font-family:JetBrains Mono,monospace;font-size:18px;font-weight:700;color:var(--text-primary);background:var(--bg-input);padding:12px 20px;border-radius:6px;border:1px solid var(--border);letter-spacing:1px;user-select:all;cursor:text;">' +
      esc(generatedPass) +
      "</div>" +
      '<div style="font-size:11px;color:var(--accent-yellow);margin-top:10px;">⚠️ Copy this password now — it cannot be viewed again</div>' +
      '<button class="btn btn-sm" style="margin-top:10px;background:var(--accent-blue);color:#fff;" onclick="copyToClipboard(\'' +
      esc(generatedPass) +
      "')\">📋 Copy to Clipboard</button>" +
      "</div>";
    resultEl.style.display = "block";
    showToast("success", "Password reset for user #" + userId);
  }
}

function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(function () {
      showToast("success", "Password copied to clipboard!");
    })
    .catch(function () {
      // Fallback
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("success", "Password copied!");
    });
}

function showAddUserModal() {
  clearForm("userModal");
  document.getElementById("newUserWorkerFields").style.display = "none";
  document.getElementById("newUserConsumerFields").style.display = "none";
  showModal("userModal");
}

function onUserRoleChange() {
  var role = document.getElementById("nuRole").value;
  document.getElementById("newUserWorkerFields").style.display =
    role === "worker" ? "block" : "none";
  document.getElementById("newUserConsumerFields").style.display =
    role === "consumer" ? "block" : "none";
}

async function submitNewUser() {
  var fullName = document.getElementById("nuFullName").value.trim();
  var username = document.getElementById("nuUsername").value.trim();
  var password = document.getElementById("nuPassword").value;
  var roleKey = document.getElementById("nuRole").value;
  var email = document.getElementById("nuEmail").value.trim();
  var phone = document.getElementById("nuPhone").value.trim();

  if (!fullName || !username || !password || !roleKey) {
    showToast("error", "Please fill in all required fields");
    return;
  }
  if (password.length < 8) {
    showToast("error", "Password must be at least 8 characters");
    return;
  }
  if (
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    showToast(
      "error",
      "Password must include uppercase, lowercase, and a number",
    );
    return;
  }

  var body = {
    fullName,
    username,
    password,
    roleKey,
    email: email || null,
    phone: phone || null,
  };

  // Add worker-specific fields
  if (roleKey === "worker") {
    body.team = document.getElementById("nuTeam").value || "Crew Alpha";
    body.specialty =
      document.getElementById("nuSpecialty").value || "General Maintenance";
  }

  // Add consumer-specific fields
  if (roleKey === "consumer") {
    body.lastName =
      document.getElementById("nuLastName").value.trim() || fullName;
    body.firstName = document.getElementById("nuFirstName").value.trim() || "";
    body.account = document.getElementById("nuAccount").value.trim() || "";
    body.meter = document.getElementById("nuMeterNo").value.trim() || "";
    body.address = document.getElementById("nuAddress").value.trim() || "";
    body.municipality = document.getElementById("nuMuni")
      ? document.getElementById("nuMuni").value.trim()
      : "";
    body.connType =
      document.getElementById("nuConnType").value || "Residential";
    body.latitude = document.getElementById("nuLat")
      ? parseFloat(document.getElementById("nuLat").value) || null
      : null;
    body.longitude = document.getElementById("nuLng")
      ? parseFloat(document.getElementById("nuLng").value) || null
      : null;
    if (!body.account || !body.meter) {
      showToast(
        "error",
        "Account number and meter number are required for consumers",
      );
      return;
    }
  }

  const data = await api("create_user", "POST", body);
  if (data && data.success) {
    hideModal("userModal");
    clearForm("userModal");
    showToast("success", 'User "' + username + '" created successfully!');
    await renderUsers();
    await renderDashboard();
    // If consumer was created, also refresh members list
    if (roleKey === "consumer") {
      await renderMembers();
    }
    // If worker was created, also refresh workers list
    if (roleKey === "worker") {
      await renderWorkers();
    }
  }
}

// ===== BULK IMPORT CONSUMERS =====
var _bulkConsumerData = [];

function onBulkConsumerFileSelected(input) {
  var file = input.files[0];
  if (!file) return;
  document.getElementById("bulkConsumerFileName").textContent = file.name;
  document.getElementById("bulkConsumerPreview").style.display = "none";
  document.getElementById("bulkConsumerResult").style.display = "none";
  document.getElementById("btnBulkConsumerImport").disabled = true;
  _bulkConsumerData = [];

  var ext = file.name.split(".").pop().toLowerCase();

  if (ext === "csv") {
    var reader = new FileReader();
    reader.onload = function (e) {
      var rows = parseCSV(e.target.result);
      processBulkConsumerRows(rows);
    };
    reader.readAsText(file);
  } else {
    loadSheetJS(function () {
      var reader = new FileReader();
      reader.onload = function (e) {
        var data = new Uint8Array(e.target.result);
        var workbook = XLSX.read(data, { type: "array" });
        var firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        var rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
        processBulkConsumerRows(rows);
      };
      reader.readAsArrayBuffer(file);
    });
  }
}

function processBulkConsumerRows(rows) {
  if (!rows || !rows.length) {
    showToast("error", "No data found in file");
    return;
  }

  var keys = Object.keys(rows[0]).map(function (k) {
    return k.toLowerCase().trim();
  });

  function findCol(aliases) {
    for (var i = 0; i < aliases.length; i++) {
      var idx = keys.indexOf(aliases[i]);
      if (idx >= 0) return Object.keys(rows[0])[idx];
    }
    return null;
  }

  var colLast = findCol(["last_name", "lastname", "surname", "last name"]);
  var colFirst = findCol([
    "first_name",
    "firstname",
    "first name",
    "given_name",
  ]);
  var colAccount = findCol([
    "account_no",
    "account",
    "account_number",
    "acct_no",
    "acct",
  ]);
  var colMeter = findCol(["meter_no", "meter", "meter_number", "mtr_no"]);
  var colAddress = findCol([
    "address",
    "address_brgy",
    "brgy",
    "barangay",
    "street",
  ]);
  var colMuni = findCol([
    "municipality",
    "city",
    "address_muni",
    "muni",
    "town",
  ]);
  var colPhone = findCol([
    "phone",
    "contact",
    "mobile",
    "phone_number",
    "contact_no",
  ]);
  var colEmail = findCol(["email", "email_address", "e-mail"]);
  var colConn = findCol(["connection_type", "connection", "conn_type", "type"]);
  var colLat = findCol(["latitude", "lat"]);
  var colLng = findCol(["longitude", "lng", "long"]);

  if (!colLast || !colFirst) {
    showToast("error", "Could not find last_name and first_name columns");
    return;
  }
  if (!colAccount || !colMeter) {
    showToast("error", "Could not find account_no and meter_no columns");
    return;
  }

  _bulkConsumerData = [];
  var previewHtml = "";

  rows.forEach(function (row, i) {
    var lastName = String(row[colLast] || "").trim();
    var firstName = String(row[colFirst] || "").trim();
    var account = String(row[colAccount] || "").trim();
    var meter = String(row[colMeter] || "").trim();
    var address = colAddress ? String(row[colAddress] || "").trim() : "";
    var municipality = colMuni ? String(row[colMuni] || "").trim() : "";
    var phone = colPhone ? String(row[colPhone] || "").trim() : "";
    var email = colEmail ? String(row[colEmail] || "").trim() : "";
    var connType = colConn ? String(row[colConn] || "").trim() : "Residential";
    var lat = colLat ? row[colLat] : null;
    var lng = colLng ? row[colLng] : null;

    var valid = lastName && firstName && account && meter;
    var statusHtml = valid
      ? '<span style="color:var(--accent-green);">✓ Ready</span>'
      : '<span style="color:var(--accent-red);">✕ Missing fields</span>';

    _bulkConsumerData.push({
      lastName: lastName,
      firstName: firstName,
      account: account,
      meter: meter,
      address: address,
      municipality: municipality,
      phone: phone,
      email: email,
      connType: connType || "Residential",
      latitude: lat,
      longitude: lng,
      valid: valid,
    });

    if (i < 50) {
      previewHtml +=
        "<tr><td>" +
        (i + 1) +
        "</td><td>" +
        esc(lastName) +
        "</td><td>" +
        esc(firstName) +
        "</td><td>" +
        esc(account) +
        "</td><td>" +
        esc(meter) +
        "</td><td>" +
        esc(address) +
        "</td><td>" +
        esc(municipality) +
        "</td><td>" +
        statusHtml +
        "</td></tr>";
    }
  });

  var validCount = _bulkConsumerData.filter(function (c) {
    return c.valid;
  }).length;

  document.getElementById("bulkConsumerPreviewBody").innerHTML = previewHtml;
  document.getElementById("bulkConsumerPreviewCount").textContent =
    validCount +
    " of " +
    _bulkConsumerData.length +
    " ready to import" +
    (_bulkConsumerData.length > 50 ? " (showing first 50)" : "");
  document.getElementById("bulkConsumerPreview").style.display = "block";
  document.getElementById("btnBulkConsumerImport").disabled = validCount === 0;
}

async function executeBulkConsumerImport() {
  var validConsumers = _bulkConsumerData.filter(function (c) {
    return c.valid;
  });

  if (!validConsumers.length) {
    showToast("error", "No valid consumers to import");
    return;
  }

  var btn = document.getElementById("btnBulkConsumerImport");
  btn.disabled = true;
  btn.textContent = "⏳ Importing " + validConsumers.length + " consumers...";

  var data = await api("bulk_create_consumers", "POST", {
    consumers: validConsumers,
  });

  if (data && data.success) {
    var resultHtml =
      '<div style="padding:14px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:8px;">' +
      '<div style="font-size:14px;font-weight:600;color:var(--accent-green);margin-bottom:8px;">✅ Import Complete</div>' +
      '<div style="font-size:13px;color:var(--text-muted);line-height:1.8;">' +
      "Created: <strong style='color:var(--accent-green);'>" +
      data.created +
      "</strong> consumer accounts<br>" +
      "Skipped: <strong style='color:var(--accent-yellow);'>" +
      data.skipped +
      "</strong> (duplicates or errors)" +
      "</div>";

    if (data.errors && data.errors.length) {
      resultHtml +=
        '<div style="margin-top:10px;font-size:11px;color:var(--accent-red);max-height:120px;overflow-y:auto;">' +
        data.errors.join("<br>") +
        "</div>";
    }

    resultHtml +=
      '<div style="margin-top:10px;font-size:11px;color:var(--text-muted);">💡 Each account uses the account number as the username. Default password is auto-generated (user will be asked to change it on first login).</div>' +
      "</div>";

    document.getElementById("bulkConsumerResult").innerHTML = resultHtml;
    document.getElementById("bulkConsumerResult").style.display = "block";

    btn.textContent = "✅ Done!";
    btn.disabled = false;
    btn.onclick = function () {
      hideModal("bulkConsumerModal");
    };
    showToast("success", data.created + " consumers imported successfully!");

    // Refresh data
    await renderUsers();
    await renderMembers();
    await renderDashboard();
  } else {
    btn.disabled = false;
    btn.textContent = "📥 Import Consumers";
  }
}

function resetBulkConsumerModal() {
  _bulkConsumerData = [];
  var fileInput = document.getElementById("bulkConsumerFileInput");
  if (fileInput) fileInput.value = "";
  var fileName = document.getElementById("bulkConsumerFileName");
  if (fileName) fileName.textContent = "Click to select file";
  var preview = document.getElementById("bulkConsumerPreview");
  if (preview) preview.style.display = "none";
  var previewBody = document.getElementById("bulkConsumerPreviewBody");
  if (previewBody) previewBody.innerHTML = "";
  var result = document.getElementById("bulkConsumerResult");
  if (result) {
    result.style.display = "none";
    result.innerHTML = "";
  }
  var btn = document.getElementById("btnBulkConsumerImport");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "📥 Import Consumers";
    btn.onclick = function () {
      executeBulkConsumerImport();
    };
  }
}

// ===== WORKER DECLINE SR =====
function showDeclineSR(id) {
  document.getElementById("detailModalTitle").textContent =
    "❌ Cannot Service: " + id;
  document.getElementById("detailModalBody").innerHTML =
    '<div style="text-align:center;padding:10px 0;">' +
    '<div style="font-size:36px;margin-bottom:12px;">🚫</div>' +
    '<div style="font-size:14px;font-weight:600;margin-bottom:16px;">Why can\'t you service this request?</div>' +
    "</div>" +
    '<div class="form-group"><label class="form-label">Reason (required) *</label>' +
    '<textarea class="form-input" id="declineReasonText" rows="4" placeholder="e.g. Area is inaccessible due to flooding, equipment not available, outside service area..." style="resize:vertical;"></textarea>' +
    "</div>" +
    '<div style="padding:10px 14px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:6px;font-size:12px;color:var(--accent-yellow);margin-top:12px;">' +
    "⚠️ The consumer will be able to see this reason. The request will be unassigned and sent back for reassignment." +
    "</div>";
  document.getElementById("detailModalFooter").innerHTML =
    '<button class="btn btn-danger btn-sm" onclick="submitDeclineSR(\'' +
    id +
    "')\">Confirm Decline</button>" +
    '<button class="btn btn-ghost btn-sm" onclick="hideModal(\'detailModal\')">Cancel</button>';
  showModal("detailModal");
}

async function submitDeclineSR(id) {
  var reason = document.getElementById("declineReasonText").value.trim();
  if (!reason) {
    showToast("error", "Please provide a reason for declining");
    return;
  }
  const data = await api("decline_sr", "POST", { id, reason });
  if (data && data.success) {
    hideModal("detailModal");
    showToast("info", id + " declined and unassigned");
    renderWorkerDashboard();
    renderWorkerAssignments();
  }
}

// ===== UTILITIES =====
function computeReconTotal() {
  var t = ["roBills", "roSurcharge", "roReconFee", "roSeal", "roOthers"].reduce(
    (s, id) => s + (parseFloat(document.getElementById(id).value) || 0),
    0,
  );
  document.getElementById("roTotal").value = t.toFixed(2);
}

// ===== FORCED PASSWORD CHANGE =====
function showForcePasswordChange() {
  document.getElementById("detailModalTitle").textContent =
    "🔒 Password Change Required";
  document.getElementById("detailModalBody").innerHTML =
    '<div style="text-align:center;padding:10px 0 16px;">' +
    '<div style="font-size:36px;margin-bottom:8px;">🔐</div>' +
    '<div style="font-size:14px;font-weight:600;margin-bottom:4px;">You must change your password</div>' +
    '<div style="font-size:12px;color:var(--text-muted);margin-bottom:20px;">Your account is using a default password. Please set a new secure password to continue.</div>' +
    "</div>" +
    '<div class="form-group"><label class="form-label">Current Password</label>' +
    '<input type="password" class="form-input" id="cpCurrent" placeholder="Enter your current password"></div>' +
    '<div class="form-group"><label class="form-label">New Password</label>' +
    '<input type="password" class="form-input" id="cpNew" placeholder="Min 8 chars, uppercase, lowercase, number" oninput="checkPasswordStrength(this.value)"></div>' +
    '<div id="cpStrength" style="margin-top:-8px;margin-bottom:12px;"></div>' +
    '<div class="form-group"><label class="form-label">Confirm New Password</label>' +
    '<input type="password" class="form-input" id="cpConfirm" placeholder="Re-enter new password"></div>' +
    '<div id="cpError" style="display:none;padding:10px 14px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:6px;font-size:12px;color:var(--accent-red);margin-top:8px;"></div>';
  document.getElementById("detailModalFooter").innerHTML =
    '<button class="btn btn-success btn-sm" onclick="submitPasswordChange()">🔒 Change Password</button>';
  showModal("detailModal");
}

function checkPasswordStrength(pw) {
  var el = document.getElementById("cpStrength");
  if (!el) return;
  var score = 0,
    checks = [];
  if (pw.length >= 8) score++;
  else checks.push("8+ characters");
  if (/[A-Z]/.test(pw)) score++;
  else checks.push("uppercase");
  if (/[a-z]/.test(pw)) score++;
  else checks.push("lowercase");
  if (/[0-9]/.test(pw)) score++;
  else checks.push("number");
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  var colors = ["#EF4444", "#F97316", "#F59E0B", "#22C55E", "#10B981"];
  var labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  var idx = Math.min(score, 4);
  var barWidth = (score / 5) * 100 + "%";

  el.innerHTML =
    '<div style="display:flex;align-items:center;gap:8px;font-size:11px;">' +
    '<div style="flex:1;height:4px;background:var(--bg-input);border-radius:2px;overflow:hidden;">' +
    '<div style="width:' +
    barWidth +
    ";height:100%;background:" +
    colors[idx] +
    ';transition:all 0.3s;border-radius:2px;"></div>' +
    "</div>" +
    '<span style="color:' +
    colors[idx] +
    ';font-weight:600;">' +
    labels[idx] +
    "</span>" +
    "</div>" +
    (checks.length
      ? '<div style="font-size:10px;color:var(--text-muted);margin-top:4px;">Missing: ' +
        checks.join(", ") +
        "</div>"
      : "");
}

async function submitPasswordChange() {
  var current = document.getElementById("cpCurrent").value;
  var newPw = document.getElementById("cpNew").value;
  var confirm = document.getElementById("cpConfirm").value;
  var errEl = document.getElementById("cpError");

  if (!current || !newPw || !confirm) {
    errEl.textContent = "Please fill in all fields";
    errEl.style.display = "block";
    return;
  }
  if (newPw !== confirm) {
    errEl.textContent = "New passwords do not match";
    errEl.style.display = "block";
    return;
  }
  if (
    newPw.length < 8 ||
    !/[A-Z]/.test(newPw) ||
    !/[a-z]/.test(newPw) ||
    !/[0-9]/.test(newPw)
  ) {
    errEl.textContent =
      "Password must be at least 8 characters with uppercase, lowercase, and a number";
    errEl.style.display = "block";
    return;
  }
  if (current === newPw) {
    errEl.textContent = "New password must be different from current password";
    errEl.style.display = "block";
    return;
  }

  errEl.style.display = "none";
  const data = await api("change_password", "POST", {
    currentPassword: current,
    newPassword: newPw,
  });
  if (data && data.success) {
    hideModal("detailModal");
    showToast("success", "Password changed successfully!");
  }
}
function showModal(id) {
  document.getElementById(id).classList.add("active");
}
function hideModal(id) {
  document.getElementById(id).classList.remove("active");
  // Reset bulk consumer modal when closed
  if (id === "bulkConsumerModal") {
    resetBulkConsumerModal();
  }
}
function clearForm(mid) {
  var m = document.getElementById(mid);
  if (m) {
    m.querySelectorAll(
      "input:not([type=button]):not([type=submit]),textarea,select",
    ).forEach((el) => {
      if (el.type === "checkbox") el.checked = false;
      else if (el.type !== "hidden") el.value = "";
    });
  }
}
function showToast(type, msg) {
  var c = document.getElementById("toastContainer");
  if (!c) return;
  var icon =
    type === "success"
      ? "✅"
      : type === "error"
        ? "❌"
        : type === "info"
          ? "ℹ️"
          : "⚠️";
  var t = document.createElement("div");
  t.className = "toast toast-" + type;
  t.innerHTML = "<span>" + icon + "</span> " + msg;
  c.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 300);
  }, 3500);
}
function handleFileUpload(input, listId) {
  var list = document.getElementById(listId);
  if (!list) return;
  Array.from(input.files).forEach((f) => {
    var d = document.createElement("div");
    d.className = "file-item";
    d.innerHTML =
      "<span>📄 " +
      f.name +
      '</span><span style="color:var(--text-muted);font-size:11px;">' +
      (f.size / 1024).toFixed(0) +
      " KB</span>";
    list.appendChild(d);
  });
}
function filterTable(tableId, value, colIdx) {
  var table = document.getElementById(tableId);
  if (!table) return;
  Array.from(table.querySelectorAll("tbody tr")).forEach((row) => {
    if (!value) {
      row.style.display = "";
      return;
    }
    var cell = row.cells[colIdx];
    row.style.display =
      cell && cell.textContent.indexOf(value) !== -1 ? "" : "none";
  });
}
function searchTable(tableId, q) {
  var table = document.getElementById(tableId);
  if (!table) return;
  q = q.toLowerCase();
  Array.from(table.querySelectorAll("tbody tr")).forEach((row) => {
    row.style.display =
      row.textContent.toLowerCase().indexOf(q) !== -1 ? "" : "none";
  });
}
function handleGlobalSearch(q) {
  /* searches across visible table */
}
function checkResponsive() {
  var w = window.innerWidth;
  var btn = document.getElementById("menuBtn");
  if (btn) btn.style.display = "block";
}

// ===== GIS / LEAFLET MAP INTEGRATION =====

// --- Generic Map Pin Picker (used by both memberModal and userModal) ---
// prefix = 'mem' for member registration, 'nu' for new user consumer
var pickerMaps = {}; // { mem: L.Map, nu: L.Map }
var pickerMarkers = {}; // { mem: L.Marker, nu: L.Marker }

function initMapPicker(prefix) {
  var containerId = prefix + "MapPicker";
  var container = document.getElementById(containerId);
  if (!container || pickerMaps[prefix]) return;

  // Default center: Borongan, Eastern Samar
  pickerMaps[prefix] = L.map(containerId, {
    center: [11.6086, 125.4362],
    zoom: 15,
    zoomControl: true,
    attributionControl: false,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(pickerMaps[prefix]);

  L.control
    .attribution({ position: "bottomright", prefix: false })
    .addTo(pickerMaps[prefix])
    .addAttribution(
      '© <a href="https://openstreetmap.org" target="_blank">OSM</a>',
    );

  // Click to place marker
  pickerMaps[prefix].on("click", function (e) {
    var lat = e.latlng.lat.toFixed(8);
    var lng = e.latlng.lng.toFixed(8);
    document.getElementById(prefix + "Lat").value = lat;
    document.getElementById(prefix + "Lng").value = lng;

    // Hide hint
    var hint = document.getElementById(prefix + "MapHint");
    if (hint) hint.style.display = "none";

    // Place or move marker
    if (pickerMarkers[prefix]) {
      pickerMarkers[prefix].setLatLng(e.latlng);
    } else {
      pickerMarkers[prefix] = L.marker(e.latlng, {
        draggable: true,
        icon: L.divIcon({
          className: "map-pin-icon",
          html: '<div style="background:#EF4444;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;background:#fff;border-radius:50%;transform:rotate(45deg);"></div></div>',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        }),
      }).addTo(pickerMaps[prefix]);

      // Update coords on drag
      pickerMarkers[prefix].on("dragend", function (ev) {
        var pos = ev.target.getLatLng();
        document.getElementById(prefix + "Lat").value = pos.lat.toFixed(8);
        document.getElementById(prefix + "Lng").value = pos.lng.toFixed(8);
      });
    }
  });

  // Fix tile rendering after modal opens
  setTimeout(function () {
    pickerMaps[prefix].invalidateSize();
  }, 300);
}

function clearMapPin(prefix) {
  if (pickerMarkers[prefix] && pickerMaps[prefix]) {
    pickerMaps[prefix].removeLayer(pickerMarkers[prefix]);
    pickerMarkers[prefix] = null;
  }
  var latEl = document.getElementById(prefix + "Lat");
  var lngEl = document.getElementById(prefix + "Lng");
  if (latEl) latEl.value = "";
  if (lngEl) lngEl.value = "";
  var hint = document.getElementById(prefix + "MapHint");
  if (hint) hint.style.display = "block";
}

function destroyMapPicker(prefix) {
  if (pickerMaps[prefix]) {
    pickerMaps[prefix].remove();
    pickerMaps[prefix] = null;
    pickerMarkers[prefix] = null;
  }
}

// Hook into showModal to init map when modals open
var _origShowModal = showModal;
showModal = function (id) {
  _origShowModal(id);
  if (id === "memberModal") {
    setTimeout(function () {
      initMapPicker("mem");
    }, 200);
  }
  // For userModal, map is initialized when consumer role is selected (see onUserRoleChange)
};

// Hook into hideModal to cleanup maps
var _origHideModal = hideModal;
hideModal = function (id) {
  _origHideModal(id);
  if (id === "memberModal") {
    destroyMapPicker("mem");
  }
  if (id === "userModal") {
    destroyMapPicker("nu");
  }
};

// Hook into onUserRoleChange to init/destroy nu map when consumer role is toggled
var _origOnUserRoleChange = onUserRoleChange;
onUserRoleChange = function () {
  _origOnUserRoleChange();
  var role = document.getElementById("nuRole").value;
  if (role === "consumer") {
    // Small delay so the consumer fields div becomes visible first
    setTimeout(function () {
      initMapPicker("nu");
    }, 300);
  } else {
    destroyMapPicker("nu");
  }
};

// --- Import Coordinates from Excel/CSV ---
var pendingCoords = []; // [{account, lat, lng}, ...]

function onCoordsFileSelected(input) {
  var file = input.files[0];
  if (!file) return;
  document.getElementById("coordsFileName").textContent = "📄 " + file.name;
  document.getElementById("coordsPreview").style.display = "none";
  document.getElementById("coordsResult").style.display = "none";
  document.getElementById("btnImportCoords").disabled = true;
  pendingCoords = [];

  var ext = file.name.split(".").pop().toLowerCase();

  if (ext === "csv") {
    // Read CSV
    var reader = new FileReader();
    reader.onload = function (e) {
      var rows = parseCSV(e.target.result);
      processCoordsRows(rows);
    };
    reader.readAsText(file);
  } else if (ext === "xlsx" || ext === "xls") {
    // Read Excel using SheetJS
    loadSheetJS(function () {
      var reader = new FileReader();
      reader.onload = function (e) {
        var data = new Uint8Array(e.target.result);
        var workbook = XLSX.read(data, { type: "array" });
        var firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        var rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
        processCoordsRows(rows);
      };
      reader.readAsArrayBuffer(file);
    });
  } else {
    showToast("error", "Please upload .xlsx or .csv file");
  }
}

function loadSheetJS(callback) {
  if (window.XLSX) {
    callback();
    return;
  }
  var script = document.createElement("script");
  script.src =
    "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
  script.onload = callback;
  script.onerror = function () {
    showToast(
      "error",
      "Failed to load Excel parser. Check internet connection.",
    );
  };
  document.head.appendChild(script);
}

function parseCSV(text) {
  var lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  var headers = lines[0].split(",").map(function (h) {
    return h
      .trim()
      .replace(/^["']|["']$/g, "")
      .toLowerCase();
  });
  var rows = [];
  for (var i = 1; i < lines.length; i++) {
    var vals = lines[i].split(",").map(function (v) {
      return v.trim().replace(/^["']|["']$/g, "");
    });
    var obj = {};
    headers.forEach(function (h, idx) {
      obj[h] = vals[idx] || "";
    });
    rows.push(obj);
  }
  return rows;
}

function processCoordsRows(rows) {
  if (!rows || !rows.length) {
    showToast("error", "No data found in file");
    return;
  }

  // Find column names (flexible matching)
  var sampleKeys = Object.keys(rows[0]).map(function (k) {
    return k.toLowerCase().trim();
  });
  var acctCol = findColumn(sampleKeys, [
    "account_no",
    "account",
    "acct",
    "account number",
    "accountno",
    "acct_no",
  ]);
  var latCol = findColumn(sampleKeys, ["latitude", "lat"]);
  var lngCol = findColumn(sampleKeys, ["longitude", "lng", "lon", "long"]);

  if (!acctCol) {
    showToast(
      "error",
      'Column "account_no" not found. Found: ' + sampleKeys.join(", "),
    );
    return;
  }
  if (!latCol) {
    showToast(
      "error",
      'Column "latitude" not found. Found: ' + sampleKeys.join(", "),
    );
    return;
  }
  if (!lngCol) {
    showToast(
      "error",
      'Column "longitude" not found. Found: ' + sampleKeys.join(", "),
    );
    return;
  }

  // Map actual original key names
  var origKeys = Object.keys(rows[0]);
  var acctKey = origKeys.find(function (k) {
    return k.toLowerCase().trim() === acctCol;
  });
  var latKey = origKeys.find(function (k) {
    return k.toLowerCase().trim() === latCol;
  });
  var lngKey = origKeys.find(function (k) {
    return k.toLowerCase().trim() === lngCol;
  });

  pendingCoords = [];
  var tbody = document.getElementById("coordsPreviewBody");
  tbody.innerHTML = "";
  var validCount = 0;

  rows.forEach(function (row) {
    var account = String(row[acctKey] || "").trim();
    var lat = parseFloat(row[latKey]);
    var lng = parseFloat(row[lngKey]);

    if (!account) return;

    var isValid =
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180;
    var statusHtml = isValid
      ? '<span style="color:var(--accent-green);font-size:11px;">✅ Valid</span>'
      : '<span style="color:var(--accent-red);font-size:11px;">❌ Invalid coords</span>';

    if (isValid) {
      pendingCoords.push({ account: account, latitude: lat, longitude: lng });
      validCount++;
    }

    tbody.innerHTML +=
      '<tr><td style="font-family:JetBrains Mono,monospace;font-size:11px;">' +
      account +
      "</td><td>" +
      (isNaN(lat) ? "—" : lat.toFixed(6)) +
      "</td><td>" +
      (isNaN(lng) ? "—" : lng.toFixed(6)) +
      "</td><td>" +
      statusHtml +
      "</td></tr>";
  });

  document.getElementById("coordsPreviewCount").textContent =
    validCount + " valid of " + rows.length + " rows";
  document.getElementById("coordsPreview").style.display = "block";
  document.getElementById("btnImportCoords").disabled = validCount === 0;
}

function findColumn(keys, aliases) {
  for (var i = 0; i < aliases.length; i++) {
    var match = keys.find(function (k) {
      return k === aliases[i];
    });
    if (match) return match;
  }
  return null;
}

async function executeImportCoords() {
  if (!pendingCoords.length) {
    showToast("error", "No valid coordinates to import");
    return;
  }

  document.getElementById("btnImportCoords").disabled = true;
  document.getElementById("btnImportCoords").textContent = "⏳ Importing...";

  var data = await api("import_coordinates", "POST", {
    coordinates: pendingCoords,
  });

  document.getElementById("btnImportCoords").textContent =
    "📍 Import Coordinates";

  if (data && data.success) {
    var resultHtml =
      '<div style="padding:14px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:8px;">' +
      '<div style="font-size:14px;font-weight:600;color:var(--accent-green);margin-bottom:8px;">✅ Import Complete</div>' +
      '<div style="font-size:12px;color:var(--text-muted);line-height:1.8;">' +
      'Updated: <strong style="color:var(--accent-green);">' +
      (data.updated || 0) +
      "</strong> members<br>" +
      'Not found: <strong style="color:var(--accent-yellow);">' +
      (data.not_found || 0) +
      "</strong> accounts" +
      (data.not_found_list && data.not_found_list.length
        ? '<br><span style="font-size:11px;color:var(--text-muted);">Missing: ' +
          data.not_found_list.join(", ") +
          "</span>"
        : "") +
      "</div></div>";
    document.getElementById("coordsResult").innerHTML = resultHtml;
    document.getElementById("coordsResult").style.display = "block";
    showToast("success", data.updated + " member coordinates updated!");
    renderMembers();
  } else {
    document.getElementById("btnImportCoords").disabled = false;
  }
}

// --- Worker Portal: Mini Maps on Job Cards ---
var miniMaps = {};

function initMiniMap(mapId, lat, lng) {
  var container = document.getElementById(mapId);
  if (!container || miniMaps[mapId]) return;

  var map = L.map(mapId, {
    center: [lat, lng],
    zoom: 17,
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    touchZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(map);

  // Add marker
  L.marker([lat, lng], {
    icon: L.divIcon({
      className: "map-pin-icon",
      html: '<div style="background:#EF4444;width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;"><div style="width:6px;height:6px;background:#fff;border-radius:50%;transform:rotate(45deg);"></div></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    }),
  }).addTo(map);

  miniMaps[mapId] = map;

  // Fix rendering
  setTimeout(function () {
    map.invalidateSize();
  }, 200);
}

// Cleanup mini maps when pages re-render
function destroyAllMiniMaps() {
  Object.keys(miniMaps).forEach(function (key) {
    if (miniMaps[key]) {
      miniMaps[key].remove();
      delete miniMaps[key];
    }
  });
}

// Expanded location modal
function openJobLocationModal(jobId, lat, lng, consumer, landmark, location) {
  document.getElementById("detailModalTitle").textContent =
    "📍 Location: " + jobId;
  document.getElementById("detailModalBody").innerHTML =
    '<div style="margin-bottom:12px;">' +
    '<div style="font-size:15px;font-weight:600;margin-bottom:4px;">' +
    consumer +
    "</div>" +
    (location
      ? '<div style="font-size:12px;color:var(--text-muted);margin-bottom:2px;">🏠 ' +
        location +
        "</div>"
      : "") +
    (landmark
      ? '<div style="font-size:12px;color:var(--text-muted);">📍 ' +
        landmark +
        "</div>"
      : "") +
    "</div>" +
    '<div id="expandedJobMap" style="height:400px;width:100%;border-radius:8px;overflow:hidden;border:1px solid var(--border);"></div>' +
    '<div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;">' +
    '<div style="font-size:11px;color:var(--text-muted);font-family:JetBrains Mono,monospace;">' +
    lat.toFixed(6) +
    ", " +
    lng.toFixed(6) +
    "</div>" +
    '<a href="https://www.google.com/maps?q=' +
    lat +
    "," +
    lng +
    '" target="_blank" class="btn btn-sm" style="background:#06B6D4;color:#fff;text-decoration:none;">🧭 Open in Google Maps</a>' +
    "</div>";
  document.getElementById("detailModalFooter").innerHTML =
    '<button class="btn btn-ghost btn-sm" onclick="hideExpandedMap();hideModal(\'detailModal\')">Close</button>';
  showModal("detailModal");

  // Init expanded map after modal is visible
  setTimeout(function () {
    var map = L.map("expandedJobMap", {
      center: [lat, lng],
      zoom: 18,
      zoomControl: true,
      attributionControl: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);
    L.control
      .attribution({ position: "bottomright", prefix: false })
      .addTo(map)
      .addAttribution(
        '© <a href="https://openstreetmap.org" target="_blank">OSM</a>',
      );

    L.marker([lat, lng], {
      icon: L.divIcon({
        className: "map-pin-icon",
        html: '<div style="background:#EF4444;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;background:#fff;border-radius:50%;transform:rotate(45deg);"></div></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      }),
    })
      .addTo(map)
      .bindPopup(
        "<b>" + consumer + "</b>" + (landmark ? "<br>📍 " + landmark : ""),
      )
      .openPopup();

    window._expandedJobMap = map;
    setTimeout(function () {
      map.invalidateSize();
    }, 200);
  }, 300);
}

function hideExpandedMap() {
  if (window._expandedJobMap) {
    window._expandedJobMap.remove();
    window._expandedJobMap = null;
  }
}

// --- Worker Portal: Job Map ---
var workerMap = null;
var workerMapMarkers = [];

async function renderWorkerMap() {
  var mapContainer = document.getElementById("workerJobMap");
  var loadingEl = document.getElementById("wMapLoading");
  if (!mapContainer) return;

  // Fetch job data
  const [srs, ros] = await Promise.all([
    api("service_requests"),
    api("reconnections"),
  ]);
  var jobs = [];

  // Collect active service requests with coordinates
  (srs || [])
    .filter(function (s) {
      return s.status !== "Completed" && s.status !== "Declined";
    })
    .forEach(function (s) {
      if (s.latitude && s.longitude) {
        jobs.push({
          id: s.id,
          type: "Service Request",
          typeShort: "SR",
          detail: s.nature,
          consumer: s.consumer,
          landmark: s.landmark || "",
          location: s.location || "",
          status: s.status,
          lat: parseFloat(s.latitude),
          lng: parseFloat(s.longitude),
          date: s.filed,
        });
      }
    });

  // Collect active reconnections with coordinates
  (ros || [])
    .filter(function (r) {
      return r.status !== "Completed" && r.status !== "Rejected";
    })
    .forEach(function (r) {
      if (r.latitude && r.longitude) {
        jobs.push({
          id: r.id,
          type: "Reconnection",
          typeShort: "RO",
          detail: "₱" + parseFloat(r.total).toFixed(2),
          consumer: r.consumer,
          landmark: r.landmark || "",
          location: r.location || "",
          status: r.status,
          lat: parseFloat(r.latitude),
          lng: parseFloat(r.longitude),
          date: r.date,
        });
      }
    });

  // Update count
  document.getElementById("wMapJobCount").textContent =
    jobs.length + " location" + (jobs.length !== 1 ? "s" : "");

  // Initialize or reset map
  if (workerMap) {
    workerMap.remove();
    workerMap = null;
  }
  workerMapMarkers = [];

  // Default center: Borongan, Eastern Samar
  var defaultCenter = [11.6086, 125.4362];
  var defaultZoom = 14;

  workerMap = L.map("workerJobMap", {
    center: defaultCenter,
    zoom: defaultZoom,
    zoomControl: true,
    attributionControl: false,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(workerMap);

  L.control
    .attribution({ position: "bottomright", prefix: false })
    .addTo(workerMap)
    .addAttribution(
      '© <a href="https://openstreetmap.org" target="_blank">OSM</a>',
    );

  // Hide loading
  if (loadingEl) loadingEl.style.display = "none";

  // Remove old empty overlay if any
  var oldEmpty = document.getElementById("wMapEmpty");
  if (oldEmpty) oldEmpty.remove();

  if (jobs.length === 0) {
    var emptyOverlay = document.createElement("div");
    emptyOverlay.id = "wMapEmpty";
    emptyOverlay.style.cssText =
      "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;z-index:500;background:var(--bg-card);padding:24px 32px;border-radius:12px;border:1px solid var(--border);box-shadow:0 4px 16px rgba(0,0,0,0.15);";
    emptyOverlay.innerHTML =
      '<div style="font-size:32px;margin-bottom:8px;">📍</div><div style="font-size:14px;font-weight:600;margin-bottom:4px;">No mapped job locations</div><div style="font-size:12px;color:var(--text-muted);">Assigned jobs with pinned locations will appear here</div>';
    mapContainer.appendChild(emptyOverlay);
    document.getElementById("wMapJobList").innerHTML = "";
    setTimeout(function () {
      workerMap.invalidateSize();
    }, 200);
    return;
  }

  // Add markers for each job
  var bounds = L.latLngBounds();
  jobs.forEach(function (job) {
    var isSR = job.typeShort === "SR";
    var markerColor = isSR ? "#F97316" : "#A855F7";
    var statusColor =
      job.status === "New"
        ? "#3B82F6"
        : job.status === "In Progress"
          ? "#22C55E"
          : "#06B6D4";

    var icon = L.divIcon({
      className: "job-map-marker",
      html:
        '<div style="position:relative;">' +
        '<div style="background:' +
        markerColor +
        ';width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">' +
        '<div style="transform:rotate(45deg);font-size:12px;font-weight:700;color:#fff;">' +
        (isSR ? "⚡" : "🔌") +
        "</div>" +
        "</div>" +
        '<div style="position:absolute;top:-6px;right:-8px;background:' +
        statusColor +
        ';width:12px;height:12px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.2);"></div>' +
        "</div>",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -34],
    });

    var popup =
      '<div style="font-family:DM Sans,sans-serif;min-width:200px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
      '<span style="font-family:JetBrains Mono,monospace;font-size:12px;font-weight:600;color:' +
      markerColor +
      ';">' +
      job.id +
      "</span>" +
      '<span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;background:' +
      statusColor +
      ';color:#fff;">' +
      job.status +
      "</span>" +
      "</div>" +
      '<div style="font-size:14px;font-weight:600;margin-bottom:4px;">' +
      job.consumer +
      "</div>" +
      '<div style="font-size:12px;color:#666;margin-bottom:3px;">📋 ' +
      job.detail +
      "</div>" +
      (job.landmark
        ? '<div style="font-size:12px;color:#666;margin-bottom:3px;">📍 ' +
          job.landmark +
          "</div>"
        : "") +
      (job.location
        ? '<div style="font-size:12px;color:#666;margin-bottom:3px;">🏠 ' +
          job.location +
          "</div>"
        : "") +
      '<div style="font-size:11px;color:#999;margin-top:6px;">📅 ' +
      job.date +
      "</div>" +
      "</div>";

    var marker = L.marker([job.lat, job.lng], { icon: icon })
      .addTo(workerMap)
      .bindPopup(popup, { maxWidth: 280 });

    workerMapMarkers.push(marker);
    bounds.extend([job.lat, job.lng]);
  });

  // Fit map to show all markers
  if (jobs.length === 1) {
    workerMap.setView([jobs[0].lat, jobs[0].lng], 17);
  } else {
    workerMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
  }

  // Render job list below map
  var listHtml =
    '<div style="font-size:13px;font-weight:600;margin-bottom:10px;color:var(--text-muted);">📋 Job Locations</div>';
  jobs.forEach(function (job, idx) {
    var isSR = job.typeShort === "SR";
    var typeColor = isSR ? "#F97316" : "#A855F7";
    listHtml +=
      '<div class="job-card" style="cursor:pointer;" onclick="focusJobOnMap(' +
      idx +
      ')">' +
      '<div class="job-card-header">' +
      '<div><span class="job-card-id">' +
      job.id +
      '</span> <span class="job-card-type" style="background:' +
      (isSR ? "var(--accent-orange-dim)" : "var(--accent-purple-dim)") +
      ";color:" +
      typeColor +
      ';margin-left:8px;">' +
      job.type +
      "</span></div>" +
      '<span class="badge badge-' +
      (job.status === "New"
        ? "new"
        : job.status === "In Progress"
          ? "in-progress"
          : "pending") +
      '">' +
      job.status +
      "</span>" +
      "</div>" +
      '<div class="job-card-consumer">' +
      job.consumer +
      "</div>" +
      '<div class="job-card-detail">📋 ' +
      job.detail +
      "</div>" +
      '<div class="job-card-detail">📍 ' +
      (job.landmark || job.location || "No landmark") +
      "</div>" +
      "</div>";
  });
  document.getElementById("wMapJobList").innerHTML = listHtml;

  // Fix tile rendering
  setTimeout(function () {
    workerMap.invalidateSize();
  }, 200);
}

function focusJobOnMap(idx) {
  if (workerMapMarkers[idx] && workerMap) {
    var marker = workerMapMarkers[idx];
    workerMap.setView(marker.getLatLng(), 18, { animate: true });
    marker.openPopup();
    document
      .getElementById("workerJobMap")
      .scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// ===== KEYBOARD SHORTCUT PROTECTION =====
// Prevent common shortcuts that could be used to access admin pages
document.addEventListener("keydown", function (e) {
  // Block Ctrl+Shift+I / F12 (DevTools) in production — optional, remove if debugging
  // if ((e.ctrlKey && e.shiftKey && e.key === 'I') || e.key === 'F12') {
  //   e.preventDefault();
  // }
  // Block any custom keyboard shortcut attempts to navigate
  // e.g., someone binding Ctrl+Shift+A to navigateTo('user-mgmt')
  // The navigateTo function already has access control, so shortcuts won't bypass it
});

// Disable right-click context menu in production (optional — uncomment to enable)
// document.addEventListener('contextmenu', function(e) { e.preventDefault(); });

// Protect global functions from console tampering
// Freeze the navigateTo access control by making it non-writable
(function () {
  try {
    var _safeNavigateTo = navigateTo;
    Object.defineProperty(window, "navigateTo", {
      get: function () {
        return _safeNavigateTo;
      },
      set: function () {
        console.warn("⛔ navigateTo is protected");
      },
      configurable: false,
    });
  } catch (e) {
    // Already defined — skip silently
  }
})();

window.addEventListener("resize", checkResponsive);
window.addEventListener("load", () => {
  checkResponsive();
  init();
});
