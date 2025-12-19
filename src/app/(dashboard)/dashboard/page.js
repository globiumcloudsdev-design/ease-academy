import { Card } from '@/components/ui/card';

export default function DashboardPage() {
  const stats = [
    { title: 'Total Students', value: '1,234', icon: '👨‍🎓', color: 'bg-blue-500' },
    { title: 'Total Teachers', value: '89', icon: '👨‍🏫', color: 'bg-green-500' },
    { title: 'Total Classes', value: '45', icon: '🏫', color: 'bg-purple-500' },
    { title: 'Total Revenue', value: '$52,340', icon: '💰', color: 'bg-yellow-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">👨‍🎓</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">New student enrolled</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pb-3 border-b">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">✅</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Attendance marked for Class 10A</p>
                <p className="text-xs text-gray-500">3 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">📝</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">New exam scheduled</p>
                <p className="text-xs text-gray-500">5 hours ago</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Events</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-sm font-bold">
                15<br/>DEC
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Annual Sports Day</p>
                <p className="text-xs text-gray-500">Main Campus Ground</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pb-3 border-b">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-sm font-bold">
                20<br/>DEC
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Parent-Teacher Meeting</p>
                <p className="text-xs text-gray-500">All Branches</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pb-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-sm font-bold">
                25<br/>DEC
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Winter Break Starts</p>
                <p className="text-xs text-gray-500">All Campuses</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
