'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hook/useAuth';
import { useRouter, useParams } from 'next/navigation';
import api from '../../../../services/api';

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
  roomId: number;
  startTime: string;
  endTime: string;
  description?: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export default function RoomDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const roomId = params.id;

  const [room, setRoom] = useState<Room | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, authLoading, router]);

  const fetchRoomData = useCallback(async () => {
    if (!roomId || !user) return;
    
    setLoading(true);
    try {
      const roomResponse = await api.get(`/rooms/${roomId}`);
      setRoom(roomResponse.data);

      const bookingsResponse = await api.get(`/bookings`);
      const now = new Date();
      const upcoming = bookingsResponse.data.filter((booking: Booking) => 
        booking.roomId === parseInt(roomId as string) && new Date(booking.startTime) > now
      );
      setUpcomingBookings(upcoming);
    } catch (error) {
      console.error('Error fetching room data:', error);
      setError('Room not found');
    } finally {
      setLoading(false);
    }
  }, [roomId, user]);

  useEffect(() => {
    if (user) {
      fetchRoomData();
    }
  }, [user, fetchRoomData]);

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading || !room) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading room details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Room Information */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{room.name}</h1>
            <button
              onClick={() => router.push(`/rooms/${room.id}/book`)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Book This Room
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Room Details</h3>
              <div className="space-y-2">
                <p className="text-gray-600">
                  <span className="font-medium">Capacity:</span> {room.capacity} people
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Owner:</span> {room.owner.username}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Contact:</span> {room.owner.email}
                </p>
              </div>
            </div>

            {room.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{room.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Bookings</h2>
          
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No upcoming bookings for this room.</p>
              <p className="text-gray-500 text-sm mt-2">This room is available for booking!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">
                      Booked by {booking.user.username}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {formatDateTime(booking.startTime)} - {formatDateTime(booking.endTime)}
                    </span>
                  </div>
                  
                  {booking.description && (
                    <p className="text-gray-600 text-sm">{booking.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors mr-4"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => router.push('/rooms')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Browse All Rooms
          </button>
        </div>
      </div>
    </div>
  );
}