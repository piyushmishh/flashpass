import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { PageTransition } from './components/PageTransition';
import { HomePage } from './pages/HomePage';
import { EventPage } from './pages/EventPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { LoginPage } from './pages/LoginPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { ScannerPage } from './pages/ScannerPage';

export const App: React.FC = () => {
  const location = useLocation();

  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
              <Route path="/events/:id" element={<PageTransition><EventPage /></PageTransition>} />
              <Route path="/checkout/:orderId" element={<PageTransition><CheckoutPage /></PageTransition>} />
              <Route path="/confirmation/:orderId" element={<PageTransition><ConfirmationPage /></PageTransition>} />
              <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
              <Route path="/orders" element={<PageTransition><MyOrdersPage /></PageTransition>} />
              <Route path="/admin" element={<PageTransition><AdminDashboard /></PageTransition>} />
              <Route path="/scanner" element={<PageTransition><ScannerPage /></PageTransition>} />
            </Routes>
          </AnimatePresence>
        </main>
        <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
          © 2026 FlashPass — Distributed Event Ticketing Platform
        </footer>
      </div>
    </AuthProvider>
  );
};

export default App;
