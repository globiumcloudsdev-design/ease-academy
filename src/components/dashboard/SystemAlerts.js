'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react';
import { useState } from 'react';

const alertIcons = {
  high: AlertTriangle,
  medium: AlertCircle,
  low: Info,
};

const alertColors = {
  high: {
    bg: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    badge: 'bg-red-100 text-red-800',
  },
  medium: {
    bg: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-600',
    badge: 'bg-yellow-100 text-yellow-800',
  },
  low: {
    bg: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-800',
  },
};

export default function SystemAlerts({ alerts }) {
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  const defaultAlerts = [
    {
      id: 1,
      priority: 'high',
      category: 'System',
      title: 'High Server Load Detected',
      message: 'Server CPU usage exceeded 85% in the last hour',
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      actionRequired: true,
    },
    {
      id: 2,
      priority: 'high',
      category: 'Financial',
      title: 'Low Fee Collection Rate',
      message: 'South Branch fee collection below 70% for this month',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      actionRequired: true,
    },
    {
      id: 3,
      priority: 'medium',
      category: 'Academic',
      title: 'Attendance Alert',
      message: '15 students with attendance below 75% this month',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      actionRequired: true,
    },
    {
      id: 4,
      priority: 'medium',
      category: 'System',
      title: 'Backup Pending',
      message: 'Database backup not completed in last 24 hours',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      actionRequired: false,
    },
    {
      id: 5,
      priority: 'low',
      category: 'User',
      title: 'Inactive Accounts',
      message: '8 admin accounts haven\'t logged in for 30+ days',
      timestamp: new Date(Date.now() - 1000 * 60 * 120),
      actionRequired: false,
    },
  ];

  const alertList = (alerts || defaultAlerts).filter(
    (alert) => !dismissedAlerts.includes(alert.id)
  );

  const handleDismiss = (alertId) => {
    setDismissedAlerts([...dismissedAlerts, alertId]);
  };

  const handleAcknowledge = (alertId) => {
    console.log('Acknowledged alert:', alertId);
    // TODO: API call to acknowledge alert
  };

  return (
    <Card className="col-span-1 lg:col-span-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">System Alerts</CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              {alertList.filter((a) => a.priority === 'high').length} High Priority
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {alertList.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600">No active alerts</p>
              <p className="text-xs text-gray-500 mt-1">System is running smoothly</p>
            </div>
          ) : (
            alertList.map((alert) => {
              const Icon = alertIcons[alert.priority];
              const colors = alertColors[alert.priority];

              return (
                <div
                  key={alert.id}
                  className={`${colors.bg} border rounded-lg p-4 relative`}
                >
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="flex items-start space-x-3 mb-2">
                    <Icon className={`h-5 w-5 ${colors.icon} mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${colors.badge}`}>
                          {alert.priority.toUpperCase()}
                        </span>
                        <span className="text-xs bg-white px-2 py-1 rounded border">
                          {alert.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-gray-600">{alert.message}</p>
                    </div>
                  </div>

                  {alert.actionRequired && (
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-500">Action Required</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledge(alert.id)}
                        className="text-xs h-7"
                      >
                        Acknowledge
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    {alert.timestamp.toLocaleString()}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
