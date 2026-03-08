import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
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
    <div className={`min-h-screen font-sans text-zinc-900 ${isAuthenticated ? 'lg:flex' : ''}`}>
      <Navbar />
      {isAuthenticated && <Sidebar />}
      <main className={`flex-1 min-w-0 ${isAuthenticated ? 'h-screen overflow-y-auto no-scrollbar' : ''}`}>
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
      {!isAuthenticated && <Footer />}
    </div>
  );
}
