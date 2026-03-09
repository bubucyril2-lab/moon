import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  CreditCard, 
  TrendingUp, 
  ShieldCheck, 
  Search,
  MoreVertical,
  Activity,
  DollarSign,
  Clock,
  Plus,
  Minus,
  ArrowRightLeft,
  Settings,
  User,
  Shield,
  MessageSquare,
  Edit,
  Trash2,
  Key,
  Globe,
  Palette,
  Layout,
  Calendar,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/utils';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc,
  getDoc,
  setDoc,
  writeBatch,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const MasterControlRow = ({ customer, onUpdate, onDelete, onAction, formatCurrency }: any) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdjustment = async (type: 'credit' | 'debit') => {
    if (!amount || isNaN(parseFloat(amount))) return;
    setLoading(true);
    try {
      const val = parseFloat(amount);
      const adjustment = type === 'credit' ? val : -val;
      const accountRef = doc(db, 'accounts', customer.id);
      const accountSnap = await getDoc(accountRef);
      
      const batch = writeBatch(db);
      if (!accountSnap.exists()) {
        const accountNumber = "MS" + Math.floor(1000000000 + Math.random() * 9000000000);
        batch.set(accountRef, {
          user_id: customer.id,
          account_number: accountNumber,
          balance: adjustment,
          status: 'active',
          created_at: new Date().toISOString()
        });
      } else {
        batch.update(accountRef, { balance: (accountSnap.data().balance || 0) + adjustment });
      }

      const txnRef = doc(collection(db, 'transactions'));
      batch.set(txnRef, {
        user_id: customer.id,
        amount: adjustment,
        description: `Bank ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        type: type,
        status: 'completed',
        reference: 'ADJ' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        created_at: new Date().toISOString()
      });

      await batch.commit();
      setAmount('');
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr className="hover:bg-zinc-50/50 transition-all border-b border-zinc-100 group">
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center border border-zinc-200 overflow-hidden shadow-sm">
            {customer.profile_picture ? (
              <img src={customer.profile_picture} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="text-zinc-400 font-black text-lg">
                {customer.first_name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <p className="font-black text-zinc-900 text-sm tracking-tight">{customer.first_name} {customer.last_name}</p>
            <p className="text-[11px] text-zinc-500 font-medium">{customer.email}</p>
          </div>
        </div>
      </td>
      <td className="px-8 py-6">
        <p className="text-xs font-mono font-bold text-zinc-600 tracking-wider">{customer.account_number || 'NO ACCOUNT'}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">PIN: {customer.transfer_pin || '----'}</p>
          <button onClick={() => onAction(customer, 'reset')} className="p-1 hover:bg-zinc-100 rounded-md transition-all text-zinc-400 hover:text-zinc-900">
            <Edit className="w-3 h-3" />
          </button>
        </div>
      </td>
      <td className="px-8 py-6">
        <p className="text-base font-black text-zinc-900 tracking-tight">{formatCurrency(customer.balance || 0)}</p>
      </td>
      <td className="px-8 py-6">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[10px] font-bold">$</span>
            <input 
              type="number" 
              placeholder="0.00" 
              className="w-28 pl-6 pr-3 py-2 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div className="flex gap-1">
            <button 
              disabled={loading}
              onClick={() => handleAdjustment('credit')}
              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100"
              title="Quick Credit"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              disabled={loading}
              onClick={() => handleAdjustment('debit')}
              className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
              title="Quick Debit"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </td>
      <td className="px-8 py-6 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={() => onAction(customer, 'edit')} className="p-2.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all" title="Edit Profile"><Edit className="w-4 h-4" /></button>
          <button onClick={() => onAction(customer, 'message')} className="p-2.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all" title="Message"><MessageSquare className="w-4 h-4" /></button>
          <button onClick={() => onAction(customer, 'reset')} className="p-2.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all" title="Security Reset"><Key className="w-4 h-4" /></button>
          <button onClick={() => onDelete(customer.id)} className="p-2.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete Account"><Trash2 className="w-4 h-4" /></button>
        </div>
      </td>
    </tr>
  );
};

const EditTransactionDateModal = ({ txn, onClose, onUpdate }: { txn: any, onClose: () => void, onUpdate: (id: string, date: string) => void }) => {
  const initialDate = new Date(txn.created_at);
  const [date, setDate] = useState(initialDate.toISOString().split('T')[0]);
  const [time, setTime] = useState(
    initialDate.getHours().toString().padStart(2, '0') + ':' + 
    initialDate.getMinutes().toString().padStart(2, '0')
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullDate = new Date(`${date}T${time}:00`).toISOString();
    onUpdate(txn.id, fullDate);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl border border-white/20"
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Adjust Timestamp</h3>
            <p className="text-zinc-500 text-sm font-medium mt-1">Modify the ledger entry date and time.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-2xl transition-all">
            <XCircle className="w-6 h-6 text-zinc-300 hover:text-zinc-900" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Transaction Date</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none font-bold text-zinc-900"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Transaction Time</label>
            <input 
              type="time" 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none font-bold text-zinc-900"
              required
            />
          </div>
          <div className="pt-4">
            <button 
              type="submit"
              className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-black tracking-tight shadow-xl shadow-zinc-200 hover:bg-zinc-800 transition-all"
            >
              Update Timestamp
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const CreditDebitTool = ({ customers, onComplete }: { customers: any[], onComplete: () => void }) => {
  const [formData, setFormData] = useState({ userId: '', amount: '', type: 'credit', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const amount = parseFloat(formData.amount);
      const adjustment = formData.type === 'credit' ? amount : -amount;
      
      const accountRef = doc(db, 'accounts', formData.userId);
      const accountSnap = await getDoc(accountRef);
      
      let currentBalance = 0;
      const batch = writeBatch(db);

      if (!accountSnap.exists()) {
        const accountNumber = "MS" + Math.floor(1000000000 + Math.random() * 9000000000);
        batch.set(accountRef, {
          user_id: formData.userId,
          account_number: accountNumber,
          balance: adjustment,
          status: 'active',
          created_at: new Date().toISOString()
        });
      } else {
        currentBalance = accountSnap.data().balance || 0;
        const newBalance = currentBalance + adjustment;
        batch.update(accountRef, { balance: newBalance });
      }
      
      const txnRef = doc(collection(db, 'transactions'));
      batch.set(txnRef, {
        user_id: formData.userId,
        amount: adjustment,
        description: formData.description,
        type: formData.type,
        status: 'completed',
        reference: 'ADJ' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        created_at: new Date().toISOString()
      });
      
      await batch.commit();
      alert("Adjustment successful");
      onComplete();
      setFormData({ userId: '', amount: '', type: 'credit', description: '' });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-zinc-200 p-10 shadow-sm">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shadow-lg shadow-zinc-200">
          <ArrowRightLeft className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Manual Account Adjustment</h3>
          <p className="text-zinc-500 text-sm">Directly modify customer balances and generate ledger entries.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Select Customer</label>
          <select 
            required
            className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-bold text-sm"
            value={formData.userId}
            onChange={e => setFormData({...formData, userId: e.target.value})}
          >
            <option value="">Choose Customer...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name} ({c.account_number || 'No Account #'})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Adjustment Type</label>
          <select 
            className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-bold text-sm"
            value={formData.type}
            onChange={e => setFormData({...formData, type: e.target.value})}
          >
            <option value="credit">Credit (+)</option>
            <option value="debit">Debit (-)</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Amount ($)</label>
          <input 
            type="number" 
            required 
            placeholder="0.00" 
            className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-bold text-sm"
            value={formData.amount}
            onChange={e => setFormData({...formData, amount: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Transaction Note</label>
          <input 
            type="text" 
            required 
            placeholder="Reason for adjustment" 
            className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-bold text-sm"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>
        <button disabled={loading} className="lg:col-span-4 bg-zinc-900 text-white py-5 rounded-[1.5rem] font-black tracking-tight hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 disabled:opacity-50">
          {loading ? 'Processing Transaction...' : 'Execute Adjustment'}
        </button>
      </form>
    </div>
  );
};

const AdminSettingsView = ({ onFactoryReset }: { onFactoryReset: () => void }) => {
  const [security, setSecurity] = useState({ currentPassword: '', newPassword: '' });
  const [settings, setSettings] = useState({ bank_name: 'Moonstone Bank', branding_color: '#10b981', maintenance_mode: 'off' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const settingsDoc = await getDoc(doc(db, 'system_settings', 'general'));
    if (settingsDoc.exists()) {
      setSettings(settingsDoc.data() as any);
    }
  };

  const handleSecurityUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    alert("Password update via Firebase Auth is handled through the Firebase console or a specific Auth flow. This manual update is disabled for security in this demo.");
  };

  const handleSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'system_settings', 'general'), settings);
      alert("Settings updated successfully");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white rounded-[2rem] border border-zinc-200 p-10 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shadow-lg shadow-zinc-200">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Platform Configuration</h2>
              <p className="text-zinc-500 text-sm">Global system settings and branding parameters.</p>
            </div>
          </div>
          <form onSubmit={handleSettingsUpdate} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Bank Name</label>
                <input 
                  className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none font-bold" 
                  value={settings.bank_name} 
                  onChange={e => setSettings({...settings, bank_name: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Maintenance Mode</label>
                <select 
                  className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none font-bold"
                  value={settings.maintenance_mode}
                  onChange={e => setSettings({...settings, maintenance_mode: e.target.value})}
                >
                  <option value="off">Disabled (Live)</option>
                  <option value="on">Enabled (Maintenance)</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Branding Primary Color</label>
                <div className="flex gap-4">
                  <div className="relative w-20 h-14">
                    <input 
                      type="color"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      value={settings.branding_color} 
                      onChange={e => setSettings({...settings, branding_color: e.target.value})} 
                    />
                    <div className="w-full h-full rounded-2xl border border-zinc-200" style={{ backgroundColor: settings.branding_color }} />
                  </div>
                  <input 
                    className="flex-1 px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none font-mono font-bold" 
                    value={settings.branding_color} 
                    onChange={e => setSettings({...settings, branding_color: e.target.value})} 
                  />
                </div>
              </div>
            </div>
            <button className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black tracking-tight hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200">
              Save Platform Configuration
            </button>
          </form>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-white rounded-[2rem] border border-zinc-200 p-10 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shadow-lg shadow-zinc-200">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">Admin Security</h2>
              <p className="text-zinc-500 text-xs">Update administrative credentials.</p>
            </div>
          </div>
          <form onSubmit={handleSecurityUpdate} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none" value={security.currentPassword} onChange={e => setSecurity({...security, currentPassword: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none" value={security.newPassword} onChange={e => setSecurity({...security, newPassword: e.target.value})} />
              </div>
            </div>
            <button className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black tracking-tight hover:bg-zinc-800 transition-all">
              Update Security
            </button>
          </form>
        </div>
        
        <div className="bg-red-50 rounded-[2rem] border border-red-100 p-10">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-red-600" />
            <h3 className="text-red-900 font-black tracking-tight">Danger Zone</h3>
          </div>
          <p className="text-red-600 text-xs mb-6 font-medium leading-relaxed">System-wide actions that cannot be undone. Use with extreme caution.</p>
          <button onClick={onFactoryReset} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black tracking-tight hover:bg-red-700 transition-all shadow-lg shadow-red-200">
            Factory Reset System
          </button>
        </div>
      </div>
    </div>
  );
};

const EditCustomerModal = ({ customer, onClose, onComplete }: any) => {
  const [formData, setFormData] = useState({
    ...customer,
    first_name: customer.first_name || '',
    last_name: customer.last_name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    address: customer.address || '',
    status: customer.status || 'active',
    balance: customer.balance || 0,
    account_number: customer.account_number || ("MS" + Math.floor(1000000000 + Math.random() * 9000000000)),
    transfer_pin: customer.transfer_pin || '',
    card_number: customer.card_number || '',
    card_expiry: customer.card_expiry || '',
    card_cvv: customer.card_cvv || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const batch = writeBatch(db);
      
      const userRef = doc(db, 'users', customer.id);
      batch.update(userRef, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        status: formData.status
      });
      
      const accountRef = doc(db, 'accounts', customer.id);
      batch.set(accountRef, {
        user_id: customer.id,
        balance: formData.balance,
        account_number: formData.account_number,
        transfer_pin: formData.transfer_pin,
        card_number: formData.card_number,
        card_expiry: formData.card_expiry,
        card_cvv: formData.card_cvv
      }, { merge: true });
      
      await batch.commit();
      alert('Customer updated successfully');
      onComplete();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to update customer');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        className="bg-white rounded-[2.5rem] p-10 max-w-3xl w-full max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl border border-white/20"
      >
        <div className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Account Master Edit</h2>
            <p className="text-zinc-500 text-sm font-medium mt-1">Modify all customer profile and financial parameters.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-2xl transition-all">
            <XCircle className="w-7 h-7 text-zinc-300 hover:text-zinc-900" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Personal Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">First Name</label>
                <input className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none font-bold" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} placeholder="First Name" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Last Name</label>
                <input className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none font-bold" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} placeholder="Last Name" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                <input className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Phone Number</label>
                <input className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1 (555) 000-0000" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Residential Address</label>
              <textarea className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl h-24 focus:ring-2 focus:ring-zinc-900 outline-none font-medium resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full Address" />
            </div>
          </div>

          {/* Account & Financials */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Account & Financials</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Account Number</label>
                <input className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none font-mono font-bold tracking-wider" value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} placeholder="MS0000000000" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Current Balance ($)</label>
                <input type="number" step="0.01" className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none font-black text-lg" value={formData.balance ?? 0} onChange={e => setFormData({...formData, balance: parseFloat(e.target.value) || 0})} placeholder="0.00" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Transfer PIN</label>
                <input maxLength={4} className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none font-mono font-black tracking-[0.5em] text-center" value={formData.transfer_pin || ''} onChange={e => setFormData({...formData, transfer_pin: e.target.value})} placeholder="0000" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Account Status</label>
                <select className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none font-black" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="active">Active</option>
                  <option value="pending">Pending Approval</option>
                  <option value="disabled">Disabled / Locked</option>
                </select>
              </div>
            </div>
          </div>

          {/* Virtual Card Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Virtual Card Details</h3>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Card Number</label>
              <input className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none font-mono font-bold tracking-widest" value={formData.card_number || ''} onChange={e => setFormData({...formData, card_number: e.target.value})} placeholder="0000 0000 0000 0000" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Expiry Date</label>
                <input className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none font-mono font-bold" value={formData.card_expiry || ''} onChange={e => setFormData({...formData, card_expiry: e.target.value})} placeholder="MM/YY" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">CVV</label>
                <input maxLength={3} className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none font-mono font-bold" value={formData.card_cvv || ''} onChange={e => setFormData({...formData, card_cvv: e.target.value})} placeholder="000" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button type="submit" className="flex-[2] bg-zinc-900 text-white py-5 rounded-2xl font-black tracking-tight shadow-xl shadow-zinc-200 hover:bg-zinc-800 transition-all">Save All Changes</button>
            <button type="button" onClick={onClose} className="flex-1 bg-zinc-100 text-zinc-600 py-5 rounded-2xl font-black tracking-tight hover:bg-zinc-200 transition-all">Discard</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const ResetPasswordModal = ({ customer, onClose }: any) => {
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const accountRef = doc(db, 'accounts', customer.id);
      await updateDoc(accountRef, { transfer_pin: pin });
      alert('Security credentials updated successfully. Password reset must be initiated via Firebase Auth reset email.');
      onClose();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-10 max-w-md w-full relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-2 hover:bg-zinc-100 rounded-2xl transition-all"
        >
          <XCircle className="w-6 h-6 text-zinc-300 hover:text-zinc-900" />
        </button>
        <h2 className="text-2xl font-black mb-2 tracking-tight">Reset Security</h2>
        <p className="text-zinc-500 text-sm mb-8 font-medium">Update credentials for {customer.first_name} {customer.last_name}</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">New Password</label>
            <input type="password" className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none font-bold" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep current" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">New Transfer PIN</label>
            <input type="password" maxLength={4} className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none font-mono font-black tracking-[0.5em] text-center" value={pin} onChange={e => setPin(e.target.value)} placeholder="0000" />
          </div>
          <div className="flex gap-4 mt-8">
            <button type="submit" className="flex-[2] bg-amber-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-amber-100 hover:bg-amber-700 transition-all">Update Security</button>
            <button type="button" onClick={onClose} className="flex-1 bg-zinc-100 text-zinc-600 py-4 rounded-2xl font-black hover:bg-zinc-200 transition-all">Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const SendMessageModal = ({ customer, onClose }: any) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    try {
      // Find or create session
      const sessionsRef = collection(db, 'chat_sessions');
      const q = query(sessionsRef, where('customerId', '==', customer.id));
      const snap = await getDocs(q);
      
      let sessionId;
      if (snap.empty) {
        const newSession = await addDoc(sessionsRef, {
          customerId: customer.id,
          last_message: message,
          unread_count: 0,
          updated_at: new Date().toISOString()
        });
        sessionId = newSession.id;
      } else {
        sessionId = snap.docs[0].id;
      }
      
      await addDoc(collection(db, 'chat_messages'), {
        session_id: sessionId,
        sender_id: 'admin',
        message_text: message,
        created_at: new Date().toISOString()
      });
      
      alert('Message sent successfully');
      onClose();
    } catch (error: any) {
      alert(error.message || 'Error sending message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-10 max-w-md w-full relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-2 hover:bg-zinc-100 rounded-2xl transition-all"
        >
          <XCircle className="w-6 h-6 text-zinc-300 hover:text-zinc-900" />
        </button>
        <h2 className="text-2xl font-black mb-2 tracking-tight">Direct Message</h2>
        <p className="text-zinc-500 text-sm mb-8 font-medium">Send a message to {customer.first_name} {customer.last_name}</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <textarea 
            className="w-full px-6 py-5 bg-zinc-50 border border-zinc-200 rounded-2xl h-40 outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium resize-none" 
            value={message} 
            onChange={e => setMessage(e.target.value)} 
            placeholder="Type your message here..."
            required
          />
          <div className="flex gap-4">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-[2] bg-zinc-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-zinc-200 hover:bg-zinc-800 transition-all disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-zinc-100 text-zinc-600 py-4 rounded-2xl font-black hover:bg-zinc-200 transition-all">Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const AdminChatView = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');

  const fetchSessions = async () => {
    const q = query(collection(db, 'chat_sessions'), orderBy('updated_at', 'desc'));
    const snap = await getDocs(q);
    const sessionData = await Promise.all(snap.docs.map(async (d) => {
      const data = d.data();
      const userDoc = await getDoc(doc(db, 'users', data.customerId));
      const userData = userDoc.data();
      return { 
        id: d.id, 
        ...data, 
        first_name: userData?.first_name || 'Unknown', 
        last_name: userData?.last_name || 'Customer', 
        profile_picture: userData?.profile_picture 
      };
    }));
    setSessions(sessionData);
  };

  const fetchMessages = async (sessionId: string) => {
    if (!sessionId) return;
    const q = query(
      collection(db, 'chat_messages'), 
      where('session_id', '==', sessionId)
    );
    const snap = await getDocs(q);
    const msgs = snap.docs.map(d => d.data());
    msgs.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setMessages(msgs);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (!activeSession) return;
    fetchMessages(activeSession.id);
  }, [activeSession]);

  const sendMessage = async () => {
    if (!input.trim() || !activeSession) return;
    const text = input;
    setInput('');
    
    await addDoc(collection(db, 'chat_messages'), {
      session_id: activeSession.id,
      sender_id: 'admin',
      message_text: text,
      created_at: new Date().toISOString()
    });
    
    await updateDoc(doc(db, 'chat_sessions', activeSession.id), {
      last_message: text,
      updated_at: new Date().toISOString()
    });

    await fetchMessages(activeSession.id);
  };

  const filteredSessions = sessions.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-[2.5rem] border border-zinc-200 h-[800px] flex overflow-hidden shadow-2xl shadow-zinc-200/50 relative">
        {/* Sessions Sidebar */}
        <div className={`${activeSession ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 border-r border-zinc-100 flex-col bg-zinc-50/30`}>
        <div className="p-8 border-b border-zinc-100 bg-white">
          <h3 className="text-lg font-black text-zinc-900 tracking-tight mb-6">Customer Support</h3>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium" 
              placeholder="Search conversations..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filteredSessions.map(s => (
            <button 
              key={s.id}
              onClick={() => { setActiveSession(s); }}
              className={`w-full p-6 flex items-center gap-4 hover:bg-white transition-all border-b border-zinc-50 relative group ${activeSession?.id === s.id ? 'bg-white' : ''}`}
            >
              {activeSession?.id === s.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-900" />
              )}
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-zinc-200 overflow-hidden border border-zinc-100 shadow-sm">
                  {s.profile_picture && <img src={s.profile_picture} className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                </div>
                {s.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black border-2 border-white shadow-sm">
                    {s.unread_count}
                  </span>
                )}
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-black text-sm text-zinc-900 truncate tracking-tight">{s.first_name} {s.last_name}</p>
                <p className="text-xs text-zinc-500 truncate font-medium mt-0.5">{s.last_message || 'No messages yet'}</p>
              </div>
            </button>
          ))}
          {filteredSessions.length === 0 && (
            <div className="p-10 text-center text-zinc-400">
              <p className="text-xs font-bold uppercase tracking-widest">No chats found</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`${activeSession ? 'flex' : 'hidden lg:flex'} flex-1 flex flex-col bg-white`}>
        {activeSession ? (
          <>
            <div className="p-4 md:p-8 bg-white border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveSession(null)}
                  className="lg:hidden w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 overflow-hidden border border-zinc-200">
                  {activeSession.profile_picture && <img src={activeSession.profile_picture} className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                </div>
                <div>
                  <p className="font-black text-zinc-900 tracking-tight text-sm md:text-base">{activeSession.first_name} {activeSession.last_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Active Session</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => fetchMessages(activeSession.id)}
                className="hidden sm:flex px-4 py-2 bg-zinc-50 hover:bg-zinc-100 rounded-xl text-[10px] font-black text-zinc-600 uppercase tracking-widest transition-all items-center gap-2 border border-zinc-200"
              >
                <Activity className="w-3 h-3" /> Sync History
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 no-scrollbar bg-zinc-50/30">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender_id === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-5 rounded-[1.5rem] text-sm font-medium shadow-sm ${
                    msg.sender_id === 'admin' 
                      ? 'bg-zinc-900 text-white rounded-tr-none' 
                      : 'bg-white text-zinc-900 border border-zinc-100 rounded-tl-none'
                  }`}>
                    {msg.message_text}
                    <p className={`text-[9px] mt-2 font-bold uppercase tracking-widest opacity-40 ${msg.sender_id === 'admin' ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 opacity-50">
                  <MessageSquare className="w-12 h-12 mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest">Start the conversation</p>
                </div>
              )}
            </div>
            <div className="p-4 md:p-8 bg-white border-t border-zinc-100 flex flex-col md:flex-row gap-4">
              <input 
                className="flex-1 px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium text-sm md:text-base"
                placeholder="Type your response..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} className="bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black tracking-tight hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 text-sm md:text-base">
                Send Reply
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 bg-zinc-50/30">
            <div className="w-20 h-20 rounded-full bg-white border border-zinc-100 flex items-center justify-center mb-6 shadow-sm">
              <MessageSquare className="w-10 h-10 opacity-20" />
            </div>
            <h3 className="text-xl font-black text-zinc-900 tracking-tight">No Conversation Selected</h3>
            <p className="text-sm font-medium text-zinc-500 mt-2">Select a customer from the sidebar to begin support.</p>
          </div>
        )}
      </div>
    </div>
  </div>
);
};

interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  profile_picture?: string;
  phone?: string;
  address?: string;
}

interface AccountData {
  id: string;
  user_id: string;
  balance: number;
  account_number: string;
  transfer_pin?: string;
  card_number?: string;
  card_expiry?: string;
  card_cvv?: string;
}

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [resettingPassword, setResettingPassword] = useState<any>(null);
  const [sendingMessageTo, setSendingMessageTo] = useState<any>(null);
  const [editingTxnDate, setEditingTxnDate] = useState<any>(null);

  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log("Fetching admin data...");
      // Fetch Users
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersList = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserData));
      
      // Fetch Accounts
      const accountsSnap = await getDocs(collection(db, 'accounts'));
      const accountsList = accountsSnap.docs.map(d => ({ id: d.id, ...d.data() } as AccountData));
      
      // Combine User + Account
      const combinedCustomers = usersList.map(u => {
        const acc = accountsList.find(a => a.user_id === u.id);
        // Destructure to avoid overwriting user ID with account document ID
        const { id: _accId, ...accData } = acc || {};
        return { ...u, ...accData };
      }).filter(c => c.role !== 'admin');
      
      setCustomers(combinedCustomers);

      // Fetch Transactions - Sort on client side
      const txnsSnap = await getDocs(collection(db, 'transactions'));
      const txnsList = txnsSnap.docs.map(d => {
        const data = d.data();
        const user = usersList.find(u => u.id === data.user_id);
        return { 
          id: d.id, 
          ...data, 
          first_name: user?.first_name, 
          last_name: user?.last_name,
          profile_picture: user?.profile_picture 
        };
      });
      txnsList.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(txnsList);

      // Fetch Loans - Sort on client side
      const loansSnap = await getDocs(collection(db, 'loans'));
      const loansList = loansSnap.docs.map(d => {
        const data = d.data();
        const user = usersList.find(u => u.id === data.user_id);
        return { 
          id: d.id, 
          ...data, 
          first_name: user?.first_name, 
          last_name: user?.last_name,
          profile_picture: user?.profile_picture 
        };
      });
      loansList.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setLoans(loansList);

      // Calculate Stats
      const totalBalance = accountsList.reduce((sum, acc) => sum + (acc.balance || 0), 0);
      setStats({
        totalCustomers: combinedCustomers.length,
        pendingApprovals: combinedCustomers.filter(c => c.status === 'pending').length,
        activeAccounts: combinedCustomers.filter(c => c.status === 'active').length,
        totalBalance
      });

    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const factoryReset = async () => {
    if (!confirm('WARNING: This will delete ALL transactions, loans, and chat history. This cannot be undone. Continue?')) return;
    try {
      const collections = ['transactions', 'loans', 'chat_sessions', 'chat_messages'];
      for (const col of collections) {
        const snap = await getDocs(collection(db, col));
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
      alert('System reset successful.');
      fetchData();
    } catch (err) {
      alert('Reset failed.');
    }
  };

  const updateCustomerStatus = async (id: string, status: string) => {
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', id), { status });
      
      // Also update account status if it exists
      const accountRef = doc(db, 'accounts', id);
      const accountSnap = await getDoc(accountRef);
      if (accountSnap.exists()) {
        batch.update(accountRef, { status });
      }
      
      await batch.commit();
      fetchData();
    } catch (err) {
      console.error("Error updating customer status:", err);
      alert("Failed to update status");
    }
  };

  const approveTransaction = async (id: string) => {
    const txnRef = doc(db, 'transactions', id);
    await updateDoc(txnRef, { status: 'completed' });
    fetchData();
  };

  const updateLoanStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'loans', id), { status });
    fetchData();
  };

  const updateTransactionDate = async (id: string, date: string) => {
    try {
      await updateDoc(doc(db, 'transactions', id), { created_at: date });
      alert('Transaction date updated.');
      fetchData();
      setEditingTxnDate(null);
    } catch (err) {
      alert('Failed to update date.');
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', id));
    batch.delete(doc(db, 'accounts', id));
    await batch.commit();
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-[80vh]">Loading Admin Panel...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col gap-10">
        {/* Admin Content */}
        <main className="flex-1 min-w-0">
          {activeTab === 'overview' && (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Command Center</h1>
                  <p className="text-zinc-500 font-medium mt-1">Real-time system health and administrative priorities.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="px-5 py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 border border-emerald-100 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    System Operational
                  </div>
                  <div className="px-5 py-3 bg-zinc-100 text-zinc-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 border border-zinc-200">
                    <Clock className="w-3 h-3" />
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Users', value: stats?.totalCustomers ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                  { label: 'Action Required', value: stats?.pendingApprovals ?? 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                  { label: 'Verified Accounts', value: stats?.activeAccounts ?? 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                  { label: 'Total Liquidity', value: formatCurrency(stats?.totalBalance ?? 0), icon: DollarSign, color: 'text-zinc-900', bg: 'bg-zinc-100', border: 'border-zinc-200' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                    <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 border ${stat.border} shadow-sm group-hover:scale-110 transition-transform`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</p>
                    <h3 className="text-3xl font-black text-zinc-900 mt-2 tracking-tight">{stat.value}</h3>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-zinc-200 overflow-hidden shadow-sm">
                  <div className="p-10 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/30">
                    <div>
                      <h3 className="font-black text-zinc-900 text-xl tracking-tight">Pending Ledger Approvals</h3>
                      <p className="text-zinc-500 text-sm font-medium mt-1">Transactions awaiting administrative verification.</p>
                    </div>
                    <span className="bg-amber-50 text-amber-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-amber-100">
                      {transactions.filter(t => t.status === 'pending').length} Priority
                    </span>
                  </div>
                  <div className="divide-y divide-zinc-100 overflow-x-auto no-scrollbar">
                    {transactions.filter(t => t.status === 'pending').map((txn) => (
                      <div key={txn.id} className="p-8 flex items-center justify-between hover:bg-zinc-50/50 transition-colors min-w-[600px] md:min-w-0">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center border border-zinc-200 overflow-hidden shadow-sm">
                            {txn.profile_picture ? (
                              <img src={txn.profile_picture} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <ArrowRightLeft className="w-6 h-6 text-zinc-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-black text-zinc-900 tracking-tight">{txn.first_name} {txn.last_name}</p>
                            <p className="text-sm text-zinc-500 font-medium">{txn.description}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <p className="text-[10px] text-zinc-400 font-mono font-bold tracking-widest uppercase">{txn.reference}</p>
                              <span className="text-zinc-300">•</span>
                              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                                {new Date(txn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <p className="font-black text-zinc-900 text-2xl tracking-tight">{formatCurrency(txn.amount)}</p>
                          <button 
                            onClick={() => approveTransaction(txn.id)}
                            className="bg-zinc-900 text-white px-8 py-4 rounded-2xl text-sm font-black tracking-tight hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200"
                          >
                            Verify & Post
                          </button>
                        </div>
                      </div>
                    ))}
                    {transactions.filter(t => t.status === 'pending').length === 0 && (
                      <div className="p-20 text-center bg-zinc-50/30">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-zinc-100">
                          <CheckCircle className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h4 className="text-zinc-900 font-black tracking-tight text-lg">Ledger Cleared</h4>
                        <p className="text-zinc-400 font-medium mt-1">All pending transactions have been processed.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-zinc-200 overflow-hidden shadow-sm flex flex-col">
                  <div className="p-10 border-b border-zinc-100 bg-zinc-50/30">
                    <h3 className="font-black text-zinc-900 text-xl tracking-tight">Credit Queue</h3>
                    <p className="text-zinc-500 text-sm font-medium mt-1">Loan applications for review.</p>
                  </div>
                  <div className="flex-1 divide-y divide-zinc-100 overflow-y-auto no-scrollbar">
                    {loans.filter(l => l.status === 'pending').map((loan) => (
                      <div key={loan.id} className="p-8 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center border border-zinc-200 overflow-hidden shadow-sm">
                            {loan.profile_picture ? (
                              <img src={loan.profile_picture} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="text-zinc-400 font-black text-lg">{loan.first_name.charAt(0)}</div>
                            )}
                          </div>
                          <div>
                            <p className="font-black text-zinc-900 tracking-tight">{loan.first_name} {loan.last_name}</p>
                            <p className="text-xs text-zinc-500 font-medium truncate w-32">{loan.purpose}</p>
                            <p className="text-sm font-black text-zinc-900 mt-1">{formatCurrency(loan.amount)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => updateLoanStatus(loan.id, 'approved')} className="p-3 text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all border border-transparent hover:border-emerald-100" title="Approve Credit"><CheckCircle className="w-5 h-5" /></button>
                          <button onClick={() => updateLoanStatus(loan.id, 'rejected')} className="p-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100" title="Decline Credit"><XCircle className="w-5 h-5" /></button>
                        </div>
                      </div>
                    ))}
                    {loans.filter(l => l.status === 'pending').length === 0 && (
                      <div className="p-16 text-center h-full flex flex-col items-center justify-center bg-zinc-50/30">
                        <TrendingUp className="w-12 h-12 text-zinc-200 mb-4" />
                        <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">No Pending Credit</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'master' && (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black text-zinc-900 tracking-tight">Master Control</h2>
                  <p className="text-zinc-500 font-medium mt-1">Global administrative override for all customer accounts.</p>
                </div>
                <div className="relative w-full md:w-[400px]">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input 
                    className="w-full pl-14 pr-6 py-5 bg-white border border-zinc-200 rounded-[1.5rem] text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all shadow-sm font-medium" 
                    placeholder="Search by name, email or account..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-zinc-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-zinc-50/50">
                        <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Customer Identity</th>
                        <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Account & Security</th>
                        <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Net Liquidity</th>
                        <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Balance Adjustment</th>
                        <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-right">Overrides</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {customers.filter(c => 
                        `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
                        c.email.toLowerCase().includes(search.toLowerCase()) ||
                        (c.account_number && c.account_number.includes(search))
                      ).map((c) => (
                        <MasterControlRow 
                          key={c.id} 
                          customer={c} 
                          onUpdate={fetchData} 
                          onDelete={deleteCustomer}
                          formatCurrency={formatCurrency}
                          onAction={(cust: any, type: string) => {
                            if (type === 'edit') setEditingCustomer(cust);
                            if (type === 'message') setSendingMessageTo(cust);
                            if (type === 'reset') setResettingPassword(cust);
                          }}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black text-zinc-900 tracking-tight">User Directory</h2>
                  <p className="text-zinc-500 font-medium mt-1">Comprehensive management of the bank's customer base.</p>
                </div>
                <div className="relative w-full md:w-[400px]">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input 
                    className="w-full pl-14 pr-6 py-5 bg-white border border-zinc-200 rounded-[1.5rem] text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all shadow-sm font-medium" 
                    placeholder="Search directory..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-zinc-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[1100px]">
                    <thead>
                      <tr className="bg-zinc-50/50">
                        <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Profile</th>
                        <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Financial Node</th>
                        <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Security</th>
                        <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Balance</th>
                        <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Status</th>
                        <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {customers.filter(c => 
                        `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
                        c.email.toLowerCase().includes(search.toLowerCase()) ||
                        c.account_number.includes(search)
                      ).map((c) => (
                        <tr key={c.id} className="hover:bg-zinc-50/50 transition-all group">
                          <td className="px-8 py-7">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-zinc-100 overflow-hidden border border-zinc-200 shadow-sm">
                                {c.profile_picture ? (
                                  <img src={c.profile_picture} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-400 font-black text-lg">
                                    {c.first_name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-black text-zinc-900 tracking-tight">{c.first_name} {c.last_name}</p>
                                <p className="text-xs text-zinc-500 font-medium">{c.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-7">
                            <p className="text-sm font-mono font-bold text-zinc-600 tracking-wider">{c.account_number}</p>
                            <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest mt-1.5">Premium Savings</p>
                          </td>
                          <td className="px-8 py-7">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              </div>
                              <p className="text-sm font-mono font-black text-zinc-900 tracking-[0.3em]">
                                {c.transfer_pin || '----'}
                              </p>
                              <button onClick={() => setResettingPassword(c)} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-all text-zinc-400 hover:text-zinc-900">
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-8 py-7">
                            <p className="text-xl font-black text-zinc-900 tracking-tight">{formatCurrency(c.balance)}</p>
                          </td>
                          <td className="px-8 py-7">
                            <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                              c.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                              c.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'
                            }`}>{c.status}</span>
                          </td>
                          <td className="px-8 py-7">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              {c.status === 'pending' && (
                                <button onClick={() => updateCustomerStatus(c.id, 'active')} className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Approve"><CheckCircle className="w-5 h-5" /></button>
                              )}
                              {c.status === 'active' && (
                                <button onClick={() => updateCustomerStatus(c.id, 'disabled')} className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl transition-all" title="Disable Account"><XCircle className="w-5 h-5" /></button>
                              )}
                              {c.status === 'disabled' && (
                                <button onClick={() => updateCustomerStatus(c.id, 'active')} className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Enable Account"><CheckCircle className="w-5 h-5" /></button>
                              )}
                              <button onClick={() => setEditingCustomer(c)} className="p-2.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all" title="Edit Profile"><Edit className="w-5 h-5" /></button>
                              <button onClick={() => setSendingMessageTo(c)} className="p-2.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all" title="Send Message"><MessageSquare className="w-5 h-5" /></button>
                              <button onClick={() => setResettingPassword(c)} className="p-2.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all" title="Security Reset"><Key className="w-5 h-5" /></button>
                              <button onClick={() => deleteCustomer(c.id)} className="p-2.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete User"><Trash2 className="w-5 h-5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <CreditDebitTool customers={customers} onComplete={fetchData} />
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black text-zinc-900 tracking-tight">Financial Ledger</h2>
                  <p className="text-zinc-500 font-medium mt-1">Global audit trail of all system-wide financial movements.</p>
                </div>
                <div className="flex gap-4">
                  <div className="px-6 py-4 bg-white border border-zinc-200 rounded-2xl shadow-sm flex items-center gap-3">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Volume</p>
                      <p className="text-lg font-black text-zinc-900 tracking-tight">{transactions.length} Entries</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-[2.5rem] border border-zinc-200 overflow-hidden shadow-sm">
                <div className="divide-y divide-zinc-100 overflow-x-auto no-scrollbar">
                  {transactions.map((txn) => (
                    <div key={txn.id} className="p-8 flex justify-between items-center hover:bg-zinc-50/50 transition-all group min-w-[700px] md:min-w-0">
                      <div className="flex items-center gap-8">
                        <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center shadow-sm border ${
                          txn.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          <ArrowRightLeft className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="font-black text-zinc-900 text-xl tracking-tight">{txn.description}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-sm text-zinc-500 font-bold">
                              {txn.first_name} {txn.last_name} 
                            </p>
                            <span className="text-zinc-300">•</span>
                            <p className="text-xs text-zinc-400 font-medium">
                              {new Date(txn.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-2 font-mono font-black tracking-[0.2em] uppercase">{txn.reference}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-10">
                        <div className="text-right">
                          <p className="text-2xl font-black text-zinc-900 tracking-tight">{formatCurrency(txn.amount)}</p>
                          <span className={`text-[10px] uppercase font-black tracking-[0.2em] px-4 py-1.5 rounded-2xl border mt-2 inline-block ${
                            txn.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>{txn.status}</span>
                        </div>
                        <button 
                          onClick={() => setEditingTxnDate(txn)}
                          className="flex items-center gap-2 px-5 py-3 bg-zinc-50 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-2xl transition-all border border-zinc-200 hover:border-zinc-900 shadow-sm"
                        >
                          <Calendar className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Adjust Date</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="p-32 text-center bg-zinc-50/30">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-zinc-100">
                        <ArrowRightLeft className="w-10 h-10 text-zinc-200" />
                      </div>
                      <h4 className="text-zinc-900 font-black tracking-tight text-lg">Ledger Empty</h4>
                      <p className="text-zinc-400 font-medium mt-1">No transactions have been recorded in the system yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'loans' && (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black text-zinc-900 tracking-tight">Credit Portfolio</h2>
                  <p className="text-zinc-500 font-medium mt-1">Strategic oversight and management of customer credit facilities.</p>
                </div>
                <div className="flex gap-4">
                  <div className="px-6 py-4 bg-white border border-zinc-200 rounded-2xl shadow-sm flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Active Loans</p>
                      <p className="text-lg font-black text-zinc-900 tracking-tight">{loans.filter(l => l.status === 'approved').length} Facilities</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-[2.5rem] border border-zinc-200 overflow-hidden shadow-sm">
                <div className="divide-y divide-zinc-100 overflow-x-auto no-scrollbar">
                  {loans.map((loan) => (
                    <div key={loan.id} className="p-8 flex justify-between items-center hover:bg-zinc-50/50 transition-all group min-w-[700px] md:min-w-0">
                      <div className="flex items-center gap-8">
                        <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center shadow-sm border ${
                          loan.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          loan.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          <TrendingUp className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="font-black text-zinc-900 text-xl tracking-tight">{loan.first_name} {loan.last_name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-sm text-zinc-500 font-bold">
                              {loan.purpose} 
                            </p>
                            <span className="text-zinc-300">•</span>
                            <p className="text-xs text-zinc-400 font-medium">
                              Applied {new Date(loan.created_at).toLocaleDateString([], { dateStyle: 'medium' })}
                            </p>
                          </div>
                          <p className="text-2xl font-black text-zinc-900 mt-2 tracking-tight">{formatCurrency(loan.amount)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-10">
                        <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border ${
                          loan.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          loan.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>{loan.status}</span>
                        {loan.status === 'pending' && (
                          <div className="flex gap-4">
                            <button 
                              onClick={() => updateLoanStatus(loan.id, 'approved')} 
                              className="bg-zinc-900 text-white px-8 py-4 rounded-2xl text-sm font-black tracking-tight hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => updateLoanStatus(loan.id, 'rejected')} 
                              className="bg-white border border-zinc-200 text-red-600 px-8 py-4 rounded-2xl text-sm font-black tracking-tight hover:bg-red-50 transition-all"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loans.length === 0 && (
                    <div className="p-32 text-center bg-zinc-50/30">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-zinc-100">
                        <TrendingUp className="w-10 h-10 text-zinc-200" />
                      </div>
                      <h4 className="text-zinc-900 font-black tracking-tight text-lg">Portfolio Empty</h4>
                      <p className="text-zinc-400 font-medium mt-1">No credit applications have been submitted.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && <AdminChatView />}
          {activeTab === 'settings' && <AdminSettingsView onFactoryReset={factoryReset} />}

          {editingTxnDate && (
            <EditTransactionDateModal 
              txn={editingTxnDate} 
              onClose={() => setEditingTxnDate(null)} 
              onUpdate={updateTransactionDate}
            />
          )}

          {editingCustomer && (
            <EditCustomerModal 
              customer={editingCustomer} 
              onClose={() => setEditingCustomer(null)} 
              onComplete={fetchData} 
            />
          )}

          {resettingPassword && (
            <ResetPasswordModal 
              customer={resettingPassword} 
              onClose={() => setResettingPassword(null)} 
            />
          )}

          {sendingMessageTo && (
            <SendMessageModal 
              customer={sendingMessageTo} 
              onClose={() => setSendingMessageTo(null)} 
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
