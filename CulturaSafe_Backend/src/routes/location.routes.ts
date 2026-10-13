import { Router } from 'express';
import { recordLocationPoint, getLocationHistory, clearLocationHistory, recordLocationSchema } from '../controllers/location.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

export const locationRouter = Router();

locationRouter.use(requireAuth);

locationRouter.post('/points', validateBody(recordLocationSchema), recordLocationPoint);
locationRouter.get('/history', getLocationHistory);
locationRouter.delete('/history', clearLocationHistory);
