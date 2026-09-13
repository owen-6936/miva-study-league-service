import { Router } from 'express';
const router: Router = Router();
/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('Hello, world!');
  next();
});

export default router;