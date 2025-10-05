import React, { useState, createContext, useContext, useMemo, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, NavLink, Navigate, useLocation } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import CustomersPage from './pages/CustomersPage';
import InvoicesPage from './pages/InvoicesPage';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { User } from './types';
import { DashboardIcon, InventoryIcon, CustomersIcon, InvoicesIcon, LogoutIcon, MenuIcon, CloseIcon } from './components/Icons';

// Auth Context
interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useLocalStorage<User | null>('authUser', null);

  const login = useCallback((userData: User) => {
    setUser(userData);
  }, [setUser]);

  const logout = useCallback(() => {
    setUser(null);
  }, [setUser]);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Protected Route Component
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

// Layout Components
const Sidebar: React.FC<{ isSidebarOpen: boolean }> = ({ isSidebarOpen }) => {
  const navItems = [
    { to: '/dashboard', icon: <DashboardIcon />, label: 'Dashboard' },
    { to: '/inventory', icon: <InventoryIcon />, label: 'Inventory' },
    { to: '/customers', icon: <CustomersIcon />, label: 'Customers' },
    { to: '/invoices', icon: <InvoicesIcon />, label: 'Invoices' },
  ];

  return (
    <aside className={`bg-slate-800 text-white transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'} fixed inset-y-0 left-0 z-30 md:relative md:translate-x-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} print:hidden`}>
      <div className="flex items-center justify-center h-20 border-b border-slate-700">
        <h1 className={`text-2xl font-bold ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
          {isSidebarOpen ? 'Zenith' : 'Z'}
        </h1>
      </div>
      <nav className="flex-grow mt-4">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `flex items-center py-3 px-6 my-1 transition-colors duration-200 ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'} ${!isSidebarOpen && 'justify-center'}`}
          >
            {item.icon}
            <span className={`mx-4 font-medium transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className={`absolute bottom-0 w-full border-t border-slate-700 ${!isSidebarOpen && 'flex justify-center'}`}>
        <LogoutButton isSidebarOpen={isSidebarOpen} />
      </div>
    </aside>
  );
};

const LogoutButton: React.FC<{ isSidebarOpen: boolean }> = ({ isSidebarOpen }) => {
    const { logout } = useAuth();
    return (
        <button onClick={logout} className="flex items-center py-3 px-6 my-1 w-full text-slate-400 hover:text-white hover:bg-slate-700">
            <LogoutIcon />
            <span className={`mx-4 font-medium transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>Logout</span>
        </button>
    );
};


const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const location = useLocation();
  const { user } = useAuth();
  const pageTitle = location.pathname.replace('/', '').charAt(0).toUpperCase() + location.pathname.slice(2) || 'Dashboard';
  
  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm h-20 flex items-center justify-between px-6 print:hidden">
      <div className="flex items-center">
        <button onClick={onMenuClick} className="text-gray-500 focus:outline-none md:hidden">
          <MenuIcon />
        </button>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white ml-4 md:ml-0">{pageTitle}</h1>
      </div>
      <div className="flex items-center">
        <span className="text-gray-600 dark:text-gray-300">Welcome, {user?.email}</span>
      </div>
    </header>
  );
};


// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};

const AppRouter = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  if (!user) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/auth" />} />
        </Routes>
      </HashRouter>
    );
  }

  return (
    <HashRouter>
      <div className="flex h-screen">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 p-6">
            <Routes>
              <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
              <Route path="/inventory" element={<PrivateRoute><InventoryPage /></PrivateRoute>} />
              <Route path="/customers" element={<PrivateRoute><CustomersPage /></PrivateRoute>} />
              <Route path="/invoices" element={<PrivateRoute><InvoicesPage /></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </main>
        </div>
      </div>
    </HashRouter>
  );
};


export default App;