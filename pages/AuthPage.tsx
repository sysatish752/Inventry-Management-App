import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from '../App';
import type { User } from '../types';
import { Navigate } from 'react-router-dom';
import { MailIcon, LockClosedIcon } from '../components/Icons';

const AuthPage = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const { user, login } = useAuth();
  const [users, setUsers] = useLocalStorage<User[]>('users', [
    {
      id: 'default-user-01',
      email: 'satishy@zohomail.in',
      password: 'MakeIndiaGreat'
    }
  ]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to="/dashboard" />;
  }
  
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.find(u => u.email === email)) {
      setError('User with this email already exists.');
      return;
    }
    const newUser: User = { id: crypto.randomUUID(), email, password };
    setUsers([...users, newUser]);
    const { password: _, ...userToLogin } = newUser;
    login(userToLogin);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = users.find(u => u.email === email && u.password === password);
    if (foundUser) {
      const { password: _, ...userToLogin } = foundUser;
      login(userToLogin);
    } else {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-200">
      <div className="grid md:grid-cols-2">
        <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-12 text-center">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">Zenith</h1>
          <p className="text-xl text-indigo-100 max-w-sm">Your Modern Inventory Management Solution.</p>
        </div>

        <div className="flex flex-col justify-center items-center h-screen">
          <div className="w-full max-w-sm p-8 space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white">
                {isLoginView ? 'Welcome Back' : 'Create an Account'}
              </h2>
              <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                {isLoginView ? 'New to Zenith? ' : 'Already have an account? '}
                <button onClick={() => { setIsLoginView(!isLoginView); setError(''); }} className="font-medium text-indigo-600 hover:text-indigo-500">
                  {isLoginView ? 'Create an account' : 'Sign in'}
                </button>
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={isLoginView ? handleLogin : handleSignup}>
              <div className="space-y-4">
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <MailIcon />
                    </span>
                    <input
                        id="email-address"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 placeholder-slate-500 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <LockClosedIcon />
                    </span>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 placeholder-slate-500 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
              </div>
              
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 transition duration-150 ease-in-out shadow-sm"
                >
                  {isLoginView ? 'Sign in' : 'Sign up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;