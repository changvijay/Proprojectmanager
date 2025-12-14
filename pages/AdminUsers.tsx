
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { User, UserRole, TaskStatus, Project, Task, TaskPriority } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  Trash2, UserPlus, Edit, CheckCircle2, X, Search, Briefcase, 
  CheckSquare, Eye, Layers, Calendar, AlertCircle, Mail, User as UserIcon,
  ShieldCheck, Code, Terminal, Loader2, Lock
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface UserWithStats extends User {
  tasksAssigned: number;
  tasksCompleted: number;
  pendingCount: number;
}

// -- Sub-Component: User Details Modal --
interface UserDetailsModalProps {
  user: User;
  onClose: () => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, onClose }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [p, t] = await Promise.all([
          dbService.getProjects(),
          dbService.getTasks()
        ]);
        setProjects(p);
        setTasks(t);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50"><Loader2 className="animate-spin text-white h-8 w-8"/></div>;

  // Get projects user is involved in (as manager or team member)
  const userProjects = projects.filter(p => 
    p.managerId === user.id || p.teamIds.includes(user.id)
  );

  // Get tasks assigned to user
  const userTasks = tasks.filter(t => t.assigneeIds?.includes(user.id));

  // Stats for chart
  const statusCounts = {
    [TaskStatus.TODO]: userTasks.filter(t => t.status === TaskStatus.TODO).length,
    [TaskStatus.IN_PROGRESS]: userTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    [TaskStatus.REVIEW]: userTasks.filter(t => t.status === TaskStatus.REVIEW).length,
    [TaskStatus.DONE]: userTasks.filter(t => t.status === TaskStatus.DONE).length,
  };

  const chartData = [
    { name: 'To Do', value: statusCounts[TaskStatus.TODO], color: '#94a3b8' },
    { name: 'In Progress', value: statusCounts[TaskStatus.IN_PROGRESS], color: '#3b82f6' },
    { name: 'Review', value: statusCounts[TaskStatus.REVIEW], color: '#a855f7' },
    { name: 'Done', value: statusCounts[TaskStatus.DONE], color: '#22c55e' },
  ].filter(d => d.value > 0);

  const getPriorityColor = (p: TaskPriority) => {
    switch(p) {
      case TaskPriority.CRITICAL: return 'text-red-600 bg-red-50 ring-red-500/10';
      case TaskPriority.HIGH: return 'text-orange-600 bg-orange-50 ring-orange-500/10';
      case TaskPriority.MEDIUM: return 'text-blue-600 bg-blue-50 ring-blue-500/10';
      case TaskPriority.LOW: return 'text-gray-600 bg-gray-50 ring-gray-500/10';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Pattern */}
        <div className="relative bg-slate-900 p-6 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
             <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
               <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
             </svg>
          </div>
          <div className="relative flex justify-between items-start z-10">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-white p-1 mr-4 shadow-md">
                <div className="h-full w-full rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white">
                  {user.name.charAt(0)}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <div className="flex items-center text-blue-200 text-sm mb-1">
                  <Mail className="h-3 w-3 mr-1" /> {user.email}
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white border border-white/10">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Projects & Stats */}
            <div className="space-y-6">
              {/* Stats Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Workload Overview</h3>
                {userTasks.length > 0 ? (
                  <div className="h-48 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none mb-8">
                       <span className="text-2xl font-bold text-gray-700">{userTasks.length}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">No active tasks</div>
                )}
                <div className="grid grid-cols-2 gap-3 mt-2">
                   <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <span className="block text-lg font-bold text-blue-700">{userProjects.length}</span>
                      <span className="text-xs text-blue-600 uppercase font-semibold">Projects</span>
                   </div>
                   <div className="bg-green-50 p-3 rounded-lg text-center">
                      <span className="block text-lg font-bold text-green-700">{statusCounts[TaskStatus.DONE]}</span>
                      <span className="text-xs text-green-600 uppercase font-semibold">Completed</span>
                   </div>
                </div>
              </div>

              {/* Projects List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center mb-4">
                  <Layers className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Projects</h3>
                </div>
                {userProjects.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Not assigned to any projects.</p>
                ) : (
                  <ul className="space-y-3">
                    {userProjects.map(p => (
                      <li key={p.id} className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className={`h-2 w-2 mt-1.5 rounded-full mr-2 flex-shrink-0 ${p.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.description}</p>
                          <div className="mt-2 flex items-center">
                             {p.managerId === user.id && (
                               <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800">
                                 Manager
                               </span>
                             )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Right Column: Tasks */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
                <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex items-center">
                    <CheckSquare className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Assigned Tasks</h3>
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{userTasks.length} Total</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-0 max-h-[500px]">
                   {userTasks.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                       <CheckCircle2 className="h-10 w-10 text-gray-300 mb-2" />
                       <p>No tasks assigned.</p>
                     </div>
                   ) : (
                     <table className="min-w-full divide-y divide-gray-100">
                       <thead className="bg-gray-50 sticky top-0">
                         <tr>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                         </tr>
                       </thead>
                       <tbody className="bg-white divide-y divide-gray-100">
                         {userTasks.map(task => {
                           const project = projects.find(p => p.id === task.projectId);
                           return (
                             <tr key={task.id} className="hover:bg-blue-50/50 transition-colors">
                               <td className="px-6 py-4">
                                 <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">{task.title}</span>
                                    <span className="text-xs text-gray-500 line-clamp-1">{task.description}</span>
                                 </div>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap">
                                 <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                   task.status === TaskStatus.DONE ? 'bg-green-100 text-green-800' :
                                   task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                                   task.status === TaskStatus.REVIEW ? 'bg-purple-100 text-purple-800' :
                                   'bg-gray-100 text-gray-800'
                                 }`}>
                                   {task.status.replace('_', ' ')}
                                 </span>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap">
                                 <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getPriorityColor(task.priority)}`}>
                                   {task.priority}
                                 </span>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                 {project?.name || 'Unknown'}
                               </td>
                             </tr>
                           );
                         })}
                       </tbody>
                     </table>
                   )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
           <button 
             onClick={onClose}
             className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 shadow-sm transition-all"
           >
             Close
           </button>
        </div>
      </div>
    </div>
  );
};

