import type { SanitizedTeam, SanitizedUser } from '../utils.js';

export interface ILeaderboard {
    teams: SanitizedTeam[];
    topUsers: SanitizedUser[];
}