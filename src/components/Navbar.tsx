import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Landmark, LogIn, UserPlus, LogOut, LayoutDashboard, User, Menu, X, Languages } from 'lucide-react';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

const Navbar = () => {
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const initTranslate = () => {
      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        window.googleTranslateElementInit();
      }
    };

    // Try immediately and then every second for a few times to handle slow loading
    initTranslate();
    const interval = setInterval(initTranslate, 1000);
    const timeout = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isAuthenticated]); // Re-run when auth state changes as the element might be remounted

  return (
    <nav className="sticky top-0 z-50">
      <div className="bg-white/80 backdrop-blur-xl border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <Landmark className="w-8 h-8 text-emerald-600" />
            <span className="text-xl font-bold text-zinc-900 tracking-tight">Moonstone</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {!isAuthenticated && (
              <>
                <Link to="/" className="text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors">Home</Link>
                <Link to="/about" className="text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors">About</Link>
                <Link to="/services" className="text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors">Services</Link>
                <Link to="/contact" className="text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors">Contact</Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Google Translate Desktop - Near Login */}
            <div className="hidden md:block">
              <div id="google_translate_element" className="scale-90"></div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link 
                    to={isAdmin ? "/admin" : "/dashboard"} 
                    className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors"
                  >
                    {user?.profile_picture ? (
                      <img 
                        src={user.profile_picture} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full object-cover border border-zinc-200"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
                        <User className="w-4 h-4 text-zinc-400" />
                      </div>
                    )}
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                  <button 
                    onClick={logout}
                    className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Open Account
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-zinc-200 py-4 px-4 space-y-4 shadow-xl animate-in slide-in-from-top duration-200">
          {!isAuthenticated ? (
            <>
              <div className="flex flex-col gap-2">
                <Link to="/" className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 rounded-lg">Home</Link>
                <Link to="/about" className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 rounded-lg">About</Link>
                <Link to="/services" className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 rounded-lg">Services</Link>
                <Link to="/contact" className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 rounded-lg">Contact</Link>
              </div>
              <div className="pt-4 border-t border-zinc-100 flex flex-col gap-2">
                <Link to="/login" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 rounded-lg">
                  <LogIn className="w-4 h-4" /> Login
                </Link>
                <Link to="/register" className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm">
                  <UserPlus className="w-4 h-4" /> Open Account
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-100 pb-4">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center"><User className="w-5 h-5 text-zinc-400" /></div>
                )}
                <div>
                  <p className="font-bold text-zinc-900">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-zinc-500 capitalize">{user?.role}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Link to={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 rounded-lg">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg w-full text-left">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </>
          )}
          <div className="px-4 pt-2">
            <div id="google_translate_element_mobile"></div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
