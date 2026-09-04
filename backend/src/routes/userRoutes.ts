import { Router } from 'express';
import { getUsers, getUserById, createUser, updateUser, updateStatus, resetPassword, getProfile, updateProfile, changePassword } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);
router.put('/profile/password', requireAuth, changePassword);

router.get('/', getUsers);
router.post('/', createUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.patch('/:id/status', updateStatus);
router.patch('/:id/password', resetPassword);

export default router;
