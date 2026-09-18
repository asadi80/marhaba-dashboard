// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen";
import { getAccessToken, authFetch, clearAuthData, getUser } from "../utils/auth";
import AdminModal from "../components/AdminModal";

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [users, setUsers] = useState([]);
  const [usersByRole, setUsersByRole] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState(null);

  // ─── Check auth on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCurrentUser();
  }, [navigate]);

  // ─── Fetch data when user and tab change ────────────────────────────────
  useEffect(() => {
    if (currentUser && ["admin", "super_admin"].includes(currentUser.role)) {
      fetchStats();
      fetchUsers();
    }
  }, [currentUser, activeTab]);

  // ─── Fetch current user ──────────────────────────────────────────────────
  const fetchCurrentUser = async () => {
    try {
      const res = await authFetch("https://api.mar-haba.ly/api/v1/auth/me");
      
      if (!res) {
        throw new Error("No response from server");
      }

      const data = await res.json();
      console.log("Current user response:", data);
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch user");
      }

      // ✅ FIX: User is at data.data.user, not data.user
      const user = data.data?.user || data.user;
      
      if (!user) {
        throw new Error("User data not found in response");
      }

      setCurrentUser(user);
      
      // Redirect if not admin
      if (!["admin", "super_admin"].includes(user.role)) {
        navigate("/");
      }
    } catch (error) {
      console.error("Auth error:", error);
      // Clear invalid tokens and redirect to login
      clearAuthData();
      navigate("/login");
    }
  };

  // ─── Fetch stats ──────────────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const res = await authFetch("https://api.mar-haba.ly/api/v1/dashboard/stats");
      
      if (!res) {
        throw new Error("No response from server");
      }

      const data = await res.json();
      console.log("Stats response:", data);
      
      // ✅ FIX: Stats might be at data.data or data.stats
      if (data.success) {
        const statsData = data.data || data.stats;
        setStats(statsData);
      } else {
        throw new Error(data.message || "Failed to fetch stats");
      }
    } catch (error) {
      console.error("Stats fetch error:", error);
      showNotification("Error fetching stats", "error");
    }
  };

  // ─── Fetch users ──────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const roleParam = activeTab !== "all" ? `?role=${activeTab}` : "";
      const res = await authFetch(`https://api.mar-haba.ly/api/v1/dashboard/users${roleParam}`);
      
      if (!res) {
        throw new Error("No response from server");
      }

      const data = await res.json();
      console.log("Users response:", data);
      
      // ✅ FIX: Users might be at data.data or data.users
      if (data.success) {
        const usersData = data.data?.users || data.users || [];
        const usersByRoleData = data.data?.usersByRole || data.usersByRole || {};
        
        setUsers(usersData);
        setUsersByRole(usersByRoleData);
      } else {
        throw new Error(data.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Users fetch error:", error);
      showNotification("Error fetching users", "error");
      setUsers([]);
      setUsersByRole({});
    }
    setLoading(false);
  };

  // ─── Create admin ─────────────────────────────────────────────────────────
const handleCreateAdmin = async (formData) => {
  console.log("========== CREATE ADMIN ==========");
  console.log("FORM DATA:", formData);
  console.log("JSON:", JSON.stringify(formData, null, 2));

  try {
    const res = await authFetch(
      "https://api.mar-haba.ly/api/v1/dashboard/user/createAdmin",
      {
        method: "POST",
        body: JSON.stringify(formData),
      }
    );

    const data = await res.json();

    console.log("CREATE ADMIN STATUS:", res.status);
    console.log("CREATE ADMIN RESPONSE:", data);

    if (data.success) {
      showNotification(
        data.message || "Admin created successfully",
        "success"
      );

      setShowAddModal(false);
      fetchUsers();
      fetchStats();
    } else {
      const validationMessage = data.errors
        ?.map((err) => `${err.field}: ${err.message}`)
        .join(", ");

      throw new Error(
        validationMessage ||
        data.message ||
        "Failed to create admin"
      );
    }
  } catch (error) {
    console.error("Create admin error:", error);
    showNotification(
      error.message || "Error creating admin",
      "error"
    );
  }
};

  // ─── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      // Call logout endpoint if needed
      await authFetch("https://api.mar-haba.ly/api/v1/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local data
      clearAuthData();
      navigate("/login");
    }
  };

  // ─── Notification helper ──────────────────────────────────────────────────
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ─── Helper functions ─────────────────────────────────────────────────────
 const getDisplayUsers = () => {
  return Array.isArray(users) ? users : [];
};

