export interface EMIBreakdownItem {
  month: number;
  date: Date;
  principalPaid: number;
  interestPaid: number;
  prePayment: number;
  remainingBalance: number;
  totalPayment: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
}

export interface YearBreakdown {
  year: number;
  principal: number;
  interest: number;
  prePayment: number;
  total: number;
  loanPaidPercentage: number;
  monthsActive: number[]; // 0-11
}

export interface PrePaymentPlan {
  id: string;
  amount: number;
  type: 'monthly' | 'yearly' | 'one-time';
  startDate: string; // YYYY-MM
}

export const calculateEMI = (principal: number, annualRate: number, tenureYears: number): number => {
  const monthlyRate = annualRate / (12 * 100);
  const tenureMonths = tenureYears * 12;
  if (monthlyRate === 0) return principal / tenureMonths;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return emi;
};

export const calculateSIPFutureValue = (monthlyAmount: number, annualReturnRate: number, durationMonths: number): number => {
  const monthlyRate = annualReturnRate / (12 * 100);
  if (monthlyRate === 0) return monthlyAmount * durationMonths;
  return monthlyAmount * ((Math.pow(1 + monthlyRate, durationMonths) - 1) / monthlyRate) * (1 + monthlyRate);
};

export const getAdvancedEMIBreakdown = (
  principal: number,
  annualRate: number,
  tenureYears: number,
  startDateStr: string,
  prePayments: PrePaymentPlan[]
): { breakdown: EMIBreakdownItem[], yearlyBreakdown: YearBreakdown[] } => {
  const emi = calculateEMI(principal, annualRate, tenureYears);
  const monthlyRate = annualRate / (12 * 100);
  const maxMonths = tenureYears * 12 * 2; // Safety buffer
  let balance = principal;
  const breakdown: EMIBreakdownItem[] = [];
  const start = new Date(startDateStr);
  
  let totalInterest = 0;
  let totalPrincipal = 0;

  for (let i = 1; i <= maxMonths; i++) {
    const currentMonthDate = new Date(start.getFullYear(), start.getMonth() + i - 1, 1);
    const currentDateStr = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Calculate interest for this month
    const interestPaid = balance * monthlyRate;
    
    // Check for pre-payments applied this month
    let monthlyPrePayment = 0;
    prePayments.forEach(p => {
      const pStart = new Date(p.startDate);
      if (p.type === 'monthly') {
        if (currentMonthDate >= pStart) monthlyPrePayment += p.amount;
      } else if (p.type === 'one-time') {
        if (currentDateStr === p.startDate) monthlyPrePayment += p.amount;
      } else if (p.type === 'yearly') {
        if (currentMonthDate >= pStart && currentMonthDate.getMonth() === pStart.getMonth()) {
          monthlyPrePayment += p.amount;
        }
      }
    });

    let scheduledPrincipal = emi - interestPaid;
    
    // Total reduction = scheduled principal + pre-payment
    let totalReduction = scheduledPrincipal + monthlyPrePayment;
    
    if (totalReduction > balance) {
      totalReduction = balance;
      // Recalculate components within the cap
      monthlyPrePayment = Math.min(monthlyPrePayment, totalReduction);
      scheduledPrincipal = totalReduction - monthlyPrePayment;
    }

    balance -= totalReduction;
    totalInterest += interestPaid;
    totalPrincipal += (scheduledPrincipal + monthlyPrePayment);

    breakdown.push({
      month: i,
      date: currentMonthDate,
      principalPaid: scheduledPrincipal,
      interestPaid,
      prePayment: monthlyPrePayment,
      remainingBalance: Math.max(0, balance),
      totalPayment: scheduledPrincipal + interestPaid + monthlyPrePayment,
      totalInterestPaid: totalInterest,
      totalPrincipalPaid: totalPrincipal
    });

    if (balance <= 0) break;
  }

  // Yearly grouping
  const yearsMap: Record<number, YearBreakdown> = {};
  breakdown.forEach(item => {
    const y = item.date.getFullYear();
    if (!yearsMap[y]) {
      yearsMap[y] = { 
        year: y, 
        principal: 0, 
        interest: 0, 
        prePayment: 0, 
        total: 0, 
        loanPaidPercentage: 0,
        monthsActive: [] 
      };
    }
    yearsMap[y].principal += item.principalPaid;
    yearsMap[y].interest += item.interestPaid;
    yearsMap[y].prePayment += item.prePayment;
    yearsMap[y].total += item.totalPayment;
    yearsMap[y].monthsActive.push(item.date.getMonth());
    yearsMap[y].loanPaidPercentage = ((principal - item.remainingBalance) / principal) * 100;
  });

  return { breakdown, yearlyBreakdown: Object.values(yearsMap) };
};

export interface TimelineItem {
  date: string;
  timestamp: number;
  portfolio: number;
  debt: number;
}

export const generateFinancialTimeline = (
  emis: any[],
  sips: any[],
  years: number = 20
): TimelineItem[] => {
  const timeline: TimelineItem[] = [];
  const start = new Date();
  const months = years * 12;

  // Pre-calculate breakdowns for all EMIs
  const emiBreakdowns = emis.map(emi => ({
    id: emi.id,
    startDate: new Date(emi.start_date),
    data: getAdvancedEMIBreakdown(emi.principal, emi.interest_rate, emi.tenure_months / 12, emi.start_date, []).breakdown
  }));

  for (let i = 0; i <= months; i++) {
    const current = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const dateStr = current.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }).toUpperCase();
    
    // Calculate total portfolio at this point
    let totalPortfolio = 0;
    sips.forEach(sip => {
      const sipStart = new Date(sip.start_date);
      const monthsSinceStart = (current.getFullYear() - sipStart.getFullYear()) * 12 + (current.getMonth() - sipStart.getMonth());
      if (monthsSinceStart >= 0) {
        const activeMonths = Math.min(monthsSinceStart, sip.duration_months);
        totalPortfolio += calculateSIPFutureValue(sip.monthly_amount, sip.expected_return_rate, activeMonths);
        
        if (monthsSinceStart > sip.duration_months) {
          const finalVal = calculateSIPFutureValue(sip.monthly_amount, sip.expected_return_rate, sip.duration_months);
          totalPortfolio += finalVal; 
        }
      }
    });

    // Calculate total debt at this point
    let totalDebt = 0;
    emiBreakdowns.forEach(emiObj => {
      const monthsSinceStart = (current.getFullYear() - emiObj.startDate.getFullYear()) * 12 + (current.getMonth() - emiObj.startDate.getMonth());
      if (monthsSinceStart >= 0) {
        // month index in breakdown is 1-based, index 0 is first month
        const monthData = emiObj.data.find(b => b.month === monthsSinceStart);
        if (monthData) {
          totalDebt += monthData.remainingBalance;
        } else if (monthsSinceStart === 0) {
           // Should be handled by breakdown usually, but safety check
        }
      } else {
        // Loan hasn't started yet relative to this 'current' date? 
        // Actually the timeline starts from 'now', but a loan might start in the future.
        // If it's in the future and we haven't reached 'monthsSinceStart >= 0', we add the full principal.
        // This depends on if we want to show future loans as debt today.
        // Usually we only show it when it becomes active.
      }
    });

    timeline.push({
      date: dateStr,
      timestamp: current.getTime(),
      portfolio: totalPortfolio,
      debt: totalDebt
    });
  }

  return timeline;
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};
