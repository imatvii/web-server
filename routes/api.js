import { Router } from 'express';

const router = Router();

router.get('/info', (req, res) => {
  res.json({ version: '1.0', status: 'ok' });
});

export default router;