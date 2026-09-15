import express, {type Express} from 'express';
import teamRouter from './routers/teams.router.js';
import adminRouter from './routers/admin.router.js';
import leaderboardRouter from './routers/leaderboard.router.js';
import awardsRouter from './routers/awards.router.js';
import seasonsRouter from './routers/seasons.router.js';
import timetableRouter from './routers/timetable.router.js';
import announcementsRouter from './routers/announcements.router.js';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import connectToDatabase from './services/database/mongodb.js';
dotenv.config();

import indexRouter from './routers/index.router.js';
import usersRouter from './routers/users.router.js';
import authRouter from './routers/auth.router.js';
import missionsRouter from './routers/missions.router.js';
import activitiesRouter from './routers/activities.router.js';

// Create an instance of the Express application
const app: Express = express();

// Set the DNS for the application
// setDNS('Google');

// Connect to the database before starting the server
await connectToDatabase();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://mivastudyleague.com', // Must be exact for cookies to work!
  credentials: true // This tells Express to accept the HttpOnly cookie
}));
app.use(cookieParser());

// Routers for handling different API endpoints
app.use('/api/v1/', indexRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/teams', teamRouter);
app.use('/api/v1/leaderboard', leaderboardRouter);
app.use('/api/v1/awards', awardsRouter);
app.use('/api/v1/missions', missionsRouter);
app.use('/api/v1/activities', activitiesRouter);
app.use('/api/v1/seasons', seasonsRouter);
app.use('/api/v1/timetable', timetableRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/announcements', announcementsRouter);


// Start the server and listen on the specified port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});