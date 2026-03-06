import React from 'react';
import { motion } from 'motion/react';
import { Wallet, Send, TrendingUp, Globe, CreditCard, ShieldCheck } from 'lucide-react';

const Services = () => {
  const services = [
    { icon: Wallet, title: "Savings Accounts", desc: "Flexible savings plans with competitive interest rates and no hidden fees." },
    { icon: Send, title: "Local & International Transfers", desc: "Send money anywhere in the world with low fees and instant processing." },
    { icon: TrendingUp, title: "Personal & Business Loans", desc: "Fast approval loans tailored to your specific financial goals." },
    { icon: Globe, title: "International Banking", desc: "Multi-currency support and global ATM access for seamless travel." },
    { icon: CreditCard, title: "Virtual & Physical Cards", desc: "Secure cards with instant freeze/unfreeze capabilities via the app." },
    { icon: ShieldCheck, title: "Wealth Management", desc: "Expert financial advice to help you grow and protect your portfolio." }
  ];

  return (
    <div className="py-24 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-bold text-zinc-900 mb-6">Our Financial Solutions</h1>
          <p className="text-xl text-zinc-600 max-w-3xl mx-auto leading-relaxed">
            Comprehensive banking services designed to meet the demands of a modern, global economy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-10 rounded-[2rem] border border-zinc-200 hover:border-emerald-500 transition-all group shadow-sm"
            >
              <div className="w-14 h-14 rounded-2xl bg-zinc-50 text-zinc-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 flex items-center justify-center mb-8 transition-all">
                <service.icon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">{service.title}</h3>
              <p className="text-zinc-600 leading-relaxed">{service.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-24 bg-emerald-600 rounded-[3rem] p-12 md:p-20 text-white text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8">Ready to start banking?</h2>
          <p className="text-emerald-100 text-lg mb-12 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have switched to Moonstone for a better banking experience.
          </p>
          <button className="bg-white text-emerald-600 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-50 transition-all shadow-xl">
            Open Your Account Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Services;
