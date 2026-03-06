import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark, Twitter, Github, Linkedin, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-zinc-200 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <Landmark className="w-8 h-8 text-emerald-600" />
              <span className="text-xl font-bold text-zinc-900 tracking-tight">Moonstone</span>
            </Link>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Empowering your financial future with secure, innovative, and accessible banking solutions.
            </p>
            <div className="flex gap-4">
              <Twitter className="w-5 h-5 text-zinc-400 hover:text-emerald-600 cursor-pointer transition-colors" />
              <Instagram className="w-5 h-5 text-zinc-400 hover:text-emerald-600 cursor-pointer transition-colors" />
              <Linkedin className="w-5 h-5 text-zinc-400 hover:text-emerald-600 cursor-pointer transition-colors" />
              <Github className="w-5 h-5 text-zinc-400 hover:text-emerald-600 cursor-pointer transition-colors" />
            </div>
          </div>

          <div>
            <h4 className="font-bold text-zinc-900 mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm text-zinc-500">
              <li><Link to="/" className="hover:text-emerald-600 transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-emerald-600 transition-colors">About Us</Link></li>
              <li><Link to="/services" className="hover:text-emerald-600 transition-colors">Services</Link></li>
              <li><Link to="/contact" className="hover:text-emerald-600 transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-zinc-900 mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-zinc-500">
              <li><Link to="/terms" className="hover:text-emerald-600 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-emerald-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/security" className="hover:text-emerald-600 transition-colors">Security Policy</Link></li>
              <li><Link to="/cookies" className="hover:text-emerald-600 transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-zinc-900 mb-6">Newsletter</h4>
            <p className="text-sm text-zinc-500 mb-4">Stay updated with our latest financial insights.</p>
            <div className="flex gap-2">
              <input 
                className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Email address"
              />
              <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-zinc-400 text-xs">
            © {new Date().getFullYear()} Moonstone Bank. All rights reserved. Member FDIC. Equal Housing Lender.
          </p>
          <div className="flex items-center gap-6">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4 opacity-30" referrerPolicy="no-referrer" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6 opacity-30" referrerPolicy="no-referrer" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4 opacity-30" referrerPolicy="no-referrer" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
