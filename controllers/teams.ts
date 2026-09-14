import Team from "../schemas/teams.js";
import User from '../schemas/users.js';
import { sanitizeTeam } from '../utils.js';
import type { Request, Response } from 'express';
import type { IUser } from '../schemas/users.js';
import type { QueryFilter } from 'mongoose';
import type { ITeam } from '../schemas/teams.js';
import { teamSeedData } from '../seed/seed_team_data.js';
import { logActivity } from "../utils/logger.js";

/**
 * Controller function for seeding initial team data.
 */
export async function seedTeams(req: Request, res: Response) {
    try {
        const seededTeams = await Team.insertMany(teamSeedData);
        return res.status(201).json(seededTeams);
    } catch (error) {
        console.error('Error seeding teams:', error);
        return res.status(500).json({ message: 'Error seeding teams' });
    }
}

/**
 * Controller functions for handling team-related operations.
 */
export async function teams(req: Request, res: Response) {
    try {
        const teams = await Team.find().populate('members', '_id name email role');
        const sanitizedTeams = teams.map(team => sanitizeTeam(team));
        return res.status(200).json({ teams: sanitizedTeams, message: 'Teams retrieved successfully' });
    } catch (_error) {
        return res.status(500).json({ message: 'Error fetching teams' });
    }
}

/**
 * Controller function for fetching a single team by its ID.
 */
export async function getTeam(req: Request, res: Response) {
    try {
        const { teamId } = req.params;
        if (!teamId || typeof teamId !== 'string' || teamId.trim() === '') return res.status(400).json({ message: 'Team ID is required' });

        const team = await Team.findOne({ _id: teamId } as QueryFilter<ITeam>).populate('members', '_id name email role');
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        const sanitizedTeam = sanitizeTeam(team);

        return res.status(200).json({team: sanitizedTeam, message: 'Team fetched successfully'});
    } catch (_error) {
        return res.status(500).json({ message: 'Error fetching team' });
    }
}

/**
 * Controller function for a user to join a team.
 */
export async function joinTeam(req: Request, res: Response) {
    try {
        // Get the authenticated user and the team ID from the request parameters
        const user = (req as Request & { user: typeof User & IUser }).user;
        const { teamId } = req.params;

        if (!teamId || typeof teamId !== 'string' || teamId.trim() === '') return res.status(400).json({ message: 'Team ID is required' });

        // Check if the user is already in a team
        if (user.teamId) return res.status(400).json({ message: 'User is already in a team' });

        const team = await Team.findOne({ _id: teamId } as QueryFilter<ITeam>);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }
        if (team.members.length >= team.maxMembers) {
            return res.status(400).json({ message: 'Team is full' });
        }

        // Add the user to the team's members array
        team.members.push(user._id.toString());

        // Update the user's teamId in the database
        await User.updateMany({ _id: user._id }, { $set: { teamId: teamId, team: team.name } });

        await team.save();

        await logActivity('TEAM_JOINED', `${user.name} joined Team ${team.name}`, { userId: user._id, teamId: team._id });
        return res.status(200).json({ message: `Successfully joined team ${teamId}` });
    } catch (error) {
        console.error('Error joining team:', error);
        return res.status(500).json({ message: 'Error joining team' });
    }
}

/**
 * Controller function for creating a new team.
 */
export async function createTeam(req: Request, res: Response) {
    try {
        const user = (req as Request & { user: typeof User & IUser }).user;
        const { name, maxMembers = 6, color, emoji } = req.body;

        const createTeamReq = [name, maxMembers, color, emoji];

        if (createTeamReq.some(field => !field)) return res.status(400).json({ message: 'All fields are required' });

        const existingTeam = await Team.findOne({ name } as QueryFilter<ITeam>);
        if (existingTeam) return res.status(400).json({ message: 'Team with this name already exists' });

        const newTeam = new Team({
            name,
            id: name.toLowerCase(),
            maxMembers,
            members: [user._id.toString()],
            color,
            emoji,
            point: 0
        });

        await newTeam.save();

        return res.status(201).json({ message: `Team ${name} ${emoji} created successfully`, team: sanitizeTeam(newTeam) });
    } catch (error) {
        console.error('Error creating team:', error);
        return res.status(500).json({ message: 'Error creating team' });
    }
}

/**
 * Controller function for editing an existing team.
 */
export async function editTeam(req: Request, res: Response) {
    try {
        const { teamId } = req.params;
        const { name, maxMembers, color, emoji } = req.body;

        if (!teamId || typeof teamId !== 'string' || teamId.trim() === '') return res.status(400).json({ message: 'Team ID is required' });

        const team = await Team.findOne({ _id: teamId } as QueryFilter<ITeam>);
        if (!team) return res.status(404).json({ message: 'Team not found' });

        if (name) { 
            await Team.updateMany({ _id: teamId }, { $set: { name, id: name.toLowerCase() } });
        };
        if (maxMembers) await Team.updateOne({ _id: teamId }, { $set: { maxMembers } });
        if (color) await Team.updateOne({ _id: teamId }, { $set: { color } });
        if (emoji) await Team.updateOne({ _id: teamId }, { $set: { emoji } });

        return res.status(200).json({ message: `Team ${teamId} updated successfully`, team: sanitizeTeam(team) });
    } catch (error) {
        console.error('Error editing team:', error);
        return res.status(500).json({ message: 'Error editing team' });
    }
}

/**
 * Controller function for deleting an existing team.
 */
export async function deleteTeam(req: Request, res: Response) {
    try {
        const { teamId } = req.params;

        if (!teamId || typeof teamId !== 'string' || teamId.trim() === '') return res.status(400).json({ message: 'Team ID is required' });

        const team = await Team.findOne({ _id: teamId } as QueryFilter<ITeam>);
        if (!team) return res.status(404).json({ message: 'Team not found' });

        await Team.deleteOne({ _id: teamId });

        return res.status(200).json({ message: `Team ${teamId} deleted successfully` });
    } catch (error) {
        console.error('Error deleting team:', error);
        return res.status(500).json({ message: 'Error deleting team' });
    }
}