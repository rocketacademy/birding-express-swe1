import express from 'express';
import {
  allNotesController, singleNoteController, postNoteController, createNoteController,
} from '../controllers/noteController.js';

const router = express.Router();
router.get('/all', allNotesController);
router.get('/create', createNoteController);
router.post('/', postNoteController);

router.get('/single/:id', singleNoteController);

export default router;
