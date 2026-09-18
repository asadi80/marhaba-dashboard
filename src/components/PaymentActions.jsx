// src/components/PaymentActions.jsx
//
// Admin-only dropdown menu attached to a pending subscription payment.
// Lets an admin approve the payment outright, or reject it with a
// required reason (shown to the host afterwards).

import { useState } from "react";
import { authFetch } from "../utils/auth";

export default function PaymentActions({ payment, onAction, isAdmin }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Approves the payment via the dashboard API, then refreshes the
  // parent's data (via onAction) and closes the dropdown.
  const handleApprove = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/v1/dashboard/payments/${payment.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: `Approved by admin on ${new Date().toLocaleDateString()}` }),
      });
      const data = await res.json();
      if (data.success) {
        onAction?.();
        setShowDropdown(false);
      } else {
        alert(data.message || 'Failed to approve payment');
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      alert('Failed to approve payment');
    } finally {
      setLoading(false);
    }
  };

  // Rejects the payment with the entered reason. Requires a non-empty
  // reason before submitting.
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch(`/api/v1/dashboard/payments/${payment.id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        onAction?.();
        setShowRejectModal(false);
        setRejectReason("");
        setShowDropdown(false);
      } else {
        alert(data.message || 'Failed to reject payment');
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Failed to reject payment');
    } finally {
      setLoading(false);
    }
  };

  // Returns the dropdown body appropriate for the payment's current
  // status: actionable buttons for "pending", a static confirmation
  // label for "approved"/"rejected".
  const getStatusActions = () => {
    switch (payment.status) {
      case 'pending':
        return (
          <>
            <button
              onClick={() => {
                setShowDropdown(false);
                handleApprove();
              }}
              disabled={loading}
              className="w-full text-left px-4 py-2 text-sm text-[#27500A] hover:bg-[#EAF3DE] transition-colors flex items-center gap-2"
            >
              <span className="text-lg">✅</span> Approve Payment
            </button>
            <button
              onClick={() => {
                setShowDropdown(false);
                setShowRejectModal(true);
              }}
              disabled={loading}
              className="w-full text-left px-4 py-2 text-sm text-[#791F1F] hover:bg-[#FCEBEB] transition-colors flex items-center gap-2"
            >
              <span className="text-lg">❌</span> Reject Payment
            </button>
          </>
        );
      case 'approved':
        return (
          <div className="px-4 py-2 text-sm text-[#27500A] bg-[#EAF3DE] rounded">
            ✅ Already Approved
          </div>
        );
      case 'rejected':
        return (
          <div className="px-4 py-2 text-sm text-[#791F1F] bg-[#FCEBEB] rounded">
            ❌ Already Rejected
          </div>
        );
      default:
        return null;
    }
  };

  // Non-admins never see this control at all.
  if (!isAdmin) return null;

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={loading || payment.status !== 'pending'}
          className={`text-[10px] px-3 py-1.5 rounded-md border transition-all flex items-center gap-1 ${
            payment.status === 'pending'
              ? 'border-[#185FA5] text-[#185FA5] hover:bg-[#E6F1FB]'
              : 'border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span>⚙️</span> Actions
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-black/[0.06] z-10 overflow-hidden">
            <div className="py-1">
              <div className="px-4 py-1.5 text-[10px] uppercase tracking-widest text-[#999] border-b border-black/[0.06]">
                Payment #{payment.id?.slice(-8)}
              </div>
              {getStatusActions()}
              <button
                onClick={() => setShowDropdown(false)}
                className="w-full text-left px-4 py-2 text-sm text-[#999] hover:bg-gray-50 transition-colors border-t border-black/[0.06]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-[#111118] mb-2">
              Reject Payment
            </h3>
            <p className="text-sm text-[#666] mb-4">
              Please provide a reason for rejecting this payment. This will be sent to the host.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 bg-[#fafaf8] border border-black/10 rounded-md text-[13px] text-[#111118] outline-none focus:border-[#185FA5] focus:bg-white transition-all resize-none min-h-[100px]"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleReject}
                disabled={loading || !rejectReason.trim()}
                className="flex-1 bg-[#A32D2D] text-white py-2 rounded-md text-sm font-medium hover:bg-[#791F1F] transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="flex-1 bg-gray-100 text-[#666] py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}