import { PrismaClient, Booking } from '@prisma/client';

const prisma = new PrismaClient();

export class BookingService {
  static async createBookingSafe(data: {
    userId: number;
    roomId: number;
    startTime: Date;
    endTime: Date;
    description?: string;
  }): Promise<Booking> {
    return await prisma.$transaction(async (tx) => {
      const overlappingBookings = await tx.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM bookings 
        WHERE room_id = ${data.roomId}
        AND deleted_at IS NULL
        AND (
          (start_time <= ${data.startTime} AND end_time > ${data.startTime})
          OR (start_time < ${data.endTime} AND end_time >= ${data.endTime})
          OR (start_time >= ${data.startTime} AND end_time <= ${data.endTime})
        )
        FOR UPDATE
      `;

      if (overlappingBookings.length > 0) {
        throw new Error('Room is already booked for this time period');
      }
      const booking = await tx.booking.create({
        data: {
          userId: data.userId,
          roomId: data.roomId,
          startTime: data.startTime,
          endTime: data.endTime,
          description: data.description,
        },
        include: {
          room: true,
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      return booking;
    });
  }

  static async getActiveBookings(userId?: number) {
    const where = {
      deletedAt: null,
      ...(userId && { userId }),
    };

    return await prisma.booking.findMany({
      where,
      include: {
        room: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

 
  static async softDeleteBooking(bookingId: number, userId: number): Promise<Booking> {
    let booking;
    if (userId === 0) { 
      booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          deletedAt: null,
        },
      });
    } else {
      booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          userId: userId,
          deletedAt: null,
        },
      });
    }

    if (!booking) {
      throw new Error('Booking not found or already cancelled');
    }


    return await prisma.booking.update({
      where: { id: bookingId },
      data: { deletedAt: new Date() },
      include: {
        room: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }


  static async checkRoomAvailability(
    roomId: number,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: number
  ): Promise<boolean> {
    const where = {
      roomId,
      deletedAt: null,
      AND: [
        {
          OR: [
            {
              startTime: { lte: startTime },
              endTime: { gt: startTime },
            },
            {
              startTime: { lt: endTime },
              endTime: { gte: endTime },
            },
            {
              startTime: { gte: startTime },
              endTime: { lte: endTime },
            },
          ],
        },
      ],
      ...(excludeBookingId && { id: { not: excludeBookingId } }),
    };

    const conflictingBookings = await prisma.booking.count({ where });
    return conflictingBookings === 0;
  }


  static async getBookingById(bookingId: number): Promise<Booking | null> {
    return await prisma.booking.findFirst({
      where: {
        id: bookingId,
        deletedAt: null,
      },
      include: {
        room: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }
}