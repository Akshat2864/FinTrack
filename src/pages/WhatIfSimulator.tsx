import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Zap,  
  Plus, 
  Trash2,
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 

} from 'recharts';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { EMI } from '../types';
import { 
  calculateEMI, 
  getAdvancedEMIBreakdown, 
  formatCurrency, 
  PrePaymentPlan,
} from '../utils/finance';

const COLORS = ['#1a1a1a', '#f43f5e', '#10b981'];

export const WhatIfSimulator: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const emiIdFromUrl = searchParams.get('id');
  
  const [emis, setEmis] = useState<EMI[]>([]);
  const [selectedEmiId, setSelectedEmiId] = useState<string>('custom');

  useEffect(() => {
    if (emiIdFromUrl) {
      setSelectedEmiId(emiIdFromUrl);
    }
  }, [emiIdFromUrl]);
  
  // Custom form state
  const [loanAmount, setLoanAmount] = useState(1130000);
  const [interestRate, setInterestRate] = useState(7.8);
  const [tenureYears, setTenureYears] = useState(8);
  const [startDate, setStartDate] = useState('2026-05');
  
  const [prePayments, setPrePayments] = useState<PrePaymentPlan[]>([
    { id: 'initial', amount: 20000, type: 'monthly', startDate: '2026-05' }
  ]);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  useEffect(() => {
    const fetchEmis = async () => {
      if (!user) return;
      const { data } = await supabase.from('emis').select('*').eq('user_id', user.id);
      if (data) setEmis(data);
    };
    fetchEmis();
  }, [user]);

  // Sync selected EMI to form
  useEffect(() => {
    if (selectedEmiId === 'custom') return;
    const emi = emis.find(e => e.id === selectedEmiId);
    if (emi) {
      setLoanAmount(emi.principal);
      setInterestRate(emi.interest_rate);
      setTenureYears(emi.tenure_months / 12);
      setStartDate(emi.start_date.substring(0, 7));
    }
  }, [selectedEmiId, emis]);

  const emiValue = useMemo(() => calculateEMI(loanAmount, interestRate, tenureYears), [loanAmount, interestRate, tenureYears]);

  const { breakdown, yearlyBreakdown } = useMemo(() => {
    return getAdvancedEMIBreakdown(loanAmount, interestRate, tenureYears, startDate, prePayments);
  }, [loanAmount, interestRate, tenureYears, startDate, prePayments]);

  const totalInterest = breakdown.reduce((sum, item) => sum + item.interestPaid, 0);
  const totalPrepayment = breakdown.reduce((sum, item) => sum + item.prePayment, 0);
  const totalPaid = loanAmount + totalInterest;
  const originalDuration = tenureYears * 12;
  const acceleratedDuration = breakdown.length;
  const monthsSaved = Math.max(0, originalDuration - acceleratedDuration);

  const pieData = [
    { name: 'Principal', value: loanAmount },
    { name: 'Interest', value: totalInterest },
    { name: 'Pre-payment', value: totalPrepayment }
  ];

  const addPrePayment = () => {
    setPrePayments([...prePayments, { 
      id: Math.random().toString(36).substr(2, 9), 
      amount: 10000, 
      type: 'monthly', 
      startDate: startDate 
    }]);
  };

  return (
    <div className="space-y-12 pb-24">
      <header className="flex flex-col md:flex-row md:items-baseline justify-between gap-6 border-b border-black/5 pb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-black/40 font-bold">Optimization Engine</p>
          <h1 className="text-3xl md:text-5xl font-serif mt-2 italic">Strategy Lab</h1>
        </div>
        <div className="flex items-center gap-4">
           <span className="text-[10px] uppercase tracking-widest font-bold text-black/30 shrink-0">Active Scenario:</span>
           <select 
             value={selectedEmiId}
             onChange={(e) => setSelectedEmiId(e.target.value)}
             className="bg-white border border-black/5 px-4 py-2 text-[11px] uppercase tracking-widest font-bold shadow-sm outline-none focus:ring-1 ring-black/5 w-full md:w-auto"
           >
             <option value="custom">Custom Sandbox</option>
             {emis.map(e => <option key={e.id} value={e.id}>{e.loan_name}</option>)}
           </select>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-white p-8 border border-black/5 shadow-sm space-y-10">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-black/30 border-b border-black/5 pb-4">Variable Settings</h3>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-black/40">Principal</label>
                  <span className="text-lg font-serif">{formatCurrency(loanAmount)}</span>
                </div>
                <input 
                  type="range" min="100000" max="10000000" step="50000"
                  value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full h-1 bg-black/5 rounded-full appearance-none cursor-pointer accent-black"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-black/40">Rate (% p.a)</label>
                  <span className="text-lg font-serif">{interestRate}%</span>
                </div>
                <input 
                  type="range" min="5" max="20" step="0.1"
                  value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full h-1 bg-black/5 rounded-full appearance-none cursor-pointer accent-black"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-black/40">Tenure (Yrs)</label>
                  <span className="text-lg font-serif">{tenureYears} Yr</span>
                </div>
                <input 
                  type="range" min="1" max="30" step="1"
                  value={tenureYears} onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full h-1 bg-black/5 rounded-full appearance-none cursor-pointer accent-black"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-black/5 bg-black/[0.01] -mx-8 -mb-8 p-8">
               <div className="flex justify-between items-baseline">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-black/20">Monthly Standard</span>
                  <span className="text-3xl font-serif italic">{formatCurrency(emiValue)}</span>
               </div>
            </div>
          </section>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-8 bg-[#F0FAF7] border border-[#10B981]/10 rounded-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
               <TrendingUp size={80} />
            </div>
            <div className="space-y-4 relative z-10">
               <div className="flex items-center gap-2">
                  <Zap size={16} className="text-[#059669]" />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[#059669]">Tactical Opportunity</span>
               </div>
               <p className="text-sm font-serif italic text-[#065F46] leading-relaxed">
                  "By allocating an extra {formatCurrency(emiValue * 0.1)} monthly, you would effectively negate <span className="font-bold underline">{formatCurrency(totalInterest * 0.12)}</span> in compounded interest."
               </p>
            </div>
          </motion.div>
        </div>

        {/* Dashboard and Table */}
        <div className="lg:col-span-8 space-y-12">
          {/* Top Scorecards */}
          <div className="grid md:grid-cols-2 gap-8">
             <div className="bg-[#1a1a1a] p-6 md:p-10 text-white shadow-2xl relative">
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-8 font-bold">Mitigated Liability</p>
                <div className="space-y-1">
                   <h2 className="text-3xl md:text-5xl font-serif italic text-emerald-400">{formatCurrency(totalInterest)}</h2>
                   <p className="text-[8px] uppercase tracking-widest text-white/20">Total Projected Interest Bill</p>
                </div>
                <div className="mt-8 md:mt-12 pt-8 md:pt-12 border-t border-white/5 flex items-center justify-between">
                   <div>
                      <p className="text-[8px] uppercase tracking-widest text-white/40 mb-1">Time Reduction</p>
                      <p className="text-lg md:text-xl font-serif">{monthsSaved} Months</p>
                   </div>
                   <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400">
                      <Zap size={24} />
                   </div>
                </div>
             </div>

             <div className="bg-white border border-black/5 p-6 md:p-10 shadow-sm flex flex-col justify-between">
                <header className="flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-0">
                   <div className="space-y-1">
                      <h4 className="text-sm font-serif italic">Cost Distribution</h4>
                      <p className="text-[9px] uppercase tracking-widest text-black/30 font-bold">Principal vs Interest</p>
                   </div>
                   <div className="w-20 h-20 shrink-0">
                      <PieChart width={80} height={80}>
                         <Pie 
                           data={pieData} 
                           cx="50%" cy="50%" 
                           innerRadius={25} outerRadius={35} 
                           paddingAngle={5} dataKey="value"
                         >
                           {pieData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                         </Pie>
                      </PieChart>
                   </div>
                </header>
                
                <div className="space-y-4 mt-8">
                   <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                      <span className="text-black/40">Total Commitment</span>
                      <span>{formatCurrency(totalPaid)}</span>
                   </div>
                   <div className="w-full h-1 bg-black/5">
                      <div className="h-full bg-black" style={{ width: `${(loanAmount / totalPaid) * 100}%` }} />
                   </div>
                   <p className="text-[9px] text-black/30 font-serif italic">
                      Based on current strategy, the total cost of capital is {((totalInterest / loanAmount) * 100).toFixed(1)}% of the principal.
                   </p>
                </div>
             </div>
          </div>

          {/* Pre-payment Manager */}
          <section className="space-y-8">
             <div className="flex items-center justify-between">
                <h3 className="text-sm uppercase tracking-[0.2em] font-bold text-black/40">Injection Strategy</h3>
                <button 
                  onClick={addPrePayment}
                  className="px-4 py-2 border border-black/5 hover:bg-black/[0.02] text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 transition-all"
                >
                  <Plus size={14} /> Log Pre-payment
                </button>
             </div>

             <div className="space-y-4">
               <AnimatePresence initial={false}>
                {prePayments.map((plan) => (
                  <motion.div 
                    key={plan.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-white p-6 border border-black/5 hover:shadow-md transition-shadow relative"
                  >
                    <div className="col-span-12 md:col-span-4 space-y-1.5">
                      <label className="text-[8px] uppercase tracking-widest font-bold text-black/30">Capital Injection</label>
                      <div className="flex items-center gap-2 border-b border-black/10 focus-within:border-black transition-colors py-1">
                        <span className="text-black/40 text-sm">₹</span>
                        <input 
                          type="number" 
                          value={plan.amount}
                          onChange={(e) => setPrePayments(prePayments.map(p => p.id === plan.id ? { ...p, amount: Number(e.target.value) } : p))}
                          className="w-full bg-transparent font-serif italic text-lg outline-none"
                        />
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-3 space-y-1.5">
                      <label className="text-[8px] uppercase tracking-widest font-bold text-black/30">Cycle</label>
                      <select 
                        value={plan.type}
                        onChange={(e) => setPrePayments(prePayments.map(p => p.id === plan.id ? { ...p, type: e.target.value as any } : p))}
                        className="w-full bg-transparent border-b border-black/10 py-2 text-[10px] uppercase tracking-widest font-bold outline-none cursor-pointer appearance-none"
                      >
                        <option value="monthly">Monthly Recurring</option>
                        <option value="yearly">Yearly Bullet</option>
                        <option value="one-time">Lump Sum</option>
                      </select>
                    </div>
                    <div className="col-span-10 md:col-span-4 space-y-1.5">
                      <label className="text-[8px] uppercase tracking-widest font-bold text-black/30">Commencement Date</label>
                      <input 
                        type="month" 
                        value={plan.startDate}
                        onChange={(e) => setPrePayments(prePayments.map(p => p.id === plan.id ? { ...p, startDate: e.target.value } : p))}
                        className="w-full bg-transparent border-b border-black/10 py-2 text-[10px] items-center outline-none"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1 flex justify-end">
                      <button 
                         onClick={() => setPrePayments(prePayments.filter(p => p.id !== plan.id))}
                         className="p-2 text-black/20 hover:text-red-500 transition-colors"
                      >
                         <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
               </AnimatePresence>
             </div>
          </section>

          {/* Yearly Table */}
          <section className="space-y-6 pt-12 border-t border-black/5">
             <div className="flex justify-between items-end">
                <div className="space-y-1">
                   <h3 className="text-xl font-serif italic">Amortization Calendar</h3>
                   <p className="text-[9px] uppercase tracking-widest font-bold text-black/30">Annual Consolidation</p>
                </div>
             </div>
             <div className="bg-white border border-black/5 overflow-hidden">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-black/80 text-white leading-none">
                         <th className="p-3 md:p-5 font-serif font-thin italic text-sm md:text-lg uppercase tracking-widest">Year</th>
                         <th className="p-3 md:p-5 text-[8px] md:text-[9px] uppercase tracking-widest font-bold opacity-60">Principal</th>
                         <th className="p-3 md:p-5 text-[8px] md:text-[9px] uppercase tracking-widest font-bold opacity-60">Interest</th>
                         <th className="hidden sm:table-cell p-5 text-[9px] uppercase tracking-widest font-bold opacity-60">Injection</th>
                         <th className="hidden sm:table-cell p-5 text-[9px] uppercase tracking-widest font-bold opacity-60">Total</th>
                         <th className="p-3 md:p-5 text-right text-[8px] md:text-[9px] uppercase tracking-widest font-bold opacity-60">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-black/5">
                      {yearlyBreakdown.map((row) => (
                         <tr 
                           key={row.year} 
                           onMouseEnter={() => setHoveredYear(row.year)}
                           onMouseLeave={() => setHoveredYear(null)}
                           className={`group transition-colors ${hoveredYear === row.year ? 'bg-black/[0.02]' : ''}`}
                         >
                            <td className="p-3 md:p-5 font-serif text-sm md:text-lg">{row.year}</td>
                            <td className="p-3 md:p-5 font-sans font-medium text-[10px] md:text-xs">{formatCurrency(row.principal)}</td>
                            <td className="p-3 md:p-5 font-sans font-medium text-[10px] md:text-xs text-red-500">{formatCurrency(row.interest)}</td>
                            <td className="hidden sm:table-cell p-5 font-sans font-medium text-xs text-blue-500">{formatCurrency(row.prePayment)}</td>
                            <td className="hidden sm:table-cell p-5 font-sans font-bold text-xs">{formatCurrency(row.total)}</td>
                            <td className="p-3 md:p-5 text-right">
                               <div className="flex items-center justify-end gap-3">
                                  <div className="w-16 h-1 bg-black/5 rounded-full overflow-hidden">
                                     <div 
                                       className="h-full bg-black transition-all duration-500" 
                                       style={{ width: `${row.loanPaidPercentage}%` }} 
                                      />
                                  </div>
                                  <span className="text-[10px] font-bold font-mono">{row.loanPaidPercentage.toFixed(0)}%</span>
                               </div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             <p className="text-center text-[9px] text-black/20 font-bold uppercase tracking-[0.5em] py-8">End of Forecast</p>
          </section>
        </div>
      </div>
    </div>
  );
};
