import { Router } from 'express';
import {
  getItineraries,
  getItineraryById,
  createItinerary,
  updateItinerary,
  deleteItinerary,
  createItinerarySchema,
  updateItinerarySchema
} from '../controllers/itineraries.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

export const itinerariesRouter = Router();

itinerariesRouter.use(requireAuth);

itinerariesRouter.get('/', getItineraries);
itinerariesRouter.get('/:id', getItineraryById);
itinerariesRouter.post('/', validateBody(createItinerarySchema), createItinerary);
itinerariesRouter.put('/:id', validateBody(updateItinerarySchema), updateItinerary);
itinerariesRouter.delete('/:id', deleteItinerary);
