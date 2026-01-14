import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { MainLayout } from '../layout/MainLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

interface CardData {
    uuid: string;
    name_on_card: string;
    user_phone: string;
    is_blocked: boolean;
    balance: string;
}

const Cards: React.FC = () => {
    // Mock Data
    const [cards, setCards] = useState<CardData[]>([
        { uuid: '123-abc-456', name_on_card: 'John Doe', user_phone: '1234567890', is_blocked: false, balance: '1500.00' },
        { uuid: '789-xyz-012', name_on_card: 'Jane Smith', user_phone: '0987654321', is_blocked: true, balance: '500.00' },
    ]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // New Card Form State
    const [newCardName, setNewCardName] = useState('');
    const [newCardPhone, setNewCardPhone] = useState('');
    const [newCardBalance, setNewCardBalance] = useState('');

    const handleCreateCard = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock creation
        const newCard: CardData = {
            uuid: Math.random().toString(36).substr(2, 9),
            name_on_card: newCardName,
            user_phone: newCardPhone,
            is_blocked: false,
            balance: newCardBalance || '0.00'
        };
        setCards([...cards, newCard]);
        setIsCreateModalOpen(false);
        setNewCardName('');
        setNewCardPhone('');
        setNewCardBalance('');
    };

    const filteredCards = cards.filter(card =>
        card.name_on_card.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.uuid.includes(searchTerm)
    );

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Cards</h1>
                    <p className="text-muted-foreground">Manage NFC cards and accounts</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="bg-black text-white hover:bg-gray-800">
                    <Plus className="mr-2 h-4 w-4" /> Create New Card
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="w-full max-w-sm">
                        <Input
                            placeholder="Search by name or card UUID..."
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b text-muted-foreground">
                                <tr>
                                    <th className="py-3 px-4 font-medium">Card UUID</th>
                                    <th className="py-3 px-4 font-medium">Name on Card</th>
                                    <th className="py-3 px-4 font-medium">User Phone</th>
                                    <th className="py-3 px-4 font-medium">Balance</th>
                                    <th className="py-3 px-4 font-medium">Status</th>
                                    <th className="py-3 px-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCards.map(card => (
                                    <tr key={card.uuid} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                        <td className="py-3 px-4 font-mono text-xs">{card.uuid}</td>
                                        <td className="py-3 px-4">{card.name_on_card}</td>
                                        <td className="py-3 px-4">{card.user_phone}</td>
                                        <td className="py-3 px-4 font-bold">₦{card.balance}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${!card.is_blocked ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${!card.is_blocked ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                                {!card.is_blocked ? 'Active' : 'Blocked'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 flex gap-2">
                                            
                                            <Button size="sm" variant="secondary"><Link to="/viewcard">View</Link></Button>
                                            <Button size="sm" variant="secondary"><Link to="/topup">Top-up</Link></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create & Assign New Card"
            >
                <form onSubmit={handleCreateCard} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="name">Name on Card</label>
                        <Input
                            id="name"
                            value={newCardName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCardName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="phone">User Phone</label>
                        <Input
                            id="phone"
                            value={newCardPhone}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCardPhone(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="balance">Initial Balance</label>
                        <Input
                            id="balance"
                            type="number"
                            value={newCardBalance}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCardBalance(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Create Card</Button>
                    </div>
                </form>
            </Modal>
        </MainLayout>
    );
};

export default Cards;
