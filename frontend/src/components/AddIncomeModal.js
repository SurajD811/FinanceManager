import { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const INCOME_CATEGORIES = ['salary', 'freelance', 'business', 'investment', 'gift', 'other'];

export default function AddIncomeModal({ onClose, onSuccess, editData = null }) {
  const [formData, setFormData] = useState(editData || {
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    source: '',
    category: 'salary',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editData) {
        await axios.put(`${API_URL}/income/${editData.id}`, formData);
      } else {
        await axios.post(`${API_URL}/income`, formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6" data-testid="income-modal">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold tracking-tight">{editData ? 'Edit' : 'Add'} Income</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-surface-muted transition-colors"
            data-testid="close-modal-button"
          >
            <X className="w-5 h-5" />
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
              placeholder="0.00"
              required
              data-testid="income-amount-input"
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
              data-testid="income-date-input"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text-secondary mb-1.5 block">Source</label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full bg-transparent border border-border rounded-md px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary transition-all"
              placeholder="e.g., Company Name"
              required
              data-testid="income-source-input"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text-secondary mb-1.5 block">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-transparent border border-border rounded-md px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary transition-all"
              data-testid="income-category-select"
            >
              {INCOME_CATEGORIES.map(cat => (
                <option key={cat} value={cat} className="bg-surface">{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-text-secondary mb-1.5 block">Notes (optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-transparent border border-border rounded-md px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary transition-all"
              rows="3"
              placeholder="Add any notes..."
              data-testid="income-notes-input"
            />
          </div>

          {error && (
            <div className="text-sm text-accent-negative bg-accent-negative/10 border border-accent-negative/20 rounded-md px-4 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-transparent border border-border text-text-primary hover:bg-surface-muted transition-colors rounded-md px-6 py-2 font-medium"
              data-testid="cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white hover:bg-primary-hover transition-colors rounded-md px-6 py-2 font-medium disabled:opacity-50"
              data-testid="submit-income-button"
            >
              {loading ? 'Saving...' : editData ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}