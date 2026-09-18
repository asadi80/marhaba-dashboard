// src/components/BookingCard.jsx
//
// Renders a single booking. `type` controls whether we show the "Guest"
// (booking made on one of the user's listings, viewed as host) or
// "Listing" (booking the user made themselves, viewed as guest) label.

import StatusBadge from "./common/StatusBadge";

export default function BookingCard({ booking, type }) {
  return (
    <div className="border border-black/[0.06] rounded-lg p-3 hover:bg-[#fafaf8] transition-all">
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#111118] mb-1">
            {type === "host" ? "Guest:" : "Listing:"}
          </p>
          <p className="text-sm font-medium text-[#185FA5] truncate">
            {type === "host"
              ? booking.user?.name || booking.userId
              : booking.listing?.title || booking.listingId}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-[#666] mt-2">
        <div>
          <span className="text-[10px] uppercase tracking-wider">Check In</span>
          <p className="text-[#111118] mt-0.5">
            {new Date(booking.checkIn).toLocaleDateString()}
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider">
            Check Out
          </span>
          <p className="text-[#111118] mt-0.5">
            {new Date(booking.checkOut).toLocaleDateString()}
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider">Guests</span>
          <p className="text-[#111118] mt-0.5">{booking.guests}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider">Total</span>
          <p className="text-[#111118] mt-0.5 font-medium">
            LYD{booking.totalPrice}
          </p>
        </div>
      </div>
      <p className="text-[10px] text-[#999] mt-2">
        Booked: {new Date(booking.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}