import React, { useContext, useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { FiClock, FiLayers } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import api from '../utils/api';
import '../App.css';

const ALL_MEMBERS = 'ALL';

const Timeline = () => {
  const { user } = useContext(AuthContext);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [standups, setStandups] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const canViewTeam = user?.role === 'lead' || user?.role === 'admin';

  useEffect(() => {
    if (canViewTeam) {
      fetchUsers();
      setSelectedMember((prev) => prev || ALL_MEMBERS);
    } else if (user?._id) {
      setSelectedMember(user._id);
    }
  }, [canViewTeam, user]);

  useEffect(() => {
    if (!canViewTeam && user?._id && !selectedMember) {
      setSelectedMember(user._id);
    }
  }, [selectedMember, canViewTeam, user]);

  useEffect(() => {
    if (selectedMember || (canViewTeam && selectedMember === ALL_MEMBERS)) {
      fetchTimeline();
    }
  }, [selectedDate, selectedMember, selectedTeam]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users');
      setUsers(res.data);
      const uniqueTeams = [...new Set(res.data.map((member) => member.team).filter(Boolean))];
      setTeams(uniqueTeams);
      if (!selectedMember) {
        setSelectedMember(ALL_MEMBERS);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const date = selectedDate;
      const isAll = selectedMember === ALL_MEMBERS;

      let standupData = [];
      if (canViewTeam && isAll) {
        const res = await api.get('/api/standups/team', {
          params: {
            date,
            ...(selectedTeam ? { team: selectedTeam } : {}),
          },
        });
        standupData = res.data || [];
      } else if (canViewTeam && selectedMember && selectedMember !== user?._id) {
        const res = await api.get('/api/standups/team', {
          params: {
            date,
            userId: selectedMember,
          },
        });
        standupData = res.data || [];
      } else {
        const res = await api.get('/api/standups/my-standups', {
          params: { startDate: date, endDate: date, limit: 1 },
        });
        standupData = res.data || [];
      }
      setStandups(Array.isArray(standupData) ? standupData : standupData ? [standupData] : []);

      let taskData = [];
      if (canViewTeam && isAll) {
        const res = await api.get('/api/tasks/team', {
          params: {
            date,
            ...(selectedTeam ? { team: selectedTeam } : {}),
          },
        });
        taskData = res.data || [];
      } else if (canViewTeam && selectedMember && selectedMember !== user?._id) {
        const res = await api.get('/api/tasks/team', {
          params: {
            date,
            assignee: selectedMember,
          },
        });
        taskData = res.data || [];
      } else {
        const res = await api.get('/api/tasks/my', { params: { date } });
        taskData = res.data || [];
      }
      setTasks(taskData);
    } catch (error) {
      toast.error('Unable to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const events = useMemo(() => {
    const standupEvents = standups.map((entry) => ({
      type: 'standup',
      title: entry.user ? `${entry.user.name} • Standup` : 'Daily Standup Submitted',
      description: `${entry.completedYesterday}\nPlan: ${entry.planToday}`,
      timestamp: entry.createdAt || entry.date,
      owner: entry.user?.name,
    }));

    const taskEvents = tasks.map((task) => ({
      type: 'task',
      title: `${task.project}: ${task.title}`,
      description: `${task.priority.toUpperCase()} • ${task.status.replace('-', ' ')}`,
      timestamp: task.dueDate || task.createdAt,
      owner: task.assignee?.name,
    }));

    return [...standupEvents, ...taskEvents]
      .filter((event) => event.timestamp)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [standups, tasks]);

  const summary = useMemo(() => {
    const projects = new Set(tasks.map((task) => task.project));
    const blocked = tasks.filter((task) => task.status === 'blocked').length;
    return {
      total: tasks.length,
      projects: projects.size,
      blocked,
    };
  }, [tasks]);

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Day Timeline</h1>
            <p className="page-subtitle">
              Visualize standups and project tasks for each teammate across the day.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="ghost-btn"
              style={{ padding: '10px 16px' }}
            />
            {canViewTeam && (
              <>
                <select
                  className="ghost-btn"
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  style={{ padding: '10px 16px' }}
                >
                  <option value={ALL_MEMBERS}>All teammates</option>
                  {users.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} • {member.team}
                    </option>
                  ))}
                </select>
                <select
                  className="ghost-btn"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  style={{ padding: '10px 16px' }}
                >
                  <option value="">All teams</option>
                  {teams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-label">Tasks scheduled</span>
            <span className="stat-value">{summary.total}</span>
            <span className="stat-meta">for {format(new Date(selectedDate), 'MMMM d')}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Projects touched</span>
            <span className="stat-value">{summary.projects}</span>
            <span className="stat-meta">unique projects on the board</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Blocked items</span>
            <span className="stat-value">{summary.blocked}</span>
            <span className="stat-meta">needing help today</span>
          </div>
        </div>

        <div className="panel" style={{ marginTop: 32 }}>
          <div className="panel-heading">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiClock />
              <strong>
                {format(new Date(selectedDate), 'EEEE, MMMM d')}
              </strong>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading timeline...</div>
          ) : events.length === 0 ? (
            <div className="empty-state">No standups or tasks scheduled for this day.</div>
          ) : (
            <div className="timeline-list">
              {events.map((event, index) => (
                <div className="timeline-item" key={`${event.timestamp}-${index}`}>
                  <div className="timeline-node" style={{ background: event.type === 'task' ? 'var(--primary)' : 'var(--success)' }} />
                  <div className="timeline-card">
                    <div className="timeline-date">
                      {format(new Date(event.timestamp), 'h:mm a')}
                    </div>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {event.type === 'task' ? <FiLayers /> : <FiClock />}
                      {event.title}
                    </h4>
                    <p style={{ whiteSpace: 'pre-line', color: 'var(--text-muted)', fontSize: 13 }}>
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Timeline;

