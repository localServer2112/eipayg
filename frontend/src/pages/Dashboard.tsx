
import { MainLayout } from '../layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const StatCard = ({ title, value, change, isPositive }: any) => (
    <Card className="flex-1 min-w-[200px] border-l-4 border-l-brand shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <div className={`p-2 rounded-full ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {/* Icon placeholder */}
                <div className="w-2 h-2 bg-current rounded-full"></div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
                <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                    {change}
                </span>
                <span className="ml-1 text-gray-400">vs last month</span>
            </p>
        </CardContent>
    </Card>
);

const Dashboard = () => {
    // Mock Data
    const stats = [
        { title: 'Total Users', value: '12,345', change: '+12%', isPositive: true },
        { title: 'Cards Active', value: '8,432', change: '+5%', isPositive: true },
        { title: 'Storage Usage', value: '78%', change: '-2%', isPositive: false },
        { title: 'Revenue', value: '₦4.2M', change: '+18%', isPositive: true },
    ];

    const recentActivity = [
        { id: 1, user: 'John Doe', action: 'Top-up', amount: '₦5,000', time: '2 mins ago' },
        { id: 2, user: 'Sarah Smith', action: 'Check-in', amount: '20kg Fish', time: '15 mins ago' },
        { id: 3, user: 'Mike Johnson', action: 'Card Assigned', amount: '-', time: '1 hour ago' },
        { id: 4, user: 'Jane Doe', action: 'Check-out', amount: '₦2,300', time: '3 hours ago' },
        { id: 5, user: 'Chris Wilson', action: 'Top-up', amount: '₦10,000', time: '5 hours ago' },
    ];

    return (
        <MainLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Overview of system performance.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, index) => (
                        <StatCard key={index} {...stat} />
                    ))}
                </div>

                {/* Recent Activity */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-muted-foreground border-b">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">User</th>
                                        <th className="px-4 py-3 font-medium">Action</th>
                                        <th className="px-4 py-3 font-medium">Details</th>
                                        <th className="px-4 py-3 font-medium text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentActivity.map((activity) => (
                                        <tr key={activity.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 font-medium">{activity.user}</td>
                                            <td className="px-4 py-3">{activity.action}</td>
                                            <td className="px-4 py-3">{activity.amount}</td>
                                            <td className="px-4 py-3 text-right text-muted-foreground">{activity.time}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
};

export default Dashboard;
