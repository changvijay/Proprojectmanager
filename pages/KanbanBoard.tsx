
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { Task, TaskStatus, Project, User, ProjectDocument, DocumentType, TaskPriority, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, ArrowLeft, User as UserIcon, FileText, Upload, 
  Download, Trash2, Layout, FileSpreadsheet, Calendar, X, CheckCircle2, Eye, Lock, ShieldCheck,
  MoreVertical, BarChart3
} from 'lucide-react';

// -- Helper: Multi-Select Assignees --
const AssigneeSelector = ({ users, selectedIds, onChange, disabled }: { users: User[], selectedIds: string[], onChange: (ids: string[]) => void, disabled?: boolean }) => {
  const handleToggle = (id: string) => {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(sid => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className={`border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white shadow-sm ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
       {users.length === 0 && <p className="text-sm text-gray-500 p-3">No users found.</p>}
       {users.map(u => {
         const isSelected = selectedIds.includes(u.id);
         return (
           <div 
             key={u.id} 
             className={`flex items-center p-2 border-b border-gray-50 last:border-0 transition-colors ${!disabled ? 'hover:bg-blue-50 cursor-pointer' : ''} ${isSelected ? 'bg-blue-50' : ''}`} 
             onClick={() => handleToggle(u.id)}
           >
              <div className={`flex items-center justify-center h-5 w-5 rounded border mr-3 ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                 {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
              </div>
              <div className="flex items-center flex-1">
                <div className="h-7 w-7 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center font-bold mr-2 border border-gray-300">
                  {u.name.charAt(0)}
                </div>
                <div className="flex flex-col">
                   <span className={`text-sm ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>{u.name}</span>
                   <span className="text-[10px] text-gray-400 uppercase tracking-wider">{u.role.replace('_', ' ')}</span>
                </div>
              </div>
           </div>
         );
       })}
    </div>
  );
};

// -- Sub-Component: Workload Modal --
interface WorkloadModalProps {
  users: User[];
  tasks: Task[];
  onClose: () => void;
}

const WorkloadModal: React.FC<WorkloadModalProps> = ({ users, tasks, onClose }) => {
  const stats = users.map(u => {
    const userTasks = tasks.filter(t => t.assigneeIds?.includes(u.id));
    const total = userTasks.length;
    
    const todo = userTasks.filter(t => t.status === TaskStatus.TODO).length;
    const inProgress = userTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const review = userTasks.filter(t => t.status === TaskStatus.REVIEW).length;
    const done = userTasks.filter(t => t.status === TaskStatus.DONE).length;

    // Simple overload metric: > 3 tasks in progress
    const isOverloaded = inProgress > 3;

    return { user: u, total, todo, inProgress, review, done, isOverloaded };
  }).filter(s => s.total > 0 || s.user.role === UserRole.DEVELOPER || s.user.role === UserRole.TESTER) // Show active users or devs/testers even if empty
  .sort((a, b) => b.total - a.total);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Team Workload & Capacity</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Legend */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center text-xs text-gray-500 space-x-4">
           <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-gray-300 mr-1"></div> To Do</div>
           <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div> In Progress</div>
           <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div> Review</div>
           <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div> Done</div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
           {stats.length === 0 ? (
             <div className="text-center py-8 text-gray-500">
               <p>No active team members found.</p>
             </div>
           ) : (
             stats.map((stat) => (
               <div key={stat.user.id} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center mr-3 border border-slate-200 relative">
                            {stat.user.name.charAt(0)}
                            {stat.isOverloaded && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white" title="High workload"></div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center">
                                <p className="font-medium text-gray-900 mr-2">{stat.user.name}</p>
                                {stat.isOverloaded && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">Overloaded</span>}
                            </div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.user.role.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                          <span className="text-2xl font-bold text-gray-900">{stat.total}</span>
                          <p className="text-xs text-gray-500 uppercase">Total Tasks</p>
                      </div>
                  </div>
                  
                  {/* Stacked Bar */}
                  <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex mb-2">
                    {stat.todo > 0 && <div style={{ width: `${(stat.todo/stat.total)*100}%` }} className="h-full bg-gray-300" title={`To Do: ${stat.todo}`}></div>}
                    {stat.inProgress > 0 && <div style={{ width: `${(stat.inProgress/stat.total)*100}%` }} className="h-full bg-blue-500" title={`In Progress: ${stat.inProgress}`}></div>}
                    {stat.review > 0 && <div style={{ width: `${(stat.review/stat.total)*100}%` }} className="h-full bg-purple-500" title={`Review: ${stat.review}`}></div>}
                    {stat.done > 0 && <div style={{ width: `${(stat.done/stat.total)*100}%` }} className="h-full bg-green-500" title={`Done: ${stat.done}`}></div>}
                  </div>

                  {/* Detailed Stats */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                     <div className="bg-gray-50 rounded py-1 border border-gray-100">
                        <span className="block font-bold text-gray-700">{stat.todo}</span>
                        <span className="text-gray-400">Todo</span>
                     </div>
                     <div className="bg-blue-50 rounded py-1 border border-blue-100">
                        <span className="block font-bold text-blue-700">{stat.inProgress}</span>
                        <span className="text-blue-400">Active</span>
                     </div>
                     <div className="bg-purple-50 rounded py-1 border border-purple-100">
                        <span className="block font-bold text-purple-700">{stat.review}</span>
                        <span className="text-purple-400">Review</span>
                     </div>
                     <div className="bg-green-50 rounded py-1 border border-green-100">
                        <span className="block font-bold text-green-700">{stat.done}</span>
                        <span className="text-green-400">Done</span>
                     </div>
                  </div>
               </div>
             ))
           )}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              Close Report
            </button>
        </div>
      </div>
    </div>
  );
};

// -- Sub-Component: Create Task Modal --
interface CreateTaskModalProps {
  projectId: string;
  users: User[];
  onClose: () => void;
  onCreated: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ projectId, users, onClose, onCreated }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      projectId,
      title,
      description: desc,
      status: TaskStatus.TODO,
      priority,
      assigneeIds: assigneeIds,
      reporterId: user.id,
      dueDate: dueDate || undefined,
      documents: []
    };

    try {
      await dbService.addTask(newTask);
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to create task");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Add New Task</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Task summary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Detailed requirements"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                {Object.values(TaskPriority).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignees ({assigneeIds.length})</label>
            <AssigneeSelector users={users} selectedIds={assigneeIds} onChange={setAssigneeIds} />
          </div>
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -- Sub-Component: Task Detail/Edit Modal --
interface TaskDetailModalProps {
  task: Task;
  users: User[];
  canEditStatus: boolean;
  canAssign: boolean;
  canEditDetails: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  task, users, canEditStatus, canAssign, canEditDetails, onClose, onUpdate 
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');
  const [editedTask, setEditedTask] = useState<Task>({ ...task });
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);

  const handleChange = (field: keyof Task, value: any) => {
    setEditedTask(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await dbService.updateTask(editedTask);
      onUpdate();
      onClose();
    } catch(e) {
      alert("Failed to save task");
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await dbService.deleteTask(task.id);
      onUpdate();
      onClose();
    }
  };

  // Task Document Logic
  const handleTaskDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: DocumentType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real app, upload to storage bucket here.
    // For now, we use local blob, which wont persist well across refresh for other users, 
    // but demonstrating the logic.
    const url = URL.createObjectURL(file);
    const newDoc: ProjectDocument = {
      id: `tdoc${Date.now()}`,
      name: file.name,
      type: type,
      uploadDate: new Date().toISOString(),
      size: file.size,
      mimeType: file.type,
      url: url
    };

    const updatedDocs = [newDoc, ...(editedTask.documents || [])];
    const taskWithDocs = { ...editedTask, documents: updatedDocs };
    setEditedTask(taskWithDocs);
    
    // Auto-save just for docs? Or wait for main save?
    // Let's auto save for consistency with original.
    await dbService.updateTask(taskWithDocs);
    onUpdate(); // to update parent view data
    e.target.value = '';
  };

  const handleTaskDocDelete = async (docId: string) => {
    if (window.confirm('Remove this document from task?')) {
       const updatedDocs = editedTask.documents.filter(d => d.id !== docId);
       const taskWithDocs = { ...editedTask, documents: updatedDocs };
       setEditedTask(taskWithDocs);
       await dbService.updateTask(taskWithDocs);
       onUpdate();
    }
  };

  const reqDocs = editedTask.documents?.filter(d => d.type === 'REQUIREMENT_DOC') || [];
  const testDocs = editedTask.documents?.filter(d => d.type === 'TEST_CASES') || [];

  const DocumentList = ({ docs, type }: { docs: ProjectDocument[], type: 'req' | 'test' }) => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
       <div className={`px-4 py-2 border-b border-gray-200 flex items-center ${type === 'req' ? 'bg-blue-50' : 'bg-green-50'}`}>
          {type === 'req' ? <FileText className="h-4 w-4 text-blue-600 mr-2" /> : <ShieldCheck className="h-4 w-4 text-green-600 mr-2" />}
          <span className={`text-xs font-bold uppercase ${type === 'req' ? 'text-blue-700' : 'text-green-700'}`}>
            {type === 'req' ? 'Requirements' : 'Test Cases'}
          </span>
       </div>
       {docs.length === 0 ? (
         <div className="p-4 text-center text-gray-400 text-xs italic">No documents attached.</div>
       ) : (
         <ul className="divide-y divide-gray-100">
           {docs.map(doc => (
             <li key={doc.id} className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center overflow-hidden flex-1 mr-2">
                   <div className="truncate">
                     <p 
                       className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600 hover:underline"
                       onClick={() => setPreviewDoc(doc)}
                     >
                       {doc.name}
                     </p>
                     <p className="text-xs text-gray-500">{(doc.size/1024).toFixed(0)}KB • {new Date(doc.uploadDate).toLocaleDateString()}</p>
                   </div>
                </div>
                <div className="flex space-x-1 flex-shrink-0">
                   <button onClick={() => setPreviewDoc(doc)} className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"><Eye className="h-4 w-4" /></button>
                   <button onClick={() => handleTaskDocDelete(doc.id)} className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </div>
             </li>
           ))}
         </ul>
       )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <h3 className="text-xl font-bold text-gray-900">Task Details</h3>
            {!canEditStatus && (
               <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                 <Lock className="w-3 h-3 mr-1" /> Status Locked
               </span>
            )}
            {!canEditDetails && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                <Lock className="w-3 h-3 mr-1" /> Details Locked
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 bg-gray-50/50">
           <button
             onClick={() => setActiveTab('details')}
             className={`py-3 mr-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
           >
             Overview
           </button>
           <button
             onClick={() => setActiveTab('documents')}
             className={`py-3 mr-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'documents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
           >
             Documents ({editedTask.documents?.length || 0})
           </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'details' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Title</label>
                <input
                  type="text"
                  value={editedTask.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  readOnly={!canEditDetails}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 ${!canEditDetails ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={editedTask.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    disabled={!canEditStatus}
                    className={`block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 ${!canEditStatus ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : 'border-gray-300'}`}
                  >
                    {Object.values(TaskStatus).map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                  {!canEditStatus && <p className="text-xs text-red-500 mt-1">Only assignees can change status.</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Priority</label>
                  <select
                    value={editedTask.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    disabled={!canEditDetails}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 ${!canEditDetails ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  >
                    {Object.values(TaskPriority).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Assignees {canAssign ? '' : '(Read Only)'}
                  </label>
                  <AssigneeSelector 
                    users={users} 
                    selectedIds={editedTask.assigneeIds || []} 
                    onChange={(ids) => handleChange('assigneeIds', ids)} 
                    disabled={!canAssign}
                  />
                  {!canAssign && <p className="text-xs text-amber-600 mt-1 flex items-center"><Lock className="h-3 w-3 mr-1"/> Only Project Managers can assign tasks</p>}
                </div>
                <div>
                   <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Due Date</label>
                      <input
                        type="date"
                        value={editedTask.dueDate || ''}
                        onChange={(e) => handleChange('dueDate', e.target.value)}
                        readOnly={!canEditDetails}
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 ${!canEditDetails ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                      <textarea
                        rows={5}
                        value={editedTask.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        readOnly={!canEditDetails}
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 ${!canEditDetails ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                      />
                   </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="border border-dashed border-blue-300 bg-blue-50 rounded-lg p-4 text-center hover:bg-blue-100 transition-colors">
                      <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 mb-2 border border-blue-200">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">Requirements</h4>
                      <p className="text-xs text-gray-500 mb-3">Upload PDF only</p>
                      <label className="cursor-pointer inline-flex items-center px-3 py-1.5 bg-white border border-blue-300 shadow-sm text-xs font-medium rounded text-blue-700 hover:bg-blue-50">
                        <Upload className="h-3 w-3 mr-1" /> Upload
                        <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleTaskDocUpload(e, 'REQUIREMENT_DOC')} />
                      </label>
                  </div>
                  <div className="border border-dashed border-green-300 bg-green-50 rounded-lg p-4 text-center hover:bg-green-100 transition-colors">
                      <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-green-100 mb-2 border border-green-200">
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">Test Cases</h4>
                      <p className="text-xs text-gray-500 mb-3">Upload Excel/CSV only</p>
                      <label className="cursor-pointer inline-flex items-center px-3 py-1.5 bg-white border border-green-300 shadow-sm text-xs font-medium rounded text-green-700 hover:bg-green-50">
                        <Upload className="h-3 w-3 mr-1" /> Upload
                        <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => handleTaskDocUpload(e, 'TEST_CASES')} />
                      </label>
                  </div>
               </div>

               <div className="space-y-4">
                  <DocumentList docs={reqDocs} type="req" />
                  <DocumentList docs={testDocs} type="test" />
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
           <button
             onClick={handleDelete}
             className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none transition-colors"
           >
             <Trash2 className="h-4 w-4 mr-2" />
             Delete
           </button>
           <div className="flex space-x-3">
             <button
               onClick={onClose}
               className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
             >
               Cancel
             </button>
             <button
               onClick={handleSave}
               className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors"
             >
               Save Changes
             </button>
           </div>
        </div>

        {previewDoc && (
          <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
        )}
      </div>
    </div>
  );
};

// -- Sub-Component: Document Preview Modal --
interface DocumentPreviewModalProps {
  doc: ProjectDocument;
  onClose: () => void;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ doc, onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-75 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 truncate max-w-md">{doc.name}</h3>
              <p className="text-xs text-gray-500">Updated: {new Date(doc.uploadDate).toLocaleDateString()} {new Date(doc.uploadDate).toLocaleTimeString()}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 bg-slate-100 flex items-center justify-center p-4 overflow-auto relative">
           {doc.mimeType.startsWith('image/') && doc.url ? (
             <img src={doc.url} alt={doc.name} className="max-w-full max-h-full object-contain shadow-lg" />
           ) : doc.mimeType === 'application/pdf' && doc.url ? (
             <iframe src={doc.url} title={doc.name} className="w-full h-full border-0 shadow-lg rounded-sm" />
           ) : (
             <div className="text-center bg-white p-8 rounded-xl shadow-sm">
               <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                  <Download className="h-6 w-6 text-blue-600" />
               </div>
               <h3 className="text-lg font-medium text-gray-900">Preview not available</h3>
               <p className="text-gray-500 mb-6">This file type cannot be previewed in the browser.</p>
               {doc.url && (
                 <a href={doc.url} download={doc.name} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                   Download File
                 </a>
               )}
             </div>
           )}
        </div>
        <div className="p-3 bg-white border-t border-gray-200 text-xs text-gray-500 flex justify-between">
           <span>Size: {(doc.size / 1024).toFixed(1)} KB</span>
           <span>Full Date: {new Date(doc.uploadDate).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

// -- Sub-Component: Document Upload Section (Project Level) --
interface DocumentsTabProps {
  project: Project;
  onUpdate: () => void;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ project, onUpdate }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<DocumentType | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);

  const getAcceptType = (type: DocumentType) => {
    switch(type) {
      case 'TEST_CASES':
      case 'ISSUE_TRACKER':
        return '.xlsx,.xls,.csv';
      case 'REQUIREMENT_DOC':
        return '.pdf';
      case 'USER_MANUAL':
      case 'MOU':
        return '.pdf';
      default:
        return '*/*';
    }
  };

  const handleUploadClick = (type: DocumentType) => {
    setUploadType(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = getAcceptType(type);
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadType) return;

    const url = URL.createObjectURL(file);

    const newDoc: ProjectDocument = {
      id: `doc${Date.now()}`,
      name: file.name,
      type: uploadType,
      uploadDate: new Date().toISOString(),
      size: file.size,
      mimeType: file.type,
      url: url
    };

    try {
      await dbService.addDocumentToProject(project.id, newDoc);
      onUpdate();
    } catch(e) {
      alert("Failed to upload");
    }
    
    e.target.value = '';
    setUploadType(null);
  };

  const handleDelete = async (docId: string) => {
    if (window.confirm('Delete this document?')) {
      await dbService.removeDocumentFromProject(project.id, docId);
      onUpdate();
    }
  };

  const DocSection = ({ title, type, icon: Icon, desc }: { title: string, type: DocumentType, icon: any, desc: string }) => {
    const docs = project.documents?.filter(d => d.type === type)
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()) || [];
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg mr-3">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          </div>
          {(user?.role === UserRole.ADMIN || user?.role === UserRole.PROJECT_MANAGER || user?.role === UserRole.TEAM_LEAD) && (
            <button 
              onClick={() => handleUploadClick(type)}
              className="flex items-center px-3 py-1.5 bg-white border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </button>
          )}
        </div>

        {docs.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-md border border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">No documents uploaded yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {docs.map(doc => (
              <li key={doc.id} className="py-3 flex justify-between items-center group">
                <div className="flex items-center overflow-hidden flex-1">
                  <FileText className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0 group-hover:text-blue-500 transition-colors" />
                  <div className="truncate flex-1">
                     <p 
                        className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors cursor-pointer" 
                        onClick={() => setPreviewDoc(doc)}
                     >
                       {doc.name}
                     </p>
                     <p className="text-xs text-gray-500">
                       {new Date(doc.uploadDate).toLocaleDateString()} • {(doc.size / 1024).toFixed(1)} KB
                     </p>
                  </div>
                </div>
                <div className="flex items-center ml-4 space-x-1">
                  <button 
                    onClick={() => setPreviewDoc(doc)}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 rounded-full transition-colors" 
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {doc.url && (
                    <a 
                      href={doc.url} 
                      download={doc.name}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-green-600 rounded-full transition-colors" 
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                  {(user?.role === UserRole.ADMIN || user?.role === UserRole.PROJECT_MANAGER) && (
                    <button 
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-600 rounded-full transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
      />
      
      <DocSection 
        title="Requirements Document" 
        type="REQUIREMENT_DOC" 
        icon={CheckCircle2}
        desc="Detailed functional requirements (PDF only)."
      />

      <DocSection 
        title="Test Cases" 
        type="TEST_CASES" 
        icon={ShieldCheck}
        desc="QA Test cases and execution logs (Excel/CSV)."
      />

      <DocSection 
        title="Issue Tracker" 
        type="ISSUE_TRACKER" 
        icon={FileSpreadsheet}
        desc="Spreadsheets for issue tracking (Excel/CSV)."
      />

      <DocSection 
        title="User Manual" 
        type="USER_MANUAL" 
        icon={FileText}
        desc="End-user documentation (PDF)."
      />
      
      <DocSection 
        title="MOU" 
        type="MOU" 
        icon={FileText}
        desc="Memorandum of Understanding."
      />

      {previewDoc && (
        <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
};

// -- Main Component: Project Workspace --
export const KanbanBoard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'board' | 'docs'>('board');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showWorkload, setShowWorkload] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Drag and Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const loadData = async () => {
    if (!projectId) return;
    try {
      const p = await dbService.getProjectById(projectId);
      if (p) {
        setProject({ ...p });
        const [t, u] = await Promise.all([
          dbService.getTasksByProject(projectId),
          dbService.getUsers()
        ]);
        setTasks(t);
        setUsers(u);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  // PERMISSION CHECK: Only Assignees, PM, TL, or Admin can move/edit status
  const isAllowedToMove = (task: Task) => {
    if (!user) return false;
    // PM and TL can move any task (supervision), Admin can move any task
    if (user.role === UserRole.ADMIN || user.role === UserRole.PROJECT_MANAGER || user.role === UserRole.TEAM_LEAD) return true;
    // Developers/Testers can only move their own tasks
    return task.assigneeIds && task.assigneeIds.includes(user.id);
  };

  // PERMISSION CHECK: Create/Assign Tasks (PM or Admin only)
  // Removed TEAM_LEAD to satisfy "disable edit of task details... tl... status only"
  const canManageTasks = user && (
    user.role === UserRole.ADMIN || 
    user.role === UserRole.PROJECT_MANAGER
  );

  // PERMISSION CHECK: Edit Task Details (Title, Desc, Priority, DueDate) - ONLY PM (and Admin)
  const canEditDetails = user && (
    user.role === UserRole.ADMIN ||
    user.role === UserRole.PROJECT_MANAGER
  );

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;

    if (!isAllowedToMove(taskToUpdate)) {
      return;
    }

    if (taskToUpdate && project) {
      // Optimistic Update
      const updatedTask = { ...taskToUpdate, status: newStatus };
      const previousTasks = [...tasks];
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));

      try {
        await dbService.updateTask(updatedTask);
      } catch(e) {
        // Revert on failure
        setTasks(previousTasks);
        alert("Failed to update status");
      }
    }
  };

  const moveTask = (taskId: string, direction: 'forward' | 'backward') => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (!isAllowedToMove(task)) return;

    const statusOrder = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW, TaskStatus.DONE];
    const currentIndex = statusOrder.indexOf(task.status);
    let newIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex >= 0 && newIndex < statusOrder.length) {
      handleStatusChange(taskId, statusOrder[newIndex]);
    }
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (!isAllowedToMove(task)) {
      e.preventDefault();
      return;
    }
    setDraggedTaskId(task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = draggedTaskId || e.dataTransfer.getData('text/plain');
    setDragOverColumn(null);
    setDraggedTaskId(null);

    if (taskId) {
      handleStatusChange(taskId, newStatus);
    }
  };

  const getAssignees = (ids?: string[]) => {
    if (!ids || ids.length === 0) return [];
    return users.filter(u => ids.includes(u.id));
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (!project) return <div className="p-8 text-center text-red-500">Project not found</div>;

  // -- Board View --
  const BoardView = () => {
    const columns = [
      { id: TaskStatus.TODO, title: 'To Do', color: 'border-gray-300' },
      { id: TaskStatus.IN_PROGRESS, title: 'In Progress', color: 'border-blue-400' },
      { id: TaskStatus.REVIEW, title: 'Review', color: 'border-purple-400' },
      { id: TaskStatus.DONE, title: 'Done', color: 'border-green-400' },
    ];

    return (
      <div className="h-full overflow-x-auto">
        <div className="flex space-x-4 h-full min-w-max pb-4 px-1">
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            const isOver = dragOverColumn === col.id;
            
            return (
              <div 
                key={col.id} 
                className={`w-80 flex flex-col rounded-lg max-h-full transition-all duration-200 ease-out border-2 ${
                  isOver 
                    ? 'bg-blue-50 border-blue-300 border-dashed scale-[1.02] shadow-lg' 
                    : 'bg-gray-100 border-transparent'
                }`}
                onDragOver={(e) => handleDragOver(e, col.id as TaskStatus)}
                onDrop={(e) => handleDrop(e, col.id as TaskStatus)}
              >
                <div className={`p-4 border-t-4 ${col.color} rounded-t-lg bg-gray-200 flex justify-between items-center`}>
                  <h3 className="font-semibold text-gray-700">{col.title}</h3>
                  <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-500 font-bold">{colTasks.length}</span>
                </div>
                
                <div className="p-2 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                  {colTasks.map(task => {
                    const canDrag = isAllowedToMove(task);
                    const isDragging = draggedTaskId === task.id;
                    const assignees = getAssignees(task.assigneeIds);
                    
                    return (
                      <div 
                        key={task.id}
                        draggable={canDrag}
                        onDragStart={(e) => handleDragStart(e, task)}
                        onClick={() => setSelectedTask(task)}
                        className={`
                          bg-white p-4 rounded-lg shadow-sm border border-gray-200 
                          transition-all duration-200 ease-out
                          group relative select-none
                          ${canDrag ? 'cursor-move hover:shadow-md hover:-translate-y-0.5' : 'cursor-not-allowed opacity-80 bg-gray-50'}
                          ${isDragging ? 'opacity-50 grayscale scale-95 ring-2 ring-blue-400 rotate-2' : ''}
                        `}
                      >
                        {!canDrag && (
                          <div className="absolute top-2 right-2 text-gray-300" title="Only assignees can move this task">
                            <Lock className="h-3 w-3" />
                          </div>
                        )}

                        <div className="flex justify-between items-start mb-2">
                          <div className={`h-2 w-12 rounded-full ${getPriorityColor(task.priority)}`} title={`Priority: ${task.priority}`}></div>
                          {canDrag && (
                            <div className="hidden group-hover:flex space-x-1">
                              {col.id !== TaskStatus.TODO && (
                                <button onClick={(e) => { e.stopPropagation(); moveTask(task.id, 'backward'); }} className="p-1 hover:bg-gray-100 rounded text-xs font-bold text-gray-500">&lt;</button>
                              )}
                              {col.id !== TaskStatus.DONE && (
                                <button onClick={(e) => { e.stopPropagation(); moveTask(task.id, 'forward'); }} className="p-1 hover:bg-gray-100 rounded text-xs font-bold text-gray-500">&gt;</button>
                              )}
                            </div>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-gray-800 mb-1">{task.title}</h4>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-50">
                          <div className="flex items-center -space-x-2 overflow-hidden p-1">
                            {assignees.length > 0 ? assignees.map((u, idx) => (
                              <div 
                                key={u.id} 
                                className={`inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 ${idx > 2 ? 'hidden' : ''}`}
                                title={u.name}
                              >
                                {idx === 2 && assignees.length > 3 ? `+${assignees.length - 2}` : u.name.charAt(0)}
                              </div>
                            )) : (
                              <span className="text-xs italic">Unassigned</span>
                            )}
                          </div>
                          {task.dueDate && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span className={new Date(task.dueDate) < new Date() ? 'text-red-500' : ''}>
                                {new Date(task.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col space-y-4 border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
             <button onClick={() => navigate('/projects')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
               <ArrowLeft className="h-5 w-5 text-gray-600" />
             </button>
             <div>
               <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
               <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <span>{project.status}</span>
                  <span>•</span>
                  <span>{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</span>
               </div>
             </div>
          </div>
          <div className="flex space-x-3">
             <button 
               onClick={() => setShowWorkload(true)}
               className="flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 shadow-sm transition-colors"
             >
               <BarChart3 className="h-4 w-4 mr-2" />
               Team Workload
             </button>

             {activeTab === 'board' && canManageTasks && (
               <button 
                 onClick={() => setShowTaskModal(true)}
                 className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition-colors"
               >
                 <Plus className="h-4 w-4 mr-2" />
                 Add Task
               </button>
             )}
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-6">
           <button 
             onClick={() => setActiveTab('board')}
             className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'board' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
           >
             <div className="flex items-center">
               <Layout className="h-4 w-4 mr-2" />
               Kanban Board
             </div>
           </button>
           <button 
             onClick={() => setActiveTab('docs')}
             className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'docs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
           >
             <div className="flex items-center">
               <FileText className="h-4 w-4 mr-2" />
               Project Documents
             </div>
           </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'board' ? <BoardView /> : <DocumentsTab project={project} onUpdate={loadData} />}
      </div>

      {/* Create Task Modal */}
      {showTaskModal && (
        <CreateTaskModal 
          projectId={project.id}
          users={users}
          onClose={() => setShowTaskModal(false)}
          onCreated={loadData}
        />
      )}

      {/* Team Workload Modal */}
      {showWorkload && (
        <WorkloadModal 
          users={users}
          tasks={tasks}
          onClose={() => setShowWorkload(false)}
        />
      )}

      {/* Edit/Detail Task Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          users={users}
          canEditStatus={isAllowedToMove(selectedTask)}
          canAssign={!!canManageTasks}
          canEditDetails={!!canEditDetails}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            loadData();
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};
