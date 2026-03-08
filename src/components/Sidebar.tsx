import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Landmark, 
  LogOut, 
  LayoutDashboard, 
  User, 
  Users,
  Send,
  History,
  TrendingUp,
  MessageSquare,
  Settings,
  Activity,
  Shield,
  ArrowRightLeft,
  Briefcase,
  Info,
  Phone
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const Sidebar = () => {
  const { isAdmin, logout, user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

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

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-zinc-200 h-screen sticky top-0 overflow-hidden">
      <div className="p-8 border-b border-zinc-100">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <Landmark className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black text-zinc-900 tracking-tighter uppercase">Moonstone</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-4 mb-4">Main Menu</p>
          <div className="grid gap-1">
            {features.map((item) => (
              <Link 
                key={item.id}
                to={`${dashboardPath}?tab=${item.id}`} 
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-black text-sm transition-all group ${
                  activeTab === item.id 
                    ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-200' 
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-900'}`} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-8 border-t border-zinc-100">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-4 mb-4">Quick Links</p>
          <div className="grid gap-1">
            {[
              { to: '/', label: 'Home', icon: Landmark },
              { to: '/services', label: 'Services', icon: Briefcase },
              { to: '/about', label: 'About', icon: Info },
              { to: '/contact', label: 'Contact', icon: Phone }
            ].map((link) => (
              <Link 
                key={link.to}
                to={link.to} 
                className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-black text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-all group"
              >
                <link.icon className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-zinc-100 space-y-4">
        <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
          <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 overflow-hidden">
            {user?.profile_picture ? (
              <img src={user.profile_picture} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-zinc-400" /></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-zinc-900 truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest truncate">{user?.role}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-black text-sm text-red-600 hover:bg-red-50 transition-all group"
        >
          <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-600" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
