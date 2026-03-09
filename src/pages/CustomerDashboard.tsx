import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Send, 
  CreditCard, 
  History, 
  MessageSquare, 
  TrendingUp,
  Wallet,
  CheckCircle2,
  CheckCircle,
  Clock,
  XCircle,
  Landmark,
  Users,
  Settings,
  Shield,
  User,
  Plus,
  Trash2,
  Paperclip,
  FileText,
  Image as ImageIcon,
  LogOut,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/utils';
import CreditCardComp from '../components/CreditCard';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  writeBatch,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { 
  updatePassword, 
  updateEmail, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from 'firebase/auth';
import { db, storage, auth } from '../lib/firebase';

import { useSearchParams } from 'react-router-dom';

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      // Fetch Account
      const accountRef = doc(db, 'accounts', user.id);
      const accountSnap = await getDoc(accountRef);
      const accountData = accountSnap.exists() ? accountSnap.data() : null;

      // Fetch Transactions
      const txnsQuery = query(
        collection(db, 'transactions'),
        where('user_id', '==', user.id)
      );
      const txnsSnap = await getDocs(txnsQuery);
      const transactions = txnsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort on client side to avoid composite index requirement
      transactions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Calculate stats from transactions
      const income = transactions
        .filter((t: any) => t.type.includes('in') || t.type === 'deposit' || t.type === 'loan_disbursement' || (t.type === 'transfer' && t.recipient_id === user.id))
        .reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
      const expense = transactions
        .filter((t: any) => t.type.includes('out') || t.type === 'withdrawal' || t.type === 'loan_repayment' || (t.type === 'transfer' && t.user_id === user.id))
        .reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);

      // Generate chart data (last 7 days)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return {
          name: days[d.getDay()],
          date: d.toISOString().split('T')[0],
          income: 0,
          expense: 0
        };
      }).reverse();

      transactions.forEach((t: any) => {
        const tDate = new Date(t.created_at).toISOString().split('T')[0];
        const dayData = last7Days.find(d => d.date === tDate);
        if (dayData) {
          const amount = Number(t.amount) || 0;
          if (t.type.includes('in') || t.type === 'deposit' || t.type === 'loan_disbursement') {
            dayData.income += amount;
          } else {
            dayData.expense += amount;
          }
        }
      });

      // Spending categories
      const categories = [
        { name: 'Transfers', value: transactions.filter((t: any) => t.type.includes('transfer')).reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0) },
        { name: 'Loans', value: transactions.filter((t: any) => t.type.includes('loan')).reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0) },
        { name: 'Others', value: transactions.filter((t: any) => !t.type.includes('transfer') && !t.type.includes('loan')).reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0) }
      ].filter(c => c.value > 0);

      setData({ 
        account: accountData, 
        transactions, 
        income, 
        expense, 
        chartData: last7Days, 
        categories 
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-[80vh]">Loading...</div>;

  const chartData = [
    { name: 'Mon', income: 4000, expense: 2400 },
    { name: 'Tue', income: 3000, expense: 1398 },
    { name: 'Wed', income: 2000, expense: 9800 },
    { name: 'Thu', income: 2780, expense: 3908 },
    { name: 'Fri', income: 1890, expense: 4800 },
    { name: 'Sat', income: 2390, expense: 3800 },
    { name: 'Sun', income: 3490, expense: 4300 },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="flex flex-col gap-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-white border-4 border-white shadow-2xl overflow-hidden flex-shrink-0 transition-transform group-hover:scale-105 duration-300">
                  {user?.profile_picture ? (
                    <img 
                      src={user.profile_picture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                      <User className="w-6 h-6 md:w-8 md:h-8 text-zinc-300" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-black text-zinc-900 tracking-tight">
                  Hello, {user?.first_name} {user?.last_name}
                </h1>
                <p className="text-zinc-500 font-medium text-sm md:text-base">
                  Welcome back to your Moonstone account.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end mr-4">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Server Time</p>
                <p className="text-sm font-mono font-bold text-zinc-600">{new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <main className="min-h-[600px]">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Top Stats Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Card & Balance - Main Focus */}
                    <div className="lg:col-span-4 space-y-6">
                      <div className="relative group">
                        <CreditCardComp 
                          type="black" 
                          number={`**** **** **** ${data?.account?.account_number?.slice(-4) || '8888'}`}
                          holder={`${user?.first_name} ${user?.last_name}`}
                          className="shadow-2xl shadow-zinc-400/30 ring-1 ring-white/20"
                        />
                        <div className="absolute top-4 right-4">
                          <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                            <p className="text-[10px] font-bold text-white uppercase tracking-widest">Active</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-zinc-900 rounded-[2rem] p-8 text-white shadow-2xl shadow-zinc-900/20 relative overflow-hidden">
                        <div className="relative z-10">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Total Available Balance</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl md:text-5xl font-black tracking-tighter">
                              {formatCurrency(data?.account?.balance || 0)}
                            </span>
                          </div>
                          <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                            <div>
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Account Number</p>
                              <p className="font-mono text-sm font-bold tracking-wider">{data?.account?.account_number}</p>
                            </div>
                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                              <Wallet className="w-5 h-5 text-emerald-400" />
                            </div>
                          </div>
                        </div>
                        {/* Decorative background circle */}
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
                      </div>
                    </div>

                    {/* Income/Expense & Quick Actions */}
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-[2rem] p-8 border border-zinc-200/60 shadow-sm flex flex-col justify-between group hover:border-emerald-500/30 transition-all">
                        <div>
                          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                            <ArrowDownLeft className="w-7 h-7" />
                          </div>
                          <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest mb-2">Monthly Income</p>
                          <h3 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">
                            {formatCurrency(data?.income || 0)}
                          </h3>
                        </div>
                        <div className="mt-8 flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-zinc-100" />
                            ))}
                          </div>
                          <p className="text-xs font-bold text-zinc-400">+12% from last month</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-[2rem] p-8 border border-zinc-200/60 shadow-sm flex flex-col justify-between group hover:border-red-500/30 transition-all">
                        <div>
                          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-6 group-hover:scale-110 transition-transform">
                            <ArrowUpRight className="w-7 h-7" />
                          </div>
                          <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest mb-2">Monthly Expenses</p>
                          <h3 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">
                            {formatCurrency(data?.expense || 0)}
                          </h3>
                        </div>
                        <div className="mt-8 flex items-center gap-2">
                          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div className="w-[65%] h-full bg-red-500" />
                          </div>
                          <p className="text-xs font-bold text-zinc-400 whitespace-nowrap">65% of limit</p>
                        </div>
                      </div>

                      {/* Quick Actions Bento */}
                      <div className="md:col-span-2 bg-zinc-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                          <div className="text-center md:text-left">
                            <h3 className="text-2xl font-black tracking-tight mb-2">Quick Actions</h3>
                            <p className="text-zinc-400 font-medium">Manage your finances with one tap.</p>
                          </div>
                          <div className="flex flex-wrap justify-center gap-4">
                            {[
                              { label: 'Send Money', icon: Send, action: () => setActiveTab('transfers'), color: 'bg-emerald-500' },
                              { label: 'Pay Bills', icon: CreditCard, action: () => {}, color: 'bg-blue-500' },
                              { label: 'Add Funds', icon: Plus, action: () => {}, color: 'bg-zinc-700' },
                              { label: 'Support', icon: MessageSquare, action: () => setActiveTab('chat'), color: 'bg-zinc-700' }
                            ].map((btn, i) => (
                              <button
                                key={i}
                                onClick={btn.action}
                                className="flex flex-col items-center gap-3 group"
                              >
                                <div className={`w-16 h-16 ${btn.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:-translate-y-1 transition-all duration-300`}>
                                  <btn.icon className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{btn.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Background pattern */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts & Activity Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Cash Flow Chart */}
                    <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-zinc-200/60 p-8 shadow-sm">
                      <div className="flex items-center justify-between mb-10">
                        <div>
                          <h3 className="text-xl font-black text-zinc-900 tracking-tight">Cash Flow Analysis</h3>
                          <p className="text-zinc-400 text-sm font-medium">Your income vs expenses over the last 7 days</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Income</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Expense</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data?.chartData || []}>
                            <defs>
                              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} 
                              dy={10}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} 
                              dx={-10}
                              tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip 
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                              itemStyle={{ fontWeight: 700, fontSize: '12px' }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="income" 
                              stroke="#10b981" 
                              strokeWidth={4}
                              fillOpacity={1} 
                              fill="url(#colorIncome)" 
                            />
                            <Area 
                              type="monotone" 
                              dataKey="expense" 
                              stroke="#ef4444" 
                              strokeWidth={4}
                              strokeDasharray="8 8"
                              fillOpacity={1} 
                              fill="url(#colorExpense)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Recent Transactions Sidebar */}
                    <div className="lg:col-span-4 bg-white rounded-[2.5rem] border border-zinc-200/60 shadow-sm flex flex-col">
                      <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
                        <h3 className="text-xl font-black text-zinc-900 tracking-tight">Activity</h3>
                        <button 
                          onClick={() => setActiveTab('history')} 
                          className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
                        >
                          <ArrowUpRight className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto max-h-[400px] no-scrollbar p-2">
                        {data?.transactions?.length > 0 ? (
                          <div className="space-y-1">
                            {data.transactions.slice(0, 6).map((txn: any) => (
                              <div key={txn.id} className="p-4 rounded-2xl hover:bg-zinc-50 transition-all flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                                    txn.type.includes('in') || txn.type === 'deposit' || txn.type === 'loan_disbursement' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-900'
                                  }`}>
                                    {txn.type.includes('in') || txn.type === 'deposit' || txn.type === 'loan_disbursement' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                  </div>
                                  <div>
                                    <p className="font-bold text-zinc-900 text-sm truncate max-w-[120px]">{txn.description}</p>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{new Date(txn.created_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`font-black text-sm ${
                                    txn.type.includes('in') || txn.type === 'deposit' || txn.type === 'loan_disbursement' ? 'text-emerald-600' : 'text-zinc-900'
                                  }`}>
                                    {txn.type.includes('in') || txn.type === 'deposit' || txn.type === 'loan_disbursement' ? '+' : '-'}{formatCurrency(txn.amount)}
                                  </p>
                                  <span className={`text-[9px] font-black uppercase tracking-tighter ${
                                    txn.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'
                                  }`}>{txn.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <History className="w-8 h-8 text-zinc-200" />
                            </div>
                            <p className="text-zinc-400 font-bold text-sm">No activity yet</p>
                          </div>
                        )}
                      </div>
                      <div className="p-6 mt-auto">
                        <button 
                          onClick={() => setActiveTab('history')}
                          className="w-full py-4 bg-zinc-50 text-zinc-900 rounded-2xl font-bold text-sm hover:bg-zinc-100 transition-all"
                        >
                          View Full History
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'transfers' && <TransferView onComplete={fetchDashboardData} />}
              {activeTab === 'beneficiaries' && <BeneficiaryView />}
              {activeTab === 'loans' && <LoanView onComplete={fetchDashboardData} />}
              {activeTab === 'chat' && <ChatView />}
              {activeTab === 'history' && <HistoryView transactions={data?.transactions} />}
              {activeTab === 'settings' && <SettingsView />}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
};

// Sub-components for Customer Dashboard
const TransferView = ({ onComplete }: { onComplete: () => void }) => {
  const { user } = useAuth();
  const [type, setType] = useState<'local' | 'international'>('local');
  const [formData, setFormData] = useState({ 
    amount: '', 
    recipient_account: '', 
    recipient_name: '',
    bank_name: '',
    description: '', 
    pin: '', 
    swift_code: '' 
  });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const accountRef = doc(db, 'accounts', user.id);
      const accountSnap = await getDoc(accountRef);
      const accountData = accountSnap.data();
      
      if (accountData?.transfer_pin !== formData.pin) {
        throw new Error("Invalid Transfer PIN");
      }

      const amount = parseFloat(formData.amount);
      if (accountData?.balance < amount) {
        throw new Error("Insufficient funds");
      }

      const batch = writeBatch(db);
      const txnRef = doc(collection(db, 'transactions'));
      batch.set(txnRef, {
        user_id: user.id,
        amount: amount,
        description: formData.description || `Transfer to ${formData.recipient_name}`,
        type: 'transfer_out',
        status: 'pending',
        recipient_name: formData.recipient_name,
        recipient_account: formData.recipient_account,
        bank_name: formData.bank_name,
        swift_code: formData.swift_code || null,
        reference: 'TRF' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        created_at: new Date().toISOString()
      });

      batch.update(accountRef, {
        balance: accountData.balance - amount
      });

      await batch.commit();
      setShowSuccess(true);
      onComplete();
      setFormData({ 
        amount: '', 
        recipient_account: '', 
        recipient_name: '',
        bank_name: '',
        description: '', 
        pin: '', 
        swift_code: '' 
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <div className="bg-white rounded-[2.5rem] border border-zinc-200/60 p-8 md:p-12 shadow-sm">
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <div className="flex-1">
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight mb-2">Transfer Funds</h2>
            <p className="text-zinc-500 font-medium">Send money securely to any bank account worldwide.</p>
          </div>
          <div className="flex p-1.5 bg-zinc-100 rounded-2xl h-fit">
            <button 
              onClick={() => setType('local')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${type === 'local' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
            >
              Local
            </button>
            <button 
              onClick={() => setType('international')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${type === 'international' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
            >
              International
            </button>
          </div>
        </div>

        <form onSubmit={handleTransfer} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Recipient Details</label>
              <input 
                required
                className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                placeholder="Full Name"
                value={formData.recipient_name}
                onChange={(e) => setFormData({...formData, recipient_name: e.target.value})}
              />
              <input 
                required
                className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-sm"
                placeholder={type === 'local' ? 'Account Number' : 'IBAN / Account Number'}
                value={formData.recipient_account}
                onChange={(e) => setFormData({...formData, recipient_account: e.target.value})}
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Bank Information</label>
              <input 
                required
                className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                placeholder="Bank Name"
                value={formData.bank_name}
                onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
              />
              {type === 'international' && (
                <input 
                  required
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-sm"
                  placeholder="SWIFT / BIC Code"
                  value={formData.swift_code}
                  onChange={(e) => setFormData({...formData, swift_code: e.target.value})}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Transaction Details</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-zinc-400">$</span>
                <input 
                  type="number"
                  required
                  className="w-full pl-10 pr-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-black text-xl"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>
              <input 
                required
                className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                placeholder="Reference / Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Security Confirmation</label>
              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 mb-4">
                <p className="text-xs text-emerald-700 font-bold leading-relaxed">
                  Please enter your 4-digit Transfer PIN to authorize this transaction. This action cannot be undone.
                </p>
              </div>
              <input 
                type="password"
                maxLength={4}
                required
                className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-center text-2xl tracking-[1em]"
                placeholder="****"
                value={formData.pin}
                onChange={(e) => setFormData({...formData, pin: e.target.value})}
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-zinc-900 text-white py-6 rounded-[2rem] font-black text-lg hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-zinc-900/20 flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-6 h-6 text-emerald-400" />
                <span>Confirm {type === 'local' ? 'Local' : 'International'} Transfer</span>
              </>
            )}
          </button>
        </form>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-zinc-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[3rem] p-12 max-w-lg w-full text-center shadow-2xl relative"
          >
            <button 
              onClick={() => setShowSuccess(false)}
              className="absolute top-8 right-8 p-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-400 hover:text-zinc-900 transition-all"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 rotate-12">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-black text-zinc-900 mb-4 tracking-tighter uppercase">INITIATED</h2>
            <p className="text-zinc-500 text-lg font-medium leading-relaxed mb-10">
              Your transfer of <span className="text-zinc-900 font-black">{formatCurrency(parseFloat(formData.amount || '0'))}</span> has been initiated and is awaiting verification.
            </p>
            <button 
              onClick={() => setShowSuccess(false)}
              className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-zinc-800 transition-all active:scale-95"
            >
              RETURN TO DASHBOARD
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

const BeneficiaryView = () => {
  const { user } = useAuth();
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ name: '', account_number: '', bank_name: '' });

  useEffect(() => { 
    if (user) fetchBeneficiaries(); 
  }, [user]);

  const fetchBeneficiaries = async () => {
    if (!user) return;
    const q = query(collection(db, 'beneficiaries'), where('user_id', '==', user.id));
    const snap = await getDocs(q);
    setBeneficiaries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await addDoc(collection(db, 'beneficiaries'), {
      ...formData,
      user_id: user.id,
      created_at: new Date().toISOString()
    });
    setShowAdd(false);
    fetchBeneficiaries();
    setFormData({ name: '', account_number: '', bank_name: '' });
  };

  const deleteBeneficiary = async (id: string) => {
    if (!confirm('Remove this beneficiary?')) return;
    await deleteDoc(doc(db, 'beneficiaries', id));
    fetchBeneficiaries();
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-zinc-900 tracking-tight mb-2">Beneficiaries</h2>
          <p className="text-zinc-500 font-medium">Manage your trusted recipients for instant transfers.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-2xl shadow-zinc-900/20 hover:bg-zinc-800 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 text-emerald-400" /> 
          <span>Add New Recipient</span>
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="bg-white rounded-[2.5rem] border border-zinc-200/60 p-10 max-w-2xl w-full shadow-2xl shadow-zinc-900/20 relative"
          >
            <button 
              onClick={() => setShowAdd(false)}
              className="absolute top-8 right-8 p-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-400 hover:text-zinc-900 transition-all"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-black mb-8 tracking-tight">New Beneficiary</h3>
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Full Name</label>
                <input required className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Account Number</label>
                  <input required className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono" value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Bank Name</label>
                  <input required className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 bg-zinc-900 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-zinc-800 transition-all">Save Beneficiary</button>
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-zinc-100 text-zinc-600 py-5 rounded-2xl font-black hover:bg-zinc-200 transition-all">Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {beneficiaries.map((b: any) => (
          <div key={b.id} className="bg-white rounded-[2.5rem] border border-zinc-200/60 p-8 hover:shadow-2xl hover:-translate-y-2 transition-all group relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-900 text-white flex items-center justify-center font-black text-3xl shadow-2xl shadow-zinc-900/30 group-hover:bg-emerald-500 transition-colors">
                  {b.name.charAt(0)}
                </div>
                <button onClick={() => deleteBeneficiary(b.id)} className="w-10 h-10 flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <h4 className="font-black text-zinc-900 text-xl mb-1 tracking-tight">{b.name}</h4>
              <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest mb-6">{b.bank_name}</p>
              <div className="pt-6 border-t border-zinc-100 flex justify-between items-center">
                <p className="text-xs font-mono font-bold text-zinc-400 tracking-wider">{b.account_number}</p>
                <button 
                  onClick={() => {
                    alert('Transfer feature for beneficiaries coming soon!');
                  }}
                  className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Decorative background circle */}
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-zinc-50 rounded-full group-hover:bg-emerald-50 transition-colors duration-500" />
          </div>
        ))}
        {beneficiaries.length === 0 && !showAdd && (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-zinc-200">
            <div className="w-24 h-24 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Users className="w-10 h-10 text-zinc-200" />
            </div>
            <h3 className="text-zinc-900 font-black text-2xl mb-2 tracking-tight">No beneficiaries yet</h3>
            <p className="text-zinc-500 font-medium mb-10">Add your first recipient to start sending money faster.</p>
            <button onClick={() => setShowAdd(true)} className="bg-zinc-900 text-white px-10 py-4 rounded-2xl font-black shadow-2xl shadow-zinc-900/20 hover:bg-zinc-800 transition-all">Add Now</button>
          </div>
        )}
      </div>
    </div>
  );
};

const LoanView = ({ onComplete }: { onComplete: () => void }) => {
  const { user } = useAuth();
  const [loans, setLoans] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    if (user) fetchLoans(); 
  }, [user]);

  const fetchLoans = async () => {
    if (!user) return;
    const q = query(collection(db, 'loans'), where('user_id', '==', user.id));
    const snap = await getDocs(q);
    const loansList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    loansList.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setLoans(loansList);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'loans'), {
        user_id: user.id,
        amount: parseFloat(amount),
        purpose,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      alert('Loan application submitted!');
      fetchLoans();
      setAmount(''); setPurpose('');
    } finally {
      setLoading(false);
    }
  };

  const handleRepay = async (loanId: string, loanAmount: number) => {
    if (!user) return;
    if (!confirm(`Repay ${formatCurrency(loanAmount)} for this loan?`)) return;
    try {
      const accountRef = doc(db, 'accounts', user.id);
      const accountSnap = await getDoc(accountRef);
      const balance = accountSnap.data()?.balance || 0;

      if (balance < loanAmount) throw new Error("Insufficient balance to repay loan");

      const batch = writeBatch(db);
      batch.update(doc(db, 'loans', loanId), { status: 'paid' });
      batch.update(accountRef, { balance: balance - loanAmount });
      
      const txnRef = doc(collection(db, 'transactions'));
      batch.set(txnRef, {
        user_id: user.id,
        amount: loanAmount,
        description: 'Loan Repayment',
        type: 'loan_repayment',
        status: 'completed',
        reference: 'PAY' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        created_at: new Date().toISOString()
      });

      await batch.commit();
      alert('Loan repaid successfully');
      fetchLoans();
      onComplete();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Loan Application Form */}
      <div className="lg:col-span-5">
        <div className="bg-white rounded-[2.5rem] border border-zinc-200/60 p-8 md:p-10 shadow-sm sticky top-40">
          <div className="mb-8">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
              <TrendingUp className="w-7 h-7" />
            </div>
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight mb-2">Apply for a Loan</h2>
            <p className="text-zinc-500 font-medium">Get instant credit with flexible repayment options.</p>
          </div>

          <form onSubmit={handleApply} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Loan Amount</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-zinc-400">$</span>
                <input 
                  type="number" 
                  required 
                  placeholder="0.00" 
                  className="w-full pl-10 pr-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-black text-xl" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Purpose of Loan</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Business Expansion" 
                className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium" 
                value={purpose} 
                onChange={e => setPurpose(e.target.value)} 
              />
            </div>
            
            <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-emerald-500" />
                <span className="text-xs font-bold text-zinc-900 uppercase tracking-widest">Loan Terms</span>
              </div>
              <ul className="space-y-3">
                {[
                  'Fixed 5.5% APR',
                  'No hidden processing fees',
                  'Flexible 12-48 month terms',
                  'Instant approval for qualified users'
                ].map((term, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                    {term}
                  </li>
                ))}
              </ul>
            </div>

            <button 
              disabled={loading} 
              className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-zinc-800 transition-all disabled:opacity-50 shadow-xl shadow-zinc-900/20"
            >
              {loading ? 'Processing...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>

      {/* Loan List */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-black text-zinc-900 tracking-tight">Active & Past Loans</h3>
          <div className="px-4 py-1.5 bg-zinc-100 rounded-full">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{loans.length} Records</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {loans.length > 0 ? loans.map((loan: any) => (
            <div key={loan.id} className="bg-white rounded-[2rem] border border-zinc-200/60 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-emerald-500/30 transition-all group">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                  loan.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                  loan.status === 'paid' ? 'bg-zinc-100 text-zinc-400' : 'bg-amber-50 text-amber-600'
                }`}>
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-black text-zinc-900 text-lg tracking-tight">{formatCurrency(loan.amount)}</p>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      loan.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 
                      loan.status === 'paid' ? 'bg-zinc-100 text-zinc-400' : 'bg-amber-100 text-amber-600'
                    }`}>{loan.status}</span>
                  </div>
                  <p className="text-sm text-zinc-500 font-medium">{loan.purpose}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-100">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Applied On</p>
                  <p className="text-sm font-bold text-zinc-600">{new Date(loan.created_at).toLocaleDateString()}</p>
                </div>
                {loan.status === 'approved' && (
                  <button 
                    onClick={() => handleRepay(loan.id, loan.amount)}
                    className="bg-zinc-900 text-white px-6 py-3 rounded-xl text-sm font-black hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10 active:scale-95"
                  >
                    Repay Now
                  </button>
                )}
                {loan.status === 'paid' && (
                  <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-zinc-200">
              <div className="w-20 h-20 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-zinc-200" />
              </div>
              <h3 className="text-zinc-900 font-black text-xl mb-2 tracking-tight">No loan history</h3>
              <p className="text-zinc-500 font-medium">Apply for your first loan to see it here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ChatView = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [session, setSession] = useState<any>(null);

  const fetchMessages = async (sessionId: string) => {
    if (!sessionId) return;
    const msgQuery = query(
      collection(db, 'chat_messages'),
      where('session_id', '==', sessionId)
    );
    const mSnap = await getDocs(msgQuery);
    const msgs = mSnap.docs.map(d => d.data());
    msgs.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setMessages(msgs);
  };

  useEffect(() => {
    if (!user) return;
    
    const initChat = async () => {
      const sessionsRef = collection(db, 'chat_sessions');
      const q = query(sessionsRef, where('customerId', '==', user.id));
      const snap = await getDocs(q);
      
      let sessionId;
      if (snap.empty) {
        const newSession = await addDoc(sessionsRef, {
          customerId: user.id,
          last_message: '',
          unread_count: 0,
          updated_at: new Date().toISOString()
        });
        sessionId = newSession.id;
        setSession({ id: sessionId });
      } else {
        sessionId = snap.docs[0].id;
        setSession({ id: sessionId, ...snap.docs[0].data() });
      }

      await fetchMessages(sessionId);
    };

    initChat();
  }, [user]);

  const sendMessage = async (text = input) => {
    if (!text.trim() || !session || !user) return;
    const msgText = text;
    setInput('');
    
    await addDoc(collection(db, 'chat_messages'), {
      session_id: session.id,
      sender_id: user.id,
      message_text: msgText,
      created_at: new Date().toISOString()
    });
    
    await updateDoc(doc(db, 'chat_sessions', session.id), {
      last_message: msgText,
      updated_at: new Date().toISOString()
    });

    await fetchMessages(session.id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileRef = ref(storage, `chat/${user.id}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      const fileMsg = `[File: ${file.name}](${url})`;
      sendMessage(fileMsg);
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-[2.5rem] border border-zinc-200/60 shadow-2xl shadow-zinc-200/50 flex overflow-hidden h-[800px]">
        {/* Sidebar - Support Info */}
      <div className="hidden md:flex w-80 border-r border-zinc-100 flex-col bg-zinc-50/50">
        <div className="p-8">
          <h3 className="text-xl font-black text-zinc-900 tracking-tight mb-6">Concierge</h3>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-zinc-200/60 shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-zinc-900 text-sm mb-1">Secure Support</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">Your conversation is end-to-end encrypted and monitored by our security team.</p>
            </div>
            
            <div className="bg-zinc-900 p-6 rounded-2xl text-white shadow-xl shadow-zinc-900/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Live Status</span>
              </div>
              <p className="text-xs font-medium text-zinc-400 leading-relaxed">Average response time: <span className="text-white font-bold">Under 5 minutes</span></p>
            </div>
          </div>
        </div>
        <div className="mt-auto p-8 border-t border-zinc-100">
          <button className="w-full py-4 bg-white border border-zinc-200 rounded-xl text-xs font-black text-zinc-600 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            View Past Tickets
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <h3 className="font-black text-zinc-900 tracking-tight">Moonstone Support</h3>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Always Online</p>
            </div>
          </div>
          <button 
            onClick={() => session && fetchMessages(session.id)}
            className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
          >
            <History className="w-5 h-5" />
          </button>
        </div>

        {/* Messages View */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xs mx-auto">
              <div className="w-20 h-20 bg-zinc-50 rounded-[2rem] flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-zinc-200" />
              </div>
              <h4 className="text-zinc-900 font-black text-xl mb-2 tracking-tight">Start a Conversation</h4>
              <p className="text-zinc-500 text-sm font-medium">Our support team is ready to help you with any questions.</p>
            </div>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.sender_id === user?.id;
            const isFile = msg.message_text.startsWith('[File: ');
            const fileMatch = msg.message_text.match(/\[File: (.*)\]\((.*)\)/);
            
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] group ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`p-5 rounded-[2rem] text-sm font-medium shadow-sm ${
                    isMe 
                      ? 'bg-zinc-900 text-white rounded-tr-none' 
                      : 'bg-zinc-100 text-zinc-900 rounded-tl-none'
                  }`}>
                    {isFile && fileMatch ? (
                      <a href={fileMatch[2]} target="_blank" rel="noreferrer" className="flex items-center gap-3 group/file">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isMe ? 'bg-white/10' : 'bg-white'}`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold truncate max-w-[150px]">{fileMatch[1]}</p>
                          <p className="text-[10px] opacity-60 uppercase tracking-widest font-black">Download File</p>
                        </div>
                      </a>
                    ) : (
                      <p className="leading-relaxed">{msg.message_text}</p>
                    )}
                  </div>
                  <p className={`text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Area */}
        <div className="p-8 bg-white border-t border-zinc-100">
          <div className="flex items-center gap-4 bg-zinc-50 p-2 rounded-[2rem] border border-zinc-200/60 focus-within:border-emerald-500/50 focus-within:ring-4 focus-within:ring-emerald-500/5 transition-all">
            <div className="relative">
              <input 
                type="file" 
                id="chat-file" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <label 
                htmlFor="chat-file" 
                className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-white hover:shadow-sm transition-all ${uploading ? 'opacity-50' : ''}`}
              >
                <Paperclip className="w-5 h-5 text-zinc-400" />
              </label>
            </div>
            <input 
              className="flex-1 bg-transparent border-none outline-none px-2 py-3 font-medium text-zinc-900 placeholder:text-zinc-400"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendMessage()}
            />
            <button 
              onClick={() => sendMessage()} 
              className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20 active:scale-95"
            >
              <Send className="w-5 h-5 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

const HistoryView = ({ transactions }: { transactions: any[] }) => {
  const downloadReceipt = async (txnId: string) => {
    alert('Receipt generation is handled by the server. In this Firebase-only demo, please use the dashboard to view transaction details.');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-zinc-900 tracking-tight mb-2">Transaction History</h2>
          <p className="text-zinc-500 font-medium">A complete record of your financial activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-6 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-all flex items-center gap-2 shadow-sm">
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-zinc-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Transaction</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Date & Time</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Reference</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Amount</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {transactions?.length > 0 ? transactions.map((txn: any) => (
                <tr key={txn.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                        txn.type.includes('in') || txn.type === 'deposit' || txn.type === 'loan_disbursement' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-900'
                      }`}>
                        {txn.type.includes('in') || txn.type === 'deposit' || txn.type === 'loan_disbursement' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-black text-zinc-900 text-sm tracking-tight">{txn.description}</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{txn.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-zinc-600">{new Date(txn.created_at).toLocaleDateString()}</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{new Date(txn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-mono font-bold text-zinc-400 tracking-wider">{txn.reference || 'N/A'}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      txn.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 
                      txn.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                    }`}>{txn.status}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className={`font-black text-base tracking-tight ${
                      txn.type.includes('in') || txn.type === 'deposit' || txn.type === 'loan_disbursement' ? 'text-emerald-600' : 'text-zinc-900'
                    }`}>
                      {txn.type.includes('in') || txn.type === 'deposit' || txn.type === 'loan_disbursement' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => downloadReceipt(txn.id)}
                      className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ArrowDownLeft className="w-5 h-5 rotate-180" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="w-20 h-20 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                      <History className="w-10 h-10 text-zinc-200" />
                    </div>
                    <h3 className="text-zinc-900 font-black text-xl mb-2 tracking-tight">No transactions found</h3>
                    <p className="text-zinc-500 font-medium">Your financial activity will appear here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SettingsView = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [security, setSecurity] = useState({ currentPassword: '', newPassword: '', pin: '' });
  const [loadingStates, setLoadingStates] = useState({
    personal: false,
    email: false,
    picture: false,
    security: false
  });
  const [successStates, setSuccessStates] = useState({ personal: false, email: false, picture: false, security: false });

  useEffect(() => { 
    if (user) fetchProfile(); 
  }, [user]);

  const triggerSuccess = (key: keyof typeof successStates) => {
    setSuccessStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setSuccessStates(prev => ({ ...prev, [key]: false }));
    }, 3000);
  };

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (userDoc.exists()) {
        setProfile(userDoc.data());
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const handlePersonalUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoadingStates(prev => ({ ...prev, personal: true }));
    const formData = new FormData(e.target as HTMLFormElement);
    const updates = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
    };

    try {
      await updateDoc(doc(db, 'users', user.id), updates);
      triggerSuccess('personal');
      await fetchProfile();
    } catch (err: any) {
      alert(err.message || "Failed to update personal information");
    } finally {
      setLoadingStates(prev => ({ ...prev, personal: false }));
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auth.currentUser) return;
    setLoadingStates(prev => ({ ...prev, email: true }));
    const formData = new FormData(e.target as HTMLFormElement);
    const newEmail = formData.get('email') as string;

    try {
      if (newEmail && newEmail !== user.email) {
        try {
          await updateEmail(auth.currentUser, newEmail);
          await updateDoc(doc(db, 'users', user.id), { email: newEmail });
          triggerSuccess('email');
          await fetchProfile();
        } catch (emailErr: any) {
          if (emailErr.code === 'auth/requires-recent-login') {
            throw new Error('Please logout and login again to change your email address for security reasons.');
          }
          throw emailErr;
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to update email");
    } finally {
      setLoadingStates(prev => ({ ...prev, email: false }));
    }
  };

  const handlePictureUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !previewImage) return;

    setLoadingStates(prev => ({ ...prev, picture: true }));
    try {
      const fileRef = ref(storage, `profiles/${user.id}`);
      
      // Use uploadString with data_url which is often more reliable in sandboxed environments
      const uploadPromise = uploadString(fileRef, previewImage, 'data_url');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Upload timed out. This may be due to a slow connection or a large file. Please try again with a smaller image.")), 60000)
      );

      await Promise.race([uploadPromise, timeoutPromise]);
      
      const profile_picture = await getDownloadURL(fileRef);
      await updateDoc(doc(db, 'users', user.id), { profile_picture });
      
      triggerSuccess('picture');
      setPreviewImage(null);
      setSelectedFile(null);
      await fetchProfile();
    } catch (err: any) {
      console.error("Picture upload error:", err);
      alert(err.message || "Failed to upload profile picture. Please try a smaller image or check your connection.");
    } finally {
      setLoadingStates(prev => ({ ...prev, picture: false }));
    }
  };

  const handleSecurityUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auth.currentUser) return;
    setLoadingStates(prev => ({ ...prev, security: true }));
    try {
      // Re-authenticate if password change is requested
      if (security.newPassword) {
        if (!security.currentPassword) {
          throw new Error('Current password is required to change password');
        }
        const credential = EmailAuthProvider.credential(user.email, security.currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, security.newPassword);
      }

      triggerSuccess('security');
      setSecurity({ currentPassword: '', newPassword: '', pin: '' });
    } catch (err: any) {
      alert(err.message || "Failed to update security settings");
    } finally {
      setLoadingStates(prev => ({ ...prev, security: false }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-zinc-900 tracking-tight mb-2">Settings</h2>
          <p className="text-zinc-500 font-medium">Manage your account preferences and security.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-10">
          {/* Profile Picture Form */}
          <div className="bg-white rounded-[2.5rem] border border-zinc-200/60 p-8 md:p-10 shadow-sm">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <ImageIcon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Profile Picture</h3>
                <p className="text-zinc-500 text-sm font-medium">Update your account avatar.</p>
              </div>
            </div>

            <form onSubmit={handlePictureUpdate} className="space-y-8">
              <div className="flex flex-col sm:flex-row items-center gap-8 p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-[2rem] bg-white border-4 border-white shadow-xl overflow-hidden">
                    {previewImage ? (
                      <img src={previewImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : profile?.profile_picture ? (
                      <img src={profile.profile_picture} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-200">
                        <User className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-zinc-800 transition-all shadow-lg">
                    <ImageIcon className="w-5 h-5" />
                    <input 
                      type="file" 
                      name="profile_picture" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            alert("File is too large. Maximum size is 2MB.");
                            e.target.value = '';
                            return;
                          }
                          setSelectedFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPreviewImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-black text-zinc-900 text-lg mb-1">{profile?.first_name} {profile?.last_name}</h4>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">{user?.email}</p>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">Recommended size: 400x400px. Max file size: 2MB.</p>
                </div>
              </div>
              {previewImage && (
                <div className="flex gap-4">
                  <button disabled={loadingStates.picture} className={`flex-1 py-4 rounded-2xl font-black text-lg transition-all disabled:opacity-50 shadow-xl flex items-center justify-center gap-2 ${
                    successStates.picture ? 'bg-emerald-100 text-emerald-600 shadow-emerald-100' : 'bg-emerald-600 text-white shadow-emerald-900/20 hover:bg-emerald-700'
                  }`}>
                    {loadingStates.picture ? <Loader2 className="w-6 h-6 animate-spin" /> : successStates.picture ? <><CheckCircle2 className="w-6 h-6" /> Picture Saved</> : 'Save New Picture'}
                  </button>
                  {!successStates.picture && !loadingStates.picture && (
                    <button 
                      type="button"
                      onClick={() => { setPreviewImage(null); setSelectedFile(null); }}
                      className="px-6 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-black hover:bg-zinc-200 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Personal Information Form */}
          <div className="bg-white rounded-[2.5rem] border border-zinc-200/60 p-8 md:p-10 shadow-sm">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Personal Details</h3>
                <p className="text-zinc-500 text-sm font-medium">Update your name and contact info.</p>
              </div>
            </div>

            <form onSubmit={handlePersonalUpdate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">First Name</label>
                  <input name="first_name" defaultValue={profile?.first_name} className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Last Name</label>
                  <input name="last_name" defaultValue={profile?.last_name} className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Phone Number</label>
                <input name="phone" defaultValue={profile?.phone} className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Residential Address</label>
                <textarea name="address" defaultValue={profile?.address} className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium h-32 resize-none" />
              </div>

              <button disabled={loadingStates.personal} className={`w-full py-5 rounded-2xl font-black text-lg transition-all disabled:opacity-50 shadow-xl flex items-center justify-center gap-2 ${
                successStates.personal ? 'bg-emerald-50 text-emerald-600 shadow-emerald-50' : 'bg-zinc-900 text-white shadow-zinc-900/20 hover:bg-zinc-800'
              }`}>
                {loadingStates.personal ? <Loader2 className="w-6 h-6 animate-spin" /> : successStates.personal ? <><CheckCircle2 className="w-6 h-6" /> Details Updated</> : 'Update Personal Info'}
              </button>
            </form>
          </div>

          {/* Email Form */}
          <div className="bg-white rounded-[2.5rem] border border-zinc-200/60 p-8 md:p-10 shadow-sm">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Email Address</h3>
                <p className="text-zinc-500 text-sm font-medium">Change your registered email.</p>
              </div>
            </div>

            <form onSubmit={handleEmailUpdate} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Email Address</label>
                <input name="email" defaultValue={profile?.email} className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" />
              </div>

              <button disabled={loadingStates.email} className={`w-full py-5 rounded-2xl font-black text-lg transition-all disabled:opacity-50 shadow-xl flex items-center justify-center gap-2 ${
                successStates.email ? 'bg-emerald-50 text-emerald-600 shadow-emerald-50' : 'bg-zinc-900 text-white shadow-zinc-900/20 hover:bg-zinc-800'
              }`}>
                {loadingStates.email ? <Loader2 className="w-6 h-6 animate-spin" /> : successStates.email ? <><CheckCircle2 className="w-6 h-6" /> Email Updated</> : 'Update Email'}
              </button>
            </form>
          </div>
        </div>

        {/* Security Settings */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-zinc-200/60 p-8 md:p-10 shadow-sm">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Security</h3>
                <p className="text-zinc-500 text-sm font-medium">Protect your account and funds.</p>
              </div>
            </div>

            <form onSubmit={handleSecurityUpdate} className="space-y-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Change Password</h4>
                </div>
                <div className="space-y-4">
                  <input type="password" placeholder="Current Password" className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none font-bold" value={security.currentPassword} onChange={e => setSecurity({...security, currentPassword: e.target.value})} />
                  <input type="password" placeholder="New Password" className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none font-bold" value={security.newPassword} onChange={e => setSecurity({...security, newPassword: e.target.value})} />
                </div>
              </div>

              <button disabled={loadingStates.security} className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-2 ${
                successStates.security ? 'bg-emerald-50 text-emerald-600 shadow-emerald-50' : 'bg-zinc-900 text-white shadow-zinc-900/20 hover:bg-zinc-800'
              }`}>
                {loadingStates.security ? <Loader2 className="w-6 h-6 animate-spin" /> : successStates.security ? <><CheckCircle2 className="w-6 h-6" /> Security Updated</> : 'Update Security Settings'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
