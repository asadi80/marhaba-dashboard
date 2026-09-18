// src/pages/UserDetailPage.jsx
//
// Admin-facing "user detail" screen: profile header, an editable info
// form, and tabs for the user's listings, bookings, sessions, events,
// subscription payments, and uploaded documents.
//
// All the presentational pieces (badges, cards, image gallery, payment
// actions, etc.) live in ../components — this file is just data
// fetching + tab/page layout.

import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen";
import { authFetch } from "../utils/auth";

import { getAvatarStyle } from "../utils/avatar";
import { inputCls } from "../constants/styles";

import Field from "../components/common/Field";
import SectionTitle from "../components/common/SectionTitle";
import InfoRow from "../components/common/InfoRow";
import StatusBadge from "../components/common/StatusBadge";
import RoleBadge from "../components/common/RoleBadge";

import BookingCard from "../components/BookingCard";
import ListingCard from "../components/ListingCard";
import SessionCard from "../components/SessionCard";
import EventsCard from "../components/EventsCard";
import ImageGallery from "../components/ImageGallery";
import SubscriptionPaymentCard from "../components/SubscriptionPaymentCard";
import IDDocumentActions from "../components/IdDocumentactions";

export default function UserDetailPage() {
  const navigate = useNavigate();
  const { id: userId } = useParams();

  // ── Core data ──
  const [currentUser, setCurrentUser] = useState(null); // the logged-in admin/super_admin
  const [targetUser, setTargetUser] = useState(null); // the user being viewed/edited
  const [userListings, setUserListings] = useState([]);
  const [userBookings, setUserBookings] = useState([]); // bookings the target user made as a guest
  const [listingsBookings, setListingsBookings] = useState([]); // bookings made on the target user's listings (if host)
  const [userSession, setUserSession] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [subscriptionPayments, setSubscriptionPayments] = useState([]);

  // ── Edit form state ──
  const [form, setForm] = useState({});

  // ── UI state ──
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState("info");

  const isSuperAdmin = currentUser?.role === "super_admin";
  const isAdmin =
    currentUser?.role === "admin" || currentUser?.role === "super_admin";

  // Merges ID images with every payment's receipt images into a single
  // flat list for the "Documents" tab / count badge.

  const getAllDocuments = () => {
    const docs = [];

    // Add ALL ID document images
    if (Array.isArray(targetUser?.id_documents)) {
      targetUser.id_documents.forEach((document) => {
        if (document?.file_url) {
          docs.push({
            url: document.file_url,
            type: "id",
            label: `${document.document_type || "ID Document"}${
              document.side ? ` (${document.side})` : ""
            }`,
          });
        }
      });
    }

    // Add receipt images from payments
    if (subscriptionPayments?.length) {
      subscriptionPayments.forEach((payment) => {
        if (Array.isArray(payment.receipt_images)) {
          payment.receipt_images.forEach((url) => {
            if (url) {
              docs.push({
                url,
                type: "receipt",
                label: `Receipt (Payment #${payment.id?.slice(-8) || "N/A"})`,
              });
            }
          });
        }
      });
    }

    return docs;
  };

  const documents = getAllDocuments();

  const tabs = [
    { key: "info", label: "Account Info" },
    { key: "listings", label: `Listings (${userListings.length})` },
    {
      key: "bookings",
      label: `Bookings (${userBookings.length + listingsBookings.length})`,
    },
    { key: "session", label: `Session (${userSession.length})` },
    { key: "events", label: `Events (${userEvents.length})` },
    { key: "payments", label: `Payments (${subscriptionPayments.length})` },
    { key: "documents", label: `Documents (${documents.length})` },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────────────────

  // Load the logged-in admin first; the target user fetch depends on it
  // (and on the :id route param).
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) fetchTargetUser();
  }, [currentUser, userId]);

  // Confirms the caller is authenticated and has an admin-level role;
  // redirects to /login or / otherwise.
  const fetchCurrentUser = async () => {
    try {
      const res = await authFetch("/api/v1/auth/me");
      if (!res || !res.ok) {
        navigate("/login");
        return;
      }
      const data = await res.json();
      const user = data.data?.user || data.user;
      if (!user || !["admin", "super_admin"].includes(user.role)) {
        navigate("/");
        return;
      }
      setCurrentUser(user);
    } catch (error) {
      console.error("Auth error:", error);
      navigate("/login");
    }
  };

  // Fetches the user being viewed, seeds the edit form from it, pulls
  // subscription payments off the response, then kicks off the
  // remaining tab data fetches in parallel.
  const fetchTargetUser = async () => {
    setLoading(true);
    try {
      // FIXED: Use the correct admin route
      const res = await authFetch(`/api/v1/dashboard/users/${userId}`);

      if (!res) {
        throw new Error("No response from server");
      }
      const data = await res.json();
      console.log("user info", data);
      if (!res.ok) throw new Error(data.message || "Failed to load user");
      const user = data.data?.user || data.user || data;
      setTargetUser(user);

      // Extract subscription payments from the user data
      const payments = user.host_subscription_payments || [];
      setSubscriptionPayments(payments);

      setForm({
        name: user.name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        role: user.role || "",
        status: user.status || "",
        statusReason: user.statusReason || user.status_reason || "",
      });

      await Promise.all([
        fetchUserListings(),
        fetchUserBookings(),
        fetchUserSession(),
        fetchUserEvents(),
      ]);
    } catch (err) {
      showNotification(err.message || "Failed to load user", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserListings = async () => {
    try {
      // FIXED: Use the correct admin route
      const res = await authFetch(`/api/v1/dashboard/users/${userId}/listings`);
      if (res && res.ok) {
        const data = await res.json();
        setUserListings(data.listings || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserBookings = async () => {
    try {
      // FIXED: Use the correct admin route
      const res = await authFetch(`/api/v1/dashboard/users/${userId}/bookings`);
      if (res && res.ok) {
        const data = await res.json();
        setUserBookings(data.bookingsAsGuest || []);
        setListingsBookings(data.bookingsAsHost || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserSession = async () => {
    try {
      // FIXED: Use the correct admin route
      const res = await authFetch(`/api/v1/dashboard/users/${userId}/sessions`);
      if (res && res.ok) {
        const data = await res.json();
        setUserSession(data.sessions || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserEvents = async () => {
    try {
      // FIXED: Use the correct admin route
      const res = await authFetch(`/api/v1/dashboard/users/${userId}/events`);
      if (res && res.ok) {
        const data = await res.json();
        setUserEvents(data.events || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  // Saves the edit form. Regular admins can only change phone/status/
  // statusReason; super admins can also change name/email/role.
  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = isSuperAdmin
        ? {
            name: form.name,
            email: form.email,
            phone_number: form.phone_number,
            role: form.role,
            status: form.status,
            statusReason: form.statusReason,
          }
        : {
            phone_number: form.phone_number,
            status: form.status,
            statusReason: form.statusReason,
          };
      // FIXED: Use the correct admin route
      const res = await authFetch(`/api/v1/dashboard/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        showNotification("User updated successfully", "success");
        setTargetUser((prev) => ({ ...prev, ...(data.user ?? updates) }));
        if (updates.status) await fetchUserListings();
      } else {
        showNotification(data.message || "Update failed", "error");
      }
    } catch {
      showNotification("Error saving changes", "error");
    } finally {
      setSaving(false);
    }
  };

  // Deletes the target user (super admin only, gated in the UI below)
  // after a confirm() prompt, then redirects back to the dashboard.
  const handleDelete = async () => {
    if (
      !confirm(
        `Delete ${targetUser.name}? This will also delete all their listings and bookings. This cannot be undone.`,
      )
    )
      return;
    setDeleting(true);
    try {
      // FIXED: Use the correct admin route
      const res = await authFetch(`/api/v1/dashboard/users/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showNotification(
          `User deleted with ${data.deletedCount?.listings || 0} listings and associated bookings`,
          "success",
        );
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        showNotification(data.message, "error");
        setDeleting(false);
      }
    } catch {
      showNotification("Error deleting user", "error");
      setDeleting(false);
    }
  };

  // Shows a toast-style notification for ~3.5s.
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Small helper: returns an onChange handler that writes into `form[k]`.
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Formats an ISO date string as "3 Jan 2024"; returns null (not a
  // string) for falsy input so InfoRow can show its own placeholder.
  const fmt = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  if (!currentUser || loading) {
    return <LoadingScreen />;
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f7f6f2]">
        <p className="text-[#999] text-sm">User not found.</p>
        <Link to="/dashboard" className="text-xs text-[#185FA5] underline">
          ← back to admin
        </Link>
      </div>
    );
  }

  const avi = getAvatarStyle(targetUser.name);
  const userInitials = targetUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const adminInitials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-40 max-w-xs px-5 py-3 rounded-lg text-sm text-white bg-[#1a1a2e] border-l-4 ${
            notification.type === "success"
              ? "border-[#e8c547]"
              : "border-[#E24B4A]"
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-[#1a1a2e] border-b border-[#e8c547]/20 px-4 sm:px-8 h-14 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <Link
            to="/"
            style={{
              textDecoration: "none",
              fontFamily: "'Cairo','Tajawal',sans-serif",
              fontWeight: 500,
              fontSize: "24px",
              color: "#ffffff",
              letterSpacing: "1px",
              flexShrink: 0,
            }}
          >
            مر<span style={{ fontWeight: 700, color: "#e8c547" }}>حبا</span>
          </Link>
          <Link
            to="/dashboard"
            className="text-white/50 hover:text-white/80 text-xs transition-colors truncate"
          >
            ← back to users
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
            style={{ background: "#e8c547", color: "#1a1a2e" }}
          >
            {adminInitials}
          </div>
          <span className="hidden sm:block text-xs text-white/70 truncate max-w-[100px]">
            {currentUser.name}
          </span>
          <span className="hidden sm:inline text-[10px] text-[#e8c547] bg-[#e8c547]/10 border border-[#e8c547]/25 px-2 py-0.5 rounded-full">
            {currentUser.role}
          </span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Profile header */}
        <div className="bg-white rounded-xl border border-black/[0.06] p-4 sm:p-6 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-base sm:text-lg font-medium flex-shrink-0"
              style={{ background: avi.bg, color: avi.color }}
            >
              {userInitials}
            </div>
            <div className="min-w-0">
              <h1 className="font-serif italic font-light text-xl sm:text-2xl text-[#111118] leading-tight truncate">
                {targetUser.name}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <RoleBadge role={targetUser.role} />
                <StatusBadge status={targetUser.status} />
                <span className="text-[11px] text-[#bbb]">
                  #{targetUser.id?.slice(-8)}
                </span>
              </div>
            </div>
          </div>

          {/* Only super admins can delete, and never another super admin */}
          {isSuperAdmin && targetUser.role !== "super_admin" && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="self-start sm:self-auto text-xs text-[#A32D2D] border border-[#A32D2D]/20 px-4 py-2 rounded-md hover:bg-[#FCEBEB] transition-all disabled:opacity-50 flex-shrink-0 whitespace-nowrap"
            >
              {deleting ? "deleting..." : "delete user"}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-black/[0.06] mb-6 overflow-x-auto">
          <div className="flex gap-0 min-w-max sm:min-w-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "text-[#185FA5] border-b-2 border-[#185FA5]"
                    : "text-[#666] hover:text-[#111118]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Info Tab ── */}
        {activeTab === "info" && (
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5">
            {/* Left column */}
            <div className="flex flex-col gap-5">
              <div className="bg-white rounded-xl border border-black/[0.06] p-4 sm:p-5">
                <SectionTitle>account info</SectionTitle>
                <InfoRow label="User ID" value={targetUser.id} mono />
                <InfoRow label="Created" value={fmt(targetUser.created_at)} />
                <InfoRow
                  label="Last active"
                  value={fmt(targetUser.last_active)}
                />
                <InfoRow
                  label="Email verified"
                  value={targetUser.email_verified ? "Yes" : "No"}
                />
              </div>

              {targetUser.role === "host" && (
                <div className="bg-white rounded-xl border border-black/[0.06] p-4 sm:p-5">
                  <SectionTitle>host details</SectionTitle>
                  <InfoRow
                    label="Rating"
                    value={targetUser.host_details?.rating?.toFixed(1) ?? "0.0"}
                  />
                  <InfoRow
                    label="Listings"
                    value={targetUser.totalListings ?? 0}
                  />
                  <InfoRow
                    label="Verified"
                    value={targetUser.host_details?.verified ? "Yes" : "No"}
                  />
                  <InfoRow label="Joined" value={fmt(targetUser.created_at)} />
                  <InfoRow
                    label="Confirmed"
                    value={fmt(targetUser.host_details?.confirmed_at)}
                  />
                  <InfoRow
                    label="Expires"
                    value={fmt(targetUser.host_details?.expires_at)}
                  />
                  <InfoRow
                    label="Status reason"
                    value={targetUser.statusReason}
                  />
                </div>
              )}

              <div className="bg-white rounded-xl border border-black/[0.06] p-4 sm:p-5">
                <SectionTitle>user details</SectionTitle>
                <InfoRow
                  label="Member since"
                  value={fmt(targetUser.created_at)}
                />
                <InfoRow label="Bookings made" value={userBookings.length} />
                <InfoRow label="Listings" value={userListings.length} />
              </div>
            </div>

            {/* Right columns */}
            <div className="flex flex-col gap-5 lg:col-span-2">
              {/* Edit form */}
              <div className="bg-white rounded-xl border border-black/[0.06] p-4 sm:p-6">
                <SectionTitle>edit user</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="full name">
                    <input
                      className={inputCls}
                      value={form.name ?? ""}
                      onChange={set("name")}
                      disabled={!isSuperAdmin}
                    />
                  </Field>
                  <Field label="email">
                    <input
                      type="email"
                      className={inputCls}
                      value={form.email ?? ""}
                      onChange={set("email")}
                      disabled={!isSuperAdmin}
                    />
                  </Field>
                  <Field label="phone number">
                    <input
                      type="tel"
                      className={inputCls}
                      value={form.phone_number ?? ""}
                      onChange={set("phone_number")}
                    />
                  </Field>
                  <Field label="status">
                    <select
                      className={inputCls}
                      value={form.status ?? ""}
                      onChange={set("status")}
                    >
                      {targetUser?.role === "host" ? (
                        <>
                          <option value="confirmed">
                            Confirmed — starts 6-month timer
                          </option>
                          <option value="pending">Pending</option>
                          <option value="suspended">Suspended</option>
                        </>
                      ) : (
                        <>
                          <option value="confirmed">Confirmed</option>
                          <option value="pending">Pending</option>
                          <option value="suspended">Suspended</option>
                        </>
                      )}
                    </select>
                    {targetUser?.role === "host" &&
                      form.status === "confirmed" && (
                        <p className="text-[11px] text-[#27500A] mt-1">
                          ⏱️ 6-month timer starts now.
                        </p>
                      )}
                    {targetUser?.role === "host" &&
                      form.status === "pending" && (
                        <p className="text-[11px] text-[#633806] mt-1">
                          ⚠️ Pending hosts need to upload ID documents.
                        </p>
                      )}
                    {form.status === "suspended" && (
                      <p className="text-[11px] text-[#791F1F] mt-1">
                        ⚠️ Suspended users cannot log in or make bookings.
                      </p>
                    )}
                    {targetUser?.role !== "host" &&
                      form.status === "pending" && (
                        <p className="text-[11px] text-[#633806] mt-1">
                          ⏳ User is awaiting confirmation.
                        </p>
                      )}
                  </Field>
                  <Field label="status reason (optional)">
                    <input
                      className={inputCls}
                      value={form.statusReason ?? ""}
                      onChange={set("statusReason")}
                      placeholder="e.g. expired, violation..."
                    />
                  </Field>
                </div>

                {!isSuperAdmin && (
                  <p className="text-[11px] text-[#bbb] mt-4 leading-relaxed">
                    As an admin you can update phone number and status. Super
                    admins can edit all fields.
                  </p>
                )}

                <div className="flex justify-end mt-5">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#1a1a2e] text-[#e8c547] text-xs px-5 sm:px-6 py-2.5 rounded-md hover:bg-[#16213e] disabled:opacity-50 transition-all"
                  >
                    {saving ? "saving..." : "save changes"}
                  </button>
                </div>
              </div>

              {/* ID Images */}

              {/* ID Documents */}
              {/* ID Documents - Per Document Actions */}
              <div className="bg-white rounded-xl border border-black/[0.06] p-4 sm:p-6">
                <SectionTitle>
                  id documents
                  <span className="text-sm not-italic font-normal text-[#999]">
                    ({targetUser.id_documents?.length ?? 0})
                  </span>
                </SectionTitle>

                {targetUser.id_documents?.length > 0 ? (
                  <div className="space-y-4">
                    {targetUser.id_documents.map((document) => (
                      <div
                        key={document.id}
                        className="border border-black/[0.06] rounded-lg p-4"
                      >
                        {/* Document Header with Actions */}
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm font-medium text-[#111118]">
                              {document.document_type || "ID Document"}
                              {document.side && (
                                <span className="text-xs text-[#999] font-normal ml-2">
                                  ({document.side})
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-[#999]">
                              Uploaded:{" "}
                              {new Date(
                                document.created_at,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <StatusBadge
                              status={document.status || "pending"}
                            />
                            {/* ✅ Per-document actions */}
                            <IDDocumentActions
                              documentId={document.id}
                              status={document.status || "pending"}
                              documentType={
                                document.document_type || "ID Document"
                              }
                              side={document.side}
                              isAdmin={isAdmin}
                              onAction={() => {
                                setLoading(true);
                                fetchTargetUser().finally(() =>
                                  setLoading(false),
                                );
                              }}
                            />
                          </div>
                        </div>

                        {/* Document Image */}
                        {document.file_url && (
                          <div className="mt-3">
                            <ImageGallery
                              images={[document.file_url]}
                              title={`${document.document_type || "ID Document"} ${document.side || ""}`}
                              emptyMessage="No image available."
                            />
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {document.status === "rejected" &&
                          document.rejection_reason && (
                            <div className="mt-3 p-3 bg-[#FCEBEB] rounded-lg border border-red-200">
                              <p className="text-[11px] font-medium text-[#791F1F]">
                                Rejection Reason:
                              </p>
                              <p className="text-[13px] text-[#791F1F]">
                                {document.rejection_reason}
                              </p>
                            </div>
                          )}

                        {/* Review Info */}
                        {document.reviewed_at && (
                          <p className="text-[10px] text-[#999] mt-2">
                            Reviewed:{" "}
                            {new Date(document.reviewed_at).toLocaleString()}
                            {document.reviewer?.name &&
                              ` by ${document.reviewer.name}`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-[#bbb] text-sm">
                    No ID documents uploaded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Listings Tab ── */}
        {activeTab === "listings" && (
          <div className="bg-white rounded-xl border border-black/[0.06] p-4 sm:p-6">
            <SectionTitle>
              user's listings
              <span className="text-sm not-italic font-normal text-[#999]">
                ({userListings.length})
              </span>
            </SectionTitle>
            {userListings.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-[#bbb] text-sm">
                This user has no listings yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Bookings Tab ── */}
        {activeTab === "bookings" && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-black/[0.06] p-4 sm:p-6">
              <SectionTitle>
                bookings made by this user
                <span className="text-sm not-italic font-normal text-[#999]">
                  ({userBookings.length})
                </span>
              </SectionTitle>
              {userBookings.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-[#bbb] text-sm">
                  This user hasn't made any bookings yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      type="guest"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-black/[0.06] p-4 sm:p-6">
              <SectionTitle>
                bookings on user's listings
                <span className="text-sm not-italic font-normal text-[#999]">
                  ({listingsBookings.length})
                </span>
              </SectionTitle>
              {listingsBookings.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-[#bbb] text-sm">
                  No bookings have been made on this user's listings yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listingsBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      type="host"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Session Tab ── */}
        {activeTab === "session" && (
          <div className="bg-white rounded-xl border border-black/[0.06] p-4 sm:p-6">
            <SectionTitle>
              user sessions
              <span className="text-sm not-italic font-normal text-[#999]">
                ({userSession.length})
              </span>
            </SectionTitle>
            {userSession.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-[#bbb] text-sm">
                This user has no sessions yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userSession.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Events Tab ── */}
        {activeTab === "events" && (
          <div className="bg-white rounded-xl border border-black/[0.06] p-4 sm:p-6">
            <SectionTitle>
              user events
              <span className="text-sm not-italic font-normal text-[#999]">
                ({userEvents.length})
              </span>
            </SectionTitle>
            {userEvents.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-[#bbb] text-sm">
                This user has no events yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userEvents.map((event) => (
                  <EventsCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Payments Tab ── */}
        {activeTab === "payments" && (
          <div className="bg-white rounded-xl border border-black/[0.06] p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <SectionTitle>
                host subscription payments
                <span className="text-sm not-italic font-normal text-[#999]">
                  ({subscriptionPayments.length})
                </span>
              </SectionTitle>
              <button
                onClick={() => {
                  setLoading(true);
                  fetchTargetUser().finally(() => setLoading(false));
                }}
                className="text-[11px] text-[#185FA5] hover:underline"
              >
                ↻ Refresh
              </button>
            </div>

            {targetUser.role !== "host" ? (
              <div className="flex items-center justify-center py-12 text-[#bbb] text-sm">
                This user is not a host, so they don't have subscription
                payments.
              </div>
            ) : subscriptionPayments.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-[#bbb] text-sm">
                This host has no subscription payments yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {subscriptionPayments.map((payment, index) => (
                  <SubscriptionPaymentCard
                    key={payment.id || index}
                    payment={payment}
                    onRefresh={() => {
                      setLoading(true);
                      fetchTargetUser().finally(() => setLoading(false));
                    }}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Documents Tab ── */}
        {activeTab === "documents" && (
          <div className="bg-white rounded-xl border border-black/[0.06] p-4 sm:p-6">
            <SectionTitle>
              all documents
              <span className="text-sm not-italic font-normal text-[#999]">
                ({documents.length})
              </span>
            </SectionTitle>

            {documents.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-[#bbb] text-sm">
                No documents found for this user.
              </div>
            ) : (
              <div className="space-y-6">
                {/* ID Documents */}
                {targetUser?.id_images?.length > 0 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-[#999] mb-3 flex items-center gap-2">
                      ID Documents ({targetUser.id_images.length})
                      <StatusBadge
                        status={targetUser.status_id_images || "pending"}
                      />
                    </h3>
                    <ImageGallery
                      images={targetUser.id_images}
                      title="ID Document"
                      emptyMessage="No ID documents"
                    />
                  </div>
                )}

                {/* Receipt documents from payments */}
                {subscriptionPayments.some(
                  (p) => p.receipt_images?.length > 0,
                ) && (
                  <div className="pt-4 border-t border-black/[0.06]">
                    <h3 className="text-xs uppercase tracking-widest text-[#999] mb-3">
                      Payment Receipts
                    </h3>
                    {subscriptionPayments.map(
                      (payment, index) =>
                        payment.receipt_images?.length > 0 && (
                          <div
                            key={payment.id || index}
                            className="mb-4 last:mb-0"
                          >
                            <p className="text-[11px] font-medium text-[#111118] mb-2">
                              Payment #{payment.id?.slice(-8) || "N/A"} — LYD
                              {payment.amount}
                              <span className="text-[#999] font-normal ml-2">
                                (
                                {new Date(
                                  payment.created_at,
                                ).toLocaleDateString()}
                                )
                              </span>
                              <span
                                className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${
                                  payment.status === "approved"
                                    ? "bg-[#EAF3DE] text-[#27500A]"
                                    : payment.status === "rejected"
                                      ? "bg-[#FCEBEB] text-[#791F1F]"
                                      : "bg-[#E6F1FB] text-[#0C447C]"
                                }`}
                              >
                                {payment.status}
                              </span>
                            </p>
                            <ImageGallery
                              images={payment.receipt_images}
                              title="Receipt"
                              emptyMessage="No receipt images"
                            />
                          </div>
                        ),
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
