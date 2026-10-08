// src/utils/normalizeUser.js
export function normalizeUser(raw) {
  if (!raw) return null;

  return {
    ...raw,
    id_documents: Array.isArray(raw.id_documents) ? raw.id_documents : [],
    host_subscription_payments: Array.isArray(raw.host_subscription_payments)
      ? raw.host_subscription_payments
      : [],
    listings: Array.isArray(raw.listings) ? raw.listings : [],
    bookings: Array.isArray(raw.bookings) ? raw.bookings : [],
  };
}