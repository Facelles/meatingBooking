'use client';

import { useState, useEffect, useCallback } from 'react';
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

export default function RoomsPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, authLoading, router]);

  const fetchRooms = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await api.get('/rooms');
      setRooms(response.data);
      setFilteredRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user, fetchRooms]);

  useEffect(() => {
    let filtered = rooms;

    if (searchTerm) {
      filtered = filtered.filter(room =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.owner.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (capacityFilter) {
      const minCapacity = parseInt(capacityFilter);
      filtered = filtered.filter(room => room.capacity >= minCapacity);
    }

    setFilteredRooms(filtered);
  }, [rooms, searchTerm, capacityFilter]);

  const handleDeleteRoom = async (roomId: number) => {
    if (!confirm('Are you sure you want to delete this room? This will also cancel all bookings for this room.')) {
      return;
    }

    try {
      await api.delete(`/rooms/${roomId}`);
      setRooms(rooms.filter(room => room.id !== roomId));
    } catch (error) {
      console.error('Error deleting room:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to delete room');
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meeting Rooms</h1>
            <p className="text-gray-600 mt-2">Browse and book available meeting rooms</p>
          </div>
          {isAdmin() && (
            <button
              onClick={() => router.push('/rooms/create')}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Create New Room
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Rooms
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, description, or owner..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Capacity
              </label>
              <select
                value={capacityFilter}
                onChange={(e) => setCapacityFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Any capacity</option>
                <option value="2">2+ people</option>
                <option value="5">5+ people</option>
                <option value="10">10+ people</option>
                <option value="20">20+ people</option>
                <option value="50">50+ people</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Rooms Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading rooms...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md p-8">
              <p className="text-gray-600 mb-4">
                {rooms.length === 0 ? 'No rooms available yet.' : 'No rooms match your search criteria.'}
              </p>
              {rooms.length === 0 && isAdmin() && (
                <button
                  onClick={() => router.push('/rooms/create')}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Create First Room
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <div key={room.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{room.name}</h3>
                    <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {room.capacity} seats
                    </span>
                  </div>
                  
                  {room.description && (
                    <p className="text-gray-600 mb-4 line-clamp-3">{room.description}</p>
                  )}
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Owner:</span> {room.owner.username}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Contact:</span> {room.owner.email}
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/rooms/${room.id}`)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => router.push(`/rooms/${room.id}/book`)}
                      className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      Book Room
                    </button>
                  </div>

                  {isAdmin() && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                      >
                        Delete Room
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
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