/**
 * Book Clubs Router
 * Defines routes for book club endpoints
 */

import express from 'express';
import {
  getBookClubs,
  getBookClubById,
  joinBookClub,
  leaveBookClub
} from './book-clubs.controller.js';
import { authCognito } from '../../middleware/authCognito.js';

const router = express.Router();

// Public routes
router.get('/', getBookClubs);
router.get('/:id', getBookClubById);

// Protected routes (require authentication)
router.post('/:id/join', authCognito(), joinBookClub);
router.delete('/:id/leave', authCognito(), leaveBookClub);

export default router;
