'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../hook/useAuth';
import { useRouter } from 'next/navigation';
import api from '../../../../services/api';

export default function CreateRoomPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin())) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/rooms', {
        name: formData.name,
        capacity: parseInt(formData.capacity),
        description: formData.description
      });
      
      router.push('/dashboard');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Error creating room');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (authLoading || !user || !isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 relative overflow-hidden">
      {/* Background particles/decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      </div>

      <div className="max-w-md mx-auto bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10 relative z-10">
        {/* Glass shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent rounded-2xl"></div>
        
        <div className="text-center mb-8 relative z-10">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-2xl">
            <span className="text-white text-2xl">🏗️</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Create New Room
          </h1>
          <p className="text-gray-400 mt-2">Add a new meeting room to the system</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <span className="flex items-center">
                <span className="mr-2">🏠</span>
                Room Name *
              </span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/5 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
              placeholder="e.g., Conference Room A"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <span className="flex items-center">
                <span className="mr-2">👥</span>
                Capacity *
              </span>
            </label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/5 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
              placeholder="e.g., 10"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <span className="flex items-center">
                <span className="mr-2">📝</span>
                Description
              </span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/5 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 resize-none"
              placeholder="Optional description of the room features, equipment, etc."
            />
          </div>

          {error && (
            <div className="p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl">
              <p className="text-red-300 text-sm flex items-center">
                <span className="mr-2">⚠️</span>
                {error}
              </p>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 backdrop-blur-sm text-gray-300 border border-gray-500/30 py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-lg font-medium"
            >
              ← Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-4 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating...
                </div>
              ) : (
                <span className="flex items-center justify-center">
                  <span className="mr-2">✨</span>
                  Create Room
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}