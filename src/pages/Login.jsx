// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { saveTokens, saveUser, clearAuthData } from '../utils/auth';

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] tracking-widest uppercase text-[#999] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="
        w-full px-3 py-2.5 rounded-lg text-[13px] text-[#111118]
        bg-[#fafaf8] border border-black/10
        placeholder:text-[#c0bfbb]
        outline-none
        transition-[border-color,background,box-shadow] duration-150
        hover:border-black/20
        focus:border-[#185FA5] focus:bg-white focus:shadow-[0_0_0_3px_rgba(24,95,165,0.08)]
      "
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const copy = {
    heroTitle: (
      <>
        Good to see
        <br />
        you again.
      </>
    ),
    heroSub: 'Sign in to manage your bookings, listings, and account settings.',
    stats: [
      { val: '10,000+', label: 'active travelers', color: '#378ADD' },
      { val: '5,000+', label: 'trusted hosts', color: '#e8c547' },
      { val: '98%', label: 'satisfaction rate', color: '#1D9E75' },
    ],
    welcome: 'Welcome back.',
    noAccount: 'No account yet?',
    signupFree: 'Sign up free',
    emailLabel: 'Email',
    emailPh: 'you@example.com',
    passLabel: 'Password',
    passPh: '••••••••',
    forgot: 'forgot?',
    submit: 'sign in →',
    submitting: 'signing in...',
    security: 'Protected by industry-standard encryption',
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://api.mar-haba.ly/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // ─── Save tokens from response ──────────────────────────────────────
      // Tokens are at data.data.tokens
      if (data.data?.tokens) {
        saveTokens(data.data.tokens);
        console.log('✅ Tokens saved');
      } else {
        console.warn('⚠️ No tokens in response');
      }

      // ─── Save user data from response ──────────────────────────────────
      // User is at data.data.user
      if (data.data?.user) {
        saveUser(data.data.user);
        console.log('✅ User data saved:', data.data.user);
      } else {
        console.warn('⚠️ No user data in response');
      }

      // ─── Redirect based on role ────────────────────────────────────────
      // Role is at data.data.user.role
      const userRole = data.data?.user?.role;
      console.log('👤 User role:', userRole);

      if (userRole === 'admin' || userRole === 'super_admin') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=Tajawal:wght@300;400;500;700;800&family=DM+Mono:wght@400;500&family=Fraunces:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .animate-fadeUp   { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .fu1 { animation-delay: 0.08s; }
        .fu2 { animation-delay: 0.16s; }
        .fu3 { animation-delay: 0.24s; }
        .animate-spin-fast { animation: spin 0.7s linear infinite; }
      `}</style>

      <div
        className="min-h-screen flex bg-[#f7f6f2]"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        {/* ── Left panel ────────────────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col justify-between w-[380px] shrink-0 bg-[#1a1a2e] px-12 py-10 border-r border-[#e8c547]/10 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -bottom-16 -end-16 w-56 h-56 rounded-full border border-[#e8c547]/[0.08] pointer-events-none" />
          <div className="absolute -bottom-5 -end-5 w-36 h-36 rounded-full border border-[#e8c547]/[0.06] pointer-events-none" />

          <div className="relative space-y-10">
            {/* Logo */}
            <Link
              to="/"
              className="no-underline text-[26px] text-white/90 tracking-wide"
              style={{ fontFamily: "'Cairo','Tajawal',sans-serif", fontWeight: 500 }}
            >
              مر<span className="font-bold text-[#e8c547]">حبا</span>
            </Link>

            {/* Hero text */}
            <div>
              <h2
                className="text-[38px] text-white font-light leading-[1.15] mb-4 italic"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {copy.heroTitle}
              </h2>
              <p className="text-[13px] text-white/35 leading-relaxed">{copy.heroSub}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-col gap-5 relative">
            {copy.stats.map(({ val, label, color }) => (
              <div key={label} style={{ borderTop: `3px solid ${color}` }} className="pt-3">
                <div
                  className="text-[26px] text-white font-light leading-none italic"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {val}
                </div>
                <div className="text-[10px] tracking-widest uppercase text-white/30 mt-1">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Right panel ───────────────────────────────────────────────────── */}
        <main className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
          <div className="w-full max-w-[360px]">
            {/* Top bar: mobile logo */}
            <div className="flex items-center justify-between mb-8">
              <Link
                to="/"
                className="no-underline font-medium text-[26px] text-[#1a1a2e] tracking-wide"
                style={{ fontFamily: "'Cairo','Tajawal',sans-serif" }}
              >
                مر<span className="font-bold text-[#e8c547]">حبا</span>
              </Link>
            </div>

            {/* Heading */}
            <div className="animate-fadeUp fu1 mb-8">
              <h1
                className="text-[32px] text-[#111118] font-light leading-tight mb-1.5 italic"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {copy.welcome}
              </h1>
            </div>

            {/* Error */}
            {error && (
              <div className="animate-fadeUp flex items-center gap-2 px-3.5 py-2.5 bg-[#FCEBEB] border border-[#a32d2d]/15 rounded-lg text-[12px] text-[#791F1F] mb-5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                  <circle cx="7" cy="7" r="6" stroke="#A32D2D" strokeWidth="1.2" />
                  <path d="M7 4v3.5M7 9.5h.01" stroke="#A32D2D" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="animate-fadeUp fu2 space-y-3.5">
              <Field label={copy.emailLabel}>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder={copy.emailPh}
                  value={formData.email}
                  onChange={handleChange}
                />
              </Field>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-[10px] tracking-widest uppercase text-[#999]"
                  >
                    {copy.passLabel}
                  </label>
                  <Link to="/forgot-password" className="text-[11px] text-[#185FA5] no-underline">
                    {copy.forgot}
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder={copy.passPh}
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full py-3 mt-2
                  bg-[#1a1a2e] text-[#e8c547]
                  rounded-xl border-none text-[13px] font-semibold tracking-wide
                  flex items-center justify-center gap-2
                  transition-[opacity,transform] duration-150
                  hover:enabled:opacity-90 hover:enabled:-translate-y-px
                  disabled:opacity-45 disabled:cursor-not-allowed
                  cursor-pointer
                "
              >
                {loading && (
                  <span className="animate-spin-fast inline-block w-3.5 h-3.5 rounded-full border-2 border-[#e8c547]/30 border-t-[#e8c547]" />
                )}
                {loading ? copy.submitting : copy.submit}
              </button>
            </form>

            {/* Security badge */}
            <div className="animate-fadeUp fu3 mt-7 text-center">
              <span className="inline-flex items-center gap-1.5 bg-[#1D9E75]/10 border border-[#1D9E75]/20 rounded-2xl px-3 py-1 text-[11px] text-[#0F6E56]">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M5 1L1.5 2.5v3C1.5 7.4 3 8.8 5 9.5c2-0.7 3.5-2.1 3.5-4V2.5L5 1z"
                    stroke="#0F6E56"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                </svg>
                {copy.security}
              </span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}