// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch, setAuthToken, setUser } from '../utils/auth';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (!response) return;

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store tokens and user data
      if (data.data?.tokens?.accessToken) {
        setAuthToken(data.data.tokens.accessToken);
        if (data.data.tokens.refreshToken) {
          localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        }
      }

      if (data.data?.user) {
        setUser(data.data.user);
        localStorage.setItem('userType', data.data.user.role);
      }

      // Redirect based on user role
      const userRole = data.data?.user?.role;
      if (userRole === 'admin' || userRole === 'super_admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div
            style={{
              fontFamily: "'Cairo', 'Tajawal', sans-serif",
              fontWeight: 500,
              fontSize: "32px",
              color: "#1a1a2e",
              letterSpacing: "1px",
            }}
          >
            مر<span style={{ fontWeight: 700, color: "#e8c547" }}>حبا</span>
          </div>
          <h2 className="mt-6 text-2xl font-light text-[#1a1a2e] font-serif italic">
            Admin Dashboard
          </h2>
          <p className="mt-2 text-sm text-[#999]">
            Sign in to access the admin panel
          </p>
        </div>

        {/* Login Form */}
        <div className="mt-8 bg-white rounded-xl border border-black/[0.06] p-6 sm:p-8 shadow-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-[10px] uppercase tracking-widest text-[#999] mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#fafaf8] border border-black/10 rounded-md text-[13px] text-[#111118] outline-none focus:border-[#185FA5] focus:bg-white transition-all"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-[10px] uppercase tracking-widest text-[#999] mb-1.5"
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-[11px] text-[#185FA5] hover:underline"
                  onClick={() => navigate('/forgot-password')}
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#fafaf8] border border-black/10 rounded-md text-[13px] text-[#111118] outline-none focus:border-[#185FA5] focus:bg-white transition-all"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="text-[12px] text-[#A32D2D] bg-[#FCEBEB] border border-[#A32D2D]/20 rounded-md px-4 py-2.5 flex items-start gap-2">
                <span className="text-sm">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md text-sm font-medium text-[#e8c547] bg-[#1a1a2e] hover:bg-[#16213e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a1a2e] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-4 w-4 border-2 border-[#e8c547] border-t-transparent rounded-full animate-spin"></span>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Demo Credentials (for development) */}
          <div className="mt-6 border-t border-black/[0.06] pt-6">
            <p className="text-[10px] uppercase tracking-widest text-[#999] text-center mb-3">
              Demo Credentials
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#fafaf8] rounded-md p-2 text-center">
                <p className="text-[#666]">Admin</p>
                <p className="text-[#111118] font-mono text-[10px] break-all">admin@example.com</p>
                <p className="text-[#999] text-[10px]">password: Admin@123</p>
              </div>
              <div className="bg-[#fafaf8] rounded-md p-2 text-center">
                <p className="text-[#666]">Super Admin</p>
                <p className="text-[#111118] font-mono text-[10px] break-all">super@example.com</p>
                <p className="text-[#999] text-[10px]">password: Super@123</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-[11px] text-[#999] hover:text-[#1a1a2e] transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}