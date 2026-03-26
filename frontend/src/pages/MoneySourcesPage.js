import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Plus, Trash2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const SOURCE_TYPES = ['job', 'side hustle', 'business', 'freelance', 'passive income', 'other'];

export default function MoneySourcesPage() {
  const [sourcesList, setSourcesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'job',
    description: ''
  });

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const response = await axios.get(`${API_URL}/money-sources`);
      setSourcesList(response.data);
    } catch (error) {
      console.error('Failed to fetch money sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this source?')) return;
    
    try {
      await axios.delete(`${API_URL}/money-sources/${id}`);
      fetchSources();
    } catch (error) {
      console.error('Failed to delete money source:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/money-sources`, formData);
      setShowModal(false);
      setFormData({ name: '', type: 'job', description: '' });
      fetchSources();
    } catch (error) {
      console.error('Failed to add money source:', error);
    }
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
            <h1 className="text-4xl sm:text-5xl tracking-tight leading-none font-bold">Money Sources</h1>
            <p className="text-sm text-text-secondary mt-1">Manage your income sources</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary text-white hover:bg-primary-hover transition-colors rounded-md px-4 py-2 font-medium text-sm flex items-center gap-2"
            data-testid="add-source-button"
          >
            <Plus className="w-4 h-4" /> Add Source
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="sources-list">
          {sourcesList.length > 0 ? (
            sourcesList.map((source) => (
              <div key={source.id} className="bg-surface border border-border rounded-lg p-6 hover:-translate-y-1 transition-transform">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">{source.name}</h3>
                    <span className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary">{source.type}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(source.id)}
                    className="p-2 rounded-md hover:bg-accent-negative/10 text-accent-negative transition-colors"
                    data-testid={`delete-source-${source.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {source.description && (
                  <p className="text-sm text-text-secondary">{source.description}</p>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-surface border border-border rounded-lg">
              <p className="text-text-secondary">No money sources yet. Add your first source!</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6" data-testid="source-modal">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold tracking-tight">Add Money Source</h3>
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
                <label className="text-sm font-medium text-text-secondary mb-1.5 block">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-transparent border border-border rounded-md px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary transition-all"
                  placeholder="e.g., Company Name"
                  required
                  data-testid="source-name-input"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary mb-1.5 block">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-transparent border border-border rounded-md px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary transition-all"
                  data-testid="source-type-select"
                >
                  {SOURCE_TYPES.map(type => (
                    <option key={type} value={type} className="bg-surface">{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary mb-1.5 block">Description (optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-transparent border border-border rounded-md px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary transition-all"
                  rows="3"
                  placeholder="Additional details..."
                  data-testid="source-description-input"
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
                  data-testid="submit-source-button"
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