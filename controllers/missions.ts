import Mission from '../schemas/missions.js';
import { sanitizeMission } from '../utils.js';
import { logActivity } from '../utils/logger.js';
import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { getUserPastMissions, getUserCompletedMissions } from '../utils.js';
import type { IUser } from '../schemas/users.js';
import User from '../schemas/users.js';

/**
 * Controller function for fetching all missions.
 */
export async function getMissions(req: Request, res: Response) {
    try {
        const missions = await Mission.find().sort({ createdAt: -1 });
        res.status(200).json({missions: sanitizeMission(missions), message: 'Missions fetched successfully'});
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch missions', error });
    }
}

/**
 * Controller function for creating a new mission.
 */
export async function createMission(req: Request, res: Response) {
    try {
        const { title, courseId, storyBrief, resources, tasks, basePoints, firstBloodBonus, teamSynergyBonus, createdAt, deadline, status } = req.body;

        const missionData = { title, courseId, storyBrief, resources, tasks, basePoints, firstBloodBonus, teamSynergyBonus, createdAt, deadline, status };

        // Validate that all required fields are present
        const missionDataReq = Object.fromEntries(Object.entries(missionData).filter(([_, v]) => v != null));
        if (Object.values(missionDataReq).some(value => value === undefined || value === null)) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newMission = new Mission(missionData);

        await newMission.save();

        await logActivity('MISSION_PUBLISHED', `New mission published: "${newMission.title}"`);
        return res.status(201).json({ message: 'Mission created successfully', mission: sanitizeMission(newMission) });
    } catch (error) {
        console.error('Error creating mission:', error);
        return res.status(500).json({ message: 'Error creating mission', error });
    }
}

/**
 * Controller function for deleting a mission by ID.
 */
export async function deleteMission(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const deletedMission = await Mission.findByIdAndDelete(id);
        if (!deletedMission) {
            return res.status(404).json({ message: 'Mission not found' });
        }
        return res.status(200).json({ message: 'Mission deleted successfully', mission: sanitizeMission(deletedMission) });
    } catch (error) {
        return res.status(500).json({ message: 'Error deleting mission', error });
    }
}

/**
 * Controller function for fetching a user's past and completed missions.
 */
export async function pastMissions(req: Request, res: Response) {
    const user = (req as Request & { user: typeof User & IUser }).user; 
    try {
        const missions = await Mission.find();
        const pastMissions = getUserPastMissions(user, missions);
        const completedMissions = getUserCompletedMissions(user, missions);
        const sanitizedPastMissions = sanitizeMission(pastMissions.filter((mission): mission is NonNullable<typeof mission> => mission !== null));
        const sanitizedCompletedMissions = sanitizeMission(completedMissions.filter((mission): mission is NonNullable<typeof mission> => mission !== null));

        res.status(200).json({pastMissions: sanitizedPastMissions, completedMissions: sanitizedCompletedMissions, message: 'Past & Completed missions fetched successfully'});
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch past missions', error });
    }
}

export async function currentMissions(req: Request, res: Response) {
    try {
        const now = new Date();
        const missions = await Mission.find({ deadline: { $gte: now } }).sort({ createdAt: -1 });
        res.status(200).json({missions: sanitizeMission(missions), message: 'Current missions fetched successfully'});
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch current missions', error });
    }
}


/**
 * Controller function for submitting a task for a mission.
 */
export const submitTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { missionId, taskId } = req.params;
        const { answer } = req.body; 
        
        // Strict cast to your extended Express Request
        const userId = (req as Request & { user: { _id: Types.ObjectId } }).user._id;

        // 1. Fetch User and Mission
        const mission = await Mission.findById(missionId);
        const user = await User.findById(userId);
        if (!mission || !user) return res.status(404).json({ message: 'Not found' });

        // 2. Validate Deadline
        if (new Date() > new Date(mission.deadline)) {
            return res.status(400).json({ message: 'The deadline for this mission has passed.' });
        }

        const task = mission.tasks.find(t => t.id === taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        // 3. Find or initialize the user's mission progress
        let userMission = user.userMissions?.find(um => um.missionId.toString() === missionId);
        
        if (!userMission) {
            if (!user.userMissions) user.userMissions = [];
            user.userMissions.push({ 
                missionId: mission._id as Types.ObjectId,
                taskSubmissions: [], 
                completed: false
            });
            // The `!` tells TypeScript: "Trust me, I just pushed this, it's not undefined"
            userMission = user.userMissions[user.userMissions.length - 1]!;
        }

        // 4. Prevent duplicate submissions (No ?. needed anymore!)
        if (userMission.taskSubmissions.some(sub => sub.taskId === taskId)) {
            return res.status(400).json({ message: 'You have already submitted this task.' });
        }

        let pointsEarned = 0;
        let graded = false;

        // 5. Grade the Task!
        if (task.type === 'QUIZ') {
            graded = true; 
            let parsedAnswers: Record<string, string> = {};
            
            try { 
                parsedAnswers = JSON.parse(answer); 
            } catch (e) { 
                // Ignore parse errors, will result in 0 points
            }

            let correctCount = 0;
            const quizQuestions = task.quizQuestions || []; // Strict fallback
            
            quizQuestions.forEach(q => {
                if (parsedAnswers[q.id] === q.correctAnswer) correctCount++;
            });
            
            if (quizQuestions.length > 0) {
                pointsEarned = Math.floor((correctCount / quizQuestions.length) * task.points);
            }
        } else {
            graded = false;
            pointsEarned = 0; 
        }

        // 6. Record the submission
        userMission.taskSubmissions.push({
            taskId: taskId as string,
            answer,
            graded,
            pointsEarned
        });

        // 7. Check if this submission completes the entire mission
        let newlyCompleted = false;
        let bonusPoints = 0;
        
        if (!userMission.completed) {
            const requiredTasks = mission.tasks.filter(t => t.isRequired);
            
            const hasCompletedAll = requiredTasks.every(rt => 
                userMission!.taskSubmissions.some(sub => sub.taskId === rt.id)
            );

            if (hasCompletedAll) {
                userMission.completed = true;
                userMission.completedAt = new Date();
                newlyCompleted = true;
                
                bonusPoints += mission.basePoints;

                const completorsCount = await User.countDocuments({
                    'userMissions': { 
                        $elemMatch: { missionId: mission._id, completed: true } 
                    }
                });

                if (completorsCount < 3) {
                    bonusPoints += mission.firstBloodBonus;
                }
            }
        }

        // 8. Update User's global points and Save
        const totalPointsAwarded = pointsEarned + bonusPoints;
        user.points = (user.points || 0) + totalPointsAwarded;
        
        user.markModified('userMissions'); 
        await user.save();

        return res.status(200).json({
            message: 'Task submitted successfully!',
            taskPoints: pointsEarned,
            bonusPoints,
            missionCompleted: newlyCompleted,
            totalXP: totalPointsAwarded
        });

    } catch (error) {
        next(error);
    }
};