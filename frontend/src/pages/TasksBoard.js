import React, { useContext, useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { FiPlus, FiFilter } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import TaskDrawer from '../components/TaskDrawer';
import AuthContext from '../context/AuthContext';
import api from '../utils/api';
import '../App.css';

const statusConfig = {
  todo: { label: 'Backlog', accent: '#94a3b8' },
  'in-progress': { label: 'In progress', accent: '#f97316' },
  blocked: { label: 'Blocked', accent: '#ef4444' },
  done: { label: 'Completed', accent: '#22c55e' },
};

const TaskCard = ({ task, onStatusChange, onEdit, canEdit, canEditDetails }) => {
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const dueLabel = dueDate ? format(dueDate, 'MMM d') : 'No due date';
  const priorityClass = `chip chip-${task.priority}`;

  return (
    <div className="task-card">
      <div>
        <span className={priorityClass} style={{ textTransform: 'uppercase', fontSize: 11 }}>
          {task.priority}
        </span>
        <h4>{task.title}</h4>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{task.project}</p>
      </div>

      {task.description && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{task.description}</p>
      )}

      <div className="task-meta">
        <span>Due • {dueLabel}</span>
        <span>By • {task.assignee?.name}</span>
        <span>From • {task.createdBy?.name}</span>
      </div>

      <div className="task-footer">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Status
          </span>
          <select
            value={task.status}
            onChange={(event) => onStatusChange(task._id, event.target.value)}
            disabled={!canEdit}
          >
            {Object.keys(statusConfig).map((status) => (
              <option key={status} value={status}>
                {statusConfig[status].label}
              </option>
            ))}
          </select>
        </div>
        {canEditDetails && (
          <button className="ghost-btn" style={{ padding: '8px 12px' }} onClick={() => onEdit(task)}>
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

const TasksBoard = () => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    project: '',
    status: '',
    date: '',
    assignee: '',
  });
  const [viewMode, setViewMode] = useState('my');
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTask, setDrawerTask] = useState(null);
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectTeamlead, setNewProjectTeamlead] = useState('');
  const [isAddingProject, setIsAddingProject] = useState(false);

  const canViewTeam = user?.role === 'lead' || user?.role === 'admin';
  const canEditTasks = viewMode === 'my' || canViewTeam;
  const canEditTaskDetails = (task) =>
    canViewTeam ||
    (task.assignee?._id === user?._id) ||
    (task.createdBy?._id === user?._id);

  useEffect(() => {
    fetchTasks();
  }, [viewMode, filters]);

  useEffect(() => {
    if (canViewTeam) {
      fetchUsers();
    }
  }, [canViewTeam]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users');
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const endpoint = viewMode === 'team' ? '/api/tasks/team' : '/api/tasks/my';
      const params = {};
      if (filters.project) params.project = filters.project;
      if (filters.status) params.status = filters.status;
      if (filters.date) params.date = filters.date;
      if (viewMode === 'team' && filters.assignee) params.assignee = filters.assignee;

      const res = await api.get(endpoint, { params });
      const projectRes = await api.get('/api/project');
      setProjects(projectRes.data);
      setTasks(res.data);
    } catch (error) {
      toast.error('Unable to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const groupedTasks = useMemo(() => {
    return tasks.reduce(
      (acc, task) => {
        acc[task.status] = acc[task.status] || [];
        acc[task.status].push(task);
        return acc;
      },
      { todo: [], 'in-progress': [], blocked: [], done: [] }
    );
  }, [tasks]);

  const projectOptions = useMemo(() => {
    return Array.from(new Set(tasks.map((task) => task.project))).filter(Boolean);
  }, [tasks]);

  const timelineItems = useMemo(() => {
    return tasks
      .filter((task) => task.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 7);
  }, [tasks]);

  const handleStatusChange = async (taskId, status) => {
    try {
      await api.put(`/api/tasks/${taskId}`, { status });
      fetchTasks();
      toast.success('Task updated');
    } catch (error) {
      toast.error('Unable to update task');
    }
  };

  const resetFilters = () => {
    setFilters({
      project: '',
      status: '',
      date: '',
      assignee: '',
    });
  };

  const timelineDateLabel = (task) => {
    if (!task.dueDate) return 'No due date';
    const date = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : new Date(task.dueDate);
    return format(date, 'EEEE, MMM d');
  };

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Team Tasks</h1>
            <p className="page-subtitle">
              Assign tasks, track progress, and view daily plans on a unified board.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {canViewTeam && (
              <button
                className={viewMode === 'team' ? 'secondary-btn' : 'ghost-btn'}
                onClick={() => setViewMode(viewMode === 'team' ? 'my' : 'team')}
              >
                {viewMode === 'team' ? 'Viewing: Team' : 'Switch to team'}
              </button>
            )}
            <button className="primary-btn" onClick={() => {
              setDrawerTask(null);
              setDrawerOpen(true);
            }}>
              <FiPlus />
              Create Task
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiFilter />
              <strong>Filters</strong>
            </div>
            <button className="ghost-btn" onClick={resetFilters} style={{ padding: '8px 14px' }}>
              Reset
            </button>
          </div>
          <div className="filters-grid">
            <div className="form-group">
              <label>Project</label>
              <select
                value={filters.project}
                onChange={(e) => setFilters((prev) => ({ ...prev, project: e.target.value }))}
              >
                <option value="">All projects</option>
                {projectOptions.map((project) => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="">All statuses</option>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Due date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            {canViewTeam && (
              <div className="form-group">
                <label>Assignee</label>
                <select
                  value={filters.assignee}
                  onChange={(e) => setFilters((prev) => ({ ...prev, assignee: e.target.value }))}
                >
                  <option value="">Entire team</option>
                  {users.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} • {member.team}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="panel">
            <div className="loading">Loading tasks...</div>
          </div>
        ) : (
          <div className="board">
            {Object.entries(statusConfig).map(([status, config]) => (
              <div className="board-column" key={status}>
                <div className="column-header">
                  <span style={{ color: config.accent, fontWeight: 600 }}>{config.label}</span>
                  <span className="column-count">{groupedTasks[status]?.length || 0}</span>
                </div>
                {groupedTasks[status]?.length ? (
                  groupedTasks[status].map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      canEdit={canEditTasks}
                      canEditDetails={canEditTaskDetails(task)}
                      onEdit={(item) => {
                        if (!canEditTaskDetails(item)) {
                          toast.error("You don't have permission to edit this task");
                          return;
                        }
                        setDrawerTask(item);
                        setDrawerOpen(true);
                      }}
                    />
                  ))
                ) : (
                  <div className="empty-state" style={{ padding: '30px 0' }}>
                    No tasks yet
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="panel" style={{ marginTop: 32 }}>
          <div className="panel-heading">
            <div>
              <h3>Upcoming Timeline</h3>
              <p className="page-subtitle">See what each day looks like across projects</p>
            </div>
          </div>
          {timelineItems.length === 0 ? (
            <div className="empty-state">No upcoming tasks with due dates.</div>
          ) : (
            <div className="timeline-list">
              {timelineItems.map((task) => (
                <div key={task._id} className="timeline-item">
                  <div className="timeline-node" />
                  <div className="timeline-card">
                    <div className="timeline-date">{timelineDateLabel(task)}</div>
                    <h4>{task.title}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {task.project} • {task.assignee?.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


        <div className=" panel" style={{ marginTop: 32 }}>
          <div className="panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Add a Project</h3>
              <p className="page-subtitle">Manage your projects below</p>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newProjectName.trim()) {
                  toast.error('Project name is required');
                  return;
                }
                try {
                  setIsAddingProject(true);
                  const response = await api.post('/api/project', { name: newProjectName.trim(), Teamlead: newProjectTeamlead.trim() });
                  setProjects((prev) => [...prev, response.data]);
                  setNewProjectName('');
                  toast.success('Project added!');
                } catch (err) {
                  toast.error(err.response?.data?.message || 'Failed to add project');
                } finally {
                  setIsAddingProject(false);
                }
              }}
              style={{ display: 'flex', gap: 16 }}
            >

              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  placeholder="Enter project name"
                  onChange={(e) => setNewProjectName(e.target.value)}
                  disabled={isAddingProject}
                />
              </div>
              <div className="form-group">
                <label>Teamlead</label>
                <input
                  type="text"
                  value={newProjectTeamlead}
                  placeholder="Enter Teamlead"
                  onChange={(e) => setNewProjectTeamlead(e.target.value)}
                  disabled={isAddingProject}
                />
              </div>
              <div className="form-group">
                <label>Add Project</label>
                <button
                  type="submit"
                  disabled={isAddingProject}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '12px 16px',
                    cursor: isAddingProject ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                    fontSize: 15,
                    opacity: isAddingProject ? 0.7 : 1
                  }}
                >
                  <FiPlus /> Add Project
                </button>
              </div>
            </form>
          </div>
          <div>
            {projects.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0', fontSize: 15 }}>
                No projects yet.
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {projects.map((project) => (
                  <>
                    <li
                      key={project._id}
                      style={{
                        padding: '10px 20px',
                        borderRadius: 7,
                        fontWeight: 500,
                        fontSize: 15,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 1px 4px #eee'
                      }}
                    >
                      {project.name}  <span style={{ color: 'var(--text-muted)' }}>-> </span>  {project.Teamlead}
                    </li>
                  </>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <TaskDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerTask(null);
        }}
        onSuccess={fetchTasks}
        users={users}
        currentUser={user}
        task={drawerTask}
      />
    </>
  );
};

export default TasksBoard;

