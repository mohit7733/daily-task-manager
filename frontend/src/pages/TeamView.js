import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import '../App.css';

const TeamView = () => {
  const [standups, setStandups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTeam, setSelectedTeam] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      fetchTeamStandups();
    }
  }, [selectedDate, selectedTeam]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users');
      setUsers(res.data);
      const teams = [...new Set(res.data.map(u => u.team))];
      if (teams.length > 0 && !selectedTeam) {
        setSelectedTeam(teams[0]);
      }
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error(error);
    }
  };

  const fetchTeamStandups = async () => {
    setLoading(true);
    try {
      const params = { date: selectedDate };
      if (selectedTeam) {
        params.team = selectedTeam;
      }
      const res = await api.get('/api/standups/team', { params });
      setStandups(res.data);
    } catch (error) {
      toast.error('Failed to fetch team standups');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const teams = [...new Set(users.map(u => u.team))];
  const submittedUsers = standups.map(s => s.user._id.toString());
  const missingUsers = users.filter(u => 
    (!selectedTeam || u.team === selectedTeam) && 
    !submittedUsers.includes(u._id.toString())
  );

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="panel">
          <h1 className="page-title" style={{ marginBottom: 12 }}>
            👥 Team Standup View
          </h1>
          <p className="page-subtitle" style={{ marginBottom: 24 }}>
            Track which teammates have submitted updates and spot blockers quickly.
          </p>

          <div className="filters-grid" style={{ marginBottom: 24 }}>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Team</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="">All teams</option>
                {teams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              <div className="stat-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                  <span className="stat-label">Standups submitted</span>
                  <span className="stat-value">{standups.length}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Missing standups</span>
                  <span className="stat-value">{missingUsers.length}</span>
                </div>
              </div>

              {missingUsers.length > 0 && (
                <div className="panel" style={{ borderColor: 'rgba(251, 191, 36, 0.35)', background: 'rgba(251, 191, 36, 0.08)', marginBottom: 24 }}>
                  <h3 style={{ color: 'var(--warning)', marginBottom: 12 }}>⚠️ Still pending</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {missingUsers.map(user => (
                      <span key={user._id} className="badge badge-member" style={{ fontSize: 13 }}>
                        {user.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {standups.length === 0 ? (
                <div className="empty-state">
                  <h3>No standups found for this date</h3>
                  <p>No team members have submitted standups for {format(new Date(selectedDate), 'MMMM d, yyyy')}.</p>
                </div>
              ) : (
                <div className="grid">
                  {standups.map((standup) => (
                    <div key={standup._id} className="standup-card">
                      <div className="standup-header">
                        <div>
                          <h3 style={{ margin: 0 }}>
                            {standup.user.name}
                          </h3>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {standup.user.team} • {standup.user.email}
                          </span>
                        </div>
                        <span className={`badge badge-${standup.user.role}`}>
                          {standup.user.role}
                        </span>
                      </div>

                      <div className="standup-section">
                        <h4>✅ Completed Yesterday</h4>
                        <p>{standup.completedYesterday}</p>
                      </div>

                      <div className="standup-section">
                        <h4>🎯 Plan Today</h4>
                        <p>{standup.planToday}</p>
                      </div>

                      <div className="standup-section">
                        <h4>🚧 Blockers</h4>
                        <p style={{ color: standup.blockers && standup.blockers.toLowerCase() !== 'none' ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {standup.blockers || 'None'}
                        </p>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
                        Submitted: {format(new Date(standup.createdAt), 'h:mm a')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default TeamView;

