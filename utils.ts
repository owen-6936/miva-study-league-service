import dns from 'node:dns';
import bcrypt from 'bcryptjs';
import type { Types } from 'mongoose';
import crypto from 'node:crypto';
import User, { type IUser } from './schemas/users.js';
import Team from './schemas/teams.js';
import type Mission from './schemas/missions.js';
import type { IMission } from './schemas/missions.js';
import type { ISeason } from './schemas/seasons.js';
import Season from './schemas/seasons.js';
import type { ITimetableEntry } from './schemas/timetable.js';
import type TimetableEntry from './schemas/timetable.js';

/**
 * Sets the DNS servers to the specified provider.
 * @param dnsProvider - The DNS provider to set (Google, Cloudflare, OpenDNS, Quad9)
 */
function setDNS(dnsProvider: 'Google' | 'Cloudflare' | 'OpenDNS' | 'Quad9'){
    enum DNS {
        Google = "8.8.8.8, 8.8.4.4",
        Cloudflare = "1.1.1.1, 1.0.0.1",
        OpenDNS = "208.67.222.222, 208.67.220.220",
        Quad9 = "9.9.9.9, 149.112.112.112",
    }
    const currentIpServers = dns.getServers();
    console.log('Current DNS servers:', currentIpServers);
    if (DNS[dnsProvider] === currentIpServers.join(', ')) {
        console.log('DNS servers are already set to the desired provider.');
        return;
    }
    const ips =DNS[dnsProvider].split(',').map(ip => ip.trim());
    console.log('Setting DNS servers to:', ips);
    return dns.setServers(ips);
}

/**
 * Hashes a plain text password using bcrypt.
 * @param password - Plain text password
 * @param saltRounds - Number of salt rounds (default is 10)
 * @returns A promise that resolves to the hashed password
 */
async function hashPassword(password: string, saltRounds: number = 10): Promise<string> {
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(password, salt);
}

/**
 * Verifies if the provided password matches the hashed password.
 * @param password - Plain text password
 * @param hashedPassword - Hashed password
 * @returns A promise that resolves to true if the passwords match, false otherwise
 */
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
}

/**
 * Generates a secure, random 6-digit string
 */
function generateVerificationCode() {
  // randomInt takes (min, max). The max is exclusive.
  // This guarantees a random number between 100000 and 999999.
  const code = crypto.randomInt(100000, 1000000);
  
  return code.toString();
}

export interface SanitizedUser extends  Pick<InstanceType<typeof User>, 'name' | 'email' | 'verified' | 'role' | 'matricNumber' | 'team' | 'teamId' | 'createdAt'> {
    id: Types.ObjectId;
}
/**
 * Strips sensitive fields (like passwords and refresh tokens) from a User document 
 * before returning it to the client. Safely handles both single objects and arrays.
 * 
 * @param user - The raw Mongoose User document(s)
 * @returns A safe, sanitized user object with an `id` field mapped from `_id`
 */
function sanitizeUser(user: InstanceType<typeof User> | InstanceType<typeof User>[]): SanitizedUser | SanitizedUser[] {
    if (Array.isArray(user)) {
        return user.map(u => sanitizeUser(u)) as SanitizedUser[];
    }

    const { _id, __v, refreshToken, password, ...safeUser } = user.toObject();
    
    return {
        ...safeUser,
        id: _id
    };
}

export interface SanitizedTeam extends Pick<InstanceType<typeof Team>, 'name' | 'captainId' | 'color' | 'emoji' | 'point' | 'members' | 'maxMembers'> {
    id: Types.ObjectId;
}

/**
 * Standardizes the Team document for API responses by removing internal Mongoose fields 
 * (`__v`, `_id`) and mapping `_id` to a string-friendly `id`.
 */
function sanitizeTeam(team: InstanceType<typeof Team> | InstanceType<typeof Team>[]): SanitizedTeam | SanitizedTeam[] {
    if (Array.isArray(team)) {
        return team.map(t => sanitizeTeam(t)) as SanitizedTeam[];
    }

    const { _id, __v, ...safeTeam } = team.toObject();
    
    return {
        ...safeTeam,
        id: _id
    };
}

/**
 * Standardizes the Mission document for API responses, removing internal fields.
 */
function sanitizeMission(mission: IMission | IMission[]): IMission | IMission[] {
    if (Array.isArray(mission)) {
        return mission.map(m => sanitizeMission(m)) as IMission[];
    }

    const { _id, __v, ...safeMission } = (mission as InstanceType<typeof Mission>).toObject();
    
    return {
        ...safeMission,
        id: _id
    };
}

/**
 * Standardizes the Season document for API responses, removing internal fields.
 */
function sanitizeSeason(season: InstanceType<typeof Season> | InstanceType<typeof Season>[]): ISeason | ISeason[] {
    if (Array.isArray(season)) {
        return season.map(s => sanitizeSeason(s)) as ISeason[];
    }

    const { _id, __v, ...safeSeason } = season.toObject();
    
    return {
        ...safeSeason,
        id: _id
    };
}

/**
 * Standardizes the TimetableEntry document for API responses, removing internal fields.
 */
function sanitizeTimetableEntry(entry: InstanceType<typeof TimetableEntry> | InstanceType<typeof TimetableEntry>[]): ITimetableEntry | ITimetableEntry[] {
    if (Array.isArray(entry)) {
        return entry.map(e => sanitizeTimetableEntry(e)) as ITimetableEntry[];
    }

    const { _id, __v, ...safeEntry } = entry.toObject();
    
    return {
        ...safeEntry,
        id: _id
    };
}

/**
 * Merges a user's mission progress (e.g. tasks completed) with the full mission data from the database.
 * Useful for building a comprehensive dashboard view for a user.
 * 
 * @param user - The user document containing their progress array
 * @param pastMissions - The array of all global missions to cross-reference against
 */
function getUserMissions(user: IUser, pastMissions: IMission[]): (IMission & { tasksCompleted: number })[] {
    if (!user.userMissions || user.userMissions.length === 0) return [];

    const userFullMissions: (IMission & { tasksCompleted: number })[] = []
    
   user.userMissions.forEach(mission => {
       const fullMission = pastMissions.find(m => (m._id as unknown as Types.ObjectId).equals(mission.missionId));
       if (fullMission) {
           userFullMissions.push({ ...fullMission, tasksCompleted: mission.tasksCompleted });
       }
   });
   return userFullMissions;
}

/**
 * Retrieves missions that the user participated in, but the global deadline has already passed.
 */
function getUserPastMissions(user: IUser, pastMissions: IMission[]): (IMission & { tasksCompleted: number })[] {
    return getUserMissions(user, pastMissions).filter(mission => mission.deadline < new Date());
}

/**
 * Retrieves missions that the user has fully completed (tasks completed matches total tasks required).
 */
function getUserCompletedMissions(user: IUser, pastMissions: IMission[]): (IMission & { tasksCompleted: number })[] {
    return getUserMissions(user, pastMissions).filter(mission => mission.tasksCompleted === mission.tasksTotal);
}

export { setDNS, hashPassword, verifyPassword, generateVerificationCode, sanitizeUser, sanitizeTeam, sanitizeMission, getUserMissions, getUserPastMissions, getUserCompletedMissions, sanitizeSeason, sanitizeTimetableEntry };