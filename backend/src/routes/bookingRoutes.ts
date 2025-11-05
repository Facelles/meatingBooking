import { Router, Request, Response } from 'express';
import { adminMiddleware, authMiddleware } from '../middleware/auth';
import { BookingService } from '../services/bookingService';

const router = Router();

router.post('/', authMiddleware, async (req: Request, res: Response) => {
    const { room_id, user_id, start_time, end_time, description } = req.body;
    const currentUser = req.user!;

    if (!room_id || !start_time || !end_time) {
        return res.status(400).json({ message: 'room_id, start_time, and end_time are required' });
    }

    const bookingUserId = user_id || currentUser.id;

    if (user_id && user_id !== currentUser.id && currentUser.role !== 'admin') {
        return res.status(403).json({ message: 'Only admin can create bookings for other users' });
    }

    try {
        const booking = await BookingService.createBookingSafe({
            userId: bookingUserId,
            roomId: room_id,
            startTime: new Date(start_time),
            endTime: new Date(end_time),
            description
        });

        res.status(201).json(booking);
    } catch (e) {
        if (e instanceof Error) {
            if (e.message.includes('already booked') || e.message.includes('unique_booking')) {
                return res.status(409).json({ message: 'Room is already booked for this time period' });
            }
        }
        
        res.status(500).json({ message: 'Error creating booking', error: e });
    }
});

// Get all bookings (admin only) or user's bookings
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        let bookings;
        
        if (user.role === 'admin') {
            // Admin sees all active bookings
            bookings = await BookingService.getActiveBookings();
        } else {
            // User sees only their bookings
            bookings = await BookingService.getActiveBookings(user.id);
        }
        
        res.json(bookings);
    } catch (e) {
        res.status(500).json({ message: 'Error fetching bookings', error: e });
    }
});

// Get booking by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const booking = await BookingService.getBookingById(parseInt(req.params.id));
        
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        
        const user = req.user!;
        if (user.role !== 'admin' && booking.userId !== user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        res.json(booking);
    } catch (e) {
        res.status(500).json({ message: 'Error fetching booking', error: e });
    }
});

// Check availability
router.post('/check-availability', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { roomId, startTime, endTime, excludeBookingId } = req.body;

        if (!roomId || !startTime || !endTime) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const isAvailable = await BookingService.checkRoomAvailability(
            parseInt(roomId),
            new Date(startTime),
            new Date(endTime),
            excludeBookingId ? parseInt(excludeBookingId) : undefined
        );

        res.json({ available: isAvailable });
    } catch (error) {
        res.status(500).json({ message: 'Failed to check availability' });
    }
});

// Cancel booking (soft delete)
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
    const user = req.user!;
    
    try {
        const bookingId = parseInt(req.params.id);
        
        if (user.role !== 'admin') {
            const booking = await BookingService.getBookingById(bookingId);
            
            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }
            
            if (booking.userId !== user.id) {
                return res.status(403).json({ message: 'Not authorized' });
            }
            
            const now = new Date();
            if (new Date(booking.startTime) <= now) {
                return res.status(400).json({ message: 'Cannot cancel past or ongoing bookings' });
            }
        }

        const cancelledBooking = await BookingService.softDeleteBooking(bookingId, user.role === 'admin' ? 0 : user.id);
        
        res.json({ message: 'Booking cancelled successfully', booking: cancelledBooking });
    } catch (e) {
        if (e instanceof Error && e.message.includes('not found')) {
            return res.status(404).json({ message: 'Booking not found or already cancelled' });
        }
        
        res.status(500).json({ message: 'Error cancelling booking', error: e });
    }
});

export default router;