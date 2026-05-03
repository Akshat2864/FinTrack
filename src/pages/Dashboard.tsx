import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { EMI, SIP } from '../types';
import { 
  formatCurrency, 
  generateFinancialTimeline,
  TimelineItem 
} from '../utils/finance';

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Brush
} from 'recharts';
import { motion } from 'motion/react';
import { Link } from 'react-router';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [emis, setEmis] = useState<EMI[]>([]);
  const [sips, setSips] = useState<SIP[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMonths, setViewMonths] = useState(120); // Default 10 years

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      const [emisRes, sipsRes] = await Promise.all([
        supabase.from('emis').select('*').eq('user_id', user.id),
        supabase.from('sips').select('*').eq('user_id', user.id)
      ]);

      if (emisRes.data && sipsRes.data) {
        setEmis(emisRes.data);
        setSips(sipsRes.data);
        const data = generateFinancialTimeline(emisRes.data, sipsRes.data, 30); // Generate 30 years
        setTimeline(data);
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const filteredTimeline = timeline.slice(0, viewMonths);

  const totalMonthlyEMI = emis.reduce((sum, emi) => sum + emi.emi_amount, 0);
  const totalMonthlySIP = sips.reduce((sum, sip) => sum + sip.monthly_amount, 0);
  const totalLoanLiability = emis.reduce((sum, emi) => sum + emi.principal, 0);
  
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-baseline justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-black/40 font-bold">Current Snapshot</p>
          <h1 className="text-5xl font-serif mt-2">Financial Overview</h1>
        </div>
        <div className="flex gap-4">
          <Link to="/emi" className="text-[10px] uppercase tracking-widest font-bold px-6 py-3 border border-black hover:bg-black hover:text-white transition-all">
            Add Liability
          </Link>
          <Link to="/sip" className="text-[10px] uppercase tracking-widest font-bold px-6 py-3 bg-black text-white hover:bg-opacity-80 transition-all">
            New Investment
          </Link>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Total EMI Liability', value: formatCurrency(totalLoanLiability), trend: '+2.4%', color: 'text-red-600', isBlack: false },
          { label: 'Monthly House Rent', value: formatCurrency(totalMonthlyEMI), trend: 'Due in 4 days', color: 'text-black/40', isBlack: false },
          { label: 'SIP Valuation', value: formatCurrency(totalMonthlySIP * 120), trend: '+12.8% yield', color: 'text-emerald-600', isBlack: true },
        ].map((card, i) => (
          <motion.div 
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-8 rounded-sm shadow-sm border border-black/5 flex flex-col justify-between h-48 ${card.isBlack ? 'bg-[#1A1A1A] text-white border-transparent shadow-xl' : 'bg-white'}`}
          >
            <div>
              <p className={`text-[10px] uppercase tracking-widest mb-2 font-bold ${card.isBlack ? 'opacity-40' : 'text-black/40'}`}>{card.label}</p>
              <p className={`text-3xl font-serif font-medium`}>{card.value}</p>
            </div>
            <p className={`text-[10px] font-bold tracking-wider ${card.isBlack ? 'opacity-60' : card.color}`}>{card.trend}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Growth vs Debt Chart */}
        <div className="col-span-12 lg:col-span-8 bg-white p-10 border border-black/5 shadow-sm rounded-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold">Growth Projection vs Debt</h3>
              <p className="text-[9px] uppercase tracking-widest font-bold text-black/20 mt-1">Interactive Forecast</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex bg-black/[0.03] p-1 rounded-sm">
                {[
                  { l: '1Y', v: 12 },
                  { l: '5Y', v: 60 },
                  { l: '10Y', v: 120 },
                  { l: 'MAX', v: 360 }
                ].map(r => (
                  <button 
                    key={r.l}
                    onClick={() => setViewMonths(r.v)}
                    className={`px-3 py-1 text-[9px] font-bold tracking-tighter rounded-sm transition-all ${viewMonths === r.v ? 'bg-white text-black shadow-sm' : 'text-black/40 hover:text-black'}`}
                  >
                    {r.l}
                  </button>
                ))}
              </div>
              <div className="flex gap-6 text-[10px] uppercase tracking-widest font-bold">
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-black rounded-full"></span> Portfolio</span>
                <span className="flex items-center gap-2 opacity-30"><span className="w-2 h-2 bg-black rounded-full"></span> Liabilities</span>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredTimeline}>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                   dataKey="date" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{fill: 'rgba(0,0,0,0.4)', fontSize: 10, fontWeight: 700}} 
                   dy={15} 
                   interval={Math.floor(viewMonths / 6)}
                />
                <YAxis hide />
                <Tooltip 
                   formatter={(val: any) => formatCurrency(Number(val))}
                   contentStyle={{ borderRadius: '0', border: '1px solid rgba(0,0,0,0.1)', background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                   itemStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="portfolio" stroke="#000" strokeWidth={2} fill="rgba(0,0,0,0.03)" />
                <Area type="monotone" dataKey="debt" stroke="rgba(0,0,0,0.1)" strokeWidth={2} fill="rgba(0,0,0,0.01)" />
                <Brush 
                  dataKey="date" 
                  height={30} 
                  stroke="rgba(0,0,0,0.1)" 
                  fill="#fff"
                  travellerWidth={10}
                  gap={1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar Feature: Active Lists */}
        <div className="col-span-12 lg:col-span-4 bg-[#F5F2ED] p-10 flex flex-col rounded-sm">
          <h4 className="text-xs uppercase tracking-[0.2em] font-bold mb-10">Active Trackers</h4>
          <div className="space-y-8 flex-1">
            {emis.slice(0, 2).map(e => (
              <div key={e.id} className="border-b border-black/5 pb-4 last:border-0">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-bold tracking-tight">{e.loan_name}</p>
                  <span className="text-[10px] px-2 py-0.5 bg-black text-white font-bold tracking-tighter">EMI</span>
                </div>
                <p className="text-xs text-black/50 italic">{formatCurrency(e.emi_amount)}/mo • {e.tenure_months} mo left</p>
              </div>
            ))}
            {sips.slice(0, 2).map(s => (
              <div key={s.id} className="border-b border-black/5 pb-4 last:border-0 font-serif italic text-black/70">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-bold tracking-tight text-black not-italic font-sans">{s.sip_name}</p>
                  <span className="text-[10px] px-2 py-0.5 border border-black text-black font-bold tracking-tighter not-italic">SIP</span>
                </div>
                <p className="text-xs">{formatCurrency(s.monthly_amount)}/mo • {s.expected_return_rate}% Expected</p>
              </div>
            ))}
          </div>
          <Link to="/sip" className="w-full py-5 text-[10px] uppercase tracking-widest font-bold border border-black hover:bg-black hover:text-white transition-all text-center mt-10">
            Audit Full Ledger
          </Link>
        </div>
      </div>
    </div>
  );
};
