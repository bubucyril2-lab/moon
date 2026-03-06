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
  Image as ImageIcon
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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

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
        where('user_id', '==', user.id),
        orderBy('created_at', 'desc')
      );
      const txnsSnap = await getDocs(txnsQuery);
      const transactions = txnsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-8">
        {/* Horizontal Navigation */}
        <nav className="w-full overflow-x-auto no-scrollbar">
          <div className="bg-white rounded-2xl border border-zinc-200 p-2 flex gap-2 shadow-sm min-w-max md:min-w-0">
            {[
              { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
              { id: 'transfers', icon: Send, label: 'Transfers' },
              { id: 'beneficiaries', icon: Users, label: 'Beneficiaries' },
              { id: 'history', icon: History, label: 'History' },
              { id: 'loans', icon: TrendingUp, label: 'Loans' },
              { id: 'chat', icon: MessageSquare, label: 'Support Chat' },
              { id: 'settings', icon: Settings, label: 'Settings' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 min-w-[100px] md:min-w-[120px] flex items-center justify-center gap-2 px-3 md:px-4 py-3 rounded-xl text-xs md:text-sm font-medium transition-all ${
                  activeTab === item.id 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                    : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[2rem] bg-white border-2 border-white shadow-xl overflow-hidden flex-shrink-0">
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
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">Welcome back, {user?.first_name}</h1>
                    <p className="text-zinc-500 text-sm md:text-base">Here's what's happening with your accounts today.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setActiveTab('transfers')} className="flex-1 md:flex-none px-6 py-3 bg-zinc-900 text-white rounded-2xl font-bold shadow-lg shadow-zinc-200 hover:bg-zinc-800 transition-all">Send Money</button>
                  <button onClick={() => setActiveTab('history')} className="flex-1 md:flex-none px-6 py-3 bg-white border border-zinc-200 text-zinc-900 rounded-2xl font-bold hover:bg-zinc-50 transition-all">History</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <div className="max-w-sm mx-auto md:max-w-none">
                    <CreditCardComp 
                      type="black" 
                      number={`**** **** **** ${data?.account?.account_number?.slice(-4) || '8888'}`}
                      holder={`${user?.first_name} ${user?.last_name}`}
                      className="shadow-2xl shadow-zinc-300"
                    />
                  </div>
                  <div className="mt-4 p-4 bg-zinc-900 rounded-2xl text-white flex justify-between items-center max-w-sm mx-auto md:max-w-none">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest opacity-50">Balance</p>
                      <p className="text-xl font-bold">{formatCurrency(data?.account?.balance || 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest opacity-50">Account</p>
                      <p className="font-mono text-xs">{data?.account?.account_number}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl md:rounded-[2rem] p-6 md:p-8 border border-zinc-200 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 md:mb-6">
                      <ArrowDownLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <p className="text-zinc-500 text-sm mb-1">Total Income</p>
                    <h3 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">{formatCurrency(data?.income || 0)}</h3>
                  </div>
                  <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-zinc-100">
                    <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">This Month</p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl md:rounded-[2rem] p-6 md:p-8 border border-zinc-200 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-4 md:mb-6">
                      <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <p className="text-zinc-500 text-sm mb-1">Total Expenses</p>
                    <h3 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">{formatCurrency(data?.expense || 0)}</h3>
                  </div>
                  <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-zinc-100">
                    <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">This Month</p>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-zinc-200 p-6">
                  <h3 className="font-bold text-zinc-900 mb-6">Cash Flow</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data?.chartData || []}>
                        <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                        <Tooltip />
                        <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                        <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="transparent" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-zinc-200 p-6">
                  <h3 className="font-bold text-zinc-900 mb-6">Spending Categories</h3>
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data?.categories?.length > 0 ? data.categories : [{ name: 'No Data', value: 1 }]}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {(data?.categories || [{}]).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden">
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                  <h3 className="font-bold text-zinc-900">Recent Transactions</h3>
                  <button onClick={() => setActiveTab('history')} className="text-emerald-600 text-sm font-semibold hover:underline">View All</button>
                </div>
                <div className="divide-y divide-zinc-100 overflow-x-auto">
                  {data?.transactions?.length > 0 ? (
                    data.transactions.map((txn: any) => (
                      <div key={txn.id} className="p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors min-w-[500px] md:min-w-0">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            txn.type.includes('in') || txn.type === 'deposit' || txn.type === 'loan_disbursement' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {txn.type.includes('in') || txn.type === 'deposit' || txn.type === 'loan_disbursement' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900">{txn.description}</p>
                            <p className="text-xs text-zinc-500">{new Date(txn.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            txn.type.includes('in') || txn.type === 'deposit' || txn.type === 'loan_disbursement' ? 'text-emerald-600' : 'text-zinc-900'
                          }`}>
                            {txn.type.includes('in') || txn.type === 'deposit' || txn.type === 'loan_disbursement' ? '+' : '-'}{formatCurrency(txn.amount)}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            {txn.status === 'completed' ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3 text-amber-500" />}
                            <span className={`text-[10px] uppercase font-bold ${
                              txn.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'
                            }`}>{txn.status}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center text-zinc-500">No transactions yet.</div>
                  )}
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
        </main>
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
      // Verify PIN
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

      // Create Transaction
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

      // Deduct from balance
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-zinc-200 p-8 max-w-2xl mx-auto shadow-sm">
      <div className="flex gap-4 mb-8 p-1 bg-zinc-100 rounded-2xl">
        <button 
          onClick={() => setType('local')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${type === 'local' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-50'}`}
        >
          Local Transfer
        </button>
        <button 
          onClick={() => setType('international')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${type === 'international' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
        >
          International
        </button>
      </div>

      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-zinc-900">{type === 'local' ? 'Send Money Locally' : 'International Wire Transfer'}</h2>
        <p className="text-zinc-500 text-sm mt-1">
          {type === 'local' ? 'Transfer funds instantly to any local bank account.' : 'Send funds securely to international bank accounts worldwide.'}
        </p>
      </div>

      <form onSubmit={handleTransfer} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recipient Name</label>
            <input 
              required
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="John Doe"
              value={formData.recipient_name}
              onChange={(e) => setFormData({...formData, recipient_name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recipient Account</label>
            <input 
              required
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder={type === 'local' ? 'Account Number' : 'IBAN / Account Number'}
              value={formData.recipient_account}
              onChange={(e) => setFormData({...formData, recipient_account: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Bank Name</label>
            <input 
              required
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="Recipient Bank"
              value={formData.bank_name}
              onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Amount ($)</label>
            <input 
              type="number"
              required
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
            />
          </div>
        </div>

        {type === 'international' && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">SWIFT / BIC Code</label>
            <input 
              required
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="ABCDUS33"
              value={formData.swift_code}
              onChange={(e) => setFormData({...formData, swift_code: e.target.value})}
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Description</label>
          <input 
            required
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            placeholder="What is this for?"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Transfer PIN</label>
          <input 
            type="password"
            maxLength={4}
            required
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            placeholder="****"
            value={formData.pin}
            onChange={(e) => setFormData({...formData, pin: e.target.value})}
          />
        </div>

        <button 
          disabled={loading}
          className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-zinc-200"
        >
          {loading ? 'Processing...' : `Confirm ${type === 'local' ? 'Local' : 'International'} Transfer`}
        </button>
      </form>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[3rem] p-12 max-w-lg w-full text-center shadow-2xl border border-zinc-100"
          >
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-black text-zinc-900 mb-4 tracking-tighter uppercase">TRANSACTION SUCCESSFUL</h2>
            <p className="text-zinc-500 text-lg font-medium leading-relaxed mb-10">
              Your transfer has been initiated successfully. It is now pending administrator approval and will be processed shortly.
            </p>
            <button 
              onClick={() => setShowSuccess(false)}
              className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-zinc-800 transition-all active:scale-95"
            >
              DONE
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Beneficiaries</h2>
          <p className="text-zinc-500">Manage your saved recipients for quick transfers.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-zinc-200 hover:bg-zinc-800 transition-all"
        >
          <Plus className="w-5 h-5" /> Add Recipient
        </button>
      </div>

      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] border border-zinc-200 p-8 max-w-2xl shadow-xl">
          <h3 className="text-xl font-bold mb-6">New Beneficiary</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Full Name</label>
              <input required className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Account Number</label>
              <input required className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Bank Name</label>
              <input required className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})} />
            </div>
            <div className="flex gap-4 pt-4">
              <button type="submit" className="flex-1 bg-zinc-900 text-white py-4 rounded-xl font-bold">Save Beneficiary</button>
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-zinc-100 text-zinc-600 py-4 rounded-xl font-bold">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {beneficiaries.map((b: any) => (
          <div key={b.id} className="bg-white rounded-[2rem] border border-zinc-200 p-8 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-zinc-200">
                  {b.name.charAt(0)}
                </div>
                <button onClick={() => deleteBeneficiary(b.id)} className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <h4 className="font-bold text-zinc-900 text-lg mb-1">{b.name}</h4>
              <p className="text-zinc-500 text-sm mb-4">{b.bank_name}</p>
              <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
                <p className="text-xs font-mono text-zinc-400 tracking-wider">{b.account_number}</p>
                <button 
                  onClick={() => {
                    alert('Transfer feature for beneficiaries coming soon!');
                  }}
                  className="text-emerald-600 text-xs font-bold uppercase tracking-widest hover:underline"
                >
                  Send Money
                </button>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-zinc-50 rounded-full group-hover:scale-150 transition-all duration-500" />
          </div>
        ))}
        {beneficiaries.length === 0 && !showAdd && (
          <div className="col-span-full py-20 text-center bg-zinc-50 rounded-[2rem] border-2 border-dashed border-zinc-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Users className="w-10 h-10 text-zinc-200" />
            </div>
            <h3 className="text-zinc-900 font-bold text-lg mb-2">No beneficiaries yet</h3>
            <p className="text-zinc-500 mb-8">Add your first recipient to start sending money faster.</p>
            <button onClick={() => setShowAdd(true)} className="bg-zinc-900 text-white px-8 py-3 rounded-2xl font-bold">Add Now</button>
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
    const q = query(collection(db, 'loans'), where('user_id', '==', user.id), orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
    <div className="space-y-8">
      <div className="bg-white rounded-3xl border border-zinc-200 p-8 max-w-2xl">
        <h2 className="text-2xl font-bold text-zinc-900 mb-6">Apply for a Loan</h2>
        <form onSubmit={handleApply} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Loan Amount ($)</label>
            <input type="number" required placeholder="0.00" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Purpose of Loan</label>
            <input type="text" required placeholder="e.g. Business Expansion" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl" value={purpose} onChange={e => setPurpose(e.target.value)} />
          </div>
          <button disabled={loading} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all">
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden">
        <div className="p-6 border-b border-zinc-100 font-bold">My Loans</div>
        <div className="divide-y divide-zinc-100">
          {loans.length > 0 ? loans.map((loan: any) => (
            <div key={loan.id} className="p-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  loan.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 
                  loan.status === 'paid' ? 'bg-zinc-100 text-zinc-400' : 'bg-amber-100 text-amber-600'
                }`}>
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-zinc-900">{formatCurrency(loan.amount)}</p>
                  <p className="text-sm text-zinc-500">{loan.purpose}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                  loan.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 
                  loan.status === 'paid' ? 'bg-zinc-100 text-zinc-400' : 'bg-amber-100 text-amber-600'
                }`}>{loan.status}</span>
                {loan.status === 'approved' && (
                  <button 
                    onClick={() => handleRepay(loan.id, loan.amount)}
                    className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all"
                  >
                    Repay Now
                  </button>
                )}
              </div>
            </div>
          )) : (
            <div className="p-12 text-center text-zinc-500">No loan records found.</div>
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

      const msgQuery = query(
        collection(db, 'chat_messages'),
        where('session_id', '==', sessionId),
        orderBy('created_at', 'asc')
      );
      
      const unsubscribe = onSnapshot(msgQuery, (mSnap) => {
        setMessages(mSnap.docs.map(d => d.data()));
      });
      
      return unsubscribe;
    };

    const unsubPromise = initChat();
    return () => {
      unsubPromise.then(unsub => unsub && unsub());
    };
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
    <div className="bg-white rounded-3xl border border-zinc-200 h-[600px] flex flex-col">
      <div className="p-6 border-b border-zinc-100 flex items-center gap-3">
        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
        <h3 className="font-bold">Live Support</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => {
          const isFile = msg.message_text.startsWith('[File: ');
          const fileMatch = msg.message_text.match(/\[File: (.*)\]\((.*)\)/);
          
          return (
            <div key={i} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-4 rounded-2xl text-sm ${
                msg.sender_id === user?.id ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-zinc-100 text-zinc-900 rounded-tl-none'
              }`}>
                {isFile && fileMatch ? (
                  <a href={fileMatch[2]} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline">
                    <FileText className="w-4 h-4" />
                    {fileMatch[1]}
                  </a>
                ) : (
                  msg.message_text
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-6 border-t border-zinc-100 flex gap-4">
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
            className={`p-3 rounded-xl border border-zinc-200 flex items-center justify-center cursor-pointer hover:bg-zinc-50 transition-all ${uploading ? 'opacity-50' : ''}`}
          >
            <Paperclip className="w-5 h-5 text-zinc-500" />
          </label>
        </div>
        <input 
          className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={() => sendMessage()} className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition-all">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const HistoryView = ({ transactions }: { transactions: any[] }) => {
  const downloadReceipt = async (txnId: string) => {
    alert('Receipt generation is handled by the server. In this Firebase-only demo, please use the dashboard to view transaction details.');
  };

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden">
      <div className="p-6 border-b border-zinc-100 font-bold">Full Transaction History</div>
      <div className="divide-y divide-zinc-100">
        {transactions?.length > 0 ? transactions.map((txn: any) => (
          <div key={txn.id} className="p-6 flex justify-between items-center hover:bg-zinc-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                txn.type.includes('in') || txn.type === 'deposit' || txn.type === 'loan_disbursement' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
              }`}>
                {txn.type.includes('in') || txn.type === 'deposit' || txn.type === 'loan_disbursement' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-bold text-zinc-900">{txn.description}</p>
                <p className="text-xs text-zinc-500">{new Date(txn.created_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className={`font-bold ${txn.type.includes('in') || txn.type === 'deposit' || txn.type === 'loan_disbursement' ? 'text-emerald-600' : 'text-zinc-900'}`}>
                  {txn.type.includes('in') || txn.type === 'deposit' || txn.type === 'loan_disbursement' ? '+' : '-'}{formatCurrency(txn.amount)}
                </p>
                <span className="text-[10px] uppercase font-bold text-zinc-400">{txn.status}</span>
              </div>
              <button 
                onClick={() => downloadReceipt(txn.id)}
                className="p-2 text-zinc-400 hover:text-emerald-600 transition-colors"
                title="Download Receipt"
              >
                <ArrowDownLeft className="w-5 h-5 rotate-180" />
              </button>
            </div>
          </div>
        )) : (
          <div className="p-12 text-center text-zinc-500">No transaction records found.</div>
        )}
      </div>
    </div>
  );
};

const SettingsView = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [security, setSecurity] = useState({ currentPassword: '', newPassword: '', pin: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    if (user) fetchProfile(); 
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const userDoc = await getDoc(doc(db, 'users', user.id));
    setProfile(userDoc.data());
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const updates: any = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      phone: formData.get('phone'),
      address: formData.get('address'),
    };

    const file = (formData.get('profile_picture') as File);
    try {
      if (file && file.size > 0) {
        const fileRef = ref(storage, `profiles/${user.id}`);
        await uploadBytes(fileRef, file);
        updates.profile_picture = await getDownloadURL(fileRef);
      }
      
      await updateDoc(doc(db, 'users', user.id), updates);
      alert('Profile updated!');
      fetchProfile();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (security.pin) {
        await updateDoc(doc(db, 'accounts', user.id), { transfer_pin: security.pin });
      }
      alert('Security settings updated. Password changes must be handled via Firebase Auth.');
      setSecurity({ currentPassword: '', newPassword: '', pin: '' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-3xl border border-zinc-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-emerald-600" />
          <h2 className="text-xl font-bold">Profile Settings</h2>
        </div>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-zinc-100 overflow-hidden border-2 border-zinc-200">
              {profile?.profile_picture && <img src={profile.profile_picture} className="w-full h-full object-cover" />}
            </div>
            <input type="file" name="profile_picture" className="text-xs text-zinc-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input name="first_name" defaultValue={profile?.first_name} placeholder="First Name" className="px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl" />
            <input name="last_name" defaultValue={profile?.last_name} placeholder="Last Name" className="px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl" />
          </div>
          <input name="phone" defaultValue={profile?.phone} placeholder="Phone" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl" />
          <textarea name="address" defaultValue={profile?.address} placeholder="Address" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl h-24" />
          <button disabled={loading} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">
            {loading ? 'Saving...' : 'Update Profile'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-emerald-600" />
          <h2 className="text-xl font-bold">Security</h2>
        </div>
        <form onSubmit={handleSecurityUpdate} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Change Password</h3>
            <input type="password" placeholder="Current Password" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl" value={security.currentPassword} onChange={e => setSecurity({...security, currentPassword: e.target.value})} />
            <input type="password" placeholder="New Password" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl" value={security.newPassword} onChange={e => setSecurity({...security, newPassword: e.target.value})} />
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Transaction PIN</h3>
            <input type="password" maxLength={4} placeholder="Set 4-digit PIN" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl" value={security.pin} onChange={e => setSecurity({...security, pin: e.target.value})} />
          </div>
          <button className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold">Update Security</button>
        </form>
      </div>
    </div>
  );
};

export default CustomerDashboard;
