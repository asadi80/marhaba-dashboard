// src/components/common/SectionTitle.jsx
//
// Italic serif heading used at the top of every card/panel. Accepts
// arbitrary children so callers can append a count badge, e.g.
// <SectionTitle>listings <span>(3)</span></SectionTitle>

export default function SectionTitle({ children }) {
  return (
    <div className="font-serif italic font-light text-lg text-[#111118] mb-4 pb-2 border-b border-black/[0.06] flex flex-wrap items-baseline gap-1.5">
      {children}
    </div>
  );
}