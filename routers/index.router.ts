import { Router, type Request, type Response, type NextFunction } from 'express';
import { health } from '../controllers/health.js';
const router: Router = Router();

/* GET home page. */
router.get('/', function(req:Request, res: Response, next: NextFunction) {
  res.send('Hello from Miva Study League Service');
  next();
});

/* GET health check. */
router.get('/health', health);

export default router;