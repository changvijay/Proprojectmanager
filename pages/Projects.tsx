
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { geminiService } from '../services/geminiService';
import { Project, UserRole, TaskStatus, TaskPriority } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Plus, Calendar, Users, Sparkles, X, Loader2 } from 'lucide-react';

export const Projects: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectStart, setNewProjectStart] = useState('');
  const [newProjectEnd, setNewProjectEnd] = useState('');

  const loadProjects = async () => {
    try {
      const data = await dbService.getProjects();
      setProjects(data);
    } catch (e) {
      console.error(e);
      addNotification("Failed to load projects", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newProject: Project = {
      id: crypto.randomUUID(), // Use standard UUIDs
      name: newProjectName,
      description: newProjectDesc,
      status: 'PLANNING',
      startDate: newProjectStart,
      endDate: newProjectEnd,
      managerId: user.id,
      teamIds: [],
      documents: []
    };

    try {
      await dbService.addProject(newProject);
      await loadProjects();
      setIsModalOpen(false);
      resetForm();
      addNotification("Project created successfully", "success");
    } catch (e) {
      console.error("Failed to create project", e);
      addNotification("Error creating project", "error");
    }
  };

  const handleAiGenerate = async () => {
    if (!newProjectName || !newProjectDesc) return;
    setIsGenerating(true);
    addNotification("AI is generating your project plan...", "info", 3000);
    
    try {
      const result = await geminiService.generateProjectPlan(newProjectName, newProjectDesc);
      
      if (!user) return;
      
      const projectId = crypto.randomUUID();
      const newProject: Project = {
        id: projectId,
        name: newProjectName,
        description: newProjectDesc, 
        status: 'PLANNING',
        startDate: newProjectStart || new Date().toISOString().split('T')[0],
        endDate: newProjectEnd || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
        managerId: user.id,
        teamIds: [],
        documents: []
      };

      await dbService.addProject(newProject);

      // Add generated tasks
      if (result && result.tasks) {
        const taskPromises = result.tasks.map((t: any) => {
          return dbService.addTask({
            id: crypto.randomUUID(),
            projectId: projectId,
            title: t.title,
            description: t.description,
            status: TaskStatus.TODO,
            priority: t.priority === 'HIGH' ? TaskPriority.HIGH : TaskPriority.MEDIUM,
            reporterId: user.id,
            assigneeIds: [],
            documents: []
          });
        });
        await Promise.all(taskPromises);
      }

      await loadProjects();
      setIsModalOpen(false);
      resetForm();
      addNotification("Project created with AI-generated tasks!", "success");

    } catch (e) {
      console.error(e);
      addNotification("AI Generation failed, try manually.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectStart('');
    setNewProjectEnd('');
  };

  const canCreate = user?.role === UserRole.ADMIN || user?.role === UserRole.PROJECT_MANAGER;

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
           <p className="text-gray-500">Manage your ongoing initiatives.</p>
        </div>
        {canCreate && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <p className="col-span-3 text-center py-10 text-gray-500">No projects found. Create one to get started.</p>
        ) : projects.map(project => (
          <Link to={`/projects/${project.id}`} key={project.id} className="block group">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 h-full flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{project.name}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  project.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {project.status}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">{project.description}</p>
              
              <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{project.teamIds?.length || 0} members</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Create New Project</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g. Mobile App Redesign"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Describe the goals and scope..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={newProjectStart}
                    onChange={(e) => setNewProjectStart(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={newProjectEnd}
                    onChange={(e) => setNewProjectEnd(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={handleCreateProject}
                disabled={isGenerating}
                className="inline-flex justify-center rounded-md border border-transparent bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border-gray-300 shadow-sm"
              >
                Create Manually
              </button>
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={isGenerating || !newProjectName || !newProjectDesc}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-purple-700 hover:to-blue-700 shadow-sm disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Generate Plan with AI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
