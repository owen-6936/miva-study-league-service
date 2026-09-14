import Mission from '../schemas/missions.js';
import { sanitizeMission } from '../utils.js';
import { logActivity } from '../utils/logger.js';
import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { getUserPastMissions, getUserCompletedMissions } from '../utils.js';
import type { IUser } from '../schemas/users.js';
import User from '../schemas/users.js';

/**
 * Controller function for fetching a mission by ID.
 */
export async function getMissionById(req: Request, res: Response) {
    try {
        const { id }: { id?: string | Types.ObjectId } = req.params;
        if (!id) return res.status(400).json({ message: 'Mission ID is required' });
        
        const mission = await Mission.findById(id);
        if (!mission) {
            return res.status(404).json({ message: 'Mission not found' });
        }

        // 1. Get the current logged in user
        const userId = (req as Request & { user?: { _id: Types.ObjectId } }).user?._id;
        let userProgress = null;

        // 2. Look up their progress for this specific mission
        if (userId) {
            const user = await User.findById(userId);
            if (user && user.userMissions) {
                const um = user.userMissions.find(m => m.missionId.toString() === id.toString());
                
                if (um) {
                    userProgress = {
                        completed: um.completed,
                        completedAt: um.completedAt,
                        taskSubmissions: um.taskSubmissions.map(t => ({
                            taskId: t.taskId,
                            status: t.status || (t.graded ? 'approved' : 'pending'),
                            ...(t.hint ? { hint: t.hint } : {})
                        }))
                    };
                }
            }
        }

        return res.status(200).json({ 
            mission: sanitizeMission(mission), 
            userProgress, // Sends down the student's progress perfectly!
            message: 'Mission fetched successfully' 
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching mission', error });
    }
}

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

        await logActivity('MISSION_PUBLISHED', `New mission published: "${newMission.title}"`, { missionId: newMission._id });
        return res.status(201).json({ message: 'Mission created successfully', mission: sanitizeMission(newMission) });
    } catch (error) {
        console.error('Error creating mission:', error);
        return res.status(500).json({ message: 'Error creating mission', error });
    }
}

