import { model, Schema, Types } from 'mongoose';

// 1. Sub-interface for Quiz Questions
export interface IQuizQuestion {
    id: string; 
    questionText: string;
    options: string[];
    correctAnswer: string;
}
// 2. Interface for individual tasks/deliverables
export interface IMissionTask {
    id: string; 
    order: number;
    title: string;
    description: string;
    type: 'TEXT_RESPONSE' | 'URL_SUBMISSION' | 'QUIZ';
    points: number;
    isRequired: boolean;
    quizQuestions?: IQuizQuestion[]; // Only populated if type === 'QUIZ'
}
// 3. The main Mission Interface
export interface IMission {
    _id?: Types.ObjectId;
    id?: Types.ObjectId; // After your sanitize function maps it
    title: string;
    courseId: string;
    
    // 📖 The Brief
    storyBrief: string;
    
    // 📚 The Intel
    resources: string[];
    
    // 🎯 The Objectives
    tasks: IMissionTask[];
    
    // 🏆 Loot & Mechanics
    basePoints: number;
    firstBloodBonus: number;
    teamSynergyBonus: number;
    
    // 🕒 Timing
    createdAt?: Date;
    deadline: Date;
    
    // 🚦 Status
    status?: 'active' | 'expired' | 'completed' | 'upcoming' | 'grading';
}

// Sub-schema for individual multiple-choice questions
const QuizQuestionSchema = new Schema({
    id: { type: String, required: true },
    questionText: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true }
});
// 1. Define the sub-schema for the deliverables/tasks
const MissionTaskSchema = new Schema({
    id: { type: String, required: true },
    order: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: { 
        type: String, 
        required: true,
        enum: ['TEXT_RESPONSE', 'URL_SUBMISSION', 'QUIZ'] // <-- Cleaned up!
    },
    points: { type: Number, required: true, default: 0 },
    isRequired: { type: Boolean, default: true },
    quizQuestions: [QuizQuestionSchema]
});
// 2. Define the main Mission Schema
const MissionSchema = new Schema({
    title: { type: String, required: true },
    courseId: { type: String, required: true },
    storyBrief: { type: String, required: true },
    resources: [{ type: String }],
    tasks: [MissionTaskSchema],
    basePoints: { type: Number, required: true, default: 100 },
    firstBloodBonus: { type: Number, required: true, default: 0 },
    teamSynergyBonus: { type: Number, required: true, default: 0 },
    createdAt: { type: Date, default: Date.now },
    deadline: { type: Date, required: true },
    status: { 
        type: String, 
        default: 'active',
        enum: ['active', 'expired', 'completed', 'upcoming', 'grading']
    }
});

const Mission = model<IMission>('Mission', MissionSchema);

export default Mission;