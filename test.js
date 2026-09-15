import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from './dist/schemas/teams.js';
import User from './dist/schemas/users.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const teams = await Team.find().populate('members', '_id name email role isCaptain');
        for (const team of teams) {
            if (team.captainId && team.captainId !== '') {
                await team.populate('captainId', '_id name email role isCaptain');
            } else {
                team.captainId = null;
            }
        }
        console.log('Teams success');
    } catch(e) {
        console.error('Teams error:', e);
    }
    
    try {
        const lbTeams = await Team.find().sort({ points: -1 });
        console.log('LB Teams success');
    } catch(e) {
        console.error('LB error:', e);
    }
    
    process.exit(0);
}
run();
