import React from 'react';
import { motion } from 'motion/react';
import { Shield, Target, Eye, Users } from 'lucide-react';

const About = () => {
  return (
    <div className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-zinc-900 mb-6">About Moonstone Bank</h1>
          <p className="text-xl text-zinc-600 max-w-3xl mx-auto leading-relaxed">
            Founded on the principles of integrity and innovation, Moonstone Bank is dedicated to redefining the financial landscape for the digital age.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
          {[
            { icon: Target, title: "Our Mission", desc: "To empower individuals and businesses with secure, accessible, and innovative financial tools." },
            { icon: Eye, title: "Our Vision", desc: "To be the world's most trusted digital banking partner, fostering global prosperity." },
            { icon: Shield, title: "Our Values", desc: "Security, Transparency, and Excellence are at the heart of everything we do." }
          ].map((item, i) => (
            <div key={i} className="text-center p-8 bg-white rounded-3xl border border-zinc-100 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
                <item.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">{item.title}</h3>
              <p className="text-zinc-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900 rounded-[3rem] p-12 md:p-24 text-white overflow-hidden relative">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-8">A Legacy of Trust.</h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                Since our inception, we have prioritized the security of our customers' assets above all else. Our multi-layered security protocols and advanced encryption ensure that your wealth is protected around the clock.
              </p>
              <div className="flex gap-8">
                <div>
                  <p className="text-4xl font-bold text-emerald-500">10M+</p>
                  <p className="text-zinc-500 text-sm">Active Users</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-emerald-500">$50B+</p>
                  <p className="text-zinc-500 text-sm">Assets Managed</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2070" 
                alt="Bank HQ" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>
      </div>
    </div>
  );
};

export default About;
