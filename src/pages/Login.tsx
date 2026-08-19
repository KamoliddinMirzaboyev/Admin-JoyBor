import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { get, post } from '../data/api';

interface LoginResult {
  access?: string;
  refresh?: string;
  role?: string;
}

const Login: React.FC = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await post('/token/', { username: login, password }) as LoginResult;
      if (result.access) {
        // Token mavjud bo'lsa, sessionga saqlash va tizimga kirish
        sessionStorage.setItem('access', result.access);
        sessionStorage.setItem('isAuth', 'true');

        // Agar refresh token ham kelsa, uni ham saqlash
        if (result.refresh) {
          sessionStorage.setItem('refresh', result.refresh);
        }

        let role = result.role || '';
        try {
          const me = (await get('/me/')) as { role?: string };
          if (me?.role) role = me.role;
        } catch {
          // /me/ xato bersa token role'iga tayanamiz
        }

        const normalized = role.toLowerCase().replace(/[_\s-]/g, '');
        const blocked =
          (normalized.includes('student') ||
            normalized.includes('talaba') ||
            normalized.includes('sardor') ||
            normalized.includes('floorleader')) &&
          !normalized.includes('admin');
        if (blocked) {
          sessionStorage.removeItem('access');
          sessionStorage.removeItem('refresh');
          sessionStorage.removeItem('isAuth');
          sessionStorage.removeItem('userRole');
          const errorMsg = "Bu hisob admin emas. Admin login/paroli bilan kiring.";
          setError(errorMsg);
          toast.error(errorMsg);
          setLoading(false);
          return;
        }

        if (role) sessionStorage.setItem('userRole', role);

        toast.success('Muvaffaqiyatli kirdingiz!');
        setLoading(false);
        window.location.href = '/';
      } else {
        const errorMsg = 'Login yoki parol noto\'g\'ri!';
        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Tarmoqda xatolik. Qayta urinib ko\'ring.';
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 px-2">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm p-4 sm:p-8 w-full max-w-md border border-surface-200 dark:border-surface-800"
      >
        <div className="mb-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-white dark:bg-surface-800 rounded-2xl flex items-center justify-center shadow-sm border border-surface-100 dark:border-surface-700 p-3">
            <img src="/logoicon.png" alt="JoyBor Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white font-sans tracking-tight">Xush kelibsiz!</h2>
          <p className="text-surface-500 dark:text-surface-400 text-sm sm:text-base mt-2 font-sans">JoyBor Admin Paneliga kirish</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-surface-900 dark:text-surface-200 mb-1 font-sans">Login</label>
            <input
              type="text"
              className="w-full px-3 sm:px-4 py-2 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600 outline-none font-sans text-sm sm:text-base transition-colors duration-150"
              value={login}
              onChange={e => setLogin(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-surface-900 dark:text-surface-200 mb-1 font-sans">Parol</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full px-3 sm:px-4 py-2 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600 outline-none font-sans text-sm sm:text-base pr-10 transition-colors duration-150"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 focus:outline-none transition-colors duration-150"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.336-3.236.938-4.675m2.122 2.122A7.963 7.963 0 004 9c0 4.418 3.582 8 8 8 1.657 0 3.236-.336 4.675-.938m2.122-2.122A7.963 7.963 0 0020 15c0-4.418-3.582-8-8-8-1.657 0-3.236.336-4.675.938" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error && <div className="text-danger-600 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="w-full py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors duration-150 disabled:opacity-60 font-sans text-sm sm:text-base"
            disabled={loading}
          >
            {loading ? 'Tekshirilmoqda...' : 'Kirish'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;