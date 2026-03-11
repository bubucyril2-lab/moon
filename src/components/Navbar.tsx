import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Landmark, 
  LogIn, 
  UserPlus, 
  LogOut, 
  LayoutDashboard, 
  User, 
  Users,
  Menu, 
  X, 
  Languages, 
  ArrowRight,
  Send,
  History,
  TrendingUp,
  MessageSquare,
  Settings,
  Activity,
  Shield,
  ArrowRightLeft,
  Phone,
  Info,
  Briefcase
} from 'lucide-react';
import { motion } from 'motion/react';

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

  const customerFeatures = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'transfers', icon: Send, label: 'Transfers' },
    { id: 'beneficiaries', icon: Users, label: 'Beneficiaries' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'loans', icon: TrendingUp, label: 'Loans' },
    { id: 'chat', icon: MessageSquare, label: 'Support' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  const adminFeatures = [
    { id: 'overview', icon: Activity, label: 'Overview' },
    { id: 'master', icon: Shield, label: 'Master' },
    { id: 'customers', icon: Users, label: 'Users' },
    { id: 'transactions', icon: ArrowRightLeft, label: 'Ledger' },
    { id: 'loans', icon: TrendingUp, label: 'Credit' },
    { id: 'chat', icon: MessageSquare, label: 'Support' },
    { id: 'settings', icon: Settings, label: 'System' }
  ];

  const features = isAdmin ? adminFeatures : customerFeatures;
  const dashboardPath = isAdmin ? "/admin" : "/dashboard";

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const initTranslate = () => {
      const translateEl = document.getElementById('google_translate_element');
      const translateElMobile = document.getElementById('google_translate_element_mobile');
      
      if (!translateEl && !translateElMobile) return;

      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        // Initialize desktop
        if (translateEl && !translateEl.querySelector('.goog-te-gadget')) {
          translateEl.innerHTML = '';
          try {
            new window.google.translate.TranslateElement({
              pageLanguage: 'en',
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false
            }, 'google_translate_element');
          } catch (e) {
            console.error('Desktop translate init failed', e);
          }
        }

        // Initialize mobile
        if (translateElMobile && !translateElMobile.querySelector('.goog-te-gadget')) {
          translateElMobile.innerHTML = '';
          try {
            new window.google.translate.TranslateElement({
              pageLanguage: 'en',
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false
            }, 'google_translate_element_mobile');
          } catch (e) {
            console.error('Mobile translate init failed', e);
          }
        }
      }
    };

    // Global callback for the script
    window.googleTranslateElementInit = initTranslate;

    // Ensure script is loaded
    const scriptId = 'google-translate-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    } else if (window.google && window.google.translate) {
      initTranslate();
    }

    // Polling is necessary because React might re-render the Navbar and remove the element
    const interval = setInterval(initTranslate, 1500);
    
    return () => clearInterval(interval);
  }, [location.pathname, isAuthenticated]);

  return (
    <nav className={`sticky top-0 z-50 ${isAuthenticated ? 'lg:hidden' : ''}`}>
      {/* Top Utility Bar */}
      <div className="bg-zinc-900 text-white py-2 border-b border-white/5 relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-2">
          <div className="hidden sm:flex items-center gap-4 sm:gap-6 overflow-visible no-scrollbar">
            <Link to="/" className="text-[10px] font-black uppercase tracking-widest hover:text-emerald-400 transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <Landmark className="w-3 h-3" /> <span>Home</span>
            </Link>
            <Link to="/services" className="text-[10px] font-black uppercase tracking-widest hover:text-emerald-400 transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <Briefcase className="w-3 h-3" /> <span>Services</span>
            </Link>
            <Link to="/about" className="text-[10px] font-black uppercase tracking-widest hover:text-emerald-400 transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <Info className="w-3 h-3" /> <span>About</span>
            </Link>
            <Link to="/contact" className="text-[10px] font-black uppercase tracking-widest hover:text-emerald-400 transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <Phone className="w-3 h-3" /> <span>Contact</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 ml-auto sm:ml-0 relative z-[60]">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-md border border-white/20 relative z-[70] hover:bg-white/20 transition-colors cursor-pointer">
              <Languages className="w-4 h-4 text-emerald-400 pointer-events-none" />
              <div id="google_translate_element" className="min-w-[140px] h-6 flex items-center justify-center relative z-[80]"></div>
            </div>
            {!isAuthenticated && (
              <Link to="/login" className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-2 sm:px-3 py-1 rounded-md hover:bg-white/20 transition-all whitespace-nowrap">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="bg-amber-50/40 backdrop-blur-xl border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                <Landmark className="w-8 h-8 text-emerald-600" />
                <span className="text-xl font-bold text-zinc-900 tracking-tight">Moonstone</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              <Link to="/" className="text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors whitespace-nowrap">Home</Link>
              {isAuthenticated && (
                <Link to={dashboardPath} className="text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors whitespace-nowrap">Dashboard</Link>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Desktop Auth */}
              <div className="hidden lg:flex items-center gap-4">
                {isAuthenticated ? (
                  <>
                    <Link 
                      to={dashboardPath} 
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
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <span>My Account</span>
                    </Link>
                    <button 
                      onClick={logout}
                      className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <Link 
                    to="/register" 
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Open Account
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Navigation Rows */}
          <div className="lg:hidden">
            {/* Links Row */}
            <div className="flex items-center gap-6 py-3 border-t border-zinc-200 overflow-x-auto no-scrollbar">
              <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-zinc-600 whitespace-nowrap">Home</Link>
              <Link to="/services" className="text-[10px] font-black uppercase tracking-widest text-zinc-600 whitespace-nowrap">Services</Link>
              <Link to="/about" className="text-[10px] font-black uppercase tracking-widest text-zinc-600 whitespace-nowrap">About</Link>
              <Link to="/contact" className="text-[10px] font-black uppercase tracking-widest text-zinc-600 whitespace-nowrap">Contact</Link>
              {isAuthenticated && (
                <Link to={dashboardPath} className="text-[10px] font-black uppercase tracking-widest text-emerald-600 whitespace-nowrap">Dashboard</Link>
              )}
            </div>

            {/* Auth Row */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-3 py-3 border-t border-zinc-200">
                <Link to="/login" className="flex-1 text-center py-2.5 bg-zinc-100 text-zinc-900 rounded-xl text-[10px] font-black uppercase tracking-widest">Login</Link>
                <Link to="/register" className="flex-1 text-center py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Open Account</Link>
              </div>
            ) : (
              <div className="flex items-center justify-between py-3 border-t border-zinc-200">
                <Link to={dashboardPath} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                   <User className="w-4 h-4" /> My Account
                </Link>
                <button onClick={logout} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-600">
                   <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    {/* Mobile Menu Overlay */}
    {isMobileMenuOpen && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] md:hidden"
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Menu Content */}
        <motion.div 
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-amber-50/95 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <div className="flex items-center gap-2">
              <Landmark className="w-6 h-6 text-emerald-600" />
              <span className="text-lg font-black text-zinc-900 tracking-tighter uppercase">Moonstone</span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-3 bg-white border border-zinc-200 rounded-2xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-all shadow-sm"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] ml-4">Navigation</p>
              <div className="grid gap-2">
                {[
                  { to: '/', label: 'Home', icon: Landmark },
                  { to: '/about', label: 'About', icon: Info },
                  { to: '/services', label: 'Services', icon: Briefcase },
                  { to: '/contact', label: 'Contact', icon: Phone }
                ].map((link) => (
                  <Link 
                    key={link.to}
                    to={link.to} 
                    className="px-6 py-4 text-lg font-black text-zinc-900 hover:bg-zinc-50 rounded-2xl transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <link.icon className="w-5 h-5 text-white group-hover:text-emerald-600 transition-colors" />
                      {link.label}
                    </div>
                    <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>

            {isAuthenticated ? (
              <>
                <div className="p-8 bg-zinc-900 rounded-[2rem] text-white shadow-2xl shadow-zinc-200 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden">
                      {user?.profile_picture ? (
                        <img src={user.profile_picture} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><User className="w-8 h-8 text-white" /></div>
                      )}
                    </div>
                    <div>
                      <p className="font-black text-xl tracking-tight">{user?.first_name} {user?.last_name}</p>
                      <p className="text-[10px] text-white font-black uppercase tracking-widest mt-1">{user?.role}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] ml-4">Dashboard Features</p>
                  <div className="grid gap-2">
                    {features.map((item) => (
                      <Link 
                        key={item.id}
                        to={`${dashboardPath}?tab=${item.id}`} 
                        className="px-6 py-4 text-lg font-black text-zinc-900 hover:bg-zinc-50 rounded-2xl transition-all flex items-center gap-4 group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-white group-hover:bg-zinc-900 group-hover:text-white transition-all">
                          <item.icon className="w-5 h-5" />
                        </div>
                        {item.label}
                      </Link>
                    ))}
                    <button onClick={logout} className="px-6 py-4 text-lg font-black text-red-600 hover:bg-red-50 rounded-2xl transition-all flex items-center gap-4 w-full text-left group">
                      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-400 group-hover:bg-red-600 group-hover:text-white transition-all">
                        <LogOut className="w-5 h-5" />
                      </div>
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] ml-4">Account Access</p>
                <div className="grid gap-4">
                  <Link to="/login" className="flex items-center justify-center gap-3 px-6 py-5 text-lg font-black text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-[1.5rem] hover:bg-zinc-100 transition-all">
                    <LogIn className="w-5 h-5" /> Login
                  </Link>
                  <Link to="/register" className="flex items-center justify-center gap-3 px-6 py-5 text-lg font-black text-white bg-emerald-600 rounded-[1.5rem] hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all">
                    <UserPlus className="w-5 h-5" /> Open Account
                  </Link>
                </div>
              </div>
            )}

            <div className="pt-10 border-t border-zinc-100">
              <div className="flex items-center gap-3 mb-6 text-zinc-900 ml-4">
                <Languages className="w-4 h-4 text-emerald-600 pointer-events-none" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Regional Settings</span>
              </div>
            <div className="bg-zinc-50 p-6 rounded-[1.5rem] border border-zinc-200 relative z-50">
                <div id="google_translate_element_mobile" className="flex justify-center relative z-50"></div>
                <p className="text-[10px] text-zinc-400 font-medium text-center mt-4 uppercase tracking-widest">Select your preferred language</p>
              </div>
            </div>
          </div>

          <div className="p-8 bg-zinc-50 border-t border-zinc-100">
            <p className="text-[10px] text-white font-bold text-center uppercase tracking-widest">© 2026 Moonstone Bank Global</p>
          </div>
        </motion.div>
      </motion.div>
    )}
  </nav>
  );
};

export default Navbar;
