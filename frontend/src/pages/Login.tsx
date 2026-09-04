import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

export default function AuthPage() {
  const [view, setView] = useState('login'); // 'login', 'register', 'forgot-password'
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('customer');
  const [rememberMe, setRememberMe] = useState(false);
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        if (parsedUser.role === 'admin') {
          navigate('/admin');
        } else if (parsedUser.role === 'pharmacist') {
          navigate('/pharmacist/dashboard');
        } else if (parsedUser.role === 'customer') {
          navigate('/customer/dashboard');
        } else if (parsedUser.role === 'student') {
          navigate('/student/dashboard');
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch(e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, [navigate]);

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail && view === 'login') {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [view]);

  const validateLoginForm = () => {
    if (!email.trim()) return 'Email is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address.';
    if (!password) return 'Password is required.';
    return null;
  };

  const validateRegisterForm = () => {
    if (!name.trim()) return 'Full name is required.';
    if (!email.trim()) return 'Email is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address.';
    if (!password) return 'Password is required.';
    if (password.length < 8) return 'Password must be at least 8 characters long.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const validationError = validateLoginForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const data = await authApi.login({ email, password });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      const userRole = data.user.role;
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'pharmacist') {
        navigate('/pharmacist/dashboard');
      } else if (userRole === 'customer') {
        navigate('/customer/dashboard');
      } else if (userRole === 'student') {
        navigate('/student/dashboard');
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError('Unauthorized role.');
      }
      
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateRegisterForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      await authApi.register({ name, email, password, role });
      setSuccess("Account created successfully! Please log in.");
      setView('login');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email.trim()) {
      setError('Please enter your email address to receive a reset link.');
      return;
    }
    
    setSuccess(`If an account exists for ${email}, a password reset link has been sent.`);
    setTimeout(() => {
      setView('login');
      setSuccess('');
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#110f22] flex items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-[440px] bg-[#232136] rounded-[24px] p-8 sm:p-10 shadow-2xl relative">
        
        {/* Header / Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#9b51e0] to-[#7a39b7] rounded-2xl flex items-center justify-center shadow-lg shadow-[#9b51e0]/20 mb-5 transform transition-transform hover:scale-105">
            <span className="text-3xl leading-none select-none" role="img" aria-label="pill">💊</span>
          </div>
          <h1 className="text-[26px] font-bold text-white tracking-wide text-center">
            Pharmacy Inventory
          </h1>
          <p className="text-[#a09eb5] text-[15px] mt-2 text-center font-medium">
            {view === 'login' && 'Sign in to your account'}
            {view === 'register' && 'Start managing your prescriptions today'}
            {view === 'forgot-password' && 'Enter your email to receive a reset link'}
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-emerald-400 text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Login Form */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[#787596]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-[#312e4b] border border-[#312e4b] rounded-xl text-white placeholder-[#787596] focus:outline-none focus:border-[#9b51e0] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#787596]" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-[#312e4b] border border-[#312e4b] rounded-xl text-white placeholder-[#787596] focus:outline-none focus:border-[#9b51e0] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#787596] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5 mr-2.5">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="appearance-none w-5 h-5 border-2 border-[#a09eb5] rounded bg-transparent checked:bg-[#9b51e0] checked:border-[#9b51e0] transition-colors cursor-pointer"
                  />
                  <CheckCircle2 className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                </div>
                <span className="text-[14px] font-medium text-[#a09eb5] group-hover:text-white transition-colors">Remember me</span>
              </label>
              
              <button 
                type="button" 
                onClick={() => { setView('forgot-password'); setError(''); setSuccess(''); }} 
                className="text-[14px] font-medium text-[#9b51e0] hover:text-[#b876f8] transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <button 
              disabled={isLoading || !email || !password} 
              type="submit" 
              className="w-full flex items-center justify-center py-4 bg-[#9b51e0] hover:bg-[#8b45cd] active:bg-[#7a39b7] disabled:bg-[#9b51e0]/50 disabled:cursor-not-allowed text-white rounded-xl text-[16px] font-bold transition-colors mt-6"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>

            <div className="pt-6 text-center">
              <p className="text-[14px] text-[#a09eb5]">
                Don't have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => { setView('register'); setError(''); setSuccess(''); }} 
                  className="font-bold text-[#9b51e0] hover:text-[#b876f8] transition-colors"
                >
                  Create one
                </button>
              </p>
            </div>
          </form>
        )}

        {/* Register Form */}
        {view === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-[#787596]" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-3.5 bg-[#312e4b] border border-[#312e4b] rounded-xl text-white placeholder-[#787596] focus:outline-none focus:border-[#9b51e0] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[#787596]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-[#312e4b] border border-[#312e4b] rounded-xl text-white placeholder-[#787596] focus:outline-none focus:border-[#9b51e0] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#787596]" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Min. 8 characters"
                  className="w-full pl-12 pr-12 py-3.5 bg-[#312e4b] border border-[#312e4b] rounded-xl text-white placeholder-[#787596] focus:outline-none focus:border-[#9b51e0] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#787596] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#787596]" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  placeholder="Repeat password"
                  className="w-full pl-12 pr-12 py-3.5 bg-[#312e4b] border border-[#312e4b] rounded-xl text-white placeholder-[#787596] focus:outline-none focus:border-[#9b51e0] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#787596] hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Account Type</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#312e4b] border border-[#312e4b] rounded-xl text-white focus:outline-none focus:border-[#9b51e0] transition-colors appearance-none"
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
                <option value="pharmacist">Pharmacist</option>
              </select>
            </div>

            <button 
              disabled={isLoading || !name || !email || !password || !confirmPassword} 
              type="submit" 
              className="w-full flex items-center justify-center py-4 bg-[#9b51e0] hover:bg-[#8b45cd] active:bg-[#7a39b7] disabled:bg-[#9b51e0]/50 disabled:cursor-not-allowed text-white rounded-xl text-[16px] font-bold transition-colors mt-6"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Create Account'
              )}
            </button>

            <div className="pt-6 text-center">
              <p className="text-[14px] text-[#a09eb5]">
                Already have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => { setView('login'); setError(''); setSuccess(''); }} 
                  className="font-bold text-[#9b51e0] hover:text-[#b876f8] transition-colors"
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
        )}

        {/* Forgot Password Form */}
        {view === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[#787596]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-[#312e4b] border border-[#312e4b] rounded-xl text-white placeholder-[#787596] focus:outline-none focus:border-[#9b51e0] transition-colors"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={!email}
              className="w-full py-4 bg-[#9b51e0] hover:bg-[#8b45cd] active:bg-[#7a39b7] disabled:bg-[#9b51e0]/50 disabled:cursor-not-allowed text-white rounded-xl text-[16px] font-bold transition-colors mt-6"
            >
              Send Reset Link
            </button>

            <div className="pt-6 text-center">
              <button 
                type="button" 
                onClick={() => { setView('login'); setError(''); setSuccess(''); }} 
                className="font-bold text-[#9b51e0] hover:text-[#b876f8] transition-colors text-[14px]"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
