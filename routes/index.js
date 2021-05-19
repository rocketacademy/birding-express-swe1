import express from 'express';
import { homeController, aboutController, createNoteController } from '../controllers/index.js';

const router = express.Router();

router.get('/', homeController);
router.get('/about', aboutController);
router.get('/note', createNoteController);
router.post('/', (req, res) => {
  res.json(req.body.name);
});
export default router;
