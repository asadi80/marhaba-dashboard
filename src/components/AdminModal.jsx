// src/components/AdminModal.jsx
import { useState } from 'react';

function ModalShell({ title, onClose, onSubmit, loading, submitLabel, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-black/[0.06] p-6 sm:p-8 w-full sm:w-[440px] sm:max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <div className="font-display italic font-light text-xl text-[#111118] mb-6">
          {title}
        </div>
        <form onSubmit={onSubmit}>
          <div className="space-y-4">{children}</div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-4 py-2 border border-black/10 rounded-md text-[#555] hover:bg-gray-50 transition-all"
            >
              cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="text-xs px-4 py-2 bg-[#1a1a2e] text-[#e8c547] rounded-md hover:bg-[#16213e] disabled:opacity-50 transition-all"
            >
              {loading ? 'saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-[#999] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 bg-[#fafaf8] border border-black/10 rounded-md text-[13px] text-[#111118] font-[inherit] outline-none focus:border-[#185FA5] focus:bg-white transition-all';

export default function AdminModal({ onClose, onSave, isSuperAdmin }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone_number: '',
    role: 'admin',
  });
  const [loading, setLoading] = useState(false);
  
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <ModalShell
      title="Add new admin"
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
      submitLabel="create"
    >
      <Field label="full name">
        <input
          required
          className={inputCls}
          value={form.name}
          onChange={set('name')}
          placeholder="Jane Smith"
        />
      </Field>
      <Field label="email">
        <input
          required
          type="email"
          className={inputCls}
          value={form.email}
          onChange={set('email')}
          placeholder="jane@example.com"
        />
      </Field>
      <Field label="password">
        <input
          required
          type="password"
          minLength={6}
          className={inputCls}
          value={form.password}
          onChange={set('password')}
          placeholder="min 6 characters"
        />
      </Field>
      <Field label="phone number">
        <input
          required
          type="tel"
          className={inputCls}
          value={form.phone_number}
          onChange={set('phone_number')}
          placeholder="+1 555 000 0000"
        />
      </Field>
      {isSuperAdmin && (
        <Field label="role">
          <select className={inputCls} value={form.role} onChange={set('role')}>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </Field>
      )}
    </ModalShell>
  );
}