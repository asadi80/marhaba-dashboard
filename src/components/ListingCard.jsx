// src/components/ListingCard.jsx
//
// Compact card for a single listing: cover image, title, status,
// price/location, and a warning line when the listing has blocked dates.

import StatusBadge from "./common/StatusBadge";

export default function ListingCard({ listing }) {
  return (
    <div className="border border-black/[0.06] rounded-lg overflow-hidden hover:shadow-md transition-all">
      {listing.images?.[0] && (
        <div
          className="h-32 bg-cover bg-center"
          style={{ backgroundImage: `url(${listing.images[0]})` }}
        />
      )}
      <div className="p-3">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="text-sm font-medium text-[#111118] line-clamp-1 flex-1 min-w-0">
            {listing.title}
          </h3>
          <StatusBadge status={listing.status || "active"} />
        </div>
        <p className="text-xs text-[#666] mb-2 line-clamp-2">
          {listing.description}
        </p>
        <div className="flex justify-between items-center text-xs gap-2">
          <span className="text-[#185FA5] font-medium whitespace-nowrap">
            LYD{listing.price}/night
          </span>
          <span className="text-[#999] truncate">{listing.location}</span>
        </div>
        {listing.blockedDates?.length > 0 && (
          <p className="text-[10px] text-[#A32D2D] mt-2">
            {listing.blockedDates.length} blocked date(s)
          </p>
        )}
      </div>
    </div>
  );
}