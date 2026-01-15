import React, { useState, useEffect } from 'react';
import { MainLayout } from '../layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { storagesApi, StorageEntry } from '../api/storages';
import { cardsApi } from '../api/cards';
import { toast } from 'sonner';

const Storage: React.FC = () => {
    const [storageItems, setStorageItems] = useState<StorageEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalActive, setTotalActive] = useState(0);

    // Check-in modal state
    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    const [cardUuid, setCardUuid] = useState('');
    const [commodity, setCommodity] = useState('');
    const [weight, setWeight] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');
    const [estimatedHours, setEstimatedHours] = useState('24');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Checkout modal state
    const [checkoutStorage, setCheckoutStorage] = useState<StorageEntry | null>(null);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    useEffect(() => {
        fetchStorages();
    }, []);

    const fetchStorages = async () => {
        try {
            setIsLoading(true);
            const response = await storagesApi.getActive();
            setStorageItems(response.data.storages || []);
            setTotalActive(response.data.total_active || 0);
        } catch (error) {
            console.error('Failed to fetch storages:', error);
            toast.error('Failed to load storage data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // First get the account UUID from the card
            const cardInfo = await cardsApi.getInfo({ card_uuid: cardUuid });
            const accountUuid = cardInfo.data.account_details?.uuid;

            if (!accountUuid) {
                toast.error('Could not find account for this card');
                return;
            }

            const now = new Date();
            const checkIn = now.toISOString();
            const estimatedCheckout = new Date(now.getTime() + parseInt(estimatedHours) * 60 * 60 * 1000).toISOString();

            await storagesApi.create({
                account_uuid: accountUuid,
                commodity,
                weight,
                check_in: checkIn,
                estimated_check_out: estimatedCheckout,
                hourly_rate: hourlyRate
            });

            toast.success('Item checked in successfully');
            setIsCheckInModalOpen(false);
            resetCheckInForm();
            fetchStorages();
        } catch (error: any) {
            console.error('Failed to check in:', error);
            const errorData = error.response?.data;
            let errorMessage = 'Failed to check in item';
            if (errorData) {
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else {
                    const firstError = Object.values(errorData)[0];
                    if (Array.isArray(firstError)) {
                        errorMessage = firstError[0] as string;
                    }
                }
            }
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCheckout = async () => {
        if (!checkoutStorage) return;
        setIsCheckingOut(true);

        try {
            const response = await storagesApi.checkout({
                storage_uuid: checkoutStorage.uuid,
                check_out: new Date().toISOString()
            });

            toast.success(`Checked out! Cost: ₦${response.data.total_cost}, New Balance: ₦${response.data.new_balance}`);
            setCheckoutStorage(null);
            fetchStorages();
        } catch (error: any) {
            console.error('Failed to checkout:', error);
            const errorData = error.response?.data;
            let errorMessage = 'Failed to checkout';
            if (errorData?.error) {
                errorMessage = errorData.error;
            } else if (errorData?.detail) {
                errorMessage = errorData.detail;
            }
            toast.error(errorMessage);
        } finally {
            setIsCheckingOut(false);
        }
    };

    const resetCheckInForm = () => {
        setCardUuid('');
        setCommodity('');
        setWeight('');
        setHourlyRate('');
        setEstimatedHours('24');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Storage</h1>
                    <p className="text-muted-foreground">Manage cold storage check-in and checkout</p>
                </div>
                <Button onClick={() => setIsCheckInModalOpen(true)}>Check-in Item</Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Storage Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalActive}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Weight Stored</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {storageItems.reduce((sum, item) => sum + parseFloat(item.weight || '0'), 0).toFixed(2)} kg
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg Hourly Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₦{storageItems.length > 0
                                ? (storageItems.reduce((sum, item) => sum + parseFloat(item.hourly_rate || '0'), 0) / storageItems.length).toFixed(2)
                                : '0.00'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Storage</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b text-muted-foreground">
                                <tr>
                                    <th className="py-3 px-4 font-medium">Commodity</th>
                                    <th className="py-3 px-4 font-medium">Weight (kg)</th>
                                    <th className="py-3 px-4 font-medium">Hourly Rate</th>
                                    <th className="py-3 px-4 font-medium">Check-in Time</th>
                                    <th className="py-3 px-4 font-medium">Est. Checkout</th>
                                    <th className="py-3 px-4 font-medium">Duration (hrs)</th>
                                    <th className="py-3 px-4 font-medium">Status</th>
                                    <th className="py-3 px-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8">Loading...</td>
                                    </tr>
                                ) : storageItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8">No active storage items</td>
                                    </tr>
                                ) : (
                                    storageItems.map(item => (
                                        <tr key={item.uuid} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                            <td className="py-3 px-4 font-medium">{item.commodity}</td>
                                            <td className="py-3 px-4">{item.weight}</td>
                                            <td className="py-3 px-4">₦{item.hourly_rate}</td>
                                            <td className="py-3 px-4 text-muted-foreground">{formatDate(item.check_in)}</td>
                                            <td className="py-3 px-4 text-muted-foreground">{formatDate(item.estimated_check_out)}</td>
                                            <td className="py-3 px-4">{item.duration_hours?.toFixed(1) || '-'}</td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.is_active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {item.is_active ? 'Stored' : 'Checked Out'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {item.is_active && (
                                                    <Button size="sm" variant="outline" onClick={() => setCheckoutStorage(item)}>
                                                        Check-out
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Check-in Modal */}
            <Modal
                isOpen={isCheckInModalOpen}
                onClose={() => setIsCheckInModalOpen(false)}
                title="Check-in New Item"
            >
                <form onSubmit={handleCheckIn} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="cardUuid">Card UUID</label>
                        <Input
                            id="cardUuid"
                            value={cardUuid}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardUuid(e.target.value)}
                            placeholder="Enter card UUID"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="commodity">Commodity</label>
                        <Input
                            id="commodity"
                            value={commodity}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommodity(e.target.value)}
                            placeholder="e.g. Frozen Fish, Chicken"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="weight">Weight (kg)</label>
                            <Input
                                id="weight"
                                type="number"
                                step="0.01"
                                value={weight}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeight(e.target.value)}
                                placeholder="50"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="hourlyRate">Hourly Rate (₦)</label>
                            <Input
                                id="hourlyRate"
                                type="number"
                                step="0.01"
                                value={hourlyRate}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHourlyRate(e.target.value)}
                                placeholder="100"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="estimatedHours">Estimated Storage Duration (hours)</label>
                        <Input
                            id="estimatedHours"
                            type="number"
                            value={estimatedHours}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEstimatedHours(e.target.value)}
                            placeholder="24"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsCheckInModalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Checking in...' : 'Check-in'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Checkout Confirmation Modal */}
            {checkoutStorage && (
                <Modal
                    isOpen={!!checkoutStorage}
                    onClose={() => setCheckoutStorage(null)}
                    title="Confirm Checkout"
                >
                    <div className="space-y-4">
                        <p>Are you sure you want to checkout this item?</p>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <p><span className="font-medium">Commodity:</span> {checkoutStorage.commodity}</p>
                            <p><span className="font-medium">Weight:</span> {checkoutStorage.weight} kg</p>
                            <p><span className="font-medium">Hourly Rate:</span> ₦{checkoutStorage.hourly_rate}</p>
                            <p><span className="font-medium">Duration:</span> {checkoutStorage.duration_hours?.toFixed(1)} hours</p>
                            <p className="text-lg font-bold">
                                Estimated Cost: ₦{((checkoutStorage.duration_hours || 0) * parseFloat(checkoutStorage.hourly_rate)).toFixed(2)}
                            </p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setCheckoutStorage(null)}>Cancel</Button>
                            <Button onClick={handleCheckout} disabled={isCheckingOut}>
                                {isCheckingOut ? 'Processing...' : 'Confirm Checkout'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </MainLayout>
    );
};

export default Storage;
