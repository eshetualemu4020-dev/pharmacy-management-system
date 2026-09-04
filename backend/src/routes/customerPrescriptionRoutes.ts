import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { 
    getMyPrescriptions, 
    getMyPrescriptionById, 
    getMyPrescriptionFile, 
    uploadPrescription,
    getEligibleOrders
} from '../controllers/customerPrescriptionController.js';

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'prescriptions');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `rx-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.'));
    }
};

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter
});

// Middleware for auth and role
router.use(requireAuth);
router.use(requireRole(['customer']));

router.get('/', getMyPrescriptions);
router.get('/eligible-orders', getEligibleOrders);
router.get('/:id', getMyPrescriptionById);
router.get('/:id/file', getMyPrescriptionFile);

// Upload prescription endpoint
router.post('/upload', upload.single('prescription'), uploadPrescription);

export default router;
