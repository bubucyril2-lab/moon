import React from 'react';
import { motion } from 'motion/react';
import { Shield, Zap, Globe, TrendingUp, ArrowRight, Landmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import CreditCard from '../components/CreditCard';

const Home = () => {
  return (
    <div className="relative flex flex-col min-h-screen overflow-x-hidden">
      {/* Fixed Background Layer - Professional Staff Group */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none" 
        style={{ 
          backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.15)), url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=2000')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-referrer'
        }} 
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] lg:h-[95vh] flex items-center overflow-hidden py-20 lg:py-0">
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 lg:via-white/70 to-transparent z-10" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/10 border border-emerald-600/20 text-emerald-600 text-xs font-semibold mb-6">
                  <Shield className="w-3 h-3" />
                  PREMIER GLOBAL BANKING
                </div>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-zinc-900 tracking-tighter leading-[0.9] mb-8">
                  Elegance in <br />
                  <span className="text-emerald-600 italic font-serif">Finance.</span>
                </h1>
                <p className="text-lg md:text-xl text-zinc-700 mb-10 leading-relaxed font-medium max-w-lg">
                  Moonstone Bank combines traditional trust with modern technology. Experience a new standard of professional wealth management.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/register" className="bg-zinc-900 text-white px-10 py-5 rounded-2xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 group shadow-2xl shadow-zinc-400">
                    Get Started
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link to="/about" className="bg-white/80 text-zinc-900 backdrop-blur-xl border border-zinc-200 px-10 py-5 rounded-2xl font-bold hover:bg-white transition-all flex items-center justify-center">
                    Our Story
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="hidden lg:block relative"
              >
                <div className="relative z-10 transform rotate-6 translate-x-12 translate-y-12">
                  <CreditCard type="black" holder="PREMIER MEMBER" />
                </div>
                <div className="absolute top-0 left-0 z-0 transform -rotate-6 -translate-x-12 -translate-y-12 opacity-80">
                  <CreditCard type="platinum" holder="ELITE CLIENT" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Card Tiers Section */}
        <section className="py-20 lg:py-32 bg-zinc-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 lg:mb-20 gap-8">
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Exclusive Card Tiers</h2>
                <p className="text-zinc-400 text-base md:text-lg">Choose the card that matches your lifestyle. From daily essentials to global luxury, we have you covered.</p>
              </div>
              <Link to="/services" className="text-emerald-400 font-bold flex items-center gap-2 hover:text-emerald-300 transition-colors">
                View All Benefits <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-8">
                <CreditCard type="platinum" />
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Moonstone Platinum</h3>
                  <p className="text-zinc-400">Perfect for daily use with 2% cashback on all transactions and zero international fees.</p>
                </div>
              </div>
              <div className="space-y-8">
                <CreditCard type="gold" />
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Moonstone Gold</h3>
                  <p className="text-zinc-400">Enhanced travel insurance, airport lounge access, and dedicated 24/7 support.</p>
                </div>
              </div>
              <div className="space-y-8">
                <CreditCard type="black" />
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Moonstone Black</h3>
                  <p className="text-zinc-400">Our most exclusive tier. Concierge service, private event access, and unlimited rewards.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-32 bg-white/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-zinc-900 mb-4">Our Premium Services</h2>
              <p className="text-zinc-700 font-medium max-w-2xl mx-auto">Tailored financial solutions designed for your unique lifestyle and business needs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Landmark, title: "Savings Accounts", desc: "High-yield savings with flexible withdrawal options." },
                { icon: Zap, title: "Instant Transfers", desc: "Send money locally or internationally in seconds." },
                { icon: Globe, title: "Global Banking", desc: "Multi-currency accounts for the modern traveler." },
                { icon: TrendingUp, title: "Smart Loans", desc: "Competitive rates with fast approval processes." }
              ].map((service, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -5 }}
                  className="p-8 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/20 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-6">
                    <service.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-3">{service.title}</h3>
                  <p className="text-zinc-700 text-sm leading-relaxed font-medium">{service.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Banner */}
        <section className="py-16 bg-white/20 backdrop-blur-sm border-y border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-center items-center gap-12 opacity-70 grayscale-0">
            <div className="text-2xl font-bold text-zinc-800">FINTECH</div>
            <div className="text-2xl font-bold text-zinc-800">GLOBAL BANK</div>
            <div className="text-2xl font-bold text-zinc-800">SECURE PAY</div>
            <div className="text-2xl font-bold text-zinc-800">TRUST CAPITAL</div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
