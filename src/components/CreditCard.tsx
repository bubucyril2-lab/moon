import React from 'react';
import { motion } from 'motion/react';
import { CreditCard as CardIcon, Wifi } from 'lucide-react';

interface CreditCardProps {
  type: 'platinum' | 'gold' | 'black';
  number?: string;
  holder?: string;
  expiry?: string;
  className?: string;
}

const CreditCard: React.FC<CreditCardProps> = ({ type, number = '**** **** **** 8888', holder = 'JOHN DOE', expiry = '12/28', className = '' }) => {
  const themes = {
    platinum: 'bg-gradient-to-br from-zinc-100 via-zinc-200 to-zinc-400 text-zinc-800 border-white/40 shadow-zinc-200/50',
    gold: 'bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 text-amber-950 border-white/30 shadow-amber-500/20',
    black: 'bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-zinc-100 border-white/10 shadow-zinc-900/40',
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative w-full aspect-[1.586/1] rounded-[2rem] p-8 shadow-2xl border backdrop-blur-sm flex flex-col justify-between overflow-hidden ${themes[type]} ${className}`}
    >
      {/* Chip and Contactless */}
      <div className="flex justify-between items-start relative z-10">
        <div className="w-14 h-11 bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 rounded-xl border border-white/20 shadow-inner overflow-hidden relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(0,0,0,0.5) 50%), linear-gradient(0deg, transparent 50%, rgba(0,0,0,0.5) 50%)', backgroundSize: '4px 4px' }} />
        </div>
        <div className="flex flex-col items-end gap-1">
          <Wifi className="w-6 h-6 opacity-40 rotate-90" />
          <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Contactless</p>
        </div>
      </div>

      {/* Card Number */}
      <div className="space-y-2 relative z-10">
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-50 font-black">Card Number</p>
        <p className="text-2xl md:text-3xl font-mono tracking-[0.15em] font-black drop-shadow-md">{number}</p>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-end relative z-10">
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-[0.2em] opacity-50 font-black">Card Holder</p>
          <p className="text-base font-black tracking-tight uppercase">{holder}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[9px] uppercase tracking-[0.2em] opacity-50 font-black">Expires</p>
          <p className="text-base font-black tracking-tight">{expiry}</p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -top-20 w-64 h-64 bg-black/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Subtle shine effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
    </motion.div>
  );
};

export default CreditCard;
