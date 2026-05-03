import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { SIP } from '../types';
import { calculateSIPFutureValue, formatCurrency } from '../utils/finance';
import { Trash2, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const SIPTracker: React.FC = () => {
  const { user } = useAuth();
  const [sips, setSips] = useState<SIP[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [sipName, setSipName] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [returnRate, setReturnRate] = useState('');
  const [duration, setDuration] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchSips();
  }, [user]);

  const fetchSips = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('sips')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setSips(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from('sips').insert({
      user_id: user.id,
      sip_name: sipName,
      monthly_amount: parseFloat(monthlyAmount),
      expected_return_rate: parseFloat(returnRate),
      duration_months: Math.round(parseFloat(duration) * 12),
      start_date: startDate,
    });

    if (!error) {
      setSipName('');
      setMonthlyAmount('');
      setReturnRate('');
      setDuration('');
      setIsFormOpen(false);
      fetchSips();
    }
  };

  const deleteSIP = async (id: string) => {
    const { error } = await supabase.from('sips').delete().eq('id', id);
    if (!error) fetchSips();
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-baseline justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-black/40 font-bold">Capital Appreciation</p>
          <h1 className="text-5xl font-serif mt-2">SIP Growth</h1>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="text-[10px] uppercase tracking-widest font-bold px-8 py-4 bg-black text-white hover:bg-opacity-80 transition-all font-sans"
          >
            Initiate New Strategy
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
              <h2 className="text-sm uppercase tracking-[0.2em] font-bold mb-8 italic font-serif text-black/60">Investment parameters</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">Asset Allocation</label>
                  <input
                    type="text"
                    placeholder="Vanguard Global Index"
                    className="w-full bg-[#F9FAFB] border border-black/10 focus:border-black rounded-sm p-4 outline-none transition-all font-medium"
                    value={sipName}
                    onChange={(e) => setSipName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">Monthly Contribution</label>
                  <input
                    type="number"
                    placeholder="Amount in INR"
                    className="w-full bg-[#F9FAFB] border border-black/10 focus:border-black rounded-sm p-4 outline-none transition-all font-medium"
                    value={monthlyAmount}
                    onChange={(e) => setMonthlyAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">Annual Return (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 12.0"
                    className="w-full bg-[#F9FAFB] border border-black/10 focus:border-black rounded-sm p-4 outline-none transition-all font-medium"
                    value={returnRate}
                    onChange={(e) => setReturnRate(e.target.value)}
                    required
                  />
                  <p className="text-[8px] text-black/30 font-bold uppercase tracking-widest ml-1">Compounded monthly at Annual Rate/12</p>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">Horizon (Years)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 10"
                    className="w-full bg-[#F9FAFB] border border-black/10 focus:border-black rounded-sm p-4 outline-none transition-all font-medium"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">Inception Date</label>
                  <input
                    type="date"
                    className="w-full bg-[#F9FAFB] border border-black/10 focus:border-black rounded-sm p-4 outline-none transition-all font-medium"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-end gap-3">
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-black text-white text-[10px] uppercase font-bold tracking-widest hover:bg-opacity-80 transition-all shadow-xl shadow-black/10"
                  >
                    Execute Command
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)}
                    className="p-4 border border-black/10 text-black hover:border-black transition-colors"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center p-20">
             <div className="w-8 h-8 border-2 border-black/10 border-t-black rounded-full animate-spin"></div>
          </div>
        ) : sips.length === 0 ? (
          <div className="bg-white p-24 rounded-sm border border-dashed border-black/10 flex flex-col items-center justify-center text-center">
            <h3 className="text-3xl font-serif italic mb-4">Capital idle.</h3>
            <p className="text-black/40 font-medium max-w-sm text-sm">
              Prosperity requires momentum. Record your Systematic Investment Plans to visualize future wealth.
            </p>
            <button 
              onClick={() => setIsFormOpen(true)}
              className="mt-12 px-12 py-5 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-bold"
            >
              Seed Investment
            </button>
          </div>
        ) : (
          sips.map((sip) => (
            <SIPCard key={sip.id} sip={sip} onDelete={deleteSIP} />
          ))
        )}
      </div>
    </div>
  );
};

