import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, Landmark, AlertCircle, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, 'users', userCredential.user.uid);
      let userDoc = await getDoc(userRef);
      
      // Self-healing: If profile is missing, create a default one
      if (!userDoc.exists()) {
        const isInitialAdmin = email.toLowerCase().includes('admin');
        const emailPrefix = userCredential.user.email?.split('@')[0] || 'Member';
        
        // Try to be smarter about the name from email if possible
        let firstName = 'User';
        let lastName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
        
        if (emailPrefix.includes('.')) {
          const parts = emailPrefix.split('.');
          firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
          lastName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
        }

        await setDoc(userRef, {
          first_name: firstName,
          last_name: lastName,
          email: userCredential.user.email,
          role: isInitialAdmin ? 'admin' : 'customer',
          status: 'active',
          profile_picture: userCredential.user.photoURL || null,
          created_at: new Date().toISOString()
        });
        
        // If it's a customer, also ensure they have an account document
        if (!isInitialAdmin) {
          const accountRef = doc(db, 'accounts', userCredential.user.uid);
          const accountDoc = await getDoc(accountRef);
          if (!accountDoc.exists()) {
            await setDoc(accountRef, {
              user_id: userCredential.user.uid,
              account_number: "MS" + Math.floor(1000000000 + Math.random() * 9000000000),
              balance: 0,
              status: 'active',
              card_number: "4" + Math.floor(100000000000000 + Math.random() * 900000000000000).toString(),
              card_expiry: "12/29",
              card_cvv: Math.floor(100 + Math.random() * 900).toString(),
              created_at: new Date().toISOString()
            });
          }
        }
        
        // Re-fetch the doc after creation
        userDoc = await getDoc(userRef);
      }

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-zinc-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-zinc-200 p-8"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mb-4">
            <Landmark className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Welcome Back</h1>
          <p className="text-zinc-500">Access your Moonstone account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
          <p className="text-zinc-500 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-600 font-semibold hover:underline">
              Open one now
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
