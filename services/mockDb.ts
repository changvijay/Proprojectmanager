
import { User, Project, Task, UserRole, TaskStatus, TaskPriority, ProjectDocument } from '../types';

// Initial Mock Data
const INITIAL_USERS: User[] = [
  { id: 'u1', username: 'admin', name: 'Alice Admin', role: UserRole.ADMIN, email: 'alice@company.com' },
  { id: 'u2', username: 'pm', name: 'Peter PM', role: UserRole.PROJECT_MANAGER, email: 'peter@company.com' },
  { id: 'u3', username: 'lead', name: 'Larry Lead', role: UserRole.TEAM_LEAD, email: 'larry@company.com' },
  { id: 'u4', username: 'dev', name: 'Dave Dev', role: UserRole.DEVELOPER, email: 'dave@company.com' },
  { id: 'u5', username: 'tester', name: 'Tina Tester', role: UserRole.TESTER, email: 'tina@company.com' },
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Website Redesign',
    description: 'Overhaul the corporate website with a modern look and improved accessibility.',
    status: 'ACTIVE',
    startDate: '2023-10-01',
    endDate: '2024-02-15',
    managerId: 'u2',
    teamIds: ['u3', 'u4', 'u5'],
    documents: []
  },
  {
    id: 'p2',
    name: 'Mobile App V2',
    description: 'Next generation mobile application using React Native.',
    status: 'PLANNING',
    startDate: '2024-01-15',
    endDate: '2024-06-30',
    managerId: 'u2',
    teamIds: ['u3', 'u4'],
    documents: []
  }
];

const INITIAL_TASKS: Task[] = [
  {
    id: 't1', projectId: 'p1', title: 'Setup Project Repo', description: 'Initialize Git repository and CI/CD pipeline.',
    status: TaskStatus.DONE, priority: TaskPriority.HIGH, assigneeIds: ['u3'], reporterId: 'u2', dueDate: '2023-10-05', documents: []
  },
  {
    id: 't2', projectId: 'p1', title: 'Design Home Page', description: 'Create Figma mockups for the new home page.',
    status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, assigneeIds: ['u4', 'u2'], reporterId: 'u2', dueDate: '2023-10-20', documents: []
  },
  {
    id: 't3', projectId: 'p1', title: 'QA Testing Strategy', description: 'Define the test plan for the initial release.',
    status: TaskStatus.TODO, priority: TaskPriority.HIGH, assigneeIds: ['u5', 'u3'], reporterId: 'u3', dueDate: '2023-11-01', documents: []
  }
];

class MockDatabase {
  private get<T>(key: string, initial: T): T {
    const stored = localStorage.getItem(key);
    if (!stored) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(stored);
    
    // Migration check for projects
    if (key === 'projects' && Array.isArray(parsed)) {
      return parsed.map((p: any) => ({ ...p, documents: p.documents || [] })) as unknown as T;
    }

    // Migration check for tasks (assigneeId -> assigneeIds, and adding documents)
    if (key === 'tasks' && Array.isArray(parsed)) {
      return parsed.map((t: any) => ({
        ...t,
        assigneeIds: t.assigneeIds ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []), // Migrate single to array
        documents: t.documents || []
      })) as unknown as T;
    }
    
    return parsed;
  }

  private set<T>(key: string, data: T) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Users
  getUsers(): User[] { return this.get('users', INITIAL_USERS); }
  getUserByUsername(username: string): User | undefined { return this.getUsers().find(u => u.username === username); }
  addUser(user: User): void { const users = this.getUsers(); users.push(user); this.set('users', users); }
  updateUser(user: User): void { const users = this.getUsers().map(u => u.id === user.id ? user : u); this.set('users', users); }
  deleteUser(id: string): void { const users = this.getUsers().filter(u => u.id !== id); this.set('users', users); }

  // Projects
  getProjects(): Project[] { return this.get('projects', INITIAL_PROJECTS); }
  getProjectById(id: string): Project | undefined { return this.getProjects().find(p => p.id === id); }
  
  addProject(project: Project): void { 
    const projects = this.getProjects(); 
    // Ensure docs initialized
    if (!project.documents) project.documents = [];
    projects.push(project); 
    this.set('projects', projects); 
  }
  
  updateProject(project: Project): void {
    const projects = this.getProjects().map(p => p.id === project.id ? project : p);
    this.set('projects', projects);
  }
  
  deleteProject(id: string): void { const projects = this.getProjects().filter(p => p.id !== id); this.set('projects', projects); }

  // Documents
  addDocument(projectId: string, doc: ProjectDocument): void {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
      project.documents.push(doc);
      this.set('projects', projects);
    }
  }

  removeDocument(projectId: string, docId: string): void {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
      project.documents = project.documents.filter(d => d.id !== docId);
      this.set('projects', projects);
    }
  }

  // Tasks
  getTasks(): Task[] { return this.get('tasks', INITIAL_TASKS); }
  getTasksByProject(projectId: string): Task[] { return this.getTasks().filter(t => t.projectId === projectId); }
  addTask(task: Task): void { 
    const tasks = this.getTasks(); 
    // Ensure arrays initialized
    if (!task.assigneeIds) task.assigneeIds = [];
    if (!task.documents) task.documents = [];
    tasks.push(task); 
    this.set('tasks', tasks); 
  }
  updateTask(task: Task): void {
    const tasks = this.getTasks().map(t => t.id === task.id ? task : t);
    this.set('tasks', tasks);
  }
  deleteTask(id: string): void { const tasks = this.getTasks().filter(t => t.id !== id); this.set('tasks', tasks); }
}

export const mockDb = new MockDatabase();
