// src/components/SubscriptionPaymentCard.jsx
//
// Displays a single host subscription payment: status, amount, billing
// period, reference/notes, receipt images, and (for admins) the
// approve/reject actions dropdown.

import ImageGallery from "./ImageGallery";
import PaymentActions from "./PaymentActions";

export default function SubscriptionPaymentCard({ payment, onRefresh, isAdmin }) {
  const statusMap = {
    pending: {
      bg: "bg-[#E6F1FB] text-[#0C447C]",
      label: "Pending Review",
      icon: "⏳",
    },
    approved: {
      bg: "bg-[#EAF3DE] text-[#27500A]",
      label: "Approved ✅",
      icon: "✅",
    },
    rejected: {
      bg: "bg-[#FCEBEB] text-[#791F1F]",
      label: "Rejected ❌",
      icon: "❌",
    },
  };

  const statusInfo = statusMap[payment.status] || statusMap.pending;

  return (
    <div className="border border-black/[0.06] rounded-lg p-4 hover:bg-[#fafaf8] transition-all">
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-medium text-[#111118]">
              Payment #{payment.id?.slice(-8) || "N/A"}
            </p>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusInfo.bg}`}
            >
              {statusInfo.icon} {statusInfo.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-medium text-[#111118]">
              LYD{payment.amount}
            </span>
            <span className="text-[10px] text-[#999]">
              {payment.created_at
                ? new Date(payment.created_at).toLocaleDateString()
                : "—"}
            </span>
          </div>
        </div>

        {/* Payment Actions Dropdown — only rendered for pending payments viewed by an admin */}
        {isAdmin && payment.status === 'pending' && (
          <PaymentActions
            payment={payment}
            onAction={onRefresh}
            isAdmin={isAdmin}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-[#666]">
        <div>
          <span className="text-[10px] uppercase tracking-wider">Period</span>
          <p className="text-[#111118] mt-0.5">
            {payment.period_start && payment.period_end
              ? `${new Date(payment.period_start).toLocaleDateString()} → ${new Date(payment.period_end).toLocaleDateString()}`
              : "Not set"}
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider">Paid At</span>
          <p className="text-[#111118] mt-0.5">
            {payment.paid_at
              ? new Date(payment.paid_at).toLocaleDateString()
              : "—"}
          </p>
        </div>
        {payment.reference && (
          <div className="col-span-2">
            <span className="text-[10px] uppercase tracking-wider">Reference</span>
            <p className="text-[#111118] mt-0.5 font-mono text-[11px] break-all">
              {payment.reference}
            </p>
          </div>
        )}
        {payment.notes && (
          <div className="col-span-2">
            <span className="text-[10px] uppercase tracking-wider">
              {payment.status === 'rejected' ? 'Rejection Reason' : 'Notes'}
            </span>
            <p className={`text-[#111118] mt-0.5 text-[12px] ${payment.status === 'rejected' ? 'text-[#791F1F]' : ''}`}>
              {payment.notes}
            </p>
          </div>
        )}
      </div>

      {/* Receipt Images */}
      {payment.receipt_images?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-black/[0.06]">
          <p className="text-[10px] uppercase tracking-wider text-[#999] mb-2">
            Receipt Images ({payment.receipt_images.length})
          </p>
          <ImageGallery
            images={payment.receipt_images}
            title="Receipt"
            emptyMessage="No receipt images"
          />
        </div>
      )}
    </div>
  );
}