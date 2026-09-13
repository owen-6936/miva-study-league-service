import express, { type Router } from 'express';
import { login, register, refresh, logout, verifyEmail, requestEmailVerificationCode } from '../controllers/auth.js';
import { authenticate } from '../middlewares/auth.js';

const authRouter: Router = express.Router();

authRouter.post('/login', login);

authRouter.post('/logout', authenticate, logout);

authRouter.post('/register', register);

authRouter.post('/authenticate', authenticate);

authRouter.post('/refresh', refresh);

authRouter.post('/request-email-verification-code', authenticate, requestEmailVerificationCode);

authRouter.post('/verify-email', authenticate, verifyEmail);

export default authRouter;