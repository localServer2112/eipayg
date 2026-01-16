import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { cardsApi, Card as CardType } from '../api/cards';
import { accountsApi } from '../api/accounts';
import { storagesApi } from '../api/storages';
import { Transaction } from '../api/types';
import api from '../api/index';
import { toast } from 'sonner';

// Web Serial API type declarations
interface SerialPort {
    open(options: { baudRate: number }): Promise<void>;
    close(): Promise<void>;
    readable: ReadableStream<Uint8Array> | null;
}

interface Serial {
    requestPort(): Promise<SerialPort>;
}

declare global {
    interface Navigator {
        serial?: Serial;
    }
}

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
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats>({
        totalCards: 0,
        activeCards: 0,
        activeStorage: 0,
        totalBalance: '0',
    });
    const [recentActivity, setRecentActivity] = useState<TransactionWithMeta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [scanStatus, setScanStatus] = useState<string>('');
    const portRef = useRef<SerialPort | null>(null);
    const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

    // Assign Card Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignCardUuid, setAssignCardUuid] = useState('');
    const [assignUserPhone, setAssignUserPhone] = useState('');
    const [assignInitialBalance, setAssignInitialBalance] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);

    // Handle scanned card data - check if assigned, if not open modal
    const handleScannedCard = async (cardUuid: string) => {
        setScanStatus(`Checking card ${cardUuid}...`);
        try {
            // Fetch all cards and check if this UUID exists and is assigned
            const response = await cardsApi.list();
            // @ts-ignore
            const cards: CardType[] = Array.isArray(response.data) ? response.data : (response.data.results || []);

            const existingCard = cards.find(card => card.uuid === cardUuid);

            if (existingCard && existingCard.user_phone) {
                // Card is already assigned - navigate to view card page
                setScanStatus(`Card assigned. Redirecting to card details...`);
                toast.info(`Card found! Viewing details...`);
                navigate(`/viewcard/${existingCard.uuid}`);
            } else {
                // Card not assigned - open modal with pre-filled UUID
                setAssignCardUuid(cardUuid);
                setAssignUserPhone('');
                setAssignInitialBalance('');
                setIsAssignModalOpen(true);
                setScanStatus('Card not assigned. Please fill in the details.');
            }
        } catch (error) {
            console.error('Error checking card:', error);
            // If card doesn't exist in system, open modal to assign it
            setAssignCardUuid(cardUuid);
            setAssignUserPhone('');
            setAssignInitialBalance('');
            setIsAssignModalOpen(true);
            setScanStatus('New card detected. Please fill in the details.');
        }
    };

    // Handle assign card form submission
    const handleAssignCard = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAssigning(true);
        try {
            await cardsApi.assign({
                card_uuid: assignCardUuid,
                user_phone: assignUserPhone,
                initial_balance: assignInitialBalance || '0'
            });
            toast.success('Card assigned successfully');
            setIsAssignModalOpen(false);
            setAssignCardUuid('');
            setAssignUserPhone('');
            setAssignInitialBalance('');
            setScanStatus('Card assigned successfully!');
            fetchDashboardData(); // Refresh dashboard data
        } catch (error: any) {
            console.error('Failed to assign card:', error);
            const errorData = error.response?.data;
            let errorMessage = 'Failed to assign card';
            if (errorData) {
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else {
                    errorMessage = JSON.stringify(errorData);
                }
            }
            toast.error(errorMessage);
        } finally {
            setIsAssigning(false);
        }
    };

    const handleBeginScan = async () => {
        setIsScanning(true);
        setScanStatus('Initializing scan...');

        // Check if Web Serial API is supported
        if (!('serial' in navigator)) {
            console.log('Web Serial API not supported in this browser');
            setScanStatus('Web Serial API not supported. Using test data...');

            // Use test JSON data
            const testData = { card_uuid: "test-2c963f66afa6" };
            console.log('Using test JSON data:', testData);
            setIsScanning(false);
            await handleScannedCard(testData.card_uuid);
            return;
        }

        try {
            // Request a serial port
            console.log('Requesting serial port...');
            setScanStatus('Waiting for USB device selection...');

            const port = await navigator.serial!.requestPort();
            portRef.current = port;

            console.log('Serial port selected, opening connection...');
            setScanStatus('USB device detected. Opening connection...');

            // Open the serial port with common ESP32 settings
            await port.open({ baudRate: 115200 });
            console.log('Serial port opened successfully');
            setScanStatus('Connected to ESP32. Listening for data...');

            // Read data from the serial port
            const decoder = new TextDecoder();
            let buffer = '';

            if (port.readable) {
                const reader = port.readable.getReader();
                readerRef.current = reader;

                try {
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) {
                            console.log('Serial port stream closed');
                            break;
                        }

                        // Decode the received data
                        const chunk = decoder.decode(value, { stream: true });
                        buffer += chunk;
                        console.log('Received chunk:', chunk);

                        // Try to parse JSON from buffer (look for complete JSON objects)
                        const jsonMatch = buffer.match(/\{[^{}]*\}/);
                        if (jsonMatch) {
                            try {
                                const jsonData = JSON.parse(jsonMatch[0]);
                                console.log('Parsed JSON data from ESP32:', jsonData);

                                // Clear the matched part from buffer
                                buffer = buffer.substring(buffer.indexOf(jsonMatch[0]) + jsonMatch[0].length);

                                // Handle the scanned card
                                if (jsonData.card_uuid) {
                                    await handleScannedCard(jsonData.card_uuid);
                                }
                            } catch (parseError) {
                                console.log('JSON parse error, waiting for more data...');
                            }
                        }
                    }
                } catch (readError) {
                    console.error('Error reading from serial port:', readError);
                } finally {
                    reader.releaseLock();
                }
            }
        } catch (error) {
            // User cancelled or no device selected
            if (error instanceof DOMException && error.name === 'NotFoundError') {
                console.log('No USB device selected by user');
                setScanStatus('No USB device selected. Using test data...');
            } else {
                console.error('Error accessing serial port:', error);
                setScanStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}. Using test data...`);
            }

            // Fallback to test JSON data
            const testData = { card_uuid: "test-2c963f66afa6" };
            console.log('Using test JSON data:', testData);
            await handleScannedCard(testData.card_uuid);
        } finally {
            setIsScanning(false);
        }
    };

    const handleStopScan = async () => {
        try {
            if (readerRef.current) {
                await readerRef.current.cancel();
                readerRef.current = null;
            }
            if (portRef.current) {
                await portRef.current.close();
                portRef.current = null;
            }
            setScanStatus('Scan stopped');
            console.log('Serial port closed');
        } catch (error) {
            console.error('Error closing serial port:', error);
        }
        setIsScanning(false);
    };

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
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground">Overview of system performance.</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {isScanning ? (
                            <Button onClick={handleStopScan} variant="destructive">
                                Stop Scan
                            </Button>
                        ) : (
                            <Button onClick={handleBeginScan}>
                                Begin Scan
                            </Button>
                        )}
                        {scanStatus && (
                            <p className="text-sm text-muted-foreground max-w-xs text-right">
                                {scanStatus}
                            </p>
                        )}
                    </div>
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

            {/* Assign Card Modal */}
            {isAssignModalOpen && (
                <Modal
                    isOpen={isAssignModalOpen}
                    onClose={() => setIsAssignModalOpen(false)}
                    title="Assign Card"
                >
                    <form onSubmit={handleAssignCard} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="cardUuid">Card UUID</label>
                            <Input
                                id="cardUuid"
                                value={assignCardUuid}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssignCardUuid(e.target.value)}
                                placeholder="e.g. 4819e245-ebd8-406f-b09d-8078ea72e3a8"
                                required
                                readOnly
                                className="bg-gray-100"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="userPhone">User Phone</label>
                            <Input
                                id="userPhone"
                                value={assignUserPhone}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssignUserPhone(e.target.value)}
                                placeholder="e.g. 0504567891"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="initialBalance">Initial Balance</label>
                            <Input
                                id="initialBalance"
                                type="number"
                                value={assignInitialBalance}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssignInitialBalance(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button type="button" variant="ghost" onClick={() => setIsAssignModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isAssigning}>
                                {isAssigning ? 'Assigning...' : 'Assign Card'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}
        </MainLayout>
    );
};

export default Dashboard;
