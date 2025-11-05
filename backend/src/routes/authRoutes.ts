import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import prisma from "../config/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

router.post('/register', async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields required' });
    }

    try {
        const existUser = await prisma.user.findUnique({ where: { email } });
        if (existUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const totalUsers = await prisma.user.count();
        const role = totalUsers === 0 ? 'admin' : 'user';

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({ 
            data: { username, email, password: hashedPassword, role }
        });

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60,
        });

        return res.status(201).json({
            message: 'User registered and logged in successfully',
            user: { id: user.id, username: user.username, email: user.email, role: user.role },
        });
    } catch (e: any) {
        
        if (e.name === 'SequelizeValidationError') {
            const validationErrors = e.errors.map((error: any) => {
                if (error.validatorKey === 'isEmail') {
                    return 'Please provide a valid email address (e.g., user@example.com)';
                }
                return error.message;
            });
            return res.status(400).json({ 
                message: validationErrors[0] || 'Validation error',
                errors: validationErrors 
            });
        }
        
        return res.status(500).json({ message: 'Server error', error: e.message });
    }
});

router.post('/login', async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email and password are required' });
    }

    try {
        const user = await prisma.user.findFirst({ where: { username, email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60,
        });

        return res.json({
            message: 'Logged in',
            user: { id: user.id, username: user.username, email: user.email, role: user.role },
        });
    } catch (e) {
        return res.status(500).json({ message: 'Server error', error: e });
    }
});

router.post('/logout', (req: Request, res: Response) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, email: true, role: true }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
});

router.post('/promote', authMiddleware, async (req: Request, res: Response) => {
    const requester = (req as any).user;
    if (requester.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const { username } = req.body as { username: string };
    if (!username) return res.status(400).json({ message: 'Username required' });

    try {
        const target = await prisma.user.findUnique({ where: { username } });
        if (!target) return res.status(404).json({ message: 'User not found' });
        if (target.role === 'admin') return res.status(200).json({ message: 'Already admin' });

        await prisma.user.update({
            where: { username },
            data: { role: 'admin' }
        });
        return res.json({ message: 'Promoted', username });
    } catch (e) {
        return res.status(500).json({ message: 'Server error', error: e });
    }
});

export default router;