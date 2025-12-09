import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { adminService } from '../services/adminService';
import '../styles/UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [counters, setCounters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'operator',
    counterId: '',
    departmentId: '',
    permissions: {
      canGenerateTickets: false,
      canCallTokens: false,
      canManageCounters: false,
      canViewReports: false
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadCounters();
    loadDepartments();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const result = await authService.getUsers();
      if (result.success) {
        setUsers(result.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Error loading users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCounters = async () => {
    try {
      const countersData = await adminService.getCounters();
      setCounters(countersData);
    } catch (error) {
      console.error('Error loading counters:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const departmentsData = await adminService.getDepartments();
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      const result = await authService.createUser(formData);
      if (result.success) {
        setShowForm(false);
        resetForm();
        loadUsers();
        alert('User created successfully!');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user: ' + error.message);
    }
  };

  const handleUpdateUser = async () => {
    try {
      const result = await authService.updateUser(editingUser._id, formData);
      if (result.success) {
        setShowForm(false);
        setEditingUser(null);
        resetForm();
        loadUsers();
        alert('User updated successfully!');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const result = await authService.deleteUser(userId);
        if (result.success) {
          loadUsers();
          alert('User deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user: ' + error.message);
      }
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Don't pre-fill password for security
      role: user.role,
      counterId: user.counter?._id || '',
      departmentId: user.department?._id || '',
      permissions: user.permissions || {
        canGenerateTickets: false,
        canCallTokens: false,
        canManageCounters: false,
        canViewReports: false
      }
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      role: 'operator',
      counterId: '',
      departmentId: '',
      permissions: {
        canGenerateTickets: false,
        canCallTokens: false,
        canManageCounters: false,
        canViewReports: false
      }
    });
    setEditingUser(null);
    setShowPassword(false);
  };

  const createCounterUser = async (counterId) => {
    const username = `counter${counterId.slice(-4)}`;
    const password = generateRandomPassword();
    
    try {
      const result = await adminService.createCounterUser(counterId, { username, password });
      if (result.success) {
        loadUsers();
        alert(`Counter user created successfully!\nUsername: ${username}\nPassword: ${password}`);
      }
    } catch (error) {
      console.error('Error creating counter user:', error);
      alert('Error creating counter user: ' + error.message);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const getComponentLoginUrl = (user) => {
    const baseUrl = window.location.origin;
    const componentMap = {
      'admin': '/login/admin',
      'dispenser': '/login/dispenser',
      'display': '/login/display',
      'counter': '/login/counter',
      'operator': '/login/counter'
    };
    return `${baseUrl}${componentMap[user.role] || '/login/counter'}`;
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'admin': 'Administrator',
      'operator': 'Operator',
      'dispenser': 'Ticket Dispenser',
      'display': 'Display Screen',
      'counter': 'Counter Staff'
    };
    return roleNames[role] || role;
  };

  return (
    <div className="user-management">
      <div className="management-header">
        <div className="header-content">
          <h1>User Management</h1>
          <p>Manage system users and their access permissions</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <i className="fas fa-user-plus"></i> Create New User
        </button>
      </div>

      {/* Users Table */}
      <div className="users-section">
        <div className="section-header">
          <h3>System Users</h3>
          <div className="section-actions">
            <button 
              className="btn btn-outline btn-sm"
              onClick={loadUsers}
              disabled={loading}
            >
              <i className="fas fa-sync"></i> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i> Loading users...
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Counter</th>
                  <th>Department</th>
                  <th>Permissions</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <UserTableRow 
                    key={user._id}
                    user={user}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                    getLoginUrl={getComponentLoginUrl}
                    getRoleDisplayName={getRoleDisplayName}
                  />
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="7" className="no-data">
                      <i className="fas fa-users"></i>
                      <span>No users found</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Counter Users Section */}
      <div className="counter-users-section">
        <h3>Counter Users</h3>
        <div className="counters-grid">
          {counters.map(counter => {
            const counterUser = users.find(user => 
              user.counter && user.counter._id === counter._id
            );
            return (
              <CounterUserCard 
                key={counter._id}
                counter={counter}
                user={counterUser}
                onCreateUser={createCounterUser}
                onDeleteUser={handleDeleteUser}
                onEditUser={handleEditUser}
              />
            );
          })}
        </div>
      </div>

      {/* User Form Modal */}
      {showForm && (
        <UserFormModal
          formData={formData}
          setFormData={setFormData}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          editingUser={editingUser}
          onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
          onClose={() => {
            setShowForm(false);
            resetForm();
          }}
          counters={counters}
          departments={departments}
        />
      )}
    </div>
  );
};

// User Table Row Component
const UserTableRow = ({ user, onEdit, onDelete, getLoginUrl, getRoleDisplayName }) => (
  <tr className="user-row">
    <td>
      <div className="user-info-cell">
        <div className="user-avatar-small">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="username">{user.username}</div>
          <div className="login-url">
            <a href={getLoginUrl(user)} target="_blank" rel="noopener noreferrer">
              <i className="fas fa-external-link-alt"></i> Login URL
            </a>
          </div>
        </div>
      </div>
    </td>
    <td>
      <span className={`role-badge role-${user.role}`}>
        {getRoleDisplayName(user.role)}
      </span>
    </td>
    <td>
      {user.counter ? `Counter ${user.counter.counterNumber}` : '-'}
    </td>
    <td>
      {user.department ? user.department.name : '-'}
    </td>
    <td>
      <div className="permissions-list">
        {user.permissions.canGenerateTickets && <span className="permission-tag">Generate Tickets</span>}
        {user.permissions.canCallTokens && <span className="permission-tag">Call Tokens</span>}
        {user.permissions.canManageCounters && <span className="permission-tag">Manage Counters</span>}
        {user.permissions.canViewReports && <span className="permission-tag">View Reports</span>}
        {!Object.values(user.permissions).some(Boolean) && <span className="no-permissions">No permissions</span>}
      </div>
    </td>
    <td>
      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
    </td>
    <td>
      <div className="action-buttons">
        <button 
          className="btn btn-outline btn-sm"
          onClick={() => onEdit(user)}
          title="Edit User"
        >
          <i className="fas fa-edit"></i>
        </button>
        <button 
          className="btn btn-danger btn-sm"
          onClick={() => onDelete(user._id)}
          title="Delete User"
        >
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </td>
  </tr>
);

// Counter User Card Component
const CounterUserCard = ({ counter, user, onCreateUser, onDeleteUser, onEditUser }) => (
  <div className="counter-user-card">
    <div className="counter-header">
      <div className="counter-number">Counter {counter.counterNumber}</div>
      <div className="counter-department">{counter.department?.name || 'General'}</div>
      <div className={`counter-status ${counter.status}`}>
        <i className={`fas ${getCounterStatusIcon(counter.status)}`}></i>
        {counter.status}
      </div>
    </div>

    {user ? (
      <div className="user-assigned">
        <div className="assigned-user-info">
          <div className="username">{user.username}</div>
          <div className="user-role">Counter Staff</div>
        </div>
        <div className="user-actions">
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => onEditUser(user)}
            title="Edit User"
          >
            <i className="fas fa-edit"></i>
          </button>
          <button 
            className="btn btn-danger btn-sm"
            onClick={() => onDeleteUser(user._id)}
            title="Delete User"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
    ) : (
      <div className="no-user">
        <div className="no-user-message">
          <i className="fas fa-user-slash"></i>
          <span>No user assigned</span>
        </div>
        <button 
          className="btn btn-primary btn-sm"
          onClick={() => onCreateUser(counter._id)}
        >
          <i className="fas fa-user-plus"></i> Auto Create User
        </button>
      </div>
    )}
  </div>
);

// User Form Modal Component
const UserFormModal = ({ 
  formData, 
  setFormData, 
  showPassword, 
  setShowPassword, 
  editingUser, 
  onSubmit, 
  onClose, 
  counters,
  departments 
}) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h4>{editingUser ? 'Edit User' : 'Create New User'}</h4>
        <button className="btn-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="modal-body">
        <div className="form-grid">
          <div className="form-group">
            <label>Username *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter username"
              required
            />
          </div>
          
          <div className="form-group">
            <label>
              Password {editingUser ? '(leave blank to keep current)' : '*'}
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder={editingUser ? "Enter new password" : "Enter password"}
                required={!editingUser}
              />
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label>Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            >
              <option value="operator">Operator</option>
              <option value="dispenser">Ticket Dispenser</option>
              <option value="display">Display Screen</option>
              <option value="counter">Counter Staff</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {formData.role === 'counter' && (
            <div className="form-group">
              <label>Assign to Counter *</label>
              <select
                value={formData.counterId}
                onChange={(e) => setFormData(prev => ({ ...prev, counterId: e.target.value }))}
                required
              >
                <option value="">Select Counter</option>
                {counters.map(counter => (
                  <option key={counter._id} value={counter._id}>
                    Counter {counter.counterNumber} - {counter.department?.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Department</label>
            <select
              value={formData.departmentId}
              onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="permissions-section">
          <label>Permissions</label>
          <div className="permissions-grid">
            <label className="permission-item">
              <input
                type="checkbox"
                checked={formData.permissions.canGenerateTickets}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  permissions: { ...prev.permissions, canGenerateTickets: e.target.checked }
                }))}
              />
              <span>Generate Tickets</span>
            </label>
            <label className="permission-item">
              <input
                type="checkbox"
                checked={formData.permissions.canCallTokens}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  permissions: { ...prev.permissions, canCallTokens: e.target.checked }
                }))}
              />
              <span>Call Tokens</span>
            </label>
            <label className="permission-item">
              <input
                type="checkbox"
                checked={formData.permissions.canManageCounters}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  permissions: { ...prev.permissions, canManageCounters: e.target.checked }
                }))}
              />
              <span>Manage Counters</span>
            </label>
            <label className="permission-item">
              <input
                type="checkbox"
                checked={formData.permissions.canViewReports}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  permissions: { ...prev.permissions, canViewReports: e.target.checked }
                }))}
              />
              <span>View Reports</span>
            </label>
          </div>
        </div>
      </div>

      <div className="modal-actions">
        <button 
          className="btn btn-success" 
          onClick={onSubmit}
          disabled={!formData.username || (!editingUser && !formData.password) || (formData.role === 'counter' && !formData.counterId)}
        >
          <i className={`fas ${editingUser ? 'fa-save' : 'fa-user-plus'}`}></i>
          {editingUser ? 'Update User' : 'Create User'}
        </button>
        <button className="btn btn-outline" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  </div>
);

// Helper function for counter status icons
const getCounterStatusIcon = (status) => {
  const icons = {
    'active': 'fa-check-circle',
    'busy': 'fa-clock',
    'break': 'fa-coffee',
    'offline': 'fa-power-off'
  };
  return icons[status] || 'fa-question-circle';
};

export default UserManagement;