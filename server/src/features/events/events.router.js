/**
 * Events Router
 * Defines routes for event-related endpoints
 */

import express from 'express';
import {
  getEvents,
  getEventById,
  registerForEvent,
  unregisterFromEvent
} from './events.controller.js';
import { authCognito } from '../../middleware/authCognito.js';

const router = express.Router();

// Public routes
router.get('/', getEvents);
router.get('/:id', getEventById);

// Protected routes (require authentication)
router.post('/:id/register', authCognito(), registerForEvent);
router.delete('/:id/register', authCognito(), unregisterFromEvent);

export default router;
