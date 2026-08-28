import { Router } from 'express';
import { getUsers, getUserById, createUser, updateUser, updateStatus, resetPassword } from '../controllers/userController.js';

const router = Router();

router.get('/', getUsers);
router.post('/', createUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.patch('/:id/status', updateStatus);
router.patch('/:id/password', resetPassword);

export default router;
