import React, { useEffect, useState } from 'react';
import { FiX, FiSend } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import api from '../utils/api';

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const statusOptions = [
  { value: 'todo', label: 'To do' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
];

const defaultFormState = (fallbackAssignee) => ({
  title: '',
  project: '',
  description: '',
  priority: 'medium',
  status: 'todo',
  dueDate: format(new Date(), 'yyyy-MM-dd'),
  assignee: fallbackAssignee || '',
});

const TaskDrawer = ({ open, onClose, onSuccess, users, currentUser, task }) => {
  const [formData, setFormData] = useState(defaultFormState(currentUser?._id));
  const [submitting, setSubmitting] = useState(false);

  const canAssign = currentUser && ['lead', 'admin'].includes(currentUser.role);
  const isEditing = Boolean(task);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setFormData({
        title: task.title || '',
        project: task.project || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        assignee: task.assignee?._id || currentUser?._id || '',
      });
    } else {
      const fallbackAssignee = canAssign
        ? users?.[0]?._id || currentUser?._id || ''
        : currentUser?._id || '';
      setFormData(defaultFormState(fallbackAssignee));
    }
  }, [open, task, users, currentUser, canAssign]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing) {
        await api.put(`/api/tasks/${task._id}`, {
          ...formData,
          assignee: canAssign ? formData.assignee : undefined,
        });
        toast.success('Task updated');
      } else {
        await api.post('/api/tasks', {
          ...formData,
          assignee: canAssign ? formData.assignee : undefined,
        });
        toast.success('Task created');
      }
      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save task');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="task-drawer-overlay" onClick={onClose}>
      <div className="task-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <h3 style={{ marginBottom: 4 }}>{isEditing ? 'Edit Task' : 'Create Task'}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {isEditing ? 'Update assignment, status, or notes' : 'Assign work, set project and due date'}
            </p>
          </div>
          <button className="ghost-btn" onClick={onClose} aria-label="Close task composer">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label>Task title</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. API integration for payments"
              required
            />
          </div>

          <div className="form-group">
            <label>Project</label>
            <input
              name="project"
              value={formData.project}
              onChange={handleChange}
              placeholder="Project name"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Share goals, acceptance criteria or links"
              rows={4}
            />
          </div>

          <div className="filters-grid">
            <div className="form-group">
              <label>Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange}>
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="filters-grid">
            <div className="form-group">
              <label>Due date</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>
            {canAssign ? (
              <div className="form-group">
                <label>Assign to</label>
                <select name="assignee" value={formData.assignee} onChange={handleChange}>
                  {users?.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} • {member.team}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label>Assignee</label>
                <input
                  value={
                    task?.assignee?.name ||
                    (currentUser ? currentUser.name : '')
                  }
                  readOnly
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="primary-btn"
            disabled={submitting}
          >
            <FiSend size={16} />
            {submitting ? (isEditing ? 'Updating...' : 'Creating...') : isEditing ? 'Save changes' : 'Create task'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskDrawer;

