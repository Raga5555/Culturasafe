import { Router } from 'express';
import { getProfile, updateProfile, getPreferences, updatePreferences, updateProfileSchema, updatePreferencesSchema } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get('/profile', getProfile);
userRouter.put('/profile', validateBody(updateProfileSchema), updateProfile);

userRouter.get('/preferences', getPreferences);
userRouter.put('/preferences', validateBody(updatePreferencesSchema), updatePreferences);