const displayUsers = getDisplayUsers();

  // ─── Constants ─────────────────────────────────────────────────────────────
  const TABS = [
    { id: "all", label: "all users" },
    { id: "user", label: "regular users" },
    { id: "host", label: "hosts" },
    { id: "admin", label: "admins" },
    { id: "super_admin", label: "super admins" },
  ];

  const STAT_CONFIG = [
    { key: "totalUsers", label: "total users", accent: "#378ADD" },
    { key: "totalHosts", label: "total hosts", accent: "#639922" },
    { key: "totalAdmins", label: "total admins", accent: "#7F77DD" },
    { key: "totalSuperAdmins", label: "super admins", accent: "#e8c547" },
    { key: "totalListings", label: "total listings", accent: "#1D9E75" },
    { key: "totalBookings", label: "total bookings", accent: "#D4537E" },
    { key: "pendingHosts", label: "pending hosts", accent: "#BA7517" },
    {
      key: "totalRevenue",
      label: "revenue",
      accent: "#D85A30",
      format: (v) => `$${v?.toLocaleString()}`,
    },
  ];

  const AVATAR_PALETTE = [
    { bg: "#EEEDFE", color: "#3C3489" },
    { bg: "#E6F1FB", color: "#0C447C" },
    { bg: "#EAF3DE", color: "#27500A" },
    { bg: "#FAEEDA", color: "#633806" },
    { bg: "#E1F5EE", color: "#085041" },
    { bg: "#FBEAF0", color: "#72243E" },
  ];

  const getAvatarStyle = (name) =>
    AVATAR_PALETTE[name?.charCodeAt(0) % AVATAR_PALETTE.length] || AVATAR_PALETTE[0];

  const roleBadge = (role) => {
    const map = {
      super_admin: { cls: "bg-[#EEEDFE] text-[#3C3489]", label: "super admin" },
      admin: { cls: "bg-[#E6F1FB] text-[#0C447C]", label: "admin" },
      host: { cls: "bg-[#EAF3DE] text-[#27500A]", label: "host" },
      user: { cls: "bg-[#F1EFE8] text-[#444441]", label: "user" },
    };
    const cfg = map[role] || map.user;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${cfg.cls}`}
      >
        {cfg.label}
      </span>
    );
  };

  const statusBadge = (status) => {
    const map = {
      confirmed: "bg-[#EAF3DE] text-[#27500A]",
      active: "bg-[#EAF3DE] text-[#27500A]",
      pending: "bg-[#FAEEDA] text-[#633806]",
      suspended: "bg-[#FCEBEB] text-[#791F1F]",
      blocked: "bg-[#FCEBEB] text-[#791F1F]",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
          map[status] || "bg-gray-100 text-gray-700"
        }`}
      >
        {status || "unknown"}
      </span>
    );
  };

  // ─── Loading state ────────────────────────────────────────────────────────
  if (!currentUser) {
    return <LoadingScreen />;
  }

  const initials = currentUser.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Fraunces:ital,wght@0,300;0,500;1,300&display=swap');
        body { font-family: 'DM Mono', monospace; }
        .font-display { font-family: 'Fraunces', serif; }
        .stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--accent-color); }
        @keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .notif-animate { animation: slideIn 0.2s ease; }
        .user-name-link { color: #111118; text-decoration: none; font-weight: 500; font-size: 13px; transition: color 0.15s; }
        .user-name-link:hover { color: #185FA5; text-decoration: underline; }
        .tabs-scroll::-webkit-scrollbar { display: none; }
        .tabs-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="min-h-screen bg-[#f7f6f2]">
        {/* ─── Notification ───────────────────────────────────────────────── */}
        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 max-w-xs px-5 py-3 rounded-lg text-sm text-white notif-animate bg-[#1a1a2e] border-l-4 ${
              notification.type === "success"
                ? "border-[#e8c547]"
                : "border-[#E24B4A]"
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* ─── Navbar ────────────────────────────────────────────────────── */}
        <nav className="bg-[#1a1a2e] border-b border-[#e8c547]/20 px-4 sm:px-8">
          <div className="h-14 flex items-center justify-between gap-4">
            {/* Logo */}
            <Link
              to="/"
              style={{
                textDecoration: "none",
                fontFamily: "'Cairo', 'Tajawal', sans-serif",
                fontWeight: 500,
                fontSize: "24px",
                color: "#ffffff",
                letterSpacing: "1px",
                flexShrink: 0,
              }}
            >
              مر<span style={{ fontWeight: 700, color: "#e8c547" }}>حبا</span>
            </Link>

            {/* Tabs - Desktop */}
            <div className="hidden md:flex gap-0.5 flex-1 justify-center">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-md text-xs transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-[#e8c547] bg-[#e8c547]/10"
                      : "text-white/50 hover:text-[#e8c547]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                style={{ background: "#e8c547", color: "#1a1a2e" }}
              >
                {initials}
              </div>
              <div className="hidden sm:block text-xs text-white/70 truncate max-w-[100px]">
                {currentUser.name}
              </div>
              <span className="text-[10px] text-[#e8c547] bg-[#e8c547]/10 border border-[#e8c547]/25 px-2 py-0.5 rounded-full whitespace-nowrap">
                {currentUser.role}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-[#e8c547] border border-[#e8c547] px-3 py-1 rounded hover:border-red-400/50 hover:text-red-400 transition-all whitespace-nowrap"
              >
                logout
              </button>
            </div>
          </div>

          {/* Tabs - Mobile */}
          <div className="md:hidden tabs-scroll overflow-x-auto flex gap-0.5 pb-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-md text-xs transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? "text-[#e8c547] bg-[#e8c547]/10"
                    : "text-white/50 hover:text-[#e8c547]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* ─── Main content ──────────────────────────────────────────────── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
              {STAT_CONFIG.map((s) => (
                <div
                  key={s.key}
                  className="stat-card bg-white rounded-xl p-4 sm:p-5 relative overflow-hidden border border-black/[0.06]"
                  style={{ "--accent-color": s.accent }}
                >
                  <div className="font-display italic font-light text-2xl sm:text-3xl text-[#111118] leading-none mb-1">
                    {s.format ? s.format(stats[s.key]) : stats[s.key] ?? 0}
                  </div>
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-widest text-[#999]">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="font-display italic font-light text-lg text-[#111118]">
              {TABS.find((t) => t.id === activeTab)?.label}
              <span className="ml-2 text-sm not-italic font-normal text-[#999]">
                ({displayUsers.length})
              </span>
            </div>
            {currentUser.role === "super_admin" && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[#1a1a2e] text-[#e8c547] text-xs px-4 py-2 rounded-md hover:bg-[#16213e] transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                + add admin
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
            {loading ? (
              <div className="p-12 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#1a1a2e] border-t-transparent" />
              </div>
            ) : displayUsers.length === 0 ? (
              <div className="p-12 text-center text-[#999] text-sm">
                no users found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-black/[0.06] bg-[#fafaf8]">
                      {[
                        "user",
                        "contact",
                        "role",
                        "status",
                        "joined",
                        "id docs",
                        "actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-3 sm:px-4 py-3 text-left text-[10px] uppercase tracking-widest text-[#999] font-normal"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayUsers.map((user) => {
                      const avi = getAvatarStyle(user.name);
                      const userInitials = user.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() || "U";
                      
                      return (
                        <tr
                          key={user._id || user.id}
                          className="border-b border-black/[0.04] hover:bg-[#fafaf8] transition-colors last:border-0"
                        >
                          <td className="px-3 sm:px-4 py-3">
                            <div className="flex items-center gap-2 sm:gap-2.5">
                              <div
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                                style={{ background: avi.bg, color: avi.color }}
                              >
                                {userInitials}
                              </div>
                              <div className="min-w-0">
                                <Link
                                  to={`/user/${user._id || user.id}`}
                                  className="user-name-link block truncate max-w-[120px] sm:max-w-none"
                                >
                                  {user.name}
                                </Link>
                                <div className="text-[11px] text-[#999]">
                                  #{String(user._id || user.id).slice(-6)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <div className="text-[12px] sm:text-[13px] text-[#111118] truncate max-w-[140px] sm:max-w-none">
                              {user.email}
                            </div>
                            <div className="text-[11px] text-[#999]">
                              {user.phone_number || user.phone_number || "—"}
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            {roleBadge(user.role)}
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            {statusBadge(user.status)}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-[11px] sm:text-[12px] text-[#666] whitespace-nowrap">
                            {new Date(user.created_at || user.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            {user.id_images?.length > 0 ? (
                              <span className="text-[11px] bg-[#EAF3DE] text-[#27500A] px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                                {user.id_images.length} uploaded
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#bbb]">
                                none
                              </span>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <Link
                              to={`/user/${user._id || user.id}`}
                              className="text-[11px] text-[#185FA5] border border-[#185FA5]/25 px-3 py-1 rounded hover:bg-[#E6F1FB] transition-all inline-block whitespace-nowrap"
                            >
                              view
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ─── Add Admin Modal ───────────────────────────────────────────────── */}
      {showAddModal && (
        <AdminModal
          onClose={() => setShowAddModal(false)}
          onSave={handleCreateAdmin}
          isSuperAdmin={currentUser.role === "super_admin"}
        />
      )}
    </>
  );
}