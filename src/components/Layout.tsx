import React from 'react';
import { NavLink } from 'react-router';
import { 
  LayoutDashboard, 
  CreditCard, 
  TrendingUp, 
  Calculator, 

  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../services/supabase';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'EMI Tracker', path: '/emi', icon: CreditCard },
  { name: 'SIP Tracker', path: '/sip', icon: TrendingUp },
  { name: 'What-if Simulator', path: '/simulator', icon: Calculator },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { signOut, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const [notifications, setNotifications] = React.useState<string[]>([]);
  const [showNotifications, setShowNotifications] = React.useState(false);

  React.useEffect(() => {
    const fetchEmis = async () => {
      if (!user) return;
      const { data } = await supabase.from('emis').select('loan_name, start_date').eq('user_id', user.id);
      if (data) {
        const today = new Date().getDate();
        const upcoming = data.filter(e => {
          const loanDay = new Date(e.start_date).getDate();
          return loanDay >= today && loanDay <= today + 3;
        }).map(e => `Upcoming EMI: ${e.loan_name} in ${new Date(e.start_date).getDate() - today} days.`);
        setNotifications(upcoming);
      }
    };
    fetchEmis();
  }, [user]);

  return (
    <div className="flex h-screen bg-[#FDFCFB] font-sans text-[#1A1A1A]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 border-r border-black/5 p-8">
        <div className="mb-14">
          <h1 className="font-serif italic text-3xl tracking-tight">FinTrack.</h1>
        </div>

        <nav className="flex-1 space-y-12">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-black/40 mb-6 font-bold">Portfolio</p>
            <ul className="space-y-4">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `
                      group flex items-center gap-3 text-sm transition-all duration-300
                      ${isActive 
                        ? 'text-black font-semibold' 
                        : 'text-black/50 hover:text-black hover:translate-x-1'}
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`w-1.5 h-1.5 rounded-full bg-black transition-transform duration-300 ${isActive ? 'scale-100' : 'scale-0'}`} />
                        <span>{item.name}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-black/40 mb-6 font-bold">Services</p>
            <div className="space-y-4">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="flex items-center gap-3 text-sm text-black/50 hover:text-black transition-all w-full text-left"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] opacity-80" />
                <span>Security Alerts {notifications.length > 0 && `(${notifications.length})`}</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="mt-auto pt-8 border-t border-black/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[10px] text-white font-bold">
              {user?.email?.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.email?.split('@')[0]}</p>
              <p className="text-[10px] text-black/40 italic">Premium Account</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="text-[10px] uppercase tracking-[0.3em] font-bold text-black/40 hover:text-[#EF4444] transition-colors"
          >
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Mobile Top Nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-black/5 flex items-center justify-between px-6 z-40">
        <h1 className="font-serif italic text-xl tracking-tight">FinTrack.</h1>
        <button onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/10 backdrop-blur-md z-50 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-xs bg-white z-50 md:hidden p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-12">
                <h1 className="font-serif italic text-2xl tracking-tight">FinTrack.</h1>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X size={24} />
                </button>
              </div>

              <nav className="flex-1 space-y-12">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-black/40 mb-6 font-bold">Portfolio</p>
                  <ul className="space-y-6">
                    {navItems.map((item) => (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={({ isActive }) => `
                            flex items-center gap-3 text-lg transition-all
                            ${isActive ? 'text-black font-semibold' : 'text-black/50'}
                          `}
                        >
                          {({ isActive }) => (
                            <>
                              <span className={`w-1.5 h-1.5 rounded-full bg-black ${isActive ? 'scale-100' : 'scale-0'}`} />
                              <span>{item.name}</span>
                            </>
                          )}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </nav>

              <div className="mt-auto pt-8 border-t border-black/5">
                <button
                  onClick={signOut}
                  className="text-[10px] uppercase tracking-[0.2em] font-bold text-red-600"
                >
                  End Session
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-6xl mx-auto p-6 md:p-12 pb-24 h-full">
          {/* Notification Overlay */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute top-24 left-12 w-80 bg-white rounded-sm shadow-2xl border border-black/5 p-8 z-50"
              >
                <div className="flex justify-between items-center mb-8">
                  <h4 className="font-serif italic text-xl">Alerts</h4>
                  <button onClick={() => setShowNotifications(false)} className="text-black/40 hover:text-black">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-6 max-h-96 overflow-y-auto pr-4 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <p className="text-sm italic text-black/50">Your financial horizon is clear.</p>
                  ) : (
                    notifications.map((n, i) => (
                      <div key={i} className="flex flex-col gap-1 border-b border-black/5 pb-4 last:border-0 hover:translate-x-1 transition-transform">
                        <p className="text-xs uppercase tracking-widest text-black/40 font-bold">Mandatory Payment</p>
                        <p className="text-sm leading-relaxed">{n}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {children}
          
          <footer className="mt-20 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-black/30 border-t border-black/5 pt-10">
            <div className="flex gap-10">
              <span className="hover:text-black cursor-help">Calculations certified</span>
              <span className="hover:text-black cursor-help">Terms of privacy</span>
            </div>
            <div className="font-serif italic capitalize text-sm opacity-60">
              Discretion is the better part of wealth.
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};
