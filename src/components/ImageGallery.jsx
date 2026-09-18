// src/components/ImageGallery.jsx
//
// Renders a grid of document images (or PDF "open" tiles) with a
// click-to-zoom lightbox for images. Handles both absolute URLs and
// relative API paths (prefixed with VITE_API_URL).

import { useState } from "react";

export default function ImageGallery({ images, title, emptyMessage }) {
  // Currently zoomed-in image URL, or null when the lightbox is closed.
  const [lightboxImg, setLightboxImg] = useState(null);

  // Normalizes a stored image path into a fully-qualified URL the
  // browser can actually load: leaves absolute URLs untouched, and
  // prefixes relative/API-stored paths with the configured API base URL.
  const toDisplayUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    const apiUrl = import.meta.env.VITE_API_URL;
    return `${apiUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
  };

  if (!images?.length) {
    return (
      <div className="flex items-center justify-center py-10 text-[#bbb] text-sm">
        {emptyMessage || "No images uploaded yet."}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((url, i) => {
          // PDFs (or anything served from a "/raw/" path) get a document
          // tile that opens in a new tab instead of an inline thumbnail.
          const isPdf =
            url.toLowerCase().includes(".pdf") ||
            url.includes("/raw/");
          return isPdf ? (
            <a
              key={i}
              href={toDisplayUrl(url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-2 border border-black/10 rounded-lg p-4 sm:p-6 text-center hover:bg-[#fafaf8] transition-all"
            >
              <span className="text-3xl">📄</span>
              <span className="text-[11px] text-[#185FA5]">
                {title || "Document"} — open
              </span>
            </a>
          ) : (
            <div
              key={i}
              className="relative group rounded-lg overflow-hidden border border-black/10"
            >
              <img
                src={toDisplayUrl(url)}
                alt={`${title || "Document"} ${i + 1}`}
                className="w-full h-28 sm:h-32 object-cover cursor-zoom-in transition-transform duration-200 group-hover:scale-[1.02]"
                onClick={() => setLightboxImg(url)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all pointer-events-none rounded-lg" />
              <a
                href={toDisplayUrl(url)}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 text-[10px] bg-white/90 px-2 py-1 rounded text-[#185FA5] transition-all"
              >
                open ↗
              </a>
            </div>
          );
        })}
      </div>

      {/* Lightbox: full-screen overlay for the currently selected image */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <img
            src={toDisplayUrl(lightboxImg)}
            alt="Document"
            className="max-w-full max-h-[90vh] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 text-white/60 hover:text-white text-3xl leading-none"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}