import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './src/routes/auth.js';
import userRoutes from './src/routes/userRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import drugRoutes from './src/routes/drugRoutes.js';
import inventoryRoutes from './src/routes/inventoryRoutes.js';
import supplierRoutes from './src/routes/supplierRoutes.js';
import purchaseOrderRoutes from './src/routes/purchaseOrderRoutes.js';
import salesRoutes from './src/routes/salesRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import prescriptionRoutes from './src/routes/prescriptionRoutes.js';
import promotionRoutes from './src/routes/promotionRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import supportRoutes from './src/routes/supportRoutes.js';
import inventoryRoutes from './src/routes/inventoryRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';
import auditRoutes from './src/routes/auditRoutes.js';
import customerRoutes from './src/routes/customerRoutes.js';
import settingsRoutes from './src/routes/settingsRoutes.js';
import catalogRoutes from './src/routes/catalogRoutes.js';
import wishlistRoutes from './src/routes/wishlistRoutes.js';
import cartRoutes from './src/routes/cartRoutes.js';
import customerOrderRoutes from './src/routes/customerOrderRoutes.js';
import customerPrescriptionRoutes from './src/routes/customerPrescriptionRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import './src/jobs/backup.js';
import './src/jobs/scheduler.js';
import { rateLimit } from 'express-rate-limit';
import { errorHandler } from './src/middleware/errorHandler.js';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import { logger } from './src/utils/logger.js';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging via Morgan and Winston
const morganFormat = process.env.NODE_ENV !== 'production' ? 'dev' : 'combined';
app.use(morgan(morganFormat, { stream: { write: (message) => logger.info(message.trim()) } }));

// Swagger Configuration
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Pharmacy System API',
            version: '1.0.0',
            description: 'API documentation for the Pharmacy System',
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 8000}`,
            },
        ],
    },
    apis: ['./src/routes/*.ts'], // Path to route files
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10000, // Increased limit for development
	standardHeaders: true,
	legacyHeaders: false,
});
app.use(limiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' } },
    standardHeaders: true,
    legacyHeaders: false,
});

// Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/drugs', drugRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/prescriptions', prescriptionRoutes);
app.use('/api/admin/promotions', promotionRoutes);
app.use('/api/admin/reports', reportRoutes);
app.use('/api/admin/audit-logs', auditRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customer/orders', customerOrderRoutes);
app.use('/api/customer/prescriptions', customerPrescriptionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
	logger.info(`Server running on port ${PORT}`);
});
