import React from 'react';

const LegalPage = ({ title }: { title: string }) => (
  <div className="py-24 bg-white">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-zinc-900 mb-8">{title}</h1>
      <div className="prose prose-zinc max-w-none space-y-6 text-zinc-600">
        <p className="text-lg">Last updated: {new Date().toLocaleDateString()}</p>
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">1. Introduction</h2>
          <p>Welcome to Moonstone Bank. By accessing our services, you agree to be bound by these terms. Please read them carefully. Our goal is to provide a secure and transparent banking experience for all our customers.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">2. Use of Services</h2>
          <p>You must be at least 18 years old to open an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">3. Privacy & Data</h2>
          <p>Your privacy is paramount. We use advanced encryption to protect your data. We do not sell your personal information to third parties. For more details, please refer to our full Privacy Policy.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">4. Liability</h2>
          <p>Moonstone Bank is not liable for any indirect, incidental, or consequential damages arising out of your use of our services, except as required by law.</p>
        </section>
      </div>
    </div>
  </div>
);

export const Terms = () => <LegalPage title="Terms & Conditions" />;
export const Privacy = () => <LegalPage title="Privacy Policy" />;
