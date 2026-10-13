import { Router } from 'express';
import { getSavedDestinations, saveDestination, deleteSavedDestination, saveDestinationSchema } from '../controllers/destinations.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

export const destinationsRouter = Router();

destinationsRouter.use(requireAuth);

destinationsRouter.get('/saved', getSavedDestinations);
destinationsRouter.post('/saved', validateBody(saveDestinationSchema), saveDestination);
destinationsRouter.delete('/saved/:destinationId', deleteSavedDestination);
