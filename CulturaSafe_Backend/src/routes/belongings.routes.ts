import { Router } from 'express';
import {
  getBelongings,
  registerBelonging,
  updateBelonging,
  deleteBelonging,
  recordAlertEvent,
  getAlertEvents,
  registerBelongingSchema,
  updateBelongingSchema,
  recordAlertEventSchema
} from '../controllers/belongings.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

export const belongingsRouter = Router();

belongingsRouter.use(requireAuth);

belongingsRouter.get('/', getBelongings);
belongingsRouter.post('/', validateBody(registerBelongingSchema), registerBelonging);
belongingsRouter.put('/:id', validateBody(updateBelongingSchema), updateBelonging);
belongingsRouter.delete('/:id', deleteBelonging);

// Alerts endpoints
belongingsRouter.get('/alerts/history', getAlertEvents);
belongingsRouter.post('/alerts/events', validateBody(recordAlertEventSchema), recordAlertEvent);
