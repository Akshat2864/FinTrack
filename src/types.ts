export interface EMI {
  id: string;
  user_id: string;
  loan_name: string;
  principal: number;
  interest_rate: number;
  tenure_months: number;
  emi_amount: number;
  start_date: string;
  created_at?: string;
}

export interface SIP {
  id: string;
  user_id: string;
  sip_name: string;
  monthly_amount: number;
  expected_return_rate: number;
  duration_months: number;
  start_date: string;
  created_at?: string;
}

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

export interface UserProfile {
  id: string;
  email: string;
}
