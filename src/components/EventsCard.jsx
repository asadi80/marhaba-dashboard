// src/components/EventsCard.jsx
//
// Shows a single tracked user event (login, signup, etc.) along with
// whatever device/browser/OS/IP metadata was captured for it. Each
// metadata field is rendered only if present.

export default function EventsCard({ event }) {
  return (
    <div className="border border-black/[0.06] rounded-lg p-3 hover:bg-[#fafaf8] transition-all">
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#111118] mb-1">Event Type</p>
          <p className="text-sm font-medium text-[#185FA5] capitalize truncate">
            {event.type}
          </p>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E6F1FB] text-[#0C447C] flex-shrink-0 whitespace-nowrap">
          {new Date(event.createdAt).toLocaleDateString()}
        </span>
      </div>
      <div className="text-xs text-[#666] space-y-2 mt-2">
        {event.metadata?.device?.type && (
          <div className="flex justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider flex-shrink-0">
              Device
            </span>
            <span className="text-[#111118] truncate">
              {event.metadata.device.type}
            </span>
          </div>
        )}
        {event.metadata?.browser?.name && (
          <div className="flex justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider flex-shrink-0">
              Browser
            </span>
            <span className="text-[#111118] truncate">
              {event.metadata.browser.name}
            </span>
          </div>
        )}
        {event.metadata?.os?.name && (
          <div className="flex justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider flex-shrink-0">
              OS
            </span>
            <span className="text-[#111118] truncate">
              {event.metadata.os.name}
            </span>
          </div>
        )}
        {event.metadata?.ip && (
          <div className="flex justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider flex-shrink-0">
              IP
            </span>
            <span className="text-[#111118] font-mono truncate">
              {event.metadata.ip}
            </span>
          </div>
        )}
        {!event.metadata && (
          <p className="text-[#bbb] text-xs">No metadata available</p>
        )}
      </div>
    </div>
  );
}