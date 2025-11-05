'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hook/useAuth';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';

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

interface Booking {
  id: number;
  startTime: string;
  endTime: string;
  description?: string;
  room: Room;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export default function Dashboard() {
  const { user, logout, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rooms' | 'bookings' | 'my-bookings'>('rooms');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'rooms') {
        const response = await api.get('/rooms');
        setRooms(response.data);
      } else if (activeTab === 'bookings' && user?.role === 'admin') {
        const response = await api.get('/bookings');
        setBookings(response.data);
      } else if (activeTab === 'my-bookings' && user) {
        const response = await api.get(`/bookings`);
        setBookings(response.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, activeTab, fetchData]);

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  const cancelBooking = async (bookingId: number) => {
    try {
      await api.delete(`/bookings/${bookingId}`);
      fetchData(); 
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const deleteRoom = async (roomId: number) => {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/rooms/${roomId}`);
      fetchData(); 
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Background particles/decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="bg-black/20 backdrop-blur-xl shadow-2xl border-b border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                <span className="text-white text-xl">🏢</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Meeting Booking System
                </h1>
                {user.role === 'admin' && (
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                    Administrator
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-white font-medium">Welcome back!</p>
                <p className="text-gray-400 text-sm">{user.username}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm text-red-300 border border-red-500/30 px-4 py-2 rounded-xl transition-all duration-300 hover:shadow-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        <div className="border-b border-white/10">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('rooms')}
              className={`py-3 px-4 border-b-2 font-medium text-sm transition-all duration-300 ${
                activeTab === 'rooms'
                  ? 'border-blue-400 text-blue-400 bg-blue-500/10 rounded-t-lg'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600 hover:bg-white/5 rounded-t-lg'
              }`}
            >
              🏠 Rooms
            </button>
            <button
              onClick={() => setActiveTab('my-bookings')}
              className={`py-3 px-4 border-b-2 font-medium text-sm transition-all duration-300 ${
                activeTab === 'my-bookings'
                  ? 'border-green-400 text-green-400 bg-green-500/10 rounded-t-lg'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600 hover:bg-white/5 rounded-t-lg'
              }`}
            >
              📅 My Bookings
            </button>
            {isAdmin() && (
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-3 px-4 border-b-2 font-medium text-sm transition-all duration-300 ${
                  activeTab === 'bookings'
                    ? 'border-purple-400 text-purple-400 bg-purple-500/10 rounded-t-lg'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600 hover:bg-white/5 rounded-t-lg'
                }`}
              >
                🔧 All Bookings
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Rooms Tab */}
              {activeTab === 'rooms' && (
                <div>
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-white">Available Rooms</h2>
                    {isAdmin() && (
                      <button
                        onClick={() => router.push('/rooms/create')}
                        className="bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-sm text-blue-300 border border-blue-500/30 px-6 py-3 rounded-xl transition-all duration-300 hover:shadow-lg font-medium"
                      >
                        ➕ Create Room
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rooms.map((room) => (
                      <div key={room.id} className="bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group hover:transform hover:-translate-y-2">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                          <h3 className="text-xl font-bold text-white mb-3">{room.name}</h3>
                          <div className="space-y-2 mb-4">
                            <p className="text-gray-300 flex items-center">
                              <span className="mr-2">👥</span>
                              Capacity: {room.capacity} people
                            </p>
                            {room.description && (
                              <p className="text-gray-300 flex items-start">
                                <span className="mr-2 mt-1">📝</span>
                                {room.description}
                              </p>
                            )}
                            <p className="text-gray-400 text-sm flex items-center">
                              <span className="mr-2">👤</span>
                              Owner: {room.owner.username}
                            </p>
                          </div>
                          {user?.role === 'admin' ? (
                            <div className="flex space-x-3">
                              <button
                                onClick={() => router.push(`/rooms/${room.id}/book`)}
                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                              >
                                📋 Book Room
                              </button>
                              <button
                                onClick={() => deleteRoom(room.id)}
                                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => router.push(`/rooms/${room.id}/book`)}
                              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                              📋 Book Room
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {rooms.length === 0 && (
                    <div className="text-center py-12">
                      <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-8 border border-white/10 max-w-md mx-auto">
                        <p className="text-gray-400 text-lg">No rooms available.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bookings Tabs */}
              {(activeTab === 'bookings' || activeTab === 'my-bookings') && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-8">
                    {activeTab === 'bookings' ? '🔧 All Bookings' : '📅 My Bookings'}
                  </h2>
                  <div className="space-y-6">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                              <span className="mr-2">🏠</span>
                              {booking.room.name}
                            </h3>
                            <div className="space-y-2">
                              <p className="text-gray-300 flex items-center">
                                <span className="mr-2">🕒</span>
                                <strong>Time:</strong> {new Date(booking.startTime).toLocaleString()} - {new Date(booking.endTime).toLocaleString()}
                              </p>
                              {booking.description && (
                                <p className="text-gray-300 flex items-start">
                                  <span className="mr-2 mt-1">📝</span>
                                  <strong>Description:</strong> {booking.description}
                                </p>
                              )}
                              <p className="text-gray-300 flex items-center">
                                <span className="mr-2">👤</span>
                                <strong>Booked by:</strong> {booking.user.username}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-3 ml-6">
                            {(booking.user.id === user.id || isAdmin()) && (
                              <button
                                onClick={() => cancelBooking(booking.id)}
                                className="bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm text-red-300 border border-red-500/30 px-4 py-2 rounded-xl transition-all duration-300 hover:shadow-lg"
                              >
                                ❌ Cancel Booking
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {bookings.length === 0 && (
                      <div className="text-center py-12">
                        <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-8 border border-white/10 max-w-md mx-auto">
                          <p className="text-gray-400 text-lg mb-4">No bookings found.</p>
                          {activeTab === 'my-bookings' && (
                            <button
                              onClick={() => setActiveTab('rooms')}
                              className="bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-sm text-blue-300 border border-blue-500/30 px-6 py-3 rounded-xl transition-all duration-300 hover:shadow-lg font-medium"
                            >
                              🏠 Browse Rooms to Book
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}