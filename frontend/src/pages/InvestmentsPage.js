import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import AddInvestmentModal from '@/components/AddInvestmentModal';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function InvestmentsPage() {
  const [investmentsList, setInvestmentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    try {
      const response = await axios.get(`${API_URL}/investments`);
      setInvestmentsList(response.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error('Failed to fetch investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this investment?')) return;
    
    try {
      await axios.delete(`${API_URL}/investments/${id}`);
      fetchInvestments();
    } catch (error) {
      console.error('Failed to delete investment:', error);
    }
  };

  const handleEdit = (investment) => {
    setEditData(investment);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditData(null);
  };

  const totalInvested = investmentsList.reduce((sum, item) => sum + item.amount_invested, 0);
  const totalCurrentValue = investmentsList.reduce((sum, item) => sum + item.current_value, 0);
  const totalProfitLoss = totalCurrentValue - totalInvested;

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
            <h1 className="text-4xl sm:text-5xl tracking-tight leading-none font-bold">Investments</h1>
            <p className="text-sm text-text-secondary mt-1">Track your investment portfolio</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary text-white hover:bg-primary-hover transition-colors rounded-md px-4 py-2 font-medium text-sm flex items-center gap-2"
            data-testid="add-investment-button"
          >
            <Plus className="w-4 h-4" /> Add Investment
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface border border-border rounded-lg p-6">
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary">Total Invested</span>
            <div className="mono text-3xl font-bold text-text-primary mt-2" data-testid="total-invested">
              ₹{totalInvested.toFixed(2)}
            </div>
          </div>
          <div className="bg-surface border border-border rounded-lg p-6">
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary">Current Value</span>
            <div className="mono text-3xl font-bold text-text-primary mt-2" data-testid="current-value">
              ₹{totalCurrentValue.toFixed(2)}
            </div>
          </div>
          <div className="bg-surface border border-border rounded-lg p-6">
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary">Profit/Loss</span>
            <div className={`mono text-3xl font-bold mt-2 flex items-center gap-2 ${totalProfitLoss >= 0 ? 'text-accent-positive' : 'text-accent-negative'}`} data-testid="profit-loss">
              {totalProfitLoss >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
              ₹{Math.abs(totalProfitLoss).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6" data-testid="investments-list">
          <h3 className="text-xl sm:text-2xl tracking-tight font-bold mb-6">All Investments</h3>
          {investmentsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3">Date</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3">Type</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3 text-right">Invested</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3 text-right">Current Value</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3 text-right">P/L</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3">Notes</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {investmentsList.map((item) => {
                    const profitLoss = item.current_value - item.amount_invested;
                    return (
                      <tr key={item.id} className="border-b border-border hover:bg-surface-muted transition-colors">
                        <td className="py-3 text-text-secondary text-sm">{format(parseISO(item.date), 'MMM dd, yyyy')}</td>
                        <td className="py-3 text-text-primary font-medium capitalize">{item.type}</td>
                        <td className="py-3 text-right mono text-text-primary">₹{item.amount_invested.toFixed(2)}</td>
                        <td className="py-3 text-right mono text-text-primary">₹{item.current_value.toFixed(2)}</td>
                        <td className={`py-3 text-right mono font-medium ${profitLoss >= 0 ? 'text-accent-positive' : 'text-accent-negative'}`}>
                          {profitLoss >= 0 ? '+' : ''}₹{profitLoss.toFixed(2)}
                        </td>
                        <td className="py-3 text-text-secondary text-sm">{item.notes || '-'}</td>
                        <td className="py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 rounded-md hover:bg-primary/10 text-primary transition-colors"
                              data-testid={`edit-investment-${item.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 rounded-md hover:bg-accent-negative/10 text-accent-negative transition-colors"
                              data-testid={`delete-investment-${item.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary">No investment records yet. Add your first investment!</div>
          )}
        </div>
      </div>

      {showModal && <AddInvestmentModal onClose={handleCloseModal} onSuccess={fetchInvestments} editData={editData} />}
    </Layout>
  );
}