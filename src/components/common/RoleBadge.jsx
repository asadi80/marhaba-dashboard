// src/components/common/RoleBadge.jsx
//
// Small colored pill for a user's role (super_admin, admin, host, user).
// Underscores in the role name are replaced with a space for display.

export default function RoleBadge({ role }) {
  const map = {
    super_admin: "bg-[#EEEDFE] text-[#3C3489]",
    admin: "bg-[#E6F1FB] text-[#0C447C]",
    host: "bg-[#EAF3DE] text-[#27500A]",
    user: "bg-[#F1EFE8] text-[#444441]",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
        map[role] || "bg-gray-100 text-gray-700"
      }`}
    >
      {role?.replace("_", " ")}
    </span>
  );
}