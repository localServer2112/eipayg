import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { MainLayout } from '../layout/MainLayout';
import { Card as UICard, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { cardsApi, Card } from '../api/cards';
import { toast } from 'sonner';

const Cards: React.FC = () => {
    const [cards, setCards] = useState<Card[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // New Card Form State - Simplified for now
    const [newCardUuid, setNewCardUuid] = useState('');
    const [newCardPhone, setNewCardPhone] = useState('');
    const [newCardBalance, setNewCardBalance] = useState('');

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        try {
            setIsLoading(true);
            const response = await cardsApi.list();
            // Handle if response is array or paginated object
            // @ts-ignore
            const results: Card[] = Array.isArray(response.data) ? response.data : (response.data.results || []);
            setCards(results);
        } catch (error) {
            console.error('Failed to fetch cards:', error);
            toast.error('Failed to load cards');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCard = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!newCardUuid || !newCardPhone) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            await cardsApi.assign({
                card_uuid: newCardUuid,
                user_phone: newCardPhone,
                initial_balance: newCardBalance || '0'
            });
            toast.success('Card assigned successfully');
            setIsCreateModalOpen(false);
            setNewCardUuid('');
            setNewCardPhone('');
            setNewCardBalance('');
            fetchCards(); // Refresh list
        } catch (error: any) {
            console.error('Failed to assign card:', error);
            console.error('Error response data:', error.response?.data);
            const errorData = error.response?.data;
            let errorMessage = 'Failed to assign card';
            if (errorData) {
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.user_phone) {
                    errorMessage = Array.isArray(errorData.user_phone) ? errorData.user_phone[0] : errorData.user_phone;
                } else if (errorData.card_uuid) {
                    errorMessage = Array.isArray(errorData.card_uuid) ? errorData.card_uuid[0] : errorData.card_uuid;
                } else if (errorData.initial_balance) {
                    errorMessage = Array.isArray(errorData.initial_balance) ? errorData.initial_balance[0] : errorData.initial_balance;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.non_field_errors) {
                    errorMessage = Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors;
                } else {
                    errorMessage = JSON.stringify(errorData);
                }
            }
            toast.error(errorMessage);
        }
    };

    const handleSuspendCard = async (cardUuid: string, currentlyBlocked: boolean) => {
        try {
            await cardsApi.block({
                card_uuid: cardUuid,
                is_blocked: !currentlyBlocked
            });
            toast.success(currentlyBlocked ? 'Card activated successfully' : 'Card suspended successfully');
            fetchCards(); // Refresh list
        } catch (error: any) {
            console.error('Failed to update card status:', error);
            const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to update card status';
            toast.error(errorMessage);
        }
    };

    const filteredCards = cards.filter(card => {
        if (!searchTerm.trim()) return true;
        const search = searchTerm.toLowerCase().trim();
        return (
            card.name_on_card?.toLowerCase().includes(search) ||
            card.uuid?.toLowerCase().includes(search) ||
            card.user_phone?.toLowerCase().includes(search) ||
            card.user_name?.toLowerCase().includes(search)
        );
    });

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

            <UICard>
                <CardHeader>
                    <div className="w-full max-w-sm">
                        <Input
                            placeholder="Search by name, phone or UUID..."
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
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8">Loading cards...</td>
                                    </tr>
                                ) : filteredCards.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8">No cards found</td>
                                    </tr>
                                ) : (
                                    filteredCards.map(card => (
                                        <tr key={card.uuid} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                            <td className="py-3 px-4 font-mono text-xs">{card.uuid}</td>
                                            <td className="py-3 px-4">{card.name_on_card}</td>
                                            <td className="py-3 px-4">{card.user_phone || card.user_info?.phone || '-'}</td>
                                            <td className="py-3 px-4 font-bold">
                                                {card.balance ? `₦${card.balance}` : card.account_details?.balance ? `₦${card.account_details.balance}` : '-'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${!card.is_blocked ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${!card.is_blocked ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                                    {!card.is_blocked ? 'Active' : 'Blocked'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Button
                                                    size="sm"
                                                    variant={card.is_blocked ? "secondary" : "destructive"}
                                                    onClick={() => handleSuspendCard(card.uuid, card.is_blocked)}
                                                >
                                                    {card.is_blocked ? 'Activate' : 'Suspend'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </UICard>

            {isCreateModalOpen && (
                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="Assign Card"
                >
                    <form onSubmit={handleCreateCard} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="uuid">Card UUID</label>
                            <Input
                                id="uuid"
                                value={newCardUuid}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCardUuid(e.target.value)}
                                placeholder="e.g. 4819e245-ebd8-406f-b09d-8078ea72e3a8"
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
                            <Button type="button" onClick={() => handleCreateCard()}>Assign Card</Button>
                        </div>
                    </form>
                </Modal>
            )}

        </MainLayout>
    );
};

export default Cards;
