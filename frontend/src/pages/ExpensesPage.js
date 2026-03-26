import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import AddExpenseModal from '@/components/AddExpenseModal';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function ExpensesPage() {
  const [expensesList, setExpensesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`${API_URL}/expenses`);
      setExpensesList(response.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await axios.delete(`${API_URL}/expenses/${id}`);
      fetchExpenses();
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const handleEdit = (expense) => {
    setEditData(expense);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditData(null);
  };

  const totalExpenses = expensesList.reduce((sum, item) => sum + item.amount, 0);

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
            <h1 className="text-4xl sm:text-5xl tracking-tight leading-none font-bold">Expenses</h1>
            <p className="text-sm text-text-secondary mt-1">Track your spending</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-accent-negative text-white hover:opacity-90 transition-opacity rounded-md px-4 py-2 font-medium text-sm flex items-center gap-2"
            data-testid="add-expense-button"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl sm:text-2xl tracking-tight font-bold">Total Expenses</h3>
            <div className="mono text-3xl font-bold text-accent-negative" data-testid="total-expenses">
              ₹{totalExpenses.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6" data-testid="expenses-list">
          <h3 className="text-xl sm:text-2xl tracking-tight font-bold mb-6">All Expenses</h3>
          {expensesList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3">Date</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3">Category</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3">Notes</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3 text-right">Amount</th>
                    <th className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expensesList.map((item) => (
                    <tr key={item.id} className="border-b border-border hover:bg-surface-muted transition-colors">
                      <td className="py-3 text-text-secondary text-sm">{format(parseISO(item.date), 'MMM dd, yyyy')}</td>
                      <td className="py-3 text-text-primary font-medium capitalize">{item.category}</td>
                      <td className="py-3 text-text-secondary text-sm">{item.notes || '-'}</td>
                      <td className="py-3 text-right mono font-medium text-accent-negative">₹{item.amount.toFixed(2)}</td>
                      <td className="py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 rounded-md hover:bg-primary/10 text-primary transition-colors"
                            data-testid={`edit-expense-${item.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 rounded-md hover:bg-accent-negative/10 text-accent-negative transition-colors"
                            data-testid={`delete-expense-${item.id}`}
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
            <div className="text-center py-8 text-text-secondary">No expense records yet. Add your first expense!</div>
          )}
        </div>
      </div>

      {showModal && <AddExpenseModal onClose={handleCloseModal} onSuccess={fetchExpenses} editData={editData} />}
    </Layout>
  );
}