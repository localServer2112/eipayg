import React, { useState } from 'react';
import { MainLayout } from '../layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

interface StorageItem {
    id: number;
    user: string;
    itemType: string;
    quantity: string;
    checkInTime: string;
    location: string;
    status: 'Stored' | 'Checked Out';
}

const Storage: React.FC = () => {
    // Mock Data
    const [storageItems, setStorageItems] = useState<StorageItem[]>([
        { id: 1, user: 'John Doe', itemType: 'Frozen Fish', quantity: '50kg', checkInTime: '2025-01-14 08:30', location: 'Cold Room A', status: 'Stored' },
        { id: 2, user: 'Jane Smith', itemType: 'Chicken', quantity: '20 crates', checkInTime: '2025-01-14 09:15', location: 'Cold Room B', status: 'Stored' },
        { id: 3, user: 'Mike Johnson', itemType: 'Vegetables', quantity: '10 bags', checkInTime: '2025-01-13 16:45', location: 'Cold Room A', status: 'Checked Out' },
    ]);

    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    const [newItemUser, setNewItemUser] = useState('');
    const [newItemType, setNewItemType] = useState('');
    const [newItemQuantity, setNewItemQuantity] = useState('');

    const handleCheckIn = (e: React.FormEvent) => {
        e.preventDefault();
        const newItem: StorageItem = {
            id: storageItems.length + 1,
            user: newItemUser,
            itemType: newItemType,
            quantity: newItemQuantity,
            checkInTime: new Date().toLocaleString(),
            location: 'Cold Room A', // Default for now
            status: 'Stored'
        };
        setStorageItems([newItem, ...storageItems]);
        setIsCheckInModalOpen(false);
        setNewItemUser('');
        setNewItemType('');
        setNewItemQuantity('');
    };

    const handleCheckOut = (id: number) => {
        setStorageItems(storageItems.map(item =>
            item.id === id ? { ...item, status: 'Checked Out' } : item
        ));
    };

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Storage</h1>
                    <p className="text-muted-foreground">Manage cold storage checking and checkout</p>
                </div>
                <Button onClick={() => setIsCheckInModalOpen(true)}>Check-in Item</Button>
            </div>

            <div className="grid gap-6 md:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Items Stored</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,240</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Available Capacity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">45%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Today's Check-ins</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">24</div>
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
                                    <th className="py-3 px-4 font-medium">User</th>
                                    <th className="py-3 px-4 font-medium">Item Type</th>
                                    <th className="py-3 px-4 font-medium">Quantity</th>
                                    <th className="py-3 px-4 font-medium">Location</th>
                                    <th className="py-3 px-4 font-medium">Check-in Time</th>
                                    <th className="py-3 px-4 font-medium">Status</th>
                                    <th className="py-3 px-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {storageItems.map(item => (
                                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                        <td className="py-3 px-4 font-medium">{item.user}</td>
                                        <td className="py-3 px-4">{item.itemType}</td>
                                        <td className="py-3 px-4">{item.quantity}</td>
                                        <td className="py-3 px-4">{item.location}</td>
                                        <td className="py-3 px-4 text-muted-foreground">{item.checkInTime}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.status === 'Stored' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {item.status === 'Stored' && (
                                                <Button size="sm" variant="outline" onClick={() => handleCheckOut(item.id)}>
                                                    Check-out
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Modal
                isOpen={isCheckInModalOpen}
                onClose={() => setIsCheckInModalOpen(false)}
                title="Check-in New Item"
            >
                <form onSubmit={handleCheckIn} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="user">User Name</label>
                        <Input
                            id="user"
                            value={newItemUser}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItemUser(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="type">Item Type</label>
                        <Input
                            id="type"
                            value={newItemType}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItemType(e.target.value)}
                            placeholder="e.g. Fish, Poultry"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="quantity">Quantity</label>
                        <Input
                            id="quantity"
                            value={newItemQuantity}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItemQuantity(e.target.value)}
                            placeholder="e.g. 50kg, 10 bags"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsCheckInModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Check-in</Button>
                    </div>
                </form>
            </Modal>
        </MainLayout>
    );
};

export default Storage;
