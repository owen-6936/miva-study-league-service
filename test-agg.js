import mongoose from 'mongoose';
import User from './dist/schemas/users.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const missionIds = [new mongoose.Types.ObjectId('6aa7f640b8035b8d44ab26a9')];
    
    const firstBloods = await User.aggregate([
        { $unwind: "$userMissions" },
        { $match: { "userMissions.missionId": { $in: missionIds }, "userMissions.completed": true } },
        { $sort: { "userMissions.completedAt": 1 } },
        { $group: {
            _id: "$userMissions.missionId",
            userId: { $first: "$_id" },
            name: { $first: "$name" },
            teamId: { $first: "$teamId" },
            completedAt: { $first: "$userMissions.completedAt" }
        }},
        { $lookup: {
            from: "teams",
            localField: "teamId",
            foreignField: "_id",
            as: "teamDoc"
        }},
        { $unwind: { path: "$teamDoc", preserveNullAndEmptyArrays: true } }
    ]);

    console.log(JSON.stringify(firstBloods, null, 2));
    process.exit(0);
}
run();
