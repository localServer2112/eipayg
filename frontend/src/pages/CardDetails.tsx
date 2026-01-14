import React, { useState } from 'react';
import { MainLayout } from '../layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useNavigate } from 'react-router-dom';
import { ArrowDownLeft, Search, Plus, Edit2, ChevronLeft } from 'lucide-react';

const CardDetails: React.FC = () => {
    const navigate = useNavigate();
    // Mock Data based on the "Customer Detailed Dashboard" analysis
    const card = {
        uuid: '123-abc-456',
        name_on_card: 'John Doe',
        user_phone: '1234567890',
        is_blocked: false,
        balance: '15,450.00',
        created_at: '2025-01-01',
        cold_room_id: 'CR-Lagos-01'
    };

    const deposits = [
        { id: 1, amount: '5,000.00', date: 'Jan 10, 14:30', source: 'Bank Transfer' },
        { id: 2, amount: '10,000.00', date: 'Jan 05, 09:00', source: 'POS Terminal' },
        { id: 3, amount: '2,000.00', date: 'Jan 02, 11:20', source: 'Cash Agent' },
    ];

    const spendings = [
        { id: 1, item: 'Frozen Mackerel', qty: '20kg', amount: '4,500.00', date: 'Jan 12, 09:15', room: 'CR-A' },
        { id: 2, item: 'Ice Block', qty: '50 units', amount: '2,500.00', date: 'Jan 13, 11:20', room: 'CR-B' },
        { id: 3, item: 'Storage Fee', qty: '1 week', amount: '1,000.00', date: 'Jan 14, 08:00', room: 'CR-A' },
    ];

    const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('');

    const handleTopUp = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`Top up of ${topUpAmount} successful!`);
        setIsTopUpModalOpen(false);
        setTopUpAmount('');
    };

    return (
        <MainLayout>
            {/* Hero / Back Navigation */}
            <div className="mb-6">
                <Button
                    variant="ghost"
                    className="pl-0 mb-4 hover:bg-transparent hover:text-brand"
                    onClick={() => navigate('/cards')}
                >
                    <ChevronLeft className="h-4 w-4 mr-2" /> Back to Cards
                </Button>

                {/* Profile Card Header */}
                <Card className="border-0 shadow-sm bg-white overflow-hidden">
                    <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-500">
                                {card.name_on_card.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{card.name_on_card}</h1>
                                <p className="text-gray-500 text-sm font-mono">UID: {card.uuid}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${!card.is_blocked ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {!card.is_blocked ? 'Active Status' : 'Blocked'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Balance & Actions */}
                        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                            <div className="text-right">
                                <p className="text-sm text-gray-500 mb-1">Total Balance</p>
                                <h2 className="text-4xl font-bold tracking-tight text-gray-900">₦{card.balance}</h2>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <Button variant="outline" className="flex-1 md:flex-none">
                                    <Edit2 className="h-4 w-4 mr-2" /> Edit Details
                                </Button>
                                <Button
                                    className="flex-1 md:flex-none bg-black text-white hover:bg-gray-800"
                                    onClick={() => setIsTopUpModalOpen(true)}
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Top Up Balance
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Split Layout: Deposits (Left) & Spendings (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Recent Deposits (Narrower) */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Recent Deposits</h3>
                        <Button variant="ghost" size="sm" className="text-brand">View All</Button>
                    </div>
                    {/* Deposit Filter/Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search deposits..." className="pl-9 bg-white" />
                    </div>

                    <div className="space-y-3">
                        {deposits.map((dept) => (
                            <Card key={dept.id} className="p-4 flex items-center justify-between hover:border-brand/50 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                                        <ArrowDownLeft className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{dept.source}</p>
                                        <p className="text-xs text-gray-500">{dept.date}</p>
                                    </div>
                                </div>
                                <span className="font-bold text-green-600">+₦{dept.amount}</span>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Right Column: Spendings (Wider) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Spending History</h3>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">Export</Button>
                            <Button variant="outline" size="sm">Filter</Button>
                        </div>
                    </div>
                    {/* Spending Search */}
                    <div className="relative max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search by item or date..." className="pl-9 bg-white" />
                    </div>

                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Item Details</th>
                                        <th className="px-6 py-3 font-medium">Quantity</th>
                                        <th className="px-6 py-3 font-medium">Location</th>
                                        <th className="px-6 py-3 font-medium">Date</th>
                                        <th className="px-6 py-3 font-medium text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {spendings.map((tx) => (
                                        <tr key={tx.id} className="bg-white hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{tx.item}</td>
                                            <td className="px-6 py-4">{tx.qty}</td>
                                            <td className="px-6 py-4 text-brand">{tx.room}</td>
                                            <td className="px-6 py-4 text-gray-500">{tx.date}</td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900">-₦{tx.amount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>

            <Modal
                isOpen={isTopUpModalOpen}
                onClose={() => setIsTopUpModalOpen(false)}
                title="Top Up Card Balance"
            >
                <form onSubmit={handleTopUp} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="amount">Amount (₦)</label>
                        <Input
                            id="amount"
                            type="number"
                            value={topUpAmount}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopUpAmount(e.target.value)}
                            placeholder="Min 500"
                            className="text-lg font-medium"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsTopUpModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-black text-white">Confirm Top Up</Button>
                    </div>
                </form>
            </Modal>
        </MainLayout>
    );
};

export default CardDetails;
