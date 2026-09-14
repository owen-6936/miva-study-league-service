import User, { type IUser } from '../schemas/users.js';
import { generateVerificationCode, hashPassword, sanitizeUser, verifyPassword } from '../utils.js';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

import type { Request, Response, NextFunction } from 'express';
import getVerificationEmailTemplate, { verificationEmailFrom, verificationEmailSubject } from '../services/mail/templates/emailVerification.js';
import { resend } from '../services/mail/resend.js';
import { logActivity } from '../utils/logger.js';

// 1. Define an interface to avoid repetitive casting
interface AuthenticatedRequest extends Request {
  user: InstanceType<typeof User>;
}


// Controller for handling user authentication (registration and login)

/**
 * Registers a new user.
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */

export async function register(req: Request, res: Response, next: NextFunction) {

  try{
  const requiredFields = ['fullName', 'email', 'matricNumber', 'password'];
  const missingFields = requiredFields.filter(field => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({ message: 'All fields are required', missingFields });
  }

  // Destructure after validation so you know they exist
  const { fullName, email, matricNumber, password }: { fullName: string; email: string; matricNumber: string; password: string } = req.body;

  // check if email is a designated Miva email
  if (!email.endsWith('@miva.edu.ng')) {
    return res.status(400).json({ message: 'Email must be a designated Miva email' });
  }

  // find the user by email to check if they already exist
  const user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({ message: 'User already exists, please login instead' });
  }

  // hash the password before saving it to the database
  const hashedPassword = await hashPassword(password);

  // generate a refresh token for the user
  const refreshToken = crypto.randomBytes(40).toString('hex');

  // create a new user instance with the hashed password and refresh token
  const newUser = new User({name: fullName, email, matricNumber, password: hashedPassword, refreshToken, teamTransferTokens: 2});

  // save the new user to the database
  await newUser.save();

  // generate a JWT token for the user
  const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET as string, { expiresIn: '15m' });

  // Sanitize the user object to remove sensitive fields before sending it in the response
  const userResponse = sanitizeUser(newUser);

    // set the refresh token as an HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: true,
      path: '/'
    });

    await logActivity('USER_REGISTERED', `New student ${newUser.name} registered`, { userId: newUser._id });
  return res.status(201).json({ user: userResponse, token, refreshToken, message: 'User registered successfully' });

  }
  catch (error) {
    next(error);
  }
}

/**
 * Logs in an existing user.
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
 export async function login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password }: { email: string; password: string } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // find the user by email to check if they exist
      const user = await User.findOne({ email });
      if (!user || !user.password) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Compare the provided password with the stored hashed password to verify the user's credentials
      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // reissue JWT and refresh tokens for the user
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, { expiresIn: '15m' });
      const refreshToken = crypto.randomBytes(40).toString('hex');
      user.refreshToken = refreshToken;
      await user.save();

    // Sanitize the user object to remove sensitive fields before sending it in the response
    const userResponse = sanitizeUser(user);

    // set the refresh token as an HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: true,
    });

      return res.status(200).json({ user: userResponse, token, refreshToken, message: 'Login successful' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logs out the currently authenticated user by invalidating their refresh token.
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    // 2. Cast once at the beginning
    const authReq = req as AuthenticatedRequest;

    // 3. Simple truthy check (removed !!)
    if (authReq.user) {
      
      // Invalidate the user's refresh token in the database
      await User.updateOne(
        { _id: authReq.user._id },
        { $unset: { refreshToken: 1 } }
      );

      // 4. Clear cookie with identical security flags
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        path: '/' 
      });

      return res.status(200).json({ message: 'Logout successful' });
    }

    return res.status(401).json({ message: 'Unauthorized access' });
  } catch (error) {
    next(error);
  }
}



/**
 * Refreshes the authentication tokens for a user based on the provided refresh token.
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken: string = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Unauthorized access' });
    }

    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, { expiresIn: '15m' });
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    user.refreshToken = newRefreshToken;
    await user.save();

    const userResponse = sanitizeUser(user);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: true,
      path: '/'
    });

    return res.status(200).json({ user: userResponse, token, refreshToken: newRefreshToken, message: 'Your Authentication has been refreshed successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Requests a new email verification code for the authenticated user.
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function requestEmailVerificationCode(req: Request, res: Response, next: NextFunction) {
  try {

    const user = (req as Request & { user: typeof User & IUser }).user;

    const verificationCode = generateVerificationCode();
    const verificationToken = jwt.sign({ code: verificationCode }, process.env.JWT_SECRET as string, { expiresIn: '15m' });

    try{
      const { data, error } = await resend.emails.send({
        from: verificationEmailFrom,
        to: user.email,
        subject: verificationEmailSubject,
        html: getVerificationEmailTemplate(user.name as string, verificationCode)
      });

      if (error || !data) {
        throw new Error('Failed to send verification email');
      }

      await User.updateOne(
      { _id: user._id },
      { verificationToken }
    );
    
    return res.status(200).json({ message: 'Verification code sent successfully' });

    } catch(err){
      console.error('Failed to send verification email:', err);
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as Request & { user: typeof User & IUser }).user;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Verification code is required' });
    }

    if (!user.verificationToken) {
      return res.status(400).json({ message: 'No verification token found' });
    }

    try {
      const decoded = jwt.verify(user.verificationToken, process.env.JWT_SECRET as string) as { code: string };
      if (decoded.code !== code) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }
    } catch (_err) {
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    await User.updateMany(
      { _id: user._id },
      { verified: true, verificationToken: null }
    );

    await logActivity('ADMIN_ACTION', `${user.name} has verified their email`, { userId: user._id, teamId: user.teamId || undefined });
    return res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
}