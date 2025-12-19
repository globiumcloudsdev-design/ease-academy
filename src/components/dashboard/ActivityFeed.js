'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, UserPlus, FileEdit, Trash2, Settings, DollarSign, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const activityIcons = {
  user_created: UserPlus,
  branch_updated: FileEdit,
  fee_collected: DollarSign,
  settings_changed: Settings,
  user_deleted: Trash2,
  default: User,
};

const activityColors = {
  user_created: 'text-green-600 bg-green-50',
  branch_updated: 'text-blue-600 bg-blue-50',
  fee_collected: 'text-purple-600 bg-purple-50',
  settings_changed: 'text-orange-600 bg-orange-50',
  user_deleted: 'text-red-600 bg-red-50',
  default: 'text-gray-600 bg-gray-50',
};

export default function ActivityFeed({ activities }) {
  const defaultActivities = [
    {
      id: 1,
      type: 'user_created',
      user: 'Ahmed Ali',
      action: 'created a new branch admin',
      target: 'North Branch',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      branch: 'Main Campus',
    },
    {
      id: 2,
      type: 'branch_updated',
      user: 'Sara Khan',
      action: 'updated branch information',
      target: 'South Branch',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      branch: 'South Branch',
    },
    {
      id: 3,
      type: 'fee_collected',
      user: 'System',
      action: 'processed fee payment',
      target: '₨25,000',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      branch: 'East Branch',
    },
    {
      id: 4,
      type: 'settings_changed',
      user: 'Admin',
      action: 'modified system settings',
      target: 'Academic Year Configuration',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      branch: 'System',
    },
    {
      id: 5,
      type: 'user_created',
      user: 'Fatima Ahmed',
      action: 'enrolled a new student',
      target: 'Grade 5-A',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      branch: 'North Branch',
    },
    {
      id: 6,
      type: 'branch_updated',
      user: 'Hassan Raza',
      action: 'updated fee structure',
      target: 'Monthly Fees',
      timestamp: new Date(Date.now() - 1000 * 60 * 90),
      branch: 'Main Campus',
    },
  ];

  const activityList = activities || defaultActivities;

  return (
    <Card className="col-span-1 lg:col-span-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" className="text-sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {activityList.map((activity) => {
            const Icon = activityIcons[activity.type] || activityIcons.default;
            const colorClass = activityColors[activity.type] || activityColors.default;

            return (
              <div
                key={activity.id}
                className="flex items-start space-x-3 pb-4 border-b last:border-b-0"
              >
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    <span className="font-semibold">{activity.user}</span>{' '}
                    {activity.action}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Target: <span className="font-medium">{activity.target}</span>
                  </p>
                  <div className="flex items-center mt-2 space-x-3">
                    <span className="inline-flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {activity.branch}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