const SIPCard: React.FC<{ sip: SIP; onDelete: (id: string) => void }> = ({ sip, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const futureValue = calculateSIPFutureValue(sip.monthly_amount, sip.expected_return_rate, sip.duration_months);
  const totalInvested = sip.monthly_amount * sip.duration_months;
  const earnings = futureValue - totalInvested;

  // Generate projections
  const data = [];
  for(let i = 0; i <= sip.duration_months; i += Math.max(1, Math.floor(sip.duration_months / 12))) {
    data.push({
      month: `M${i}`,
      value: calculateSIPFutureValue(sip.monthly_amount, sip.expected_return_rate, i)
    });
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-sm border border-black/5 overflow-hidden hover:border-black/20 transition-all font-sans"
    >
      <div className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-10">
          <div className="w-16 h-16 border border-black/5 flex items-center justify-center text-black bg-[#F5F2ED]">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight mb-2">{sip.sip_name}</h3>
            <div className="flex items-center gap-8 text-[10px] uppercase tracking-[0.2em] text-black/40 font-bold">
               <span>{sip.expected_return_rate}% Projected</span>
               <span>{(sip.duration_months / 12).toFixed(1)} Years Term</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-16">
          <div className="text-right">
            <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1">Monthly Inflow</p>
            <p className="text-3xl font-serif italic text-emerald-600">{formatCurrency(sip.monthly_amount)}</p>
          </div>
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setExpanded(!expanded)}
                className="w-12 h-12 border border-black/5 flex items-center justify-center hover:border-black transition-all"
              >
                {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              <button 
                onClick={() => onDelete(sip.id)}
                className="w-12 h-12 border border-black/5 text-black hover:text-red-600 hover:border-red-600 transition-all"
              >
                <Trash2 size={20} />
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
            className="px-10 pb-12 pt-6 border-t border-black/5 bg-[#FDFCFB]"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mt-6">
               <div className="space-y-10">
                  <div className="grid grid-cols-2 gap-10">
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em]">Total Capital</p>
                        <p className="text-xl font-serif">{formatCurrency(totalInvested)}</p>
                     </div>
                     <div className="space-y-1 text-emerald-600">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Yield Earned</p>
                        <p className="text-xl font-serif">{formatCurrency(earnings)}</p>
                     </div>
                  </div>
                  <div className="p-10 bg-[#1A1A1A] text-white rounded-sm shadow-2xl flex flex-col justify-between">
                     <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-4 font-sans">Projected Valuation at Maturity</p>
                     <p className="text-4xl font-serif italic tracking-tight">{formatCurrency(futureValue)}</p>
                  </div>
               </div>
               
               <div className="flex flex-col h-full justify-between pb-4">
                  <div className="flex items-center justify-between mb-8">
                     <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-black/40 italic font-serif">Valuation trajectory</h4>
                     <span className="text-[10px] uppercase tracking-widest font-bold border-b border-black">Compound Growth</span>
                  </div>
                  <div className="h-[220px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                           <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(0,0,0,0.05)" />
                           <XAxis dataKey="month" hide />
                           <YAxis hide />
                           <Tooltip 
                              contentStyle={{ borderRadius: '0', border: '1px solid rgba(0,0,0,0.1)', background: '#fff' }}
                              itemStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}
                           />
                           <Area type="monotone" dataKey="value" stroke="#000" strokeWidth={3} fill="rgba(0,0,0,0.02)" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="mt-8 flex justify-between items-center text-[10px] font-bold text-black/20 uppercase tracking-widest">
                     <span>Deployment</span>
                     <div className="flex-1 border-t border-black/5 mx-6" />
                     <span>Maturity</span>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
