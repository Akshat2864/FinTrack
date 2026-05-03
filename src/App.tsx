import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { EMITracker } from './pages/EMITracker';
import { SIPTracker } from './pages/SIPTracker';
import { WhatIfSimulator } from './pages/WhatIfSimulator';
import { Layout } from './components/Layout';
import { Settings, AlertTriangle } from 'lucide-react';

const ConfigErrorScreen: React.FC<{ error: string }> = ({ error }) => {
  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white border border-black/5 p-12 shadow-2xl text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-100">
          <Settings size={32} />
        </div>
        <h1 className="text-3xl font-serif mb-4">Configuration Required</h1>
        <p className="text-black/40 text-[10px] uppercase tracking-[0.2em] font-bold mb-8">System Initialization Failed</p>
        
        <div className="bg-[#F9FAFB] p-6 rounded-sm border border-black/5 text-left mb-8">
          <div className="flex items-start gap-3 text-red-600 mb-3">
             <AlertTriangle size={16} className="shrink-0 mt-0.5" />
             <p className="text-xs font-bold leading-relaxed tracking-tight">{error}</p>
          </div>
          <p className="text-[10px] text-black/60 font-medium leading-relaxed">
            This application requires a Supabase back-end. Please provide your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the application settings menu.
          </p>
        </div>

        <p className="text-[10px] text-black/20 font-bold uppercase tracking-widest leading-relaxed">
          The application will resume once credentials are provided.
        </p>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, configError } = useAuth();
  console.log('ProtectedRoute - User:', user?.email, 'Loading:', loading);

  if (configError) return <ConfigErrorScreen error={configError} />;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#F3F4F6] border-t-[#1A1A1A] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Layout>{children}</Layout>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, configError } = useAuth();
  console.log('PublicRoute - User:', user?.email, 'Loading:', loading);

  if (configError) return <ConfigErrorScreen error={configError} />;
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
          
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/emi" element={<ProtectedRoute><EMITracker /></ProtectedRoute>} />
          <Route path="/sip" element={<ProtectedRoute><SIPTracker /></ProtectedRoute>} />
          <Route path="/simulator" element={<ProtectedRoute><WhatIfSimulator /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
