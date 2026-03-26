import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Plus, Trash2, Banknote } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MoneyReceivedPage() {
  const [moneyList, setMoneyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    sender: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: ''
  });

  useEffect(() => {
    fetchMoneyReceived();
  }, []);

  const fetchMoneyReceived = async () => {
    try {
      const response = await axios.get(`${API_URL}/money-received`);
      setMoneyList(response.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error('Failed to fetch money received:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    
    try {
      await axios.delete(`${API_URL}/money-received/${id}`);
      fetchMoneyReceived();
    } catch (error) {
      console.error('Failed to delete money received:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/money-received`, formData);
      setShowModal(false);
      setFormData({ amount: '', sender: '', date: format(new Date(), 'yyyy-MM-dd'), description: '' });
      fetchMoneyReceived();
    } catch (error) {
      console.error('Failed to add money received:', error);
    }
  };

  const totalReceived = moneyList.reduce((sum, item) => sum + item.amount, 0);

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
            <h1 className="text-4xl sm:text-5xl tracking-tight leading-none font-bold">Money Received</h1>
            <p className="text-sm text-text-secondary mt-1">Track money received from others</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-accent-neutral text-white hover:opacity-90 transition-opacity rounded-md px-4 py-2 font-medium text-sm flex items-center gap-2"
            data-testid="add-money-received-button"
          >
            <Plus className="w-4 h-4" /> Add Record
          </button>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl sm:text-2xl tracking-tight font-bold">Total Received</h3>
            <div className="mono text-3xl font-bold text-accent-neutral" data-testid="total-received">
              ₹{totalReceived.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6" data-testid="money-received-list">
          <h3 className="text-xl sm:text-2xl tracking-tight font-bold mb-6">All Records</h3>
          {moneyList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3">Date</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3">Sender</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3">Description</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3 text-right">Amount</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {moneyList.map((item) => (
                    <tr key={item.id} className="border-b border-border hover:bg-surface-muted transition-colors">
                      <td className="py-3 text-text-secondary text-sm">{format(parseISO(item.date), 'MMM dd, yyyy')}</td>
                      <td className="py-3 text-text-primary font-medium">{item.sender}</td>
                      <td className="py-3 text-text-secondary text-sm">{item.description || '-'}</td>
                      <td className="py-3 text-right mono font-medium text-accent-neutral">₹{item.amount.toFixed(2)}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-md hover:bg-accent-negative/10 text-accent-negative transition-colors"
                          data-testid={`delete-money-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary">No records yet. Add your first record!</div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6" data-testid="money-received-modal">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold tracking-tight">Add Money Received</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-md hover:bg-surface-muted transition-colors"
                data-testid="close-modal-button"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1.5 block">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-transparent border border-border rounded-md px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary transition-all"
                  required
                  data-testid="money-amount-input"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary mb-1.5 block">Sender</label>
                <input
                  type="text"
                  value={formData.sender}
                  onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                  className="w-full bg-transparent border border-border rounded-md px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary transition-all"
                  required
                  data-testid="money-sender-input"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary mb-1.5 block">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-transparent border border-border rounded-md px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary transition-all"
                  required
                  data-testid="money-date-input"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary mb-1.5 block">Description (optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-transparent border border-border rounded-md px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary transition-all"
                  rows="3"
                  data-testid="money-description-input"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-transparent border border-border text-text-primary hover:bg-surface-muted transition-colors rounded-md px-6 py-2 font-medium"
                  data-testid="cancel-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white hover:bg-primary-hover transition-colors rounded-md px-6 py-2 font-medium"
                  data-testid="submit-money-button"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}