// -- Main Component --
export const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    role: UserRole.DEVELOPER,
    password: ''
  });

  const loadData = async () => {
    try {
      const [allUsers, allTasks] = await Promise.all([
        dbService.getUsers(),
        dbService.getTasks()
      ]);

      const usersWithStats = allUsers.map(u => {
        const userTasks = allTasks.filter(t => t.assigneeIds?.includes(u.id));
        const completed = userTasks.filter(t => t.status === TaskStatus.DONE).length;
        return {
          ...u,
          tasksAssigned: userTasks.length,
          tasksCompleted: completed,
          pendingCount: userTasks.length - completed
        };
      });
      setUsers(usersWithStats);
    } catch(e) {
      console.error(e);
      addNotification("Failed to load users", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const canManageUsers = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.PROJECT_MANAGER;

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      password: '' // Keep empty for edit unless we implement password reset
    });
    setIsFormModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      username: '',
      email: '',
      role: UserRole.DEVELOPER,
      password: ''
    });
    setIsFormModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await dbService.deleteUser(id);
        addNotification("User deleted successfully", "success");
        loadData();
      } catch(e) {
        addNotification("Failed to delete user", "error");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        const updatedUser: User = {
          ...editingUser,
          name: formData.name,
          username: formData.username,
          email: formData.email,
          role: formData.role
        };
        // Note: Password update on edit is not implemented in this flow to keep it simple, 
        // as the requirement was specifically about the creation form.
        await dbService.updateUser(updatedUser);
        addNotification("User updated successfully", "success");
      } else {
        const newUser: User = {
          id: crypto.randomUUID(),
          name: formData.name,
          username: formData.username,
          email: formData.email,
          role: formData.role
        };
        await dbService.addUser(newUser, formData.password);
        addNotification("User created successfully", "success");
      }
      
      setIsFormModalOpen(false);
      loadData();
    } catch(e) {
      addNotification("Failed to save user", "error");
      console.error(e);
    }
  };

  const getRoleIcon = (role: UserRole) => {
     switch(role) {
       case UserRole.DEVELOPER: return <Code className="h-4 w-4" />;
       case UserRole.TESTER: return <ShieldCheck className="h-4 w-4" />;
       case UserRole.PROJECT_MANAGER: return <Briefcase className="h-4 w-4" />;
       case UserRole.ADMIN: return <Terminal className="h-4 w-4" />;
       default: return <UserIcon className="h-4 w-4" />;
     }
  };

  const getRoleBadge = (role: UserRole) => {
    const styles = {
      [UserRole.ADMIN]: 'bg-purple-100 text-purple-800 ring-purple-600/20',
      [UserRole.PROJECT_MANAGER]: 'bg-blue-100 text-blue-800 ring-blue-600/20',
      [UserRole.TEAM_LEAD]: 'bg-indigo-100 text-indigo-800 ring-indigo-600/20',
      [UserRole.DEVELOPER]: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
      [UserRole.TESTER]: 'bg-amber-100 text-amber-800 ring-amber-600/20',
    };
    return (
      <span className={`inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[role]}`}>
        {getRoleIcon(role)}
        {role.replace('_', ' ')}
      </span>
    );
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-gray-500 mt-1">Manage team members, permissions, and view workloads.</p>
        </div>
        {canManageUsers && (
          <button 
            onClick={handleAddNew}
            className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Add New User
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
          />
        </div>
        <div className="ml-4 text-sm text-gray-500">
           Showing <span className="font-bold text-gray-900">{filteredUsers.length}</span> users
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Team Member</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Task Progress</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((u) => {
                const completionRate = u.tasksAssigned > 0 ? Math.round((u.tasksCompleted / u.tasksAssigned) * 100) : 0;
                return (
                  <tr key={u.id} className="group hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold border border-slate-200 shadow-sm">
                          {u.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">{u.name}</div>
                          <div className="text-sm text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap align-middle">
                      <div className="w-full max-w-xs">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                           <span className="text-gray-600 font-medium">{u.tasksAssigned} Tasks</span>
                           <span className={completionRate === 100 ? 'text-green-600 font-bold' : 'text-gray-500'}>{completionRate}% Done</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              completionRate === 100 ? 'bg-green-500' : 
                              completionRate > 50 ? 'bg-blue-500' : 'bg-amber-500'
                            }`} 
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                        <div className="mt-1 text-[10px] text-gray-400 flex space-x-2">
                           <span>{u.tasksCompleted} Completed</span>
                           <span>•</span>
                           <span>{u.pendingCount} Pending</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => setViewingUser(u)}
                          className="text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details & Workload"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {canManageUsers && (
                          <>
                            <div className="h-4 w-px bg-gray-200 mx-1"></div>
                            <button 
                              onClick={() => handleEdit(u)}
                              className="text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit User"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(u.id)} 
                              className={`text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors ${u.username === 'admin' ? 'opacity-30 cursor-not-allowed hidden' : ''}`}
                              disabled={u.username === 'admin'}
                              title="Delete User"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
             <div className="p-12 text-center flex flex-col items-center justify-center bg-white">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                   <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No users found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your search terms.</p>
             </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{editingUser ? 'Edit User Profile' : 'Add New Team Member'}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{editingUser ? 'Update details and role' : 'Create a new account'}</p>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors bg-white p-1 rounded-full shadow-sm border border-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative rounded-md shadow-sm">
                   <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <UserIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                   </div>
                   <input
                     required
                     type="text"
                     value={formData.name}
                     onChange={(e) => setFormData({...formData, name: e.target.value})}
                     className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
                     placeholder="John Doe"
                   />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="relative rounded-md shadow-sm">
                   <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Terminal className="h-4 w-4 text-gray-400" aria-hidden="true" />
                   </div>
                   <input
                    required
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="jdoe"
                    disabled={!!editingUser} 
                   />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative rounded-md shadow-sm">
                   <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-4 w-4 text-gray-400" aria-hidden="true" />
                   </div>
                   <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
                    placeholder="john@example.com"
                   />
                </div>
              </div>
              
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative rounded-md shadow-sm">
                     <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock className="h-4 w-4 text-gray-400" aria-hidden="true" />
                     </div>
                     <input
                      required
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
                      placeholder="Enter password"
                     />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">System Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                  className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border bg-white"
                >
                  {Object.values(UserRole).map(r => (
                    <option key={r} value={r}>{r.replace('_', ' ')}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Determines access permissions and visibility.</p>
              </div>
              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-50 mt-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingUser && (
        <UserDetailsModal user={viewingUser} onClose={() => setViewingUser(null)} />
      )}
    </div>
  );
};
