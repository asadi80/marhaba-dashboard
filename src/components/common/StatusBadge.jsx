// src/components/common/StatusBadge.jsx
//
// Small colored pill for generic status values (confirmed, pending,
// suspended, active, cancelled). Falls back to a neutral gray style
// for any status not explicitly mapped.

export default function StatusBadge({ status }) {
  const map = {
    confirmed: "bg-[#EAF3DE] text-[#27500A]",
    pending: "bg-[#FAEEDA] text-[#633806]",
    suspended: "bg-[#FCEBEB] text-[#791F1F]",
    active: "bg-[#EAF3DE] text-[#27500A]",
    cancelled: "bg-[#FCEBEB] text-[#791F1F]",
    // Added for approve/reject-style statuses (e.g. status_id_images)
    approved: "bg-[#EAF3DE] text-[#27500A]",
    rejected: "bg-[#FCEBEB] text-[#791F1F]",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
        map[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}