export async function updateMission(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedMission = await Mission.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedMission) {
            return res.status(404).json({ message: 'Mission not found' });
        }

        logActivity('MISSION_UPDATED', `Mission updated: "${updatedMission.title}"`, { missionId: updatedMission._id });
        return res.status(200).json({ message: 'Mission updated successfully', mission: sanitizeMission(updatedMission) });
    } catch (error) {
        return res.status(500).json({ message: 'Error updating mission', error });
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
 * Retrieves missions that the authenticated user participated in but whose global deadlines have passed,
 * along with missions they have fully completed. This is used for populating the user's mission history dashboard.
 * 
 * @param req - Express Request object containing the authenticated user.
 * @param res - Express Response object.
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

/**
 * Retrieves all currently active missions (where the deadline is in the future).
 * This endpoint provides the list of available missions for users to participate in.
 * 
 * @param req - Express Request object.
 * @param res - Express Response object.
 */
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

        // 4. Prevent duplicate submissions unless the previous one was rejected
        const existingSubmissionIndex = userMission.taskSubmissions.findIndex(sub => sub.taskId === taskId);
        if (existingSubmissionIndex !== -1) {
            const existingSubmission = userMission.taskSubmissions[existingSubmissionIndex];
            if (existingSubmission?.status === 'rejected') {
                // Allow resubmission: remove the old rejected submission
                userMission.taskSubmissions.splice(existingSubmissionIndex, 1);
            } else {
                return res.status(400).json({ message: 'You have already submitted this task.' });
            }
        }

        let pointsEarned = 0;
        let graded = false;

        // 5. Grade the Task!
        if (task.type === 'QUIZ') {
            graded = true; 
            let parsedAnswers: Record<string, string> = {};
            
            try { 
                parsedAnswers = typeof answer === 'string' ? JSON.parse(answer) : answer; 
            } catch (_e) { 
                console.warn('Failed to parse quiz answers:', answer);
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
            status: graded ? 'approved' : 'pending',
            pointsEarned
        });
        
        // Log individual task submission
        logActivity('TASK_SUBMITTED', `${user.name} submitted task: ${task.title} for mission: ${mission.title}`, { userId: user._id, missionId: mission._id, teamId: user.teamId || undefined });

        // 7. Check if this submission completes the entire mission
        let newlyCompleted = false;
        let bonusPoints = 0;
        
        if (!userMission.completed) {
            const requiredTasks = mission.tasks.filter(t => t.isRequired);
            
            const hasCompletedAll = requiredTasks.every(rt => 
                userMission!.taskSubmissions.some(sub => sub.taskId === rt.id && sub.status !== 'rejected')
            );

            if (hasCompletedAll) {
                userMission.completed = true;
                userMission.completedAt = new Date();
                newlyCompleted = true;
                
                bonusPoints += mission.basePoints;
                logActivity('MISSION_COMPLETED', `${user.name} completed mission: ${mission.title} and earned bonus points! Total bonus: ${bonusPoints}`, { userId: user._id, missionId: mission._id, teamId: user.teamId || undefined });

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

// ==========================================
// 1. GET /missions/submissions
// ==========================================
export const getSubmissionsQueue = async (req: Request, res: Response) => {
    try {
        // Find users who have at least one un-graded task inside their userMissions
        const users = await User.find({
            'userMissions.taskSubmissions.graded': false
        }).populate('userMissions.missionId'); 

        const submissionsQueue: Array<{
            id: string; // The composite string ID
            userId: {
                id: Types.ObjectId;
                fullName: string | undefined;
                teamId: string | null;
            };
            missionId: unknown; // Using 'any' here handles Mongoose populated documents safely
            status: string;
            taskSubmissions: Array<{
                taskId: string;
                content: string;
                score: number;
                status: string;
                hint?: string;
            }>;
            createdAt: Date | undefined;
        }> = [];

        users.forEach(user => {
            user.userMissions?.forEach(um => {
                const hasPendingTasks = um.taskSubmissions.some(t => !t.graded);
                
                if (hasPendingTasks && um.missionId) {
                    
                    // Safely extract the mission ID string whether it's populated or not
                    const missionObjectId = (um.missionId as unknown as { _id: string })._id || um.missionId;
                    
                    submissionsQueue.push({
                        id: `${user._id}_${missionObjectId}`, 
                        userId: { 
                            id: user._id, 
                            fullName: user.name, 
                            teamId: user.teamId ? user.teamId.toString() : null 
                        },
                        missionId: um.missionId, 
                        status: 'pending_review',
                        taskSubmissions: um.taskSubmissions
                            .filter(t => !t.graded || t.status === 'pending')
                            .map(t => ({
                                taskId: t.taskId,
                                content: t.answer,             
                                score: t.pointsEarned,         
                                status: t.status || (t.graded ? 'approved' : 'pending'),
                                ...(t.hint ? { hint: t.hint } : {})
                            })),
                        createdAt: user.createdAt
                    });
                }
            });
        });

        return res.status(200).json({ 
            submissions: submissionsQueue, 
            message: 'Submissions fetched successfully' 
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching review queue', error });
    }
};


// ==========================================
// 2. POST /missions/submissions/:id/grade/:taskId
// ==========================================
export const gradeTaskSubmission = async (req: Request, res: Response) => {
    try {
        const { id: rawId, taskId: rawTaskId } = req.params;
        const { approved, pointsAwarded, hint } = req.body as { approved: boolean; pointsAwarded: number; hint?: string };

        const id = Array.isArray(rawId) ? rawId[0] : rawId;
        const taskId = Array.isArray(rawTaskId) ? rawTaskId[0] : rawTaskId;

        // Split the composite ID back into User ID and Mission ID
        if (!id || !id.includes('_')) {
            return res.status(400).json({ message: 'Invalid submission ID format' });
        }
        if (!taskId) {
            return res.status(400).json({ message: 'Invalid task ID format' });
        }
        const [userId, missionId] = id.split('_');

        if (!userId || !missionId) {
            return res.status(400).json({ message: 'Invalid submission ID format' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const userMission = user.userMissions?.find(m => m.missionId.toString() === missionId);
        if (!userMission) return res.status(404).json({ message: 'Mission progress not found' });
        
        const task = userMission.taskSubmissions.find(t => t.taskId === taskId);
        if (!task) return res.status(404).json({ message: 'Task submission not found' });
        
        if (approved) {
            task.graded = true;
            task.status = 'approved';
            task.pointsEarned = pointsAwarded;
            
            // Add the points to the user's global total!
            user.points = (user.points || 0) + pointsAwarded; 
            logActivity('TASK_GRADED', `An admin approved task submission for ${user.name}`, { userId: user._id, teamId: user.teamId || undefined, missionId: userMission.missionId });
        } else {
            // Rejected! Set status and save the hint so the user can see it
            task.graded = true; // Graded means it's been reviewed
            task.status = 'rejected';
            task.hint = hint || 'Your submission did not meet the requirements. Please try again.';
            task.pointsEarned = 0;
            logActivity('TASK_GRADED', `An admin rejected task submission for ${user.name}`, { userId: user._id, teamId: user.teamId || undefined, missionId: userMission.missionId });
        }

        // Check if ALL tasks in this mission are now graded AND approved
        // We only mark the entire mission as completed if there are no pending/rejected tasks left
        const allTasksApproved = userMission.taskSubmissions.every(t => t.status === 'approved' || (t.graded && t.status !== 'rejected'));
        if (allTasksApproved && userMission.taskSubmissions.length > 0) {
            userMission.completed = true;
            userMission.completedAt = new Date();
            
            // 💰 TRIGGER YOUR LOOT ENGINE HERE! 
            // Base XP, First Blood XP, Team Synergy XP logic goes here
            
            const mission = await Mission.findById(missionId);
            if (mission) {
                user.points = (user.points || 0) + mission.basePoints;
                logActivity('MISSION_COMPLETED', `${user.name} completed mission: ${mission.title} after admin grading!`, { userId: user._id, missionId: mission._id, teamId: user.teamId || undefined });
            }
        }

        await user.save();
        return res.status(200).json({ message: 'Task graded successfully!' });

    } catch (error) {
        return res.status(500).json({ message: 'Error grading task', error });
    }
};;