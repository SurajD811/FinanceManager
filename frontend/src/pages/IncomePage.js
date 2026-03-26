import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import AddIncomeModal from '@/components/AddIncomeModal';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function IncomePage() {
  const [incomeList, setIncomeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    fetchIncome();
  }, []);

  const fetchIncome = async () => {
    try {
      const response = await axios.get(`${API_URL}/income`);
      setIncomeList(response.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error('Failed to fetch income:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this income?')) return;
    
    try {
      await axios.delete(`${API_URL}/income/${id}`);
      fetchIncome();
    } catch (error) {
      console.error('Failed to delete income:', error);
    }
  };

  const handleEdit = (income) => {
    setEditData(income);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditData(null);
  };

  const totalIncome = incomeList.reduce((sum, item) => sum + item.amount, 0);

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
            <h1 className="text-4xl sm:text-5xl tracking-tight leading-none font-bold">Income</h1>
            <p className="text-sm text-text-secondary mt-1">Manage your income sources</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-accent-positive text-white hover:opacity-90 transition-opacity rounded-md px-4 py-2 font-medium text-sm flex items-center gap-2"
            data-testid="add-income-button"
          >
            <Plus className="w-4 h-4" /> Add Income
          </button>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl sm:text-2xl tracking-tight font-bold">Total Income</h3>
            <div className="mono text-3xl font-bold text-accent-positive" data-testid="total-income">
              ${totalIncome.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6" data-testid="income-list">
          <h3 className="text-xl sm:text-2xl tracking-tight font-bold mb-6">All Income</h3>
          {incomeList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3">Date</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3">Source</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3">Category</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3">Notes</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3 text-right">Amount</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeList.map((item) => (
                    <tr key={item.id} className="border-b border-border hover:bg-surface-muted transition-colors">
                      <td className="py-3 text-text-secondary text-sm">{format(parseISO(item.date), 'MMM dd, yyyy')}</td>
                      <td className="py-3 text-text-primary font-medium">{item.source}</td>
                      <td className="py-3 text-text-secondary text-sm capitalize">{item.category}</td>
                      <td className="py-3 text-text-secondary text-sm">{item.notes || '-'}</td>
                      <td className="py-3 text-right mono font-medium text-accent-positive">${item.amount.toFixed(2)}</td>
                      <td className="py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 rounded-md hover:bg-primary/10 text-primary transition-colors"
                            data-testid={`edit-income-${item.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 rounded-md hover:bg-accent-negative/10 text-accent-negative transition-colors"
                            data-testid={`delete-income-${item.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary">No income records yet. Add your first income!</div>
          )}
        </div>
      </div>

      {showModal && <AddIncomeModal onClose={handleCloseModal} onSuccess={fetchIncome} editData={editData} />}
    </Layout>
  );
}