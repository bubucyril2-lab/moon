import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import { Terms, Privacy } from './pages/Legal';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} />;
  }
  return <>{children}</>;
};

const PublicSiteRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className={`min-h-screen font-sans text-zinc-900 ${isAuthenticated ? 'lg:flex relative' : ''}`}>
      {isAuthenticated && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          {/* Top Gradient Section */}
          <div className="absolute top-0 left-0 right-0 h-[50vh] bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-[50vh] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-300/20 via-transparent to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-[50vh] bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-teal-300/10 via-transparent to-transparent" />
          
          {/* Bottom White Section */}
          <div className="absolute inset-0 bg-white z-[-1]" />
        </div>
      )}
      <Navbar />
      {isAuthenticated && <Sidebar />}
      <main className={`flex-1 min-w-0 relative z-10 ${isAuthenticated ? 'h-screen overflow-y-auto no-scrollbar pb-24 lg:pb-0' : ''}`}>
        <Routes>
          <Route path="/" element={<PublicSiteRoute><Home /></PublicSiteRoute>} />
          <Route path="/about" element={<PublicSiteRoute><About /></PublicSiteRoute>} />
          <Route path="/services" element={<PublicSiteRoute><Services /></PublicSiteRoute>} />
          <Route path="/contact" element={<PublicSiteRoute><Contact /></PublicSiteRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/terms" element={<PublicSiteRoute><Terms /></PublicSiteRoute>} />
          <Route path="/privacy" element={<PublicSiteRoute><Privacy /></PublicSiteRoute>} />
          <Route 
            path="/dashboard/*" 
            element={
              <ProtectedRoute>
                <CustomerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {isAuthenticated && <BottomNav />}
      {!isAuthenticated && <Footer />}
    </div>
  );
}
