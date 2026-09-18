// src/components/common/InfoRow.jsx
//
// Read-only "label ... value" row used throughout the info panels.
// Shows an em-dash placeholder when `value` is nullish, and can render
// the value in monospace (useful for IDs, references, IPs, etc).

export default function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-black/[0.04] last:border-0">
      <span className="text-[10px] uppercase tracking-widest text-[#999] flex-shrink-0 w-24 sm:w-32 leading-5">
        {label}
      </span>
      <span
        className={`text-[12px] sm:text-[13px] text-[#111118] text-right break-all leading-5 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value ?? <span className="text-[#ccc]">—</span>}
      </span>
    </div>
  );
}