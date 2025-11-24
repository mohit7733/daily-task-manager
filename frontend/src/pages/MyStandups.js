import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import '../App.css';

const MyStandups = () => {
  const [standups, setStandups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStandups();
  }, []);

  const fetchStandups = async () => {
    try {
      const res = await api.get('/api/standups/my-standups');
      setStandups(res.data);
    } catch (error) {
      toast.error('Failed to fetch standups');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page">
          <div className="panel">
            <div className="loading">Loading...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="panel">
          <h1 className="page-title" style={{ marginBottom: 12 }}>📊 My Standup History</h1>
          <p className="page-subtitle" style={{ marginBottom: 24 }}>
            A record of everything you've shared with the team.
          </p>

          {standups.length === 0 ? (
            <div className="empty-state">
              <h3>No standups yet</h3>
              <p>Submit your first update from the dashboard.</p>
            </div>
          ) : (
            <div className="grid">
              {standups.map((standup) => (
                <div key={standup._id} className="standup-card">
                  <div className="standup-header">
                    <div>
                      <h3 style={{ margin: 0 }}>
                        {format(new Date(standup.date), 'MMM d, yyyy')}
                      </h3>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {format(new Date(standup.date), 'h:mm a')}
                      </span>
                    </div>
                    <span className="chip chip-success" style={{ fontSize: 11 }}>Submitted</span>
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
                    <p>{standup.blockers || 'None'}</p>
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

export default MyStandups;

