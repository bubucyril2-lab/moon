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
    platinum: 'bg-gradient-to-br from-zinc-100 to-zinc-300 text-zinc-800 border-zinc-200',
    gold: 'bg-gradient-to-br from-amber-200 via-amber-400 to-amber-500 text-amber-950 border-amber-300',
    black: 'bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-zinc-100 border-zinc-700',
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.02, rotateY: 5 }}
      className={`relative w-full aspect-[1.586/1] rounded-2xl p-6 shadow-2xl border flex flex-col justify-between overflow-hidden ${themes[type]} ${className}`}
    >
      {/* Chip and Contactless */}
      <div className="flex justify-between items-start">
        <div className="w-12 h-10 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-lg border border-yellow-600/20" />
        <Wifi className="w-6 h-6 opacity-50" />
      </div>

      {/* Card Number */}
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-widest opacity-60 font-medium">Card Number</p>
        <p className="text-xl md:text-2xl font-mono tracking-wider font-bold">{number}</p>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest opacity-60 font-medium">Card Holder</p>
          <p className="text-sm font-bold tracking-wide">{holder}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] uppercase tracking-widest opacity-60 font-medium">Expires</p>
          <p className="text-sm font-bold tracking-wide">{expiry}</p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -top-10 w-40 h-40 bg-black/5 rounded-full blur-3xl pointer-events-none" />
    </motion.div>
  );
};

export default CreditCard;
