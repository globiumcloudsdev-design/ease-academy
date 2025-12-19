'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export default function TeacherProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    qualification: '',
    experience: '',
    subjects: [],
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.TEACHER.PROFILE);
      if (response.success) {
        setProfile(response.data.teacher);
        setFormData({
          firstName: response.data.teacher.firstName || '',
          lastName: response.data.teacher.lastName || '',
          email: response.data.teacher.email || '',
          phone: response.data.teacher.phone || '',
          address: response.data.teacher.address || '',
          dateOfBirth: response.data.teacher.dateOfBirth ? response.data.teacher.dateOfBirth.split('T')[0] : '',
          gender: response.data.teacher.gender || '',
          qualification: response.data.teacher.qualification || '',
          experience: response.data.teacher.experience || '',
          subjects: response.data.teacher.subjects?.map(s => s._id) || [],
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await apiClient.put(API_ENDPOINTS.TEACHER.PROFILE_UPDATE, formData);
      if (response.success) {
        alert('Profile updated successfully!');
        setIsEditMode(false);
        fetchProfile();
        updateUser(response.data.teacher);
      }
    } catch (error) {
      alert(error.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      phone: profile.phone || '',
      address: profile.address || '',
      dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
      gender: profile.gender || '',
      qualification: profile.qualification || '',
      experience: profile.experience || '',
      subjects: profile.subjects?.map(s => s._id) || [],
    });
    setIsEditMode(false);
  };

  if (loading) {
    return <FullPageLoader message="Loading profile..." />;
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
            <p className="text-muted-foreground">Failed to load profile</p>
            <button
              onClick={fetchProfile}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Teacher Profile
            </CardTitle>
            {!isEditMode && (
              <Button onClick={() => setIsEditMode(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name *</label>
                  {isEditMode ? (
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg">{profile.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name *</label>
                  {isEditMode ? (
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg">{profile.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  {isEditMode ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {profile.email}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  {isEditMode ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {profile.phone || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  {isEditMode ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  {isEditMode ? (
                    <Dropdown
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      options={[
                        { value: '', label: 'Select Gender' },
                        ...GENDER_OPTIONS,
                      ]}
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg capitalize">
                      {profile.gender || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Address</label>
                {isEditMode ? (
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                  />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1" />
                    {profile.address || 'Not provided'}
                  </p>
                )}
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Qualification</label>
                  {isEditMode ? (
                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., M.Sc. Mathematics"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg">
                      {profile.qualification || 'Not provided'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Experience (Years)</label>
                  {isEditMode ? (
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="0"
                      placeholder="e.g., 5"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg">
                      {profile.experience ? `${profile.experience} years` : 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Employee ID</label>
                  <p className="px-3 py-2 bg-gray-50 rounded-lg">{profile.employeeId || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <p className="px-3 py-2 bg-gray-50 rounded-lg">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        profile.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {profile.status}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Joining Date</label>
                  <p className="px-3 py-2 bg-gray-50 rounded-lg">
                    {profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : 'Not available'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Updated</label>
                  <p className="px-3 py-2 bg-gray-50 rounded-lg">
                    {profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'Not available'}
                  </p>
                </div>
              </div>
            </div>

            {/* Edit Mode Actions */}
            {isEditMode && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <ButtonLoader /> : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
