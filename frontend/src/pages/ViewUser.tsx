import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { MainLayout } from '../layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { usersApi, User } from '../api/users';
import { cardsApi, Card as CardType } from '../api/cards';
import { toast } from 'sonner';

const ViewUser: React.FC = () => {
    const { uuid } = useParams<{ uuid: string }>();
    const navigate = useNavigate();

    const [user, setUser] = useState<User | null>(null);
    const [userCards, setUserCards] = useState<CardType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    // Assign Card Form State
    const [cardUuid, setCardUuid] = useState('');
    const [initialBalance, setInitialBalance] = useState('');

    useEffect(() => {
        if (uuid) {
            fetchUserData();
        }
    }, [uuid]);

    const fetchUserData = async () => {
        try {
            setIsLoading(true);

            // Fetch user details
            const userResponse = await usersApi.get(uuid!);
            if (!userResponse.data) {
                toast.error('User not found');
                setIsLoading(false);
                return;
            }
            setUser(userResponse.data);

            // Fetch all cards and filter by user phone
            const cardsResponse = await cardsApi.list();
            // @ts-ignore
            const allCards: CardType[] = Array.isArray(cardsResponse.data) ? cardsResponse.data : (cardsResponse.data.results || []);

            // Filter cards that belong to this user (by phone)
            const userCardsList = allCards.filter(card => card.user_phone === userResponse.data?.phone);
            setUserCards(userCardsList);

        } catch (error) {
            console.error('Failed to fetch user data:', error);
            toast.error('Failed to load user data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssignCard = async () => {
        if (!cardUuid) {
            toast.error('Please enter a card UUID');
            return;
        }

        if (!user?.phone) {
            toast.error('User phone number not available');
            return;
        }

        setIsAssigning(true);

        try {
            await cardsApi.assign({
                card_uuid: cardUuid,
                user_phone: user.phone,
                initial_balance: initialBalance || '0'
            });
            toast.success('Card assigned successfully');
            setIsAssignModalOpen(false);
            setCardUuid('');
            setInitialBalance('');
            fetchUserData(); // Refresh data
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
                } else if (errorData.card_uuid) {
                    errorMessage = Array.isArray(errorData.card_uuid) ? errorData.card_uuid[0] : errorData.card_uuid;
                } else {
                    errorMessage = JSON.stringify(errorData);
                }
            }
            toast.error(errorMessage);
        } finally {
            setIsAssigning(false);
        }
    };

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading user data...</p>
                </div>
            </MainLayout>
        );
    }

    if (!user) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <p className="text-muted-foreground">User not found</p>
                    <Button onClick={() => navigate('/users')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
                    </Button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/users')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{user.first_name} {user.last_name}</h1>
                            <p className="text-muted-foreground">{user.phone}</p>
                        </div>
                    </div>
                    <Button onClick={() => setIsAssignModalOpen(true)} className="bg-black text-white hover:bg-gray-800">
                        <CreditCard className="mr-2 h-4 w-4" /> Assign Card
                    </Button>
                </div>

                {/* User Details Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>User Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">First Name</p>
                                <p className="font-medium">{user.first_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Last Name</p>
                                <p className="font-medium">{user.last_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-medium">{user.phone}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Balance</p>
                                <p className="font-bold text-lg">{user.balance ? `₦${user.balance}` : '₦0'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">Address</p>
                                <p className="font-medium">{user.address || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Created</p>
                                <p className="font-medium">{user.created ? new Date(user.created).toLocaleDateString() : '-'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* User's Cards */}
                <Card>
                    <CardHeader>
                        <CardTitle>Assigned Cards ({userCards.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {userCards.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No cards assigned to this user
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b text-muted-foreground">
                                        <tr>
                                            <th className="py-3 px-4 font-medium">Card UUID</th>
                                            <th className="py-3 px-4 font-medium">Name on Card</th>
                                            <th className="py-3 px-4 font-medium">Balance</th>
                                            <th className="py-3 px-4 font-medium">Status</th>
                                            <th className="py-3 px-4 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userCards.map(card => (
                                            <tr key={card.uuid} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                                <td className="py-3 px-4 font-mono text-xs">{card.uuid}</td>
                                                <td className="py-3 px-4">{card.name_on_card || '-'}</td>
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
                                                    <Button size="sm" variant="secondary" onClick={() => navigate(`/viewcard/${card.uuid}`)}>
                                                        View Card
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Assign Card Modal */}
            {isAssignModalOpen && (
                <Modal
                    isOpen={isAssignModalOpen}
                    onClose={() => setIsAssignModalOpen(false)}
                    title="Assign Card to User"
                >
                    <div className="space-y-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Assigning card to:</p>
                            <p className="font-medium">{user.first_name} {user.last_name} ({user.phone})</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="cardUuid">Card UUID *</label>
                            <Input
                                id="cardUuid"
                                value={cardUuid}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardUuid(e.target.value)}
                                placeholder="e.g. 4819e245-ebd8-406f-b09d-8078ea72e3a8"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="initialBalance">Initial Balance</label>
                            <Input
                                id="initialBalance"
                                type="number"
                                value={initialBalance}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInitialBalance(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button type="button" variant="ghost" onClick={() => setIsAssignModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="button" disabled={isAssigning} onClick={handleAssignCard}>
                                {isAssigning ? 'Assigning...' : 'Assign Card'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </MainLayout>
    );
};

export default ViewUser;
