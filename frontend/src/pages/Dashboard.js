import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isToday, parseISO } from 'date-fns';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import '../App.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [todayStandup, setTodayStandup] = useState(null);
  const [standupLoading, setStandupLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [taskLoading, setTaskLoading] = useState(true);

  useEffect(() => {
    fetchTodayStandup();
    fetchTasks();
  }, []);

  const fetchTodayStandup = async () => {
    try {
      const res = await api.get('/api/standups/today');
      setTodayStandup(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setStandupLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get('/api/tasks/my');
      setTasks(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setTaskLoading(false);
    }
  };

  const openTasks = useMemo(() => tasks.filter((task) => task.status !== 'done'), [tasks]);
  const dueToday = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.dueDate && isToday(typeof task.dueDate === 'string' ? parseISO(task.dueDate) : new Date(task.dueDate))
      ),
    [tasks]
  );
  const uniqueProjects = useMemo(() => new Set(tasks.map((task) => task.project)).size, [tasks]);

  const upcomingTimeline = useMemo(
    () =>
      tasks
        .filter((task) => task.dueDate)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 4),
    [tasks]
  );

  const canViewTeam = user?.role === 'lead' || user?.role === 'admin';

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Welcome back, {user?.name}! 👋</h1>
            <p className="page-subtitle">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/standup" className="primary-btn">
              Submit standup
            </Link>
            <Link to="/tasks" className="ghost-btn">
              Create tasks
            </Link>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-label">Open tasks</span>
            <span className="stat-value">{taskLoading ? '–' : openTasks.length}</span>
            <span className="stat-meta">Across all projects</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Due today</span>
            <span className="stat-value">{taskLoading ? '–' : dueToday.length}</span>
            <span className="stat-meta">Keep the day on track</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Projects in flight</span>
            <span className="stat-value">{taskLoading ? '–' : uniqueProjects}</span>
            <span className="stat-meta">Where you're contributing</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Today's standup</span>
            <span className="stat-value">
              {standupLoading ? '–' : todayStandup ? 'Submitted' : 'Pending'}
            </span>
            <span className="stat-meta">
              {todayStandup ? 'Great job staying aligned' : 'Share blockers before 9:30 AM'}
            </span>
          </div>
        </div>

        <div className="panel" style={{ marginTop: 32 }}>
          <div className="panel-heading">
            <h3>Daily Standup</h3>
            <Link to="/standup" className="ghost-btn">
              {todayStandup ? 'Update standup' : 'Submit now'}
            </Link>
          </div>
          {standupLoading ? (
            <div className="loading">Checking today's standup...</div>
          ) : todayStandup ? (
            <div style={{ display: 'grid', gap: 16 }}>
              <div className="chip chip-success" style={{ width: 'fit-content' }}>
                Submitted
              </div>
              <div>
                <h4 style={{ marginBottom: 6 }}>✅ Completed yesterday</h4>
                <p style={{ color: 'var(--text-muted)' }}>{todayStandup.completedYesterday}</p>
              </div>
              <div>
                <h4 style={{ marginBottom: 6 }}>🎯 Plan today</h4>
                <p style={{ color: 'var(--text-muted)' }}>{todayStandup.planToday}</p>
              </div>
              <div>
                <h4 style={{ marginBottom: 6 }}>🚧 Blockers</h4>
                <p style={{ color: 'var(--text-muted)' }}>{todayStandup.blockers || 'None'}</p>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ textAlign: 'left' }}>
              <h3>Standup pending</h3>
              <p>Please share yesterday's progress, today's focus, and blockers.</p>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h3>Upcoming focus</h3>
            <Link to="/timeline" className="ghost-btn">View full timeline</Link>
          </div>
          {taskLoading ? (
            <div className="loading">Loading timeline...</div>
          ) : upcomingTimeline.length === 0 ? (
            <div className="empty-state">No tasks scheduled with due dates yet.</div>
          ) : (
            <div className="timeline-list">
              {upcomingTimeline.map((task) => (
                <div className="timeline-item" key={task._id}>
                  <div className="timeline-node" />
                  <div className="timeline-card">
                    <div className="timeline-date">
                      {task.dueDate ? format(new Date(task.dueDate), 'EEEE, MMM d') : 'No due date'}
                    </div>
                    <h4>{task.title}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {task.project} • {task.status.replace('-', ' ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h3>Shortcuts</h3>
          </div>
          <div className="stat-grid">
            <Link to="/standup" className="primary-btn" style={{ justifyContent: 'center' }}>
              Daily standup
            </Link>
            <Link to="/tasks" className="ghost-btn" style={{ justifyContent: 'center' }}>
              Task planner
            </Link>
            <Link to="/my-standups" className="ghost-btn" style={{ justifyContent: 'center' }}>
              My history
            </Link>
            {canViewTeam && (
              <Link to="/team" className="ghost-btn" style={{ justifyContent: 'center' }}>
                Team overview
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;

