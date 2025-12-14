
export enum UserRole {
  ADMIN = 'ADMIN',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  TEAM_LEAD = 'TEAM_LEAD',
  DEVELOPER = 'DEVELOPER',
  TESTER = 'TESTER'
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export type DocumentType = 'USER_MANUAL' | 'REQUIREMENT_DOC' | 'MOU' | 'ISSUE_TRACKER' | 'TEST_CASES';

export interface ProjectDocument {
  id: string;
  name: string;
  type: DocumentType;
  uploadDate: string;
  size: number;
  mimeType: string;
  url?: string; // Temporary URL for the session
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  avatar?: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'PLANNING';
  startDate: string;
  endDate: string;
  managerId: string;
  teamIds: string[];
  documents: ProjectDocument[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeIds: string[]; // Changed to array support multiple people
  reporterId: string;
  dueDate?: string;
  documents: ProjectDocument[]; // Added task specific documents
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
}
