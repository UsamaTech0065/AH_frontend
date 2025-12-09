import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token || '');

      // Redirect based on role
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else if (data.user.role === 'operator') {
        navigate('/counter/1');
      } else {
        navigate('/');
      }
    } catch (error) {
      setError(error.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-xl shadow-2xl bg-white dark:bg-slate-900/50 backdrop-blur-sm">
          {/* Branding Panel (Left Side) */}
          <div className="flex flex-col items-center justify-center bg-primary/10 dark:bg-primary/20 p-8 text-center">
            <div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary mb-4">
              <span className="material-symbols-outlined text-white text-5xl">
                local_hospital
              </span>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Razi Hospital</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Secure Medical Portal</p>
          </div>

          {/* Form Panel (Right Side) */}
          <div className="flex flex-col p-8 md:p-12">
            <h1 className="text-[#111816] dark:text-white tracking-light text-[32px] font-bold leading-tight text-left pb-3">
              Sign In
            </h1>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="error-message bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="error-icon text-red-500 mr-3">
                      <i className="fas fa-exclamation-circle"></i>
                    </div>
                    <div className="error-content">
                      <h4 className="text-red-800 font-medium">Authentication Failed</h4>
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col">
                <label className="text-[#111816] dark:text-slate-200 text-base font-medium leading-normal pb-2" htmlFor="username">
                  Username
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    
                  </span>
                  <input
                    className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111816] dark:text-white dark:bg-slate-800 focus:outline-0 focus:ring-2 focus:ring-primary/50 border ${
                      error ? 'border-red-300' : 'border-[#dbe6e4] dark:border-slate-700'
                    } bg-white focus:border-primary h-14 placeholder:text-[#5f8c81] dark:placeholder:text-slate-500 pl-12 pr-4 text-base font-normal leading-normal transition-shadow duration-200`}
                    id="username"
                    placeholder="Enter your username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-[#111816] dark:text-slate-200 text-base font-medium leading-normal pb-2" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                  </span>
                  <input
                    className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111816] dark:text-white dark:bg-slate-800 focus:outline-0 focus:ring-2 focus:ring-primary/50 border ${
                      error ? 'border-red-300' : 'border-[#dbe6e4] dark:border-slate-700'
                    } bg-white focus:border-primary h-14 placeholder:text-[#5f8c81] dark:placeholder:text-slate-500 pl-12 pr-4 text-base font-normal leading-normal transition-shadow duration-200`}
                    id="password"
                    placeholder="Enter your password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="mt-4">
                <button
                  className={`flex w-full min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-opacity-90 transition-colors duration-200 ${
                    loading || !username || !password ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  type="submit"
                  disabled={loading || !username || !password}
                >
                  {loading ? (
                    <>
                      <div className="button-spinner mr-2"></div>
                      Signing In...
                    </>
                  ) : (
                    <span className="truncate">Sign In</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <footer className="absolute bottom-4 text-center w-full">
        <p className="text-xs text-slate-500 dark:text-slate-400">© 2025 Razi Hospital. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Login;