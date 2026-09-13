export async function health(req: Request, res: Response, next: NextFunction) {
  try {
    return res.status(200).json({ message: 'Service is healthy' });
  } catch (_error) {
    next(_error);
  }
}
import type { Request, Response, NextFunction } from 'express';