'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ChevronDown,
  Check,
  X,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [expandedPermissions, setExpandedPermissions] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    status: 'active',
    permissions: {
      users: { view: false, create: false, edit: false, delete: false },
      roles: { view: false, create: false, edit: false, delete: false },
      branches: { view: false, create: false, edit: false, delete: false },
      students: { view: false, create: false, edit: false, delete: false, admit: false, promote: false },
      teachers: { view: false, create: false, edit: false, delete: false, assign: false },
      classes: { view: false, create: false, edit: false, delete: false },
      fees: { view: false, create: false, edit: false, delete: false, collect: false },
      salaries: { view: false, create: false, edit: false, delete: false, process: false },
      examinations: { view: false, create: false, edit: false, delete: false, publish: false },
      attendance: { view: false, mark: false, edit: false, reports: false },
      timetable: { view: false, create: false, edit: false, delete: false },
      events: { view: false, create: false, edit: false, delete: false },
      library: { view: false, create: false, edit: false, delete: false, issue: false },
      transport: { view: false, create: false, edit: false, delete: false },
      reports: { view: false, financial: false, academic: false, operational: false },
      configuration: { view: false, edit: false },
      auditLogs: { view: false },
    },
  });

  const permissionModules = [
    { key: 'users', label: 'User Management', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'roles', label: 'Role Management', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'branches', label: 'Branch Management', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'students', label: 'Student Management', actions: ['view', 'create', 'edit', 'delete', 'admit', 'promote'] },
    { key: 'teachers', label: 'Teacher Management', actions: ['view', 'create', 'edit', 'delete', 'assign'] },
    { key: 'classes', label: 'Class Management', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'fees', label: 'Fee Management', actions: ['view', 'create', 'edit', 'delete', 'collect'] },
    { key: 'salaries', label: 'Salary Management', actions: ['view', 'create', 'edit', 'delete', 'process'] },
    { key: 'examinations', label: 'Examination Management', actions: ['view', 'create', 'edit', 'delete', 'publish'] },
    { key: 'attendance', label: 'Attendance Management', actions: ['view', 'mark', 'edit', 'reports'] },
    { key: 'timetable', label: 'Timetable Management', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'events', label: 'Event Management', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'library', label: 'Library Management', actions: ['view', 'create', 'edit', 'delete', 'issue'] },
    { key: 'transport', label: 'Transport Management', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'reports', label: 'Reports & Analytics', actions: ['view', 'financial', 'academic', 'operational'] },
    { key: 'configuration', label: 'System Configuration', actions: ['view', 'edit'] },
    { key: 'auditLogs', label: 'Audit Logs', actions: ['view'] },
  ];

  useEffect(() => {
    loadRoles();
  }, [searchTerm, statusFilter]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/super-admin/roles?${params}`);
      const data = await res.json();

      if (data.success) {
        setRoles(data.data);
      } else {
        toast.error(data.message || 'Failed to load roles');
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      displayName: '',
      description: '',
      status: 'active',
      permissions: {
        users: { view: false, create: false, edit: false, delete: false },
        roles: { view: false, create: false, edit: false, delete: false },
        branches: { view: false, create: false, edit: false, delete: false },
        students: { view: false, create: false, edit: false, delete: false, admit: false, promote: false },
        teachers: { view: false, create: false, edit: false, delete: false, assign: false },
        classes: { view: false, create: false, edit: false, delete: false },
        fees: { view: false, create: false, edit: false, delete: false, collect: false },
        salaries: { view: false, create: false, edit: false, delete: false, process: false },
        examinations: { view: false, create: false, edit: false, delete: false, publish: false },
        attendance: { view: false, mark: false, edit: false, reports: false },
        timetable: { view: false, create: false, edit: false, delete: false },
        events: { view: false, create: false, edit: false, delete: false },
        library: { view: false, create: false, edit: false, delete: false, issue: false },
        transport: { view: false, create: false, edit: false, delete: false },
        reports: { view: false, financial: false, academic: false, operational: false },
        configuration: { view: false, edit: false },
        auditLogs: { view: false },
      },
    });
    setShowModal(true);
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      status: role.status,
      permissions: role.permissions,
    });
    setShowModal(true);
  };

  const handlePermissionChange = (module, action, value) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [action]: value,
        },
      },
    }));
  };

  const handleModuleToggle = (module) => {
    const allActions = permissionModules.find(m => m.key === module)?.actions || [];
    const currentModule = formData.permissions[module];
    const allChecked = allActions.every(action => currentModule[action]);

    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: allActions.reduce((acc, action) => {
          acc[action] = !allChecked;
          return acc;
        }, {}),
      },
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.displayName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const url = editingRole
        ? `/api/super-admin/roles/${editingRole._id}`
        : '/api/super-admin/roles';

      const method = editingRole ? 'PUT' : 'POST';
      const body = editingRole
        ? {
            displayName: formData.displayName,
            description: formData.description,
            permissions: formData.permissions,
            status: formData.status,
          }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setShowModal(false);
        loadRoles();
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('Failed to save role');
    }
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;

    try {
      const res = await fetch(`/api/super-admin/roles/${roleToDelete._id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Role deleted successfully');
        setShowDeleteModal(false);
        setRoleToDelete(null);
        loadRoles();
      } else {
        toast.error(data.message || 'Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    }
  };

  const togglePermissionExpand = (module) => {
    setExpandedPermissions(prev => ({
      ...prev,
      [module]: !prev[module],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-sm text-gray-600 mt-1">Manage user roles and their permissions</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Role
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Roles</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{roles.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Roles</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {roles.filter(r => r.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">System Roles</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {roles.filter(r => r.isSystem).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Custom Roles</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {roles.filter(r => !r.isSystem).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {roles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No roles found. Create your first role to get started.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{role.displayName}</p>
                        <p className="text-sm text-gray-500">{role.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{role.description || 'No description'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        role.isSystem
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {role.isSystem ? 'System' : 'Custom'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        role.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {role.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{role.createdBy?.name || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(role)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!role.isSystem && (
                          <button
                            onClick={() => {
                              setRoleToDelete(role);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingRole ? 'Edit Role' : 'Create New Role'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={editingRole}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder="e.g., branch_admin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Branch Administrator"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Describe the role and its responsibilities"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Permissions Matrix */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Permissions</h3>
                <div className="space-y-3">
                  {permissionModules.map((module) => {
                    const allChecked = module.actions.every(
                      action => formData.permissions[module.key]?.[action]
                    );
                    const someChecked = module.actions.some(
                      action => formData.permissions[module.key]?.[action]
                    );

                    return (
                      <div key={module.key} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={allChecked}
                              onChange={() => handleModuleToggle(module.key)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <label className="font-medium text-gray-900">{module.label}</label>
                          </div>
                          <button
                            type="button"
                            onClick={() => togglePermissionExpand(module.key)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <ChevronDown
                              className={`w-5 h-5 transition-transform ${
                                expandedPermissions[module.key] ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </div>

                        {expandedPermissions[module.key] && (
                          <div className="px-4 py-3 bg-white grid grid-cols-2 md:grid-cols-4 gap-3">
                            {module.actions.map((action) => (
                              <label key={action} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions[module.key]?.[action] || false}
                                  onChange={(e) =>
                                    handlePermissionChange(module.key, action, e.target.checked)
                                  }
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 capitalize">{action}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Role</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the role "{roleToDelete?.displayName}"? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
