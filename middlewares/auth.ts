import {type Request, type Response, type NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import User from '../schemas/users.js';
import type { IUser } from '../schemas/users.js';

/**
 * Authenticates a user based on the provided JWT token.
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    (req as Request & { user?: typeof user }).user = user;

    next();
    } catch (_error) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }
    
  } catch (error) {
    next(error);
  }

}

/**
 * Middleware to require that the authenticated user has a verified email.
 * Assumes 'authenticate' middleware has already run.
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function requireVerified(req: Request, res: Response, next: NextFunction) {
  // We assume 'authenticate' has already run, so req.user exists
  const user = (req as Request & { user?: IUser }).user;

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized access' });
  }

  if (user.verified === false) {
    if(user.role !== "admin") return res.status(403).json({ 
      message: 'Email verification required and even if verified your access is restricted',
      code: 'EMAIL_NOT_VERIFIED' 
    });
    return res.status(403).json({ 
      message: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED' 
    });
  }

  next();
}


export async function adminPrivilege(req: Request, res: Response, next: NextFunction) {
    try {
        if (!(req as Request & { user?: unknown }).user) {
            return res.status(401).json({ message: 'Unauthorized access' });
        }

        const user = (req as Request & { user: InstanceType<typeof User> }).user;
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: insufficient privileges' });
        }

        next();
    } catch (error) {
        next(error);
    }
}