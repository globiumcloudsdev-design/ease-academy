'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, UserPlus, Settings, FileSearch, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      id: 'generate-report',
      label: 'Generate Report',
      icon: FileText,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => router.push('/super-admin/analytics/financial'),
    },
    {
      id: 'add-branch',
      label: 'Add New Branch',
      icon: Plus,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => router.push('/super-admin/branches'),
    },
    {
      id: 'create-admin',
      label: 'Create Admin',
      icon: UserPlus,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => router.push('/super-admin/user-management/administrators'),
    },
    {
      id: 'system-settings',
      label: 'System Settings',
      icon: Settings,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => router.push('/super-admin/configuration/general'),
    },
    {
      id: 'audit-logs',
      label: 'View Audit Logs',
      icon: FileSearch,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      action: () => router.push('/super-admin/audit-logs/activity'),
    },
    {
      id: 'notifications',
      label: 'Notification Center',
      icon: Bell,
      color: 'bg-pink-500 hover:bg-pink-600',
      action: () => router.push('/super-admin/notifications'),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                onClick={action.action}
                className={`${action.color} text-white flex flex-col items-center justify-center h-24 space-y-2`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium text-center">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
