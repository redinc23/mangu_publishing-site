/**
 * Blog Router
 * Defines routes for blog comment endpoints
 */

import express from 'express';
import {
  getComments,
  addComment,
  editComment,
  deleteComment
} from './blog.controller.js';
import { authCognito } from '../../middleware/authCognito.js';

const router = express.Router();

// Public routes
router.get('/:postId/comments', getComments);

// Protected routes (require authentication)
router.post('/:postId/comments', authCognito(), addComment);
router.put('/comments/:id', authCognito(), editComment);
router.delete('/comments/:id', authCognito(), deleteComment);

export default router;
