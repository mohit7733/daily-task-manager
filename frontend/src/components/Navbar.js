import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import '../App.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const canViewTeam = user?.role === 'lead' || user?.role === 'admin';

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/dashboard" className="navbar-brand">
          📋 Daily Task Manager
        </Link>
        <div className="navbar-links">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          {canViewTeam && <Link to="/tasks" className="nav-link">Tasks</Link>}
          {canViewTeam && <Link to="/timeline" className="nav-link">Timeline</Link>}
          <Link to="/standup" className="nav-link">Standup</Link>
          <Link to="/my-standups" className="nav-link">My Standups</Link>
          {canViewTeam && <Link to="/team" className="nav-link">Team</Link>}
        </div>
        <div className="user-info">
          <span className={`badge badge-${user?.role || 'member'}`}>
            {user?.role || 'Member'}
          </span>
          <span>{user?.name}</span>
          <button onClick={logout} className="ghost-btn" style={{ padding: '8px 16px', fontSize: '14px' }}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

