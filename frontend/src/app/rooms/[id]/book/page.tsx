'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../hook/useAuth';
import { useRouter, useParams } from 'next/navigation';
import api from '../../../../../services/api';

interface Room {
  id: number;
  name: string;
  capacity: number;
  description?: string;
  owner: {
    id: number;
    username: string;
    email: string;
  };
}

export default function BookRoomPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const roomId = params.id;

  const [room, setRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, authLoading, router]);

  const fetchRoom = useCallback(async () => {
    try {
      const response = await api.get(`/rooms/${roomId}`);
      setRoom(response.data);
    } catch (error) {
      console.error('Error fetching room:', error);
      setError('Room not found');
    }
  }, [roomId]);

  useEffect(() => {
    if (roomId && user) {
      fetchRoom();
    }
  }, [roomId, user, fetchRoom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate dates
    const startDate = new Date(formData.startTime);
    const endDate = new Date(formData.endTime);
    const now = new Date();

    if (startDate <= now) {
      setError('Start time must be in the future');
      setLoading(false);
      return;
    }

    if (endDate <= startDate) {
      setError('End time must be after start time');
      setLoading(false);
      return;
    }

    try {
      await api.post('/bookings', {
        room_id: parseInt(roomId as string),
        start_time: formData.startTime,
        end_time: formData.endTime,
        description: formData.description
      });
      
      router.push('/dashboard');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Error creating booking');
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

  // Generate minimum datetime for form inputs (current time)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600">Loading room details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 relative overflow-hidden">
      {/* Background particles/decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-green-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-pulse"></div>
      </div>

      <div className="max-w-md mx-auto bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10 relative z-10">
        {/* Glass shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent rounded-2xl"></div>
        
        <div className="text-center mb-8 relative z-10">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-2xl">
            <span className="text-white text-2xl">📋</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Book {room.name}
          </h1>
          <div className="mt-3 space-y-1">
            <p className="text-gray-300 flex items-center justify-center">
              <span className="mr-2">👥</span>
              Capacity: {room.capacity} people
            </p>
            {room.description && (
              <p className="text-gray-300 flex items-center justify-center">
                <span className="mr-2">📝</span>
                {room.description}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <span className="flex items-center">
                <span className="mr-2">🕐</span>
                Start Time *
              </span>
            </label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              min={getMinDateTime()}
              className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/5 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <span className="flex items-center">
                <span className="mr-2">🕕</span>
                End Time *
              </span>
            </label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              min={formData.startTime || getMinDateTime()}
              className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/5 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <span className="flex items-center">
                <span className="mr-2">💭</span>
                Description
              </span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/5 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 resize-none"
              placeholder="Meeting purpose, agenda, notes..."
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
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-4 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Booking...
                </div>
              ) : (
                <span className="flex items-center justify-center">
                  <span className="mr-2">✅</span>
                  Book Room
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}