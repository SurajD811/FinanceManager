import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  ArrowDownLeft, 
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import AddIncomeModal from '@/components/AddIncomeModal';
import AddExpenseModal from '@/components/AddExpenseModal';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const EXPENSE_CATEGORIES = [
  { name: 'food', color: '#E5B990' },
  { name: 'rent', color: '#D4A373' },
  { name: 'travel', color: '#65A576' },
  { name: 'shopping', color: '#E27D60' },
  { name: 'utilities', color: '#4A7C59' },
  { name: 'entertainment', color: '#D66853' },
  { name: 'other', color: '#A3A7A4' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, expensesRes, incomeRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard/summary`),
        axios.get(`${API_URL}/expenses`),
        axios.get(`${API_URL}/income`),
      ]);
      setSummary(summaryRes.data);
      setExpenses(expensesRes.data);
      setIncome(incomeRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    const monthlyData = {};
    
    income.forEach(item => {
      const month = format(parseISO(item.date), 'MMM');
      if (!monthlyData[month]) monthlyData[month] = { month, income: 0, expenses: 0 };
      monthlyData[month].income += item.amount;
    });
    
    expenses.forEach(item => {
      const month = format(parseISO(item.date), 'MMM');
      if (!monthlyData[month]) monthlyData[month] = { month, income: 0, expenses: 0 };
      monthlyData[month].expenses += item.amount;
    });
    
    return Object.values(monthlyData);
  };

  const getCategoryData = () => {
    const categoryTotals = {};
    expenses.forEach(item => {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
    });
    
    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      color: EXPENSE_CATEGORIES.find(c => c.name === name)?.color || '#A3A7A4'
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-text-secondary">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl tracking-tight leading-none font-bold">Dashboard</h1>
            <p className="text-sm text-text-secondary mt-1">Welcome back, {user?.name}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowIncomeModal(true)}
              className="bg-accent-positive text-white hover:opacity-90 transition-opacity rounded-md px-4 py-2 font-medium text-sm flex items-center gap-2"
              data-testid="add-income-button"
            >
              <Plus className="w-4 h-4" /> Add Income
            </button>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="bg-accent-negative text-white hover:opacity-90 transition-opacity rounded-md px-4 py-2 font-medium text-sm flex items-center gap-2"
              data-testid="add-expense-button"
            >
              <Plus className="w-4 h-4" /> Add Expense
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border border-border rounded-lg p-6 hover:-translate-y-1 transition-transform" data-testid="balance-card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary">Total Balance</span>
              <Wallet className="w-5 h-5 text-primary" strokeWidth={1.5} />
            </div>
            <div className="mono text-3xl font-bold text-text-primary">
              ₹{summary?.total_balance?.toFixed(2) || '0.00'}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-6 hover:-translate-y-1 transition-transform" data-testid="income-card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary">Total Income</span>
              <ArrowUpRight className="w-5 h-5 text-accent-positive" strokeWidth={1.5} />
            </div>
            <div className="mono text-3xl font-bold text-accent-positive">
              ₹{summary?.total_income?.toFixed(2) || '0.00'}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-6 hover:-translate-y-1 transition-transform" data-testid="expenses-card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary">Total Expenses</span>
              <ArrowDownLeft className="w-5 h-5 text-accent-negative" strokeWidth={1.5} />
            </div>
            <div className="mono text-3xl font-bold text-accent-negative">
              ₹{summary?.total_expenses?.toFixed(2) || '0.00'}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-6 hover:-translate-y-1 transition-transform" data-testid="investments-card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary">Investments</span>
              <PiggyBank className="w-5 h-5 text-accent-neutral" strokeWidth={1.5} />
            </div>
            <div className="mono text-3xl font-bold text-text-primary">
              ₹{summary?.total_investments?.toFixed(2) || '0.00'}
            </div>
            <div className={`text-sm mt-2 flex items-center gap-1 ${summary?.investment_profit_loss >= 0 ? 'text-accent-positive' : 'text-accent-negative'}`}>
              {summary?.investment_profit_loss >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              ₹{Math.abs(summary?.investment_profit_loss || 0).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-surface border border-border rounded-lg p-6" data-testid="income-expense-chart">
            <h3 className="text-xl sm:text-2xl tracking-tight font-bold mb-6">Income vs Expenses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={getChartData()}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent-positive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--accent-positive))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent-negative))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--accent-negative))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--text-secondary))" 
                  style={{ fontSize: '12px' }}
                  strokeWidth={0}
                />
                <YAxis 
                  stroke="hsl(var(--text-secondary))" 
                  style={{ fontSize: '12px' }}
                  strokeWidth={0}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--surface))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    fontSize: '14px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stroke="hsl(var(--accent-positive))" 
                  fill="url(#incomeGradient)"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="hsl(var(--accent-negative))" 
                  fill="url(#expenseGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-surface border border-border rounded-lg p-6" data-testid="category-breakdown-chart">
            <h3 className="text-xl sm:text-2xl tracking-tight font-bold mb-6">Expense Breakdown</h3>
            {getCategoryData().length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={getCategoryData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {getCategoryData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--surface))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                        fontSize: '14px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {getCategoryData().map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="capitalize text-text-secondary">{cat.name}</span>
                      </div>
                      <span className="mono font-medium text-text-primary">${cat.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-text-secondary text-sm">
                No expenses yet
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6" data-testid="recent-transactions">
          <h3 className="text-xl sm:text-2xl tracking-tight font-bold mb-6">Recent Transactions</h3>
          {summary?.recent_transactions?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3">Type</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3">Description</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3">Date</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recent_transactions.map((txn, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-surface-muted transition-colors">
                      <td className="py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          txn.type === 'income' ? 'bg-accent-positive/10 text-accent-positive' :
                          txn.type === 'expense' ? 'bg-accent-negative/10 text-accent-negative' :
                          'bg-accent-neutral/10 text-accent-neutral'
                        }`}>
                          {txn.type}
                        </span>
                      </td>
                      <td className="py-3 text-text-primary">{txn.description}</td>
                      <td className="py-3 text-text-secondary text-sm">{format(parseISO(txn.date), 'MMM dd, yyyy')}</td>
                      <td className={`py-3 text-right mono font-medium ${
                        txn.type === 'income' || txn.type === 'received' ? 'text-accent-positive' : 'text-accent-negative'
                      }`}>
                        {txn.type === 'expense' ? '-' : '+'}${txn.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary">No transactions yet</div>
          )}
        </div>
      </div>

      {showIncomeModal && <AddIncomeModal onClose={() => setShowIncomeModal(false)} onSuccess={fetchData} />}
      {showExpenseModal && <AddExpenseModal onClose={() => setShowExpenseModal(false)} onSuccess={fetchData} />}
    </Layout>
  );
}