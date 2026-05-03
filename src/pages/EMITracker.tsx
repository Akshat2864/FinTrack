import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { EMI } from '../types';
import { calculateEMI, formatCurrency } from '../utils/finance';
import { Trash2, CreditCard, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export const EMITracker: React.FC = () => {
  const { user } = useAuth();
  const [emis, setEmis] = useState<EMI[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [loanName, setLoanName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [tenure, setTenure] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchEMIs();
  }, [user]);

  const fetchEMIs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('emis')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setEmis(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const p = parseFloat(principal);
    const r = parseFloat(interestRate);
    const nYears = parseFloat(tenure);
    const emiAmount = calculateEMI(p, r, nYears);

    const { error } = await supabase.from('emis').insert({
      user_id: user.id,
      loan_name: loanName,
      principal: p,
      interest_rate: r,
      tenure_months: nYears * 12,
      emi_amount: emiAmount,
      start_date: startDate,
    });

    if (!error) {
      setLoanName('');
      setPrincipal('');
      setInterestRate('');
      setTenure('');
      setIsFormOpen(false);
      fetchEMIs();
    }
  };

  const deleteEMI = async (id: string) => {
    const { error } = await supabase.from('emis').delete().eq('id', id);
    if (!error) fetchEMIs();
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-baseline justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-black/40 font-bold">Liability Management</p>
          <h1 className="text-5xl font-serif mt-2">EMI Tracker</h1>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="text-[10px] uppercase tracking-widest font-bold px-8 py-4 bg-black text-white hover:bg-opacity-80 transition-all"
          >
            Declare New Debt
          </button>
        )}
      </header>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-10 rounded-sm border border-black/5 shadow-sm mb-12">
              <h2 className="text-sm uppercase tracking-[0.2em] font-bold mb-8 italic font-serif">Obligation Details</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">Loan Identifier</label>
                  <input
                    type="text"
                    placeholder="HDFC Home Loan"
                    className="w-full bg-[#F9FAFB] border border-black/10 focus:border-black rounded-sm p-4 outline-none transition-all font-medium"
                    value={loanName}
                    onChange={(e) => setLoanName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">Principal Amount</label>
                  <input
                    type="number"
                    placeholder="Amount in INR"
                    className="w-full bg-[#F9FAFB] border border-black/10 focus:border-black rounded-sm p-4 outline-none transition-all font-medium"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">Annual Interest (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 8.5"
                    className="w-full bg-[#F9FAFB] border border-black/10 focus:border-black rounded-sm p-4 outline-none transition-all font-medium"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">Tenure (Years)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="w-full bg-[#F9FAFB] border border-black/10 focus:border-black rounded-sm p-4 outline-none transition-all font-medium"
                    value={tenure}
                    onChange={(e) => setTenure(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">Commencement Date</label>
                  <input
                    type="date"
                    className="w-full bg-[#F9FAFB] border border-black/10 focus:border-black rounded-sm p-4 outline-none transition-all font-medium"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-end gap-4">
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-black text-white text-[10px] uppercase font-bold tracking-widest hover:bg-opacity-80 transition-all"
                  >
                    Commit Record
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)}
                    className="p-4 border border-black/10 text-black hover:border-black transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EMI List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center p-20">
             <div className="w-8 h-8 border-2 border-black/10 border-t-black rounded-full animate-spin"></div>
          </div>
        ) : emis.length === 0 ? (
          <div className="bg-white p-20 rounded-sm border border-dashed border-black/10 flex flex-col items-center justify-center text-center">
            <h3 className="text-2xl font-serif italic mb-2">The ledger is empty.</h3>
            <p className="text-black/40 font-medium max-w-sm text-sm">
              Your financial journey awaits documentation. Record your liabilities to begin the audit.
            </p>
            <button 
              onClick={() => setIsFormOpen(true)}
              className="mt-10 px-10 py-4 bg-black text-white text-[10px] uppercase tracking-widest font-bold"
            >
              Initialize First Record
            </button>
          </div>
        ) : (
          emis.map((emi) => (
            <EMICard key={emi.id} emi={emi} onDelete={deleteEMI} />
          ))
        )}
      </div>
    </div>
  );
};

const EMICard: React.FC<{ emi: EMI; onDelete: (id: string) => void }> = ({ emi, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-sm border border-black/5 overflow-hidden hover:border-black/20 transition-all"
    >
      <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-8">
          <div className="w-12 h-12 border border-black flex items-center justify-center text-black">
            <CreditCard size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">{emi.loan_name}</h3>
            <div className="flex items-center gap-6 mt-2 text-[10px] uppercase tracking-[0.15em] text-black/40 font-bold">
              <span>{emi.interest_rate}% Fixed</span>
              <span>{(emi.tenure_months / 12).toFixed(1)} Years Total</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-12">
          <div className="text-right">
            <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1">Monthly Assessment</p>
            <p className="text-2xl font-serif italic">{formatCurrency(emi.emi_amount)}</p>
          </div>
          <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(`/simulator?id=${emi.id}`)}
                className="w-10 h-10 border border-emerald-200 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all bg-emerald-50 text-emerald-600"
                title="Open Strategy Lab"
              >
                <BarChart3 size={18} />
              </button>
              <button 
                onClick={() => setExpanded(!expanded)}
                className="w-10 h-10 border border-black/5 flex items-center justify-center hover:border-black transition-all"
                title="Expand Details"
              >
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              <button 
                onClick={() => onDelete(emi.id)}
                className="w-10 h-10 border border-black/5 text-black/30 hover:text-red-600 hover:border-red-600 transition-all focus:bg-red-50"
                title="Delete Record"
              >
                <Trash2 size={18} />
              </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-8 pb-10 pt-4 border-t border-black/5 bg-[#FDFCFB]"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Base Principal</p>
                  <p className="text-lg font-serif">{formatCurrency(emi.principal)}</p>
               </div>
               <div className="space-y-1 text-red-600/70">
                  <p className="text-[10px] font-bold uppercase tracking-widest">Interest Accrued</p>
                  <p className="text-lg font-serif">{formatCurrency(emi.emi_amount * emi.tenure_months - emi.principal)}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Total Repayment</p>
                  <p className="text-lg font-serif">{formatCurrency(emi.emi_amount * emi.tenure_months)}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Yearly Obligation</p>
                  <p className="text-lg font-serif">{formatCurrency(emi.emi_amount * 12)}</p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
