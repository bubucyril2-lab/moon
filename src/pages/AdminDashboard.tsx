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
  LogOut
} from 'lucide-react';
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
    <tr className="hover:bg-zinc-50 transition-colors border-b border-zinc-100">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center border border-zinc-200 overflow-hidden">
            {customer.profile_picture ? (
              <img src={customer.profile_picture} className="w-full h-full object-cover" />
            ) : (
              <div className="text-zinc-400 font-bold text-sm">
                {customer.first_name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <p className="font-bold text-zinc-900 text-sm">{customer.first_name} {customer.last_name}</p>
            <p className="text-[10px] text-zinc-500">{customer.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-xs font-mono text-zinc-600">{customer.account_number || 'NO ACCOUNT'}</p>
        <p className="text-[10px] font-bold text-zinc-400 uppercase mt-1">PIN: {customer.transfer_pin || '----'}</p>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm font-bold text-zinc-900">{formatCurrency(customer.balance || 0)}</p>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <input 
            type="number" 
            placeholder="0.00" 
            className="w-24 px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-1 focus:ring-zinc-900"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <button 
            disabled={loading}
            onClick={() => handleAdjustment('credit')}
            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Quick Credit"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            disabled={loading}
            onClick={() => handleAdjustment('debit')}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Quick Debit"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => onAction(customer, 'edit')} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all" title="Edit Profile"><Edit className="w-4 h-4" /></button>
          <button onClick={() => onAction(customer, 'message')} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all" title="Message"><MessageSquare className="w-4 h-4" /></button>
          <button onClick={() => onAction(customer, 'reset')} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all" title="Security Reset"><Key className="w-4 h-4" /></button>
          <button onClick={() => onDelete(customer.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete Account"><Trash2 className="w-4 h-4" /></button>
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">Adjust Date</h3>
            <p className="text-zinc-500 text-sm">Modify the transaction timestamp.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
            <XCircle className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Transaction Date</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Transaction Time</label>
            <input 
              type="time" 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-bold shadow-xl hover:bg-zinc-800 transition-all"
          >
            Update Timestamp
          </button>
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
        // Self-healing: Create account if missing
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
    <div className="bg-white rounded-3xl border border-zinc-200 p-8">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <ArrowRightLeft className="w-6 h-6 text-zinc-900" /> Manual Account Adjustment
      </h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <select 
          required
          className="px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
          value={formData.userId}
          onChange={e => setFormData({...formData, userId: e.target.value})}
        >
          <option value="">Select Customer</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>
              {c.first_name} {c.last_name} ({c.account_number || 'No Account #'})
            </option>
          ))}
        </select>
        <select 
          className="px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
          value={formData.type}
          onChange={e => setFormData({...formData, type: e.target.value})}
        >
          <option value="credit">Credit (+)</option>
          <option value="debit">Debit (-)</option>
        </select>
        <input 
          type="number" 
          required 
          placeholder="Amount" 
          className="px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
          value={formData.amount}
          onChange={e => setFormData({...formData, amount: e.target.value})}
        />
        <input 
          type="text" 
          required 
          placeholder="Description" 
          className="px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})}
        />
        <button disabled={loading} className="lg:col-span-4 bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all">
          {loading ? 'Processing...' : 'Execute Adjustment'}
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-8">
        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-6 h-6 text-zinc-900" />
            <h2 className="text-xl font-bold">Platform Settings</h2>
          </div>
          <form onSubmit={handleSettingsUpdate} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Bank Name</label>
                <input 
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl" 
                  value={settings.bank_name} 
                  onChange={e => setSettings({...settings, bank_name: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Branding Primary Color</label>
                <div className="flex gap-4">
                  <input 
                    type="color"
                    className="h-12 w-20 p-1 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer" 
                    value={settings.branding_color} 
                    onChange={e => setSettings({...settings, branding_color: e.target.value})} 
                  />
                  <input 
                    className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl" 
                    value={settings.branding_color} 
                    onChange={e => setSettings({...settings, branding_color: e.target.value})} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Maintenance Mode</label>
                <select 
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl"
                  value={settings.maintenance_mode}
                  onChange={e => setSettings({...settings, maintenance_mode: e.target.value})}
                >
                  <option value="off">Disabled (Live)</option>
                  <option value="on">Enabled (Maintenance)</option>
                </select>
              </div>
            </div>
            <button className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold">Save Platform Settings</button>
          </form>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-zinc-900" />
            <h2 className="text-xl font-bold">Admin Security</h2>
          </div>
          <form onSubmit={handleSecurityUpdate} className="space-y-6">
            <div className="space-y-4">
              <input type="password" placeholder="Current Password" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl" value={security.currentPassword} onChange={e => setSecurity({...security, currentPassword: e.target.value})} />
              <input type="password" placeholder="New Admin Password" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl" value={security.newPassword} onChange={e => setSecurity({...security, newPassword: e.target.value})} />
            </div>
            <button className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold">Update Admin Password</button>
          </form>
        </div>
        <div className="bg-red-50 rounded-3xl border border-red-100 p-8">
          <h3 className="text-red-900 font-bold mb-2">Danger Zone</h3>
          <p className="text-red-600 text-sm mb-4">System-wide actions that cannot be undone.</p>
          <button onClick={onFactoryReset} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-all">Factory Reset System</button>
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
      
      // Update User Info
      const userRef = doc(db, 'users', customer.id);
      batch.update(userRef, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        status: formData.status
      });
      
      // Update Account Info - Use set with merge: true in case account doc doesn't exist
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
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white rounded-[2rem] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Full Account Edit</h2>
            <p className="text-zinc-500 text-sm">Modify all customer and financial parameters.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
            <XCircle className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">First Name</label>
                <input className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} placeholder="First Name" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Last Name</label>
                <input className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} placeholder="Last Name" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Email Address</label>
                <input className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Phone Number</label>
                <input className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Phone" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Residential Address</label>
              <textarea className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl h-20 focus:ring-2 focus:ring-zinc-900 outline-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Address" />
            </div>
          </div>

          {/* Account & Financials */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Account & Financials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Account Number</label>
                <input className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none font-mono" value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} placeholder="Account Number" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Current Balance ($)</label>
                <input type="number" step="0.01" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none font-bold" value={formData.balance ?? 0} onChange={e => setFormData({...formData, balance: parseFloat(e.target.value) || 0})} placeholder="Balance" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Transfer PIN</label>
                <input maxLength={4} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none font-mono tracking-widest" value={formData.transfer_pin || ''} onChange={e => setFormData({...formData, transfer_pin: e.target.value})} placeholder="4-digit PIN" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Account Status</label>
                <select className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none font-bold" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="active">Active</option>
                  <option value="pending">Pending Approval</option>
                  <option value="disabled">Disabled / Locked</option>
                </select>
              </div>
            </div>
          </div>

          {/* Virtual Card Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Virtual Card Details</h3>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Card Number</label>
              <input className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none font-mono" value={formData.card_number || ''} onChange={e => setFormData({...formData, card_number: e.target.value})} placeholder="16-digit Card Number" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Expiry Date</label>
                <input className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none font-mono" value={formData.card_expiry || ''} onChange={e => setFormData({...formData, card_expiry: e.target.value})} placeholder="MM/YY" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">CVV</label>
                <input maxLength={3} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none font-mono" value={formData.card_cvv || ''} onChange={e => setFormData({...formData, card_cvv: e.target.value})} placeholder="3-digit CVV" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="flex-1 bg-zinc-900 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-zinc-800 transition-all">Save All Changes</button>
            <button type="button" onClick={onClose} className="flex-1 bg-zinc-100 text-zinc-600 py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all">Discard</button>
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
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full">
        <h2 className="text-xl font-bold mb-2">Reset Security</h2>
        <p className="text-zinc-500 text-sm mb-6">Update credentials for {customer.first_name} {customer.last_name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">New Password</label>
            <input type="password" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep current" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">New Transfer PIN</label>
            <input type="password" maxLength={4} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl" value={pin} onChange={e => setPin(e.target.value)} placeholder="4-digit PIN" />
          </div>
          <div className="flex gap-4 mt-6">
            <button type="submit" className="flex-1 bg-amber-600 text-white py-3 rounded-xl font-bold">Update Security</button>
            <button type="button" onClick={onClose} className="flex-1 bg-zinc-100 text-zinc-600 py-3 rounded-xl font-bold">Cancel</button>
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
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full">
        <h2 className="text-xl font-bold mb-2">Send Direct Message</h2>
        <p className="text-zinc-500 text-sm mb-6">Send a message to {customer.first_name} {customer.last_name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea 
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl h-32 outline-none focus:ring-2 focus:ring-zinc-900 transition-all" 
            value={message} 
            onChange={e => setMessage(e.target.value)} 
            placeholder="Type your message here..."
            required
          />
          <div className="flex gap-4">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-zinc-900 text-white py-3 rounded-xl font-bold disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-zinc-100 text-zinc-600 py-3 rounded-xl font-bold">Cancel</button>
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
    // Sort on client side to avoid composite index requirement
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
    <div className="bg-white rounded-3xl border border-zinc-200 h-[700px] flex overflow-hidden">
      {/* Sessions Sidebar */}
      <div className="w-80 border-r border-zinc-100 flex flex-col">
        <div className="p-6 border-b border-zinc-100">
          <h3 className="font-bold mb-4">Customer Chats</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none" 
              placeholder="Search chats..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredSessions.map(s => (
            <button 
              key={s.id}
              onClick={() => { setActiveSession(s); }}
              className={`w-full p-4 flex items-center gap-3 hover:bg-zinc-50 transition-all border-b border-zinc-50 ${activeSession?.id === s.id ? 'bg-zinc-50' : ''}`}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden">
                  {s.profile_picture && <img src={s.profile_picture} className="w-full h-full object-cover" />}
                </div>
                {s.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white">
                    {s.unread_count}
                  </span>
                )}
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-bold text-sm text-zinc-900 truncate">{s.first_name} {s.last_name}</p>
                <p className="text-xs text-zinc-500 truncate">{s.last_message || 'No messages yet'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-zinc-50/30">
        {activeSession ? (
          <>
            <div className="p-6 bg-white border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-200 overflow-hidden">
                  {activeSession.profile_picture && <img src={activeSession.profile_picture} className="w-full h-full object-cover" />}
                </div>
                <div>
                  <p className="font-bold text-sm">{activeSession.first_name} {activeSession.last_name}</p>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Offline (Manual Refresh)</p>
                </div>
              </div>
              <button 
                onClick={() => fetchMessages(activeSession.id)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Activity className="w-3 h-3" /> Refresh
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-4 rounded-2xl text-sm ${
                    msg.sender_id === user?.id ? 'bg-zinc-900 text-white rounded-tr-none' : 'bg-white text-zinc-900 shadow-sm border border-zinc-100 rounded-tl-none'
                  }`}>
                    {msg.message_text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-white border-t border-zinc-100 flex gap-4">
              <input 
                className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                placeholder="Type your reply..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold">Send</button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
            <p>Select a chat to start messaging</p>
          </div>
        )}
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
  const [activeTab, setActiveTab] = useState('overview');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-8">
        {/* Admin Horizontal Navigation */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <nav className="flex-1 overflow-x-auto no-scrollbar">
            <div className="bg-white rounded-2xl md:rounded-[2rem] border border-zinc-200 p-2 flex gap-2 shadow-sm items-center min-w-max">
              <div className="px-4 md:px-6 py-2 border-r border-zinc-100 hidden xl:flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white overflow-hidden">
                  {user?.profile_picture ? (
                    <img src={user.profile_picture} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                </div>
                <p className="text-xs font-bold text-zinc-900 tracking-tight">Admin Panel</p>
              </div>
              <div className="flex gap-2">
                {[
                  { id: 'overview', icon: Activity, label: 'Overview' },
                  { id: 'master', icon: Shield, label: 'Master Control' },
                  { id: 'customers', icon: Users, label: 'Customers' },
                  { id: 'transactions', icon: CreditCard, label: 'Transactions' },
                  { id: 'loans', icon: TrendingUp, label: 'Loans' },
                  { id: 'chat', icon: MessageSquare, label: 'Support' },
                  { id: 'settings', icon: ShieldCheck, label: 'System' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`min-w-[100px] md:min-w-[110px] flex items-center justify-center gap-2 px-3 md:px-4 py-3 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold transition-all ${
                      activeTab === item.id 
                        ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-200' 
                        : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-emerald-400' : ''}`} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </nav>
          <button
            onClick={logout}
            className="bg-white border border-zinc-200 px-8 py-4 rounded-2xl md:rounded-[2rem] text-sm font-bold text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Admin Content */}
        <main className="flex-1 min-w-0">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Command Center</h1>
                  <p className="text-zinc-500">System performance and pending actions.</p>
                </div>
                <div className="flex gap-3">
                  <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    System Live
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  { label: 'Total Customers', value: stats?.totalCustomers ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Pending Approvals', value: stats?.pendingApprovals ?? 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Active Accounts', value: stats?.activeAccounts ?? 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'System Liquidity', value: formatCurrency(stats?.totalBalance ?? 0), icon: DollarSign, color: 'text-zinc-900', bg: 'bg-zinc-100' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2rem] border border-zinc-200 shadow-sm hover:shadow-md transition-all">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 md:mb-6`}>
                      <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
                    <h3 className="text-2xl md:text-3xl font-bold text-zinc-900 mt-1 tracking-tight">{stat.value}</h3>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-[2rem] border border-zinc-200 overflow-hidden shadow-sm">
                  <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
                    <h3 className="font-bold text-zinc-900 text-lg tracking-tight">Pending Transactions</h3>
                    <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest">
                      {transactions.filter(t => t.status === 'pending').length} Action Required
                    </span>
                  </div>
                  <div className="divide-y divide-zinc-100 overflow-x-auto">
                    {transactions.filter(t => t.status === 'pending').map((txn) => (
                      <div key={txn.id} className="p-6 md:p-8 flex items-center justify-between hover:bg-zinc-50 transition-colors min-w-[600px] md:min-w-0">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center border border-zinc-200 overflow-hidden">
                            {txn.profile_picture ? (
                              <img src={txn.profile_picture} className="w-full h-full object-cover" />
                            ) : (
                              <ArrowRightLeft className="w-6 h-6 text-zinc-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900">{txn.first_name} {txn.last_name}</p>
                            <p className="text-sm text-zinc-500">{txn.description}</p>
                            <p className="text-[10px] text-zinc-400 mt-1 font-mono tracking-wider">{txn.reference}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <p className="font-bold text-zinc-900 text-lg">{formatCurrency(txn.amount)}</p>
                          <button 
                            onClick={() => approveTransaction(txn.id)}
                            className="bg-zinc-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                    {transactions.filter(t => t.status === 'pending').length === 0 && (
                      <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="w-8 h-8 text-zinc-300" />
                        </div>
                        <p className="text-zinc-400 font-medium">All caught up! No pending transactions.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden">
                  <div className="p-6 border-b border-zinc-100 font-bold">Pending Loans</div>
                  <div className="divide-y divide-zinc-100">
                    {loans.filter(l => l.status === 'pending').map((loan) => (
                      <div key={loan.id} className="p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center border border-zinc-200 overflow-hidden">
                            {loan.profile_picture ? (
                              <img src={loan.profile_picture} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-zinc-400 font-bold text-sm">{loan.first_name.charAt(0)}</div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900">{loan.first_name} {loan.last_name}</p>
                            <p className="text-sm text-zinc-500">{loan.purpose}</p>
                            <p className="text-xs text-zinc-400 mt-1">{formatCurrency(loan.amount)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => updateLoanStatus(loan.id, 'approved')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><CheckCircle className="w-5 h-5" /></button>
                          <button onClick={() => updateLoanStatus(loan.id, 'rejected')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><XCircle className="w-5 h-5" /></button>
                        </div>
                      </div>
                    ))}
                    {loans.filter(l => l.status === 'pending').length === 0 && (
                      <div className="p-12 text-center text-zinc-500 italic">No pending loan applications.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'master' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Master Control Panel</h2>
                  <p className="text-zinc-500">All-in-one management for all registered accounts.</p>
                </div>
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input 
                    className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all shadow-sm" 
                    placeholder="Search accounts..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-zinc-50/50">
                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Customer</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Account & PIN</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Balance</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Quick Adjustment</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
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
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Customer Network</h2>
                  <p className="text-zinc-500">Manage and monitor all bank account holders.</p>
                </div>
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input 
                    className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all shadow-sm" 
                    placeholder="Search by name, email or account..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-white rounded-3xl md:rounded-[2rem] border border-zinc-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-zinc-50/50">
                        <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Customer Profile</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Account Details</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Transfer PIN</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Net Balance</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {customers.filter(c => 
                        `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
                        c.email.toLowerCase().includes(search.toLowerCase()) ||
                        c.account_number.includes(search)
                      ).map((c) => (
                        <tr key={c.id} className="hover:bg-zinc-50/50 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-zinc-100 overflow-hidden border border-zinc-200 shadow-sm">
                                {c.profile_picture ? (
                                  <img src={c.profile_picture} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-400 font-bold">
                                    {c.first_name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-zinc-900">{c.first_name} {c.last_name}</p>
                                <p className="text-xs text-zinc-500">{c.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm font-mono text-zinc-600 tracking-wider">{c.account_number}</p>
                            <p className="text-[10px] text-zinc-400 uppercase font-bold mt-1">Standard Savings</p>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                              <p className="text-sm font-mono font-bold text-zinc-900 tracking-widest">
                                {c.transfer_pin || 'NOT SET'}
                              </p>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-lg font-bold text-zinc-900 tracking-tight">{formatCurrency(c.balance)}</p>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                              c.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 
                              c.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                            }`}>{c.status}</span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {c.status === 'pending' && (
                                <button onClick={() => updateCustomerStatus(c.id, 'active')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Approve"><CheckCircle className="w-5 h-5" /></button>
                              )}
                              {c.status === 'active' && (
                                <button onClick={() => updateCustomerStatus(c.id, 'disabled')} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all" title="Disable Account"><XCircle className="w-5 h-5" /></button>
                              )}
                              {c.status === 'disabled' && (
                                <button onClick={() => updateCustomerStatus(c.id, 'active')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Enable Account"><CheckCircle className="w-5 h-5" /></button>
                              )}
                              <button onClick={() => setEditingCustomer(c)} className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-xl transition-all" title="Edit Profile"><Edit className="w-5 h-5" /></button>
                              <button onClick={() => setSendingMessageTo(c)} className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-xl transition-all" title="Send Message"><MessageSquare className="w-5 h-5" /></button>
                              <button onClick={() => setResettingPassword(c)} className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-xl transition-all" title="Security Reset"><Key className="w-5 h-5" /></button>
                              <button onClick={() => deleteCustomer(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete User"><Trash2 className="w-5 h-5" /></button>
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
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Financial Ledger</h2>
                <p className="text-zinc-500">Real-time monitoring of all system-wide transactions.</p>
              </div>
              <div className="bg-white rounded-3xl md:rounded-[2rem] border border-zinc-200 overflow-hidden shadow-sm">
                <div className="divide-y divide-zinc-100 overflow-x-auto no-scrollbar">
                  {transactions.map((txn) => (
                    <div key={txn.id} className="p-6 md:p-8 flex justify-between items-center hover:bg-zinc-50/50 transition-colors group min-w-[600px] md:min-w-0">
                      <div className="flex items-center gap-4 md:gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                          txn.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          <ArrowRightLeft className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 text-lg">{txn.description}</p>
                          <p className="text-sm text-zinc-500 font-medium">
                            {txn.first_name} {txn.last_name} 
                            <span className="mx-2 text-zinc-300">•</span>
                            {new Date(txn.created_at).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-1 font-mono tracking-widest uppercase">{txn.reference}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold text-zinc-900 tracking-tight">{formatCurrency(txn.amount)}</p>
                          <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full ${
                            txn.status === 'completed' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'
                          }`}>{txn.status}</span>
                        </div>
                        <button 
                          onClick={() => setEditingTxnDate(txn)}
                          className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100"
                          title="Adjust Transaction Date"
                        >
                          <Calendar className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Edit Date</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="p-20 text-center text-zinc-400 font-medium">No transactions found in the system.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'loans' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Loan Portfolio</h2>
                <p className="text-zinc-500">Review and manage customer credit applications.</p>
              </div>
              <div className="bg-white rounded-3xl md:rounded-[2rem] border border-zinc-200 overflow-hidden shadow-sm">
                <div className="divide-y divide-zinc-100 overflow-x-auto no-scrollbar">
                  {loans.map((loan) => (
                    <div key={loan.id} className="p-6 md:p-8 flex justify-between items-center hover:bg-zinc-50/50 transition-colors group min-w-[600px] md:min-w-0">
                      <div className="flex items-center gap-4 md:gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                          loan.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                          loan.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 text-lg">{loan.first_name} {loan.last_name}</p>
                          <p className="text-sm text-zinc-500 font-medium">
                            {loan.purpose} 
                            <span className="mx-2 text-zinc-300">•</span>
                            Applied on {new Date(loan.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-lg font-bold text-zinc-900 mt-1">{formatCurrency(loan.amount)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          loan.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                          loan.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                        }`}>{loan.status}</span>
                        {loan.status === 'pending' && (
                          <div className="flex gap-3">
                            <button 
                              onClick={() => updateLoanStatus(loan.id, 'approved')} 
                              className="bg-zinc-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => updateLoanStatus(loan.id, 'rejected')} 
                              className="bg-white border border-zinc-200 text-red-600 px-6 py-3 rounded-xl text-sm font-bold hover:bg-red-50 transition-all"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loans.length === 0 && (
                    <div className="p-20 text-center text-zinc-400 font-medium">No loan applications recorded.</div>
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
