import express from 'express';
import { signup, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Auth routes
router.post('/api/signup', signup);
router.post('/api/login', login);
router.get('/api/me', protect, getMe);

export default router;
