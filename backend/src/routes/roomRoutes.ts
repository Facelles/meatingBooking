import { Router, Request, Response } from 'express';
import { adminMiddleware, authMiddleware } from '../middleware/auth';
import prisma from '../config/prisma';

const router = Router();

router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    const { name, capacity, description } = req.body;
    const user = (req as any).user;

    if (!name || !capacity) {
        return res.status(400).json({ message: 'Name and capacity are required' });
    }

    try {
        const room = await prisma.room.create({ 
            data: { name, capacity, description, ownerId: user.id },
            include: { owner: { select: { id: true, username: true, email: true } } }
        });
        res.status(201).json(room);
    } catch (e) {
        res.status(500).json({ message: 'Error creating room', error: e });
    }
});

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        owner: { select: { id: true, username: true, email: true } }
      }
    });
    res.json(rooms);
  } catch (e) {
    res.status(500).json({ message: 'Error fetching rooms', error: e });
  }
});

// GET /rooms/available - Отримання доступних кімнат
router.get('/available', authMiddleware, async (req: Request, res: Response) => {
  const { start_time, end_time } = req.query;

  if (!start_time || !end_time) {
    return res.status(400).json({ message: 'start_time and end_time are required' });
  }

  try {
    // Знаходимо всі кімнати
    const allRooms = await prisma.room.findMany({
      include: {
        owner: { select: { id: true, username: true, email: true } }
      }
    });

    // Знаходимо заброньовані кімнати в заданий час
    const bookedRooms = await prisma.booking.findMany({
      where: {
        OR: [
          {
            startTime: { 
              gte: new Date(start_time as string),
              lte: new Date(end_time as string)
            }
          },
          {
            endTime: { 
              gte: new Date(start_time as string),
              lte: new Date(end_time as string)
            }
          },
          {
            startTime: { lte: new Date(start_time as string) },
            endTime: { gte: new Date(end_time as string) }
          }
        ]
      },
      select: { roomId: true }
    });

    const bookedRoomIds = bookedRooms.map(booking => booking.roomId);
    
    // Фільтруємо доступні кімнати
    const availableRooms = allRooms.filter(room => !bookedRoomIds.includes(room.id));

    res.json(availableRooms);
  } catch (e) {
    console.error('Error fetching available rooms:', e);
    res.status(500).json({ message: 'Error fetching available rooms', error: e });
  }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const room = await prisma.room.findUnique({ 
            where: { id: parseInt(req.params.id) },
            include: { owner: { select: { id: true, username: true, email: true } } }
        });
        if (!room) return res.status(404).json({ message: 'Room not found' });
        res.json(room);
    } catch (e) {
        res.status(500).json({ message: 'Error fetching room', error: e });
    }
});

router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
    const { name, capacity, description } = req.body;
    const user = (req as any).user;

    try {
        const room = await prisma.room.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!room) return res.status(404).json({ message: 'Room not found! ' });
        if (room.ownerId !== user.id && user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        };

        const updatedRoom = await prisma.room.update({
            where: { id: parseInt(req.params.id) },
            data: { name, capacity, description },
            include: { owner: { select: { id: true, username: true, email: true } } }
        });
        res.json(updatedRoom);
    } catch (e) {
        res.status(500).json({ message: 'Error updating room', error: e });
    }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    const room = await prisma.room.findUnique({ 
      where: { id: parseInt(req.params.id) },
      include: {
        bookings: true
      }
    });
    
    if (!room) return res.status(404).json({ message: 'Room not found' });
    
    if (room.ownerId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const activeBookings = room.bookings.filter(booking => booking.deletedAt === null);
    
    if (user.role === 'admin') {
      await prisma.$transaction(async (tx) => {
        await tx.booking.deleteMany({
          where: { roomId: parseInt(req.params.id) }
        });
        
        await tx.room.delete({
          where: { id: parseInt(req.params.id) }
        });
      });
      
      const deletedBookingsCount = room.bookings.length;
      res.json({ 
        message: `Room deleted successfully. ${deletedBookingsCount} booking(s) were also deleted.`,
        deletedBookings: deletedBookingsCount
      });
    } else {
      if (activeBookings.length > 0) {
        return res.status(400).json({ 
          message: `Cannot delete room. It has ${activeBookings.length} active booking(s). Cancel all bookings first.` 
        });
      }
      
      await prisma.room.delete({ where: { id: parseInt(req.params.id) } });
      res.json({ message: 'Room deleted successfully' });
    }
  } catch (e) {
    res.status(500).json({ message: 'Error deleting room', error: e });
  }
});

export default router;