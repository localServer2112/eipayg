import { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { MainLayout } from '../layout/MainLayout';
import { Card as UICard, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { usersApi, User } from '../api/users';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ITEMS_PER_PAGE = 10;

const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

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
            // @ts-ignore - handle both array and paginated response
            const results: User[] = Array.isArray(response.data) ? response.data : (response.data?.results || []);
            setUsers(results);
        } catch (error: any) {
            console.error('Failed to fetch users:', error);
            console.error('Error response:', error.response?.data);
            toast.error(error.response?.data?.detail || 'Failed to load users');
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

    const downloadCSV = () => {
        const headers = ['Name', 'Phone', 'Address', 'Balance'];
        const rows = filteredUsers.map(user => [
            `${user.first_name} ${user.last_name}`,
            user.phone || '',
            user.address || '',
            user.balance || '0',
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        toast.success('CSV downloaded');
        setIsDownloadModalOpen(false);
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Users Report', 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        autoTable(doc, {
            startY: 38,
            head: [['Name', 'Phone', 'Address', 'Balance']],
            body: filteredUsers.map(user => [
                `${user.first_name} ${user.last_name}`,
                user.phone || '-',
                user.address || '-',
                user.balance ? `₦${user.balance}` : '-',
            ]),
            theme: 'striped',
            headStyles: { fillColor: [26, 28, 30] },
            styles: { fontSize: 9 },
        });
        doc.save(`users_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('PDF downloaded');
        setIsDownloadModalOpen(false);
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

    // Pagination calculations
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Reset to page 1 when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

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
                    <div className="flex items-center gap-3 w-full">
                        <div className="flex-1 max-w-sm">
                            <Input
                                placeholder="Search by name, phone or address..."
                                value={searchTerm}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setIsDownloadModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Download
                        </button>
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
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8">Loading users...</td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8">No users found</td>
                                    </tr>
                                ) : (
                                    paginatedUsers.map(user => (
                                        <tr key={user.uuid} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                            <td className="py-3 px-4 font-medium">{user.first_name} {user.last_name}</td>
                                            <td className="py-3 px-4">{user.phone}</td>
                                            <td className="py-3 px-4">{user.address || '-'}</td>
                                            <td className="py-3 px-4 font-bold">{user.balance ? `₦${user.balance}` : '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {filteredUsers.length > ITEMS_PER_PAGE && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <span className="text-sm text-muted-foreground px-2">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </UICard>

            {/* Download Modal */}
            {isDownloadModalOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsDownloadModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Download Users Data</h2>
                        <p className="text-gray-500 text-sm mb-6">Choose a format to export the users list</p>
                        <div className="space-y-3">
                            <button
                                onClick={downloadCSV}
                                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left"
                            >
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <FileSpreadsheet className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">CSV File</h3>
                                    <p className="text-sm text-gray-500">Spreadsheet format, works with Excel</p>
                                </div>
                            </button>
                            <button
                                onClick={downloadPDF}
                                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left"
                            >
                                <div className="p-3 bg-red-100 rounded-lg">
                                    <FileText className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">PDF File</h3>
                                    <p className="text-sm text-gray-500">Printable document format</p>
                                </div>
                            </button>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-400 text-center">{filteredUsers.length} users will be exported</p>
                        </div>
                        <button
                            onClick={() => setIsDownloadModalOpen(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

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
