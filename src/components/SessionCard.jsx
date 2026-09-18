// src/components/SessionCard.jsx
//
// Shows details for a single login session: device/browser/OS/IP, plus
// login/logout timestamps. The "Active" vs "Ended" badge reflects
// session.isActive.

export default function SessionCard({ session }) {
  return (
    <div className="border border-black/[0.06] rounded-lg p-3 hover:bg-[#fafaf8] transition-all">
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#111118] mb-1">Device</p>
          <p className="text-sm font-medium text-[#185FA5] truncate">
            {session.device || "Unknown Device"}
          </p>
        </div>
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 ${
            session.isActive
              ? "bg-[#EAF3DE] text-[#27500A]"
              : "bg-[#F1EFE8] text-[#444441]"
          }`}
        >
          {session.isActive ? "Active" : "Ended"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-[#666] mt-2">
        <div>
          <span className="text-[10px] uppercase tracking-wider">Browser</span>
          <p className="text-[#111118] mt-0.5 truncate">
            {session.browser || "Unknown"}
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider">OS</span>
          <p className="text-[#111118] mt-0.5 truncate">
            {session.os || "Unknown"}
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider">IP</span>
          <p className="text-[#111118] mt-0.5 font-mono truncate">
            {session.ipAddress || "Unknown"}
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider">Login</span>
          <p className="text-[#111118] mt-0.5">
            {session.loggedInAt
              ? new Date(session.loggedInAt).toLocaleString()
              : "-"}
          </p>
        </div>
        {session.loggedOutAt && (
          <div className="col-span-2">
            <span className="text-[10px] uppercase tracking-wider">Logout</span>
            <p className="text-[#111118] mt-0.5">
              {new Date(session.loggedOutAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>
      {session.userAgent && (
        <p className="text-[10px] text-[#999] mt-2 truncate">
          {session.userAgent}
        </p>
      )}
    </div>
  );
}