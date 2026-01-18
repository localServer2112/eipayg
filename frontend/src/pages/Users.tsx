import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { MainLayout } from '../layout/MainLayout';
import { Card as UICard, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { usersApi, User } from '../api/users';
import { toast } from 'sonner';

const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    // Register Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const response = await usersApi.list();
            // @ts-ignore
            const results: User[] = Array.isArray(response.data) ? response.data : (response.data.results || []);
            setUsers(results);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFirstName('');
        setLastName('');
        setPhone('');
        setAddress('');
        setPassword('');
        setPasswordConfirm('');
    };

    const handleRegisterUser = async () => {
        if (!firstName || !lastName || !phone || !password || !passwordConfirm) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (password !== passwordConfirm) {
            toast.error('Passwords do not match');
            return;
        }

        setIsRegistering(true);

        const payload = {
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            address: address,
            user_type: 'USER' as const,
            password: password,
            password_confirm: passwordConfirm
        };
        console.log('Registering user with payload:', payload);

        try {
            await usersApi.register(payload);
            toast.success('Member registered successfully');
            setIsRegisterModalOpen(false);
            resetForm();
            fetchUsers();
        } catch (error: any) {
            console.error('Failed to register user:', error);
            console.error('Error response data:', error.response?.data);

            const errorData = error.response?.data;
            if (errorData && typeof errorData === 'object') {
                // Show all field errors
                const fieldNames: Record<string, string> = {
                    first_name: 'First Name',
                    last_name: 'Last Name',
                    phone: 'Phone',
                    address: 'Address',
                    password: 'Password',
                    password_confirm: 'Confirm Password',
                    user_type: 'User Type',
                    non_field_errors: 'Error',
                    detail: 'Error',
                    error: 'Error'
                };

                let hasFieldError = false;
                for (const [field, label] of Object.entries(fieldNames)) {
                    if (errorData[field]) {
                        const message = Array.isArray(errorData[field]) ? errorData[field][0] : errorData[field];
                        toast.error(`${label}: ${message}`);
                        hasFieldError = true;
                    }
                }

                if (!hasFieldError) {
                    toast.error(JSON.stringify(errorData));
                }
            } else {
                toast.error('Failed to register user');
            }
        } finally {
            setIsRegistering(false);
        }
    };

    const filteredUsers = users.filter(user => {
        if (!searchTerm.trim()) return true;
        const search = searchTerm.toLowerCase().trim();
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        return (
            fullName.includes(search) ||
            user.phone?.toLowerCase().includes(search) ||
            user.address?.toLowerCase().includes(search)
        );
    });

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Users</h1>
                    <p className="text-muted-foreground">Manage registered members</p>
                </div>
                <Button onClick={() => setIsRegisterModalOpen(true)} className="bg-black text-white hover:bg-gray-800">
                    <Plus className="mr-2 h-4 w-4" /> Register Member
                </Button>
            </div>

            <UICard>
                <CardHeader>
                    <div className="w-full max-w-sm">
                        <Input
                            placeholder="Search by name, phone or address..."
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
                                    <th className="py-3 px-4 font-medium">Name</th>
                                    <th className="py-3 px-4 font-medium">Phone</th>
                                    <th className="py-3 px-4 font-medium">Address</th>
                                    <th className="py-3 px-4 font-medium">Balance</th>
                                    <th className="py-3 px-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8">Loading users...</td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8">No users found</td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user.uuid} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                            <td className="py-3 px-4 font-medium">{user.first_name} {user.last_name}</td>
                                            <td className="py-3 px-4">{user.phone}</td>
                                            <td className="py-3 px-4">{user.address || '-'}</td>
                                            <td className="py-3 px-4 font-bold">{user.balance ? `₦${user.balance}` : '-'}</td>
                                            <td className="py-3 px-4">
                                                <Button size="sm" variant="secondary">
                                                    <Link to={`/viewuser/${user.uuid}`}>View</Link>
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

            {/* Register Member Modal */}
            {isRegisterModalOpen && (
                <Modal
                    isOpen={isRegisterModalOpen}
                    onClose={() => setIsRegisterModalOpen(false)}
                    title="Register Member"
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="firstName">First Name *</label>
                                <Input
                                    id="firstName"
                                    value={firstName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                                    placeholder="John"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="lastName">Last Name *</label>
                                <Input
                                    id="lastName"
                                    value={lastName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                                    placeholder="Doe"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="phone">Phone *</label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                                placeholder="0504567891"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="address">Address</label>
                            <Input
                                id="address"
                                value={address}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
                                placeholder="123 Main St"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="password">Password *</label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                    placeholder="********"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="passwordConfirm">Confirm Password *</label>
                                <Input
                                    id="passwordConfirm"
                                    type="password"
                                    value={passwordConfirm}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordConfirm(e.target.value)}
                                    placeholder="********"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button type="button" variant="ghost" onClick={() => setIsRegisterModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="button" disabled={isRegistering} onClick={handleRegisterUser}>
                                {isRegistering ? 'Registering...' : 'Register Member'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </MainLayout>
    );
};

export default Users;
