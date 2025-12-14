
import React, { useMemo, useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { TaskStatus, UserRole, Project, Task } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { ClipboardList, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pData, tData] = await Promise.all([
          dbService.getProjects(),
          dbService.getTasks()
        ]);
        setProjects(pData);
        setTasks(tData);

        // Check for deadlines
        if (user && user.role !== UserRole.ADMIN) {
           const myPendingTasks = tData.filter(t => 
             (t.assigneeIds || []).includes(user.id) && 
             t.status !== TaskStatus.DONE && 
             t.dueDate
           );

           const today = new Date();
           myPendingTasks.forEach(task => {
             if (task.dueDate) {
               const due = new Date(task.dueDate);
               const diffTime = due.getTime() - today.getTime();
               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
               
               if (diffDays <= 2 && diffDays >= 0) {
                 addNotification(`Task "${task.title}" is due soon (${diffDays === 0 ? 'Today' : 'In ' + diffDays + ' days'})!`, 'warning');
               } else if (diffDays < 0) {
                 addNotification(`Task "${task.title}" is overdue!`, 'error');
               }
             }
           });
        }

      } catch (e) {
        console.error("Failed to load dashboard data", e);
        addNotification("Failed to load dashboard data", 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Personal tasks for non-admin/PM
  const myTasks = useMemo(() => {
    return user?.role === UserRole.ADMIN 
      ? [] 
      : tasks.filter(t => (t.assigneeIds || []).includes(user?.id || ''));
  }, [tasks, user]);

  // Stats calculation
  const statusCounts = useMemo(() => {
    const counts = {
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.REVIEW]: 0,
      [TaskStatus.DONE]: 0
    };
    tasks.forEach(t => {
      if (counts[t.status] !== undefined) counts[t.status]++;
    });
    return counts;
  }, [tasks]);

  const pieData = Object.keys(statusCounts).map(key => ({
    name: key.replace('_', ' '),
    value: statusCounts[key as TaskStatus]
  }));

  const projectProgress = projects.map(p => {
    const pTasks = tasks.filter(t => t.projectId === p.id);
    const done = pTasks.filter(t => t.status === TaskStatus.DONE).length;
    const total = pTasks.length || 1; // avoid division by zero
    return {
      name: p.name,
      progress: Math.round((done / total) * 100),
      totalTasks: total
    };
  });

  const COLORS = ['#64748b', '#3b82f6', '#f59e0b', '#10b981']; // Slate, Blue, Amber, Emerald

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          <Icon className={`h-8 w-8 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500"/></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Overview of your projects and performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Projects" value={projects.length} icon={ClipboardList} color="text-blue-600" />
        <StatCard title="Total Tasks" value={tasks.length} icon={CheckCircle2} color="text-emerald-600" />
        <StatCard title="Pending Tasks" value={tasks.filter(t => t.status !== TaskStatus.DONE).length} icon={Clock} color="text-amber-600" />
        <StatCard title="Urgent Tasks" value={tasks.filter(t => t.priority === 'CRITICAL' || t.priority === 'HIGH').length} icon={AlertCircle} color="text-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Task Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Progress (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectProgress}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="progress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* My Tasks Section for individual contributors */}
      {user?.role !== UserRole.ADMIN && user?.role !== UserRole.PROJECT_MANAGER && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="text-lg font-semibold text-gray-800 mb-4">My Assigned Tasks</h3>
           {myTasks.length === 0 ? (
             <p className="text-gray-500">No tasks assigned to you.</p>
           ) : (
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {myTasks.map(task => (
                     <tr key={task.id}>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.title}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm">
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            task.priority === 'HIGH' || task.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                         }`}>
                           {task.priority}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.status.replace('_', ' ')}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.dueDate || '-'}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
        </div>
      )}
    </div>
  );
};
