'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hook/useAuth';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';

interface Booking {
  id: number;
  start_time: string;
  end_time: string;
  description?: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
  room: {
    id: number;
    name: string;
    capacity: number;
    description?: string;
  };
}

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, authLoading, router]);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await api.get('/bookings');
      setBookings(response.data);
    } catch {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user, fetchBookings]);

  const handleCancelBooking = useCallback(async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setBookings(prevBookings => prevBookings.filter(booking => booking.id !== bookingId));

    try {
      await api.delete(`/bookings/${bookingId}`);
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to cancel booking');
      
      fetchBookings();
    }
  }, [fetchBookings]); 

  const formatDateTime = useCallback((dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const canCancelBooking = useCallback((startTime: string) => {
    return new Date(startTime) > new Date();
  }, []);

  const bookingStats = useMemo(() => {
    const now = new Date();
    const upcoming = bookings.filter(booking => new Date(booking.start_time) > now);
    const past = bookings.filter(booking => new Date(booking.start_time) <= now);
    
    return {
      total: bookings.length,
      upcoming: upcoming.length,
      past: past.length
    };
  }, [bookings]);

  const handleBrowseRooms = useCallback(() => {
    router.push('/rooms');
  }, [router]);

  const handleBackToDashboard = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-600 mt-2">
              Manage your room bookings | Total: {bookingStats.total} | Upcoming: {bookingStats.upcoming} | Past: {bookingStats.past}
            </p>
          </div>
          <button
            onClick={handleBackToDashboard}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700 font-bold ml-4"
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md p-8">
              <p className="text-gray-600 mb-4">You have no bookings yet.</p>
              <p className="text-sm text-gray-500 mb-4">
                Total: {bookingStats.total} | Upcoming: {bookingStats.upcoming} | Past: {bookingStats.past}
              </p>
              <button
                onClick={handleBrowseRooms}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Browse Rooms
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {booking.room.name}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    canCancelBooking(booking.start_time)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {canCancelBooking(booking.start_time) ? 'Upcoming' : 'Past'}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Start Time</p>
                    <p className="text-gray-900">{formatDateTime(booking.start_time)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">End Time</p>
                    <p className="text-gray-900">{formatDateTime(booking.end_time)}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 font-medium">Room Details</p>
                  <p className="text-gray-900">Capacity: {booking.room.capacity} people</p>
                  {booking.room.description && (
                    <p className="text-gray-600 text-sm">{booking.room.description}</p>
                  )}
                </div>

                {booking.description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 font-medium">Description</p>
                    <p className="text-gray-900">{booking.description}</p>
                  </div>
                )}

                {canCancelBooking(booking.start_time) && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}