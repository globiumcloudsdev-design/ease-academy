'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Save, X } from 'lucide-react';
import { useState } from 'react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
        <Button
          variant={isEditing ? "outline" : "default"}
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2"
        >
          {isEditing ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Pencil className="h-4 w-4" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold mb-4">
                  {user.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{user.fullName || user.name || 'N/A'}</h2>
                <p className="text-sm text-gray-500 mt-1">{user.email || 'N/A'}</p>
                
                <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {user.role?.replace('_', ' ').toUpperCase() || 'USER'}
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4 w-full">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{user.status === 'active' ? '✅' : '❌'}</p>
                    <p className="text-xs text-gray-500 mt-1">Status</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{user.emailVerified ? '✅' : '❌'}</p>
                    <p className="text-xs text-gray-500 mt-1">Verified</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Login</span>
                  <span className="text-sm font-medium">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-medium">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Branch</span>
                  <span className="text-sm font-medium">
                    {user.role === 'super_admin' ? 'All Branches' : (user.branchName || user.branchId?.name || 'N/A')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-blue-100 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                </div>
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</label>
                  <p className="text-sm font-medium text-gray-900">{user.fullName || user.name || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Email</label>
                  <p className="text-sm font-medium text-gray-900">{user.email || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</label>
                  <p className="text-sm font-medium text-gray-900">{user.phone || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Role</label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {user.role || 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          {user.address && Object.values(user.address).some(val => val) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded bg-green-100 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-green-600"></div>
                  </div>
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.address.street && (
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Street</label>
                      <p className="text-sm font-medium text-gray-900">{user.address.street}</p>
                    </div>
                  )}
                  {user.address.city && (
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">City</label>
                      <p className="text-sm font-medium text-gray-900">{user.address.city}</p>
                    </div>
                  )}
                  {user.address.state && (
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">State</label>
                      <p className="text-sm font-medium text-gray-900">{user.address.state}</p>
                    </div>
                  )}
                  {user.address.postalCode && (
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Postal Code</label>
                      <p className="text-sm font-medium text-gray-900">{user.address.postalCode}</p>
                    </div>
                  )}
                  {user.address.country && (
                    <div className="md:col-span-2 space-y-1">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Country</label>
                      <p className="text-sm font-medium text-gray-900">{user.address.country}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Role Specific Information */}
          {user.role === 'student' && user.studentProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded bg-purple-100 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-purple-600"></div>
                  </div>
                  Student Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Number</label>
                    <p className="text-sm font-medium text-gray-900">{user.studentProfile.registrationNumber || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Roll Number</label>
                    <p className="text-sm font-medium text-gray-900">{user.studentProfile.rollNumber || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Section</label>
                    <p className="text-sm font-medium text-gray-900">{user.studentProfile.section || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Admission Date</label>
                    <p className="text-sm font-medium text-gray-900">
                      {user.studentProfile.admissionDate ? new Date(user.studentProfile.admissionDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</label>
                    <p className="text-sm font-medium text-gray-900">{user.studentProfile.academicYear || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {user.role === 'teacher' && user.teacherProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded bg-yellow-100 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-yellow-600"></div>
                  </div>
                  Teacher Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</label>
                    <p className="text-sm font-medium text-gray-900">{user.teacherProfile.employeeId || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</label>
                    <p className="text-sm font-medium text-gray-900">{user.teacherProfile.designation || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Department</label>
                    <p className="text-sm font-medium text-gray-900">{user.teacherProfile.department || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Joining Date</label>
                    <p className="text-sm font-medium text-gray-900">
                      {user.teacherProfile.joiningDate ? new Date(user.teacherProfile.joiningDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</label>
                    <p className="text-sm font-medium text-gray-900">
                      {user.teacherProfile.experience?.totalYears ? `${user.teacherProfile.experience.totalYears} years` : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {user.role === 'parent' && user.parentProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded bg-pink-100 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-pink-600"></div>
                  </div>
                  Parent Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Occupation</label>
                    <p className="text-sm font-medium text-gray-900">{user.parentProfile.occupation || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Income</label>
                    <p className="text-sm font-medium text-gray-900">
                      {user.parentProfile.income ? `PKR ${user.parentProfile.income.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Children</label>
                    <p className="text-sm font-medium text-gray-900">
                      {user.parentProfile.children?.length || 0} children
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {user.role === 'branch_admin' && user.adminProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded bg-red-100 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-red-600"></div>
                  </div>
                  Admin Permissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Permissions</label>
                  <div className="flex flex-wrap gap-2">
                    {user.adminProfile.permissions?.map((permission, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {permission}
                      </span>
                    )) || <span className="text-sm text-gray-500">No permissions assigned</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-gray-100 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                </div>
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Account Created</label>
                  <p className="text-sm font-medium text-gray-900">
                    {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</label>
                  <p className="text-sm font-medium text-gray-900">
                    {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Remarks */}
          {user.remarks && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded bg-orange-100 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-orange-600"></div>
                  </div>
                  Remarks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {user.remarks}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}