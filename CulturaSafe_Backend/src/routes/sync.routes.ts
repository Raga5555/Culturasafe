import { Router } from 'express';
import { syncOfflineData, syncPayloadSchema } from '../controllers/sync.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

export const syncRouter = Router();

syncRouter.use(requireAuth);

syncRouter.post('/', validateBody(syncPayloadSchema), syncOfflineData);
