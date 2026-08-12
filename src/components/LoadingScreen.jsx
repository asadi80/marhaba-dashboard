// src/components/LoadingScreen.jsx
export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1a1a2e] border-t-[#e8c547]"></div>
        <p className="text-[#999] text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}