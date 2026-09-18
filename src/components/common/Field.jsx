// src/components/common/Field.jsx
//
// Simple labeled wrapper for a single form control. Renders an uppercase
// mini-label above whatever input/select is passed in as `children`.

export default function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-[#999] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}