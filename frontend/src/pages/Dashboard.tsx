import { useState, useEffect } from 'react';
import { MainLayout } from '../layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cardsApi } from '../api/cards';
import { accountsApi } from '../api/accounts';
import { storagesApi } from '../api/storages';
import { Transaction } from '../api/types';
import api from '../api/index';

interface Stats {
    totalCards: number;
    activeCards: number;
    activeStorage: number;
    totalBalance: string;
}

interface TransactionWithMeta extends Transaction {
    account_name?: string;
}

const StatCard = ({ title, value, subtitle, isLoading }: { title: string; value: string; subtitle?: string; isLoading?: boolean }) => (
    <Card className="flex-1 min-w-[200px] border-l-4 border-l-brand shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
            ) : (
                <>
                    <div className="text-2xl font-bold tracking-tight">{value}</div>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                    )}
                </>
            )}
        </CardContent>
    </Card>
);

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num).replace('NGN', '₦');
};

const Dashboard = () => {
    const [stats, setStats] = useState<Stats>({
        totalCards: 0,
        activeCards: 0,
        activeStorage: 0,
        totalBalance: '0',
    });
    const [recentActivity, setRecentActivity] = useState<TransactionWithMeta[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);

            // Fetch all data in parallel
            const [cardsResponse, accountsResponse, storagesResponse, transactionsResponse] = await Promise.all([
                cardsApi.list(),
                accountsApi.list(),
                storagesApi.getActive(),
                api.get('/api/transactions/'),
            ]);

            // Process cards data
            // @ts-ignore
            const cards = Array.isArray(cardsResponse.data) ? cardsResponse.data : (cardsResponse.data.results || []);
            const totalCards = cards.length;
            const activeCards = cards.filter((card: any) => !card.is_blocked).length;

            // Process accounts data
            // @ts-ignore
            const accounts = Array.isArray(accountsResponse.data) ? accountsResponse.data : (accountsResponse.data.results || []);
            const totalBalance = accounts.reduce((sum: number, acc: any) => sum + parseFloat(acc.balance || '0'), 0);

            // Process storage data
            const activeStorage = storagesResponse.data.total_active || 0;

            // Process transactions data
            // @ts-ignore
            const transactions = Array.isArray(transactionsResponse.data) ? transactionsResponse.data : (transactionsResponse.data.results || []);

            setStats({
                totalCards,
                activeCards,
                activeStorage,
                totalBalance: totalBalance.toFixed(2),
            });

            setRecentActivity(transactions.slice(0, 10));
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getTransactionAction = (tx: Transaction) => {
        if (tx.transaction_type === 'C' || tx.transaction_type === 'credit') {
            return 'Top-up';
        }
        return 'Debit';
    };

    const getTransactionBadgeClass = (tx: Transaction) => {
        if (tx.transaction_type === 'C' || tx.transaction_type === 'credit') {
            return 'bg-green-100 text-green-700';
        }
        return 'bg-red-100 text-red-700';
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Overview of system performance.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Cards"
                        value={stats.totalCards.toString()}
                        subtitle="Registered cards"
                        isLoading={isLoading}
                    />
                    <StatCard
                        title="Active Cards"
                        value={stats.activeCards.toString()}
                        subtitle="Not blocked"
                        isLoading={isLoading}
                    />
                    <StatCard
                        title="Active Storage"
                        value={stats.activeStorage.toString()}
                        subtitle="Items in storage"
                        isLoading={isLoading}
                    />
                    <StatCard
                        title="Total Balance"
                        value={formatCurrency(stats.totalBalance)}
                        subtitle="Across all accounts"
                        isLoading={isLoading}
                    />
                </div>

                {/* Recent Activity */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-muted-foreground border-b">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Description</th>
                                        <th className="px-4 py-3 font-medium">Type</th>
                                        <th className="px-4 py-3 font-medium">Amount</th>
                                        <th className="px-4 py-3 font-medium text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-8">Loading...</td>
                                        </tr>
                                    ) : recentActivity.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-8 text-muted-foreground">No recent transactions</td>
                                        </tr>
                                    ) : (
                                        recentActivity.map((tx) => (
                                            <tr key={tx.uuid} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                                <td className="px-4 py-3 font-medium">{tx.description}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTransactionBadgeClass(tx)}`}>
                                                        {getTransactionAction(tx)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-semibold">
                                                    {tx.transaction_type === 'C' || tx.transaction_type === 'credit' ? '+' : '-'}
                                                    {formatCurrency(tx.amount)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-muted-foreground">{formatTimeAgo(tx.created)}</td>
                                            </tr>
                                        ))
                                    )}
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
