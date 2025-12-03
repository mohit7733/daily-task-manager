import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import '../App.css';

const StandupForm = () => {
  const [formData, setFormData] = useState({
    completedYesterday: '',
    planToday: '',
    blockers: '',
    projectName: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTodayStandup();
  }, []);

  const fetchTodayStandup = async () => {
    try {
      const res = await api.get('/api/standups/today');
      const projectRes = await api.get('/api/project');
      setProjects(projectRes.data);
      if (res.data) {
        setFormData({
          completedYesterday: res.data.completedYesterday || '',
          planToday: res.data.planToday || '',
          blockers: res.data.blockers || '',
          projectName: res.data.projectName || ''
        });
      }
    } catch (error) {
      console.error('Error fetching standup:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/api/standups', formData);
      toast.success('Standup submitted successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit standup');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
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
          <h1 className="page-title" style={{ fontSize: 28, marginBottom: 12 }}>
            📝 Daily Standup
          </h1>
          <p className="page-subtitle" style={{ marginBottom: 24 }}>
            Share what you completed, today's focus, and where you need support.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label>1️⃣ What I completed yesterday</label>
              <textarea
                name="completedYesterday"
                value={formData.completedYesterday}
                onChange={handleChange}
                required
                placeholder="Describe what you accomplished yesterday..."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>2️⃣ What I will do today</label>
              <textarea
                name="planToday"
                value={formData.planToday}
                onChange={handleChange}
                required
                placeholder="Describe what you plan to work on today..."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>3️⃣ Any blockers / help needed</label>
              <textarea
                name="blockers"
                value={formData.blockers}
                onChange={handleChange}
                placeholder="List any blockers or areas where you need help. If none, leave blank or type 'None'."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>4️⃣ Project Name</label>
              <select
                name="projectName"
                value={formData.projectName || ''}
                onChange={handleChange}
                required
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project.name}>{project.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit standup'}
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default StandupForm;

