import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Send, 
  History, 
  MessageSquare, 
  Settings,
  Activity,
  Shield,
  Users,
  ArrowRightLeft,
  TrendingUp
} from 'lucide-react';

const BottomNav = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  if (!isAuthenticated) return null;

  const customerFeatures = [
    { id: 'overview', icon: LayoutDashboard, label: 'Home' },
    { id: 'transfers', icon: Send, label: 'Pay' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'chat', icon: MessageSquare, label: 'Support' },
    { id: 'settings', icon: Settings, label: 'Menu' }
  ];

  const adminFeatures = [
    { id: 'overview', icon: Activity, label: 'Home' },
    { id: 'master', icon: Shield, label: 'Master' },
    { id: 'customers', icon: Users, label: 'Users' },
    { id: 'transactions', icon: ArrowRightLeft, label: 'Ledger' },
    { id: 'chat', icon: MessageSquare, label: 'Support' }
  ];

  const features = isAdmin ? adminFeatures : customerFeatures;
  const dashboardPath = isAdmin ? "/admin" : "/dashboard";

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-zinc-200 px-2 py-3 z-[100] flex items-center justify-around shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
      {features.slice(0, 5).map((item) => (
        <Link
          key={item.id}
          to={`${dashboardPath}?tab=${item.id}`}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all ${
            activeTab === item.id 
              ? 'text-emerald-600' 
              : 'text-zinc-400'
          }`}
        >
          <div className={`p-2 rounded-xl transition-all ${activeTab === item.id ? 'bg-emerald-50' : ''}`}>
            <item.icon className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNav;
