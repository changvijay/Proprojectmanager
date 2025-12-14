
import { supabase } from './supabaseClient';
import { User, Project, Task, ProjectDocument } from '../types';

// Helper to map DB snake_case to App camelCase
const mapUser = (u: any): User => ({
  id: u.id,
  username: u.username,
  name: u.name,
  role: u.role,
  email: u.email,
  avatar: u.avatar
});

const mapProject = (p: any): Project => ({
  id: p.id,
  name: p.name,
  description: p.description,
  status: p.status,
  startDate: p.start_date,
  endDate: p.end_date,
  managerId: p.manager_id,
  teamIds: p.team_ids || [],
  documents: p.documents || []
});

const mapTask = (t: any): Task => ({
  id: t.id,
  projectId: t.project_id,
  title: t.title,
  description: t.description,
  status: t.status,
  priority: t.priority,
  assigneeIds: t.assignee_ids || [],
  reporterId: t.reporter_id,
  dueDate: t.due_date,
  documents: t.documents || []
});

export const dbService = {
  // --- USERS ---
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return (data || []).map(mapUser);
  },

  getUserByUsername: async (username: string): Promise<User | undefined> => {
    const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
    if (error) return undefined;
    return mapUser(data);
  },

  getUserById: async (id: string): Promise<User | undefined> => {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) return undefined;
    return mapUser(data);
  },

  // Authenticate user against database
  verifyUser: async (username: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !data) return null;

    // Check password (In a real app, use bcrypt/argon2 hashing)
    if (data.password === password) {
      return mapUser(data);
    }
    
    return null;
  },

  addUser: async (user: User, password?: string): Promise<void> => {
    const { error } = await supabase.from('users').insert({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
      avatar: user.avatar,
      password: password // Insert password into DB
    });
    if (error) throw error;
  },

  updateUser: async (user: User): Promise<void> => {
    const { error } = await supabase.from('users').update({
      name: user.name,
      role: user.role,
      email: user.email,
      avatar: user.avatar
    }).eq('id', user.id);
    if (error) throw error;
  },

  deleteUser: async (id: string): Promise<void> => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  },

  // --- PROJECTS ---
  getProjects: async (): Promise<Project[]> => {
    const { data, error } = await supabase.from('projects').select('*');
    if (error) throw error;
    return (data || []).map(mapProject);
  },

  getProjectById: async (id: string): Promise<Project | undefined> => {
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
    if (error) return undefined;
    return mapProject(data);
  },

  addProject: async (project: Project): Promise<void> => {
    const { error } = await supabase.from('projects').insert({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      start_date: project.startDate,
      end_date: project.endDate,
      manager_id: project.managerId,
      team_ids: project.teamIds,
      documents: project.documents
    });
    if (error) throw error;
  },

  // --- TASKS ---
  getTasks: async (): Promise<Task[]> => {
    const { data, error } = await supabase.from('tasks').select('*');
    if (error) throw error;
    return (data || []).map(mapTask);
  },

  getTasksByProject: async (projectId: string): Promise<Task[]> => {
    const { data, error } = await supabase.from('tasks').select('*').eq('project_id', projectId);
    if (error) throw error;
    return (data || []).map(mapTask);
  },

  addTask: async (task: Task): Promise<void> => {
    const { error } = await supabase.from('tasks').insert({
      id: task.id,
      project_id: task.projectId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee_ids: task.assigneeIds,
      reporter_id: task.reporterId,
      due_date: task.dueDate,
      documents: task.documents
    });
    if (error) throw error;
  },

  updateTask: async (task: Task): Promise<void> => {
    const { error } = await supabase.from('tasks').update({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee_ids: task.assigneeIds,
      due_date: task.dueDate,
      documents: task.documents
    }).eq('id', task.id);
    if (error) throw error;
  },

  deleteTask: async (id: string): Promise<void> => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  },
  
  // --- DOCUMENTS (Generic Helper) ---
  addDocumentToProject: async (projectId: string, doc: ProjectDocument): Promise<void> => {
     const p = await dbService.getProjectById(projectId);
     if(p) {
        const newDocs = [...p.documents, doc];
        const { error } = await supabase.from('projects').update({ documents: newDocs }).eq('id', projectId);
        if(error) throw error;
     }
  },

  removeDocumentFromProject: async (projectId: string, docId: string): Promise<void> => {
      const p = await dbService.getProjectById(projectId);
      if(p) {
         const newDocs = p.documents.filter(d => d.id !== docId);
         const { error } = await supabase.from('projects').update({ documents: newDocs }).eq('id', projectId);
         if(error) throw error;
      }
  }
};
