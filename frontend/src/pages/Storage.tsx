import React, { useState, useEffect } from 'react';
import { MainLayout } from '../layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { storagesApi, StorageEntry } from '../api/storages';
import { cardsApi } from '../api/cards';
import { accountsApi } from '../api/accounts';
import { toast } from 'sonner';
import { Download, FileText, FileSpreadsheet, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ITEMS_PER_PAGE = 10;

const Storage: React.FC = () => {
    const [storageItems, setStorageItems] = useState<StorageEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalActive, setTotalActive] = useState(0);
    const [userInfoMap, setUserInfoMap] = useState<Record<string, { name: string; phone: string }>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<'check_in' | 'duration_hours' | 'weight' | 'hourly_rate' | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    // Check-in modal state
    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    const [cardUuid, setCardUuid] = useState('');
    const [commodity, setCommodity] = useState('');
    const [weight, setWeight] = useState('');
    const [dailyRate, setDailyRate] = useState('');
    const [estimatedDays, setEstimatedDays] = useState('1');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchStorages();
    }, []);

    const fetchStorages = async () => {
        try {
            setIsLoading(true);
            const response = await storagesApi.getActive();
            const storages = response.data.storages || [];
            setStorageItems(storages);
            setTotalActive(response.data.total_active || 0);
            setCurrentPage(1);

            // Fetch user info for each unique account
            const uniqueAccountUuids = [...new Set(storages.map(s => s.account_uuid).filter(Boolean))];
            const results = await Promise.allSettled(
                uniqueAccountUuids.map(uuid => accountsApi.getDetails({ account_uuid: uuid }))
            );

            const map: Record<string, { name: string; phone: string }> = {};
            results.forEach((result, i) => {
                if (result.status === 'fulfilled') {
                    const { user_info } = result.value.data;
                    if (user_info) {
                        map[uniqueAccountUuids[i]] = {
                            name: `${user_info.first_name} ${user_info.last_name}`.trim(),
                            phone: user_info.phone,
                        };
                    }
                }
            });
            setUserInfoMap(map);
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
            const cardInfo = await cardsApi.getInfo({ card_uuid: cardUuid });
            const accountUuid = cardInfo.data.account_details?.uuid;

            if (!accountUuid) {
                toast.error('Could not find account for this card');
                return;
            }

            const now = new Date();
            const checkIn = now.toISOString();
            const estimatedHours = parseFloat(estimatedDays) * 24;
            const estimatedCheckout = new Date(now.getTime() + estimatedHours * 60 * 60 * 1000).toISOString();
            const hourlyRate = (parseFloat(dailyRate) / 24).toFixed(2);

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

    const resetCheckInForm = () => {
        setCardUuid('');
        setCommodity('');
        setWeight('');
        setDailyRate('');
        setEstimatedDays('1');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getCustomerName = (item: StorageEntry) =>
        userInfoMap[item.account_uuid]?.name || item.account;
    const getCustomerPhone = (item: StorageEntry) =>
        userInfoMap[item.account_uuid]?.phone || '';

    const downloadCSV = () => {
        const headers = ['Customer', 'Phone', 'Commodity', 'Weight (kg)', 'Daily Rate (₦)', 'Check-in Time', 'Est. Checkout', 'Duration (days)', 'Status'];
        const rows = storageItems.map(item => [
            getCustomerName(item),
            getCustomerPhone(item),
            item.commodity,
            item.weight,
            (parseFloat(item.hourly_rate || '0') * 24).toFixed(2),
            new Date(item.check_in).toLocaleString(),
            new Date(item.estimated_check_out).toLocaleString(),
            ((item.duration_hours || 0) / 24).toFixed(1),
            item.is_active ? 'Stored' : 'Checked Out',
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `active_storage_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);

        toast.success('CSV downloaded successfully');
        setIsDownloadModalOpen(false);
    };

    const downloadPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Active Storage Report', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        const tableData = storageItems.map(item => [
            getCustomerName(item),
            item.commodity,
            `${item.weight} kg`,
            `₦${(parseFloat(item.hourly_rate || '0') * 24).toFixed(2)}`,
            new Date(item.check_in).toLocaleDateString(),
            new Date(item.estimated_check_out).toLocaleDateString(),
            `${((item.duration_hours || 0) / 24).toFixed(1)} days`,
            item.is_active ? 'Stored' : 'Checked Out',
        ]);

        autoTable(doc, {
            startY: 38,
            head: [['Customer', 'Commodity', 'Weight', 'Rate/day', 'Check-in', 'Est. Checkout', 'Duration', 'Status']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [26, 28, 30] },
            styles: { fontSize: 8 },
            columnStyles: { 0: { cellWidth: 30 } },
        });

        const finalY = (doc as any).lastAutoTable.finalY || 150;
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Total Active Items: ${storageItems.length}`, 14, finalY + 10);

        doc.save(`active_storage_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('PDF downloaded successfully');
        setIsDownloadModalOpen(false);
    };

    const handleSort = (field: typeof sortField) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
        setCurrentPage(1);
    };

    const SortIcon = ({ field }: { field: typeof sortField }) => {
        if (sortField !== field) return <ArrowUpDown className="inline ml-1 h-3.5 w-3.5 opacity-40" />;
        return sortDir === 'asc'
            ? <ArrowUp className="inline ml-1 h-3.5 w-3.5" />
            : <ArrowDown className="inline ml-1 h-3.5 w-3.5" />;
    };

    const filteredItems = storageItems.filter(item => {
        if (!searchTerm.trim()) return true;
        const s = searchTerm.toLowerCase();
        const name = getCustomerName(item).toLowerCase();
        const phone = getCustomerPhone(item).toLowerCase();
        return (
            name.includes(s) ||
            phone.includes(s) ||
            item.commodity?.toLowerCase().includes(s)
        );
    }).sort((a, b) => {
        if (!sortField) return 0;
        let aVal: number;
        let bVal: number;
        if (sortField === 'check_in') {
            aVal = new Date(a.check_in).getTime();
            bVal = new Date(b.check_in).getTime();
        } else if (sortField === 'duration_hours') {
            aVal = a.duration_hours || 0;
            bVal = b.duration_hours || 0;
        } else if (sortField === 'weight') {
            aVal = parseFloat(a.weight || '0');
            bVal = parseFloat(b.weight || '0');
        } else {
            aVal = parseFloat(a.hourly_rate || '0');
            bVal = parseFloat(b.hourly_rate || '0');
        }
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

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
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg Daily Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₦{storageItems.length > 0
                                ? (storageItems.reduce((sum, item) => sum + (parseFloat(item.hourly_rate || '0') * 24), 0) / storageItems.length).toFixed(2)
                                : '0.00'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between">
                        <CardTitle>Active Storage</CardTitle>
                        <button
                            onClick={() => setIsDownloadModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Download
                        </button>
                    </div>
                    <Input
                        placeholder="Search by customer, commodity..."
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="max-w-xs"
                    />
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b text-muted-foreground">
                                <tr>
                                    <th className="py-3 px-4 font-medium">Customer</th>
                                    <th className="py-3 px-4 font-medium">Commodity</th>
                                    <th className="py-3 px-4 font-medium">
                                        <button onClick={() => handleSort('weight')} className="flex items-center gap-0.5 hover:text-foreground transition-colors">
                                            Weight (kg)<SortIcon field="weight" />
                                        </button>
                                    </th>
                                    <th className="py-3 px-4 font-medium">
                                        <button onClick={() => handleSort('hourly_rate')} className="flex items-center gap-0.5 hover:text-foreground transition-colors">
                                            Daily Rate<SortIcon field="hourly_rate" />
                                        </button>
                                    </th>
                                    <th className="py-3 px-4 font-medium">
                                        <button onClick={() => handleSort('check_in')} className="flex items-center gap-0.5 hover:text-foreground transition-colors">
                                            Check-in Time<SortIcon field="check_in" />
                                        </button>
                                    </th>
                                    <th className="py-3 px-4 font-medium">Est. Checkout</th>
                                    <th className="py-3 px-4 font-medium">
                                        <button onClick={() => handleSort('duration_hours')} className="flex items-center gap-0.5 hover:text-foreground transition-colors">
                                            Duration (days)<SortIcon field="duration_hours" />
                                        </button>
                                    </th>
                                    <th className="py-3 px-4 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8">Loading...</td>
                                    </tr>
                                ) : filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8">No active storage items</td>
                                    </tr>
                                ) : (
                                    paginatedItems.map(item => (
                                        <tr key={item.uuid} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                            <td className="py-3 px-4">
                                                <span className="font-medium">{getCustomerName(item)}</span>
                                                {getCustomerPhone(item) && (
                                                    <><br /><span className="text-xs text-muted-foreground">{getCustomerPhone(item)}</span></>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">{item.commodity}</td>
                                            <td className="py-3 px-4">{item.weight}</td>
                                            <td className="py-3 px-4">₦{(parseFloat(item.hourly_rate || '0') * 24).toFixed(2)}</td>
                                            <td className="py-3 px-4 text-muted-foreground">{formatDate(item.check_in)}</td>
                                            <td className="py-3 px-4 text-muted-foreground">{formatDate(item.estimated_check_out)}</td>
                                            <td className="py-3 px-4">{((item.duration_hours || 0) / 24).toFixed(1) || '-'}</td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.is_active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {item.is_active ? 'Stored' : 'Checked Out'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm">
                            <p className="text-muted-foreground">
                                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} of {filteredItems.length}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

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
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Download Storage Data</h2>
                        <p className="text-gray-500 text-sm mb-6">Choose a format to export the active storage list</p>

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
                            <p className="text-xs text-gray-400 text-center">{storageItems.length} items will be exported</p>
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
                            <label className="text-sm font-medium" htmlFor="dailyRate">Daily Rate (₦)</label>
                            <Input
                                id="dailyRate"
                                type="number"
                                step="0.01"
                                value={dailyRate}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDailyRate(e.target.value)}
                                placeholder="2400"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="estimatedDays">Estimated Storage Duration (days)</label>
                        <Input
                            id="estimatedDays"
                            type="number"
                            value={estimatedDays}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEstimatedDays(e.target.value)}
                            placeholder="1"
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
        </MainLayout>
    );
};

export default Storage;
