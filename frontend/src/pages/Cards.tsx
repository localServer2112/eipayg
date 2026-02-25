import { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { MainLayout } from '../layout/MainLayout';
import { Card as UICard, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { cardsApi, Card } from '../api/cards';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ITEMS_PER_PAGE = 10;

const Cards: React.FC = () => {
    const [cards, setCards] = useState<Card[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

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

    const downloadCSV = () => {
        const headers = ['Card UUID', 'Name on Card', 'User Phone', 'Assignment', 'Status'];
        const rows = filteredCards.map(card => [
            card.uuid,
            card.name_on_card || '',
            card.user_phone || card.user_info?.phone || '',
            card.user_phone || card.user_info?.phone ? 'Assigned' : 'Unassigned',
            card.is_blocked ? 'Blocked' : 'Active',
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `cards_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        toast.success('CSV downloaded');
        setIsDownloadModalOpen(false);
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Cards Report', 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        autoTable(doc, {
            startY: 38,
            head: [['Card UUID', 'Name on Card', 'Phone', 'Assignment', 'Status']],
            body: filteredCards.map(card => [
                card.uuid,
                card.name_on_card || '-',
                card.user_phone || card.user_info?.phone || '-',
                card.user_phone || card.user_info?.phone ? 'Assigned' : 'Unassigned',
                card.is_blocked ? 'Blocked' : 'Active',
            ]),
            theme: 'striped',
            headStyles: { fillColor: [26, 28, 30] },
            styles: { fontSize: 7 },
        });
        doc.save(`cards_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('PDF downloaded');
        setIsDownloadModalOpen(false);
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

    // Pagination calculations
    const totalPages = Math.ceil(filteredCards.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedCards = filteredCards.slice(startIndex, endIndex);

    // Reset to page 1 when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Cards</h1>
                    <p className="text-muted-foreground">Manage NFC cards and accounts</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="bg-black text-white hover:bg-gray-800">
                    <Plus className="mr-2 h-4 w-4" /> Assign Card
                </Button>
            </div>

            <UICard>
                <CardHeader>
                    <div className="flex items-center gap-3 w-full">
                        <div className="flex-1 max-w-sm">
                            <Input
                                placeholder="Search by name, phone or UUID..."
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
                                    <th className="py-3 px-4 font-medium">Card UUID</th>
                                    <th className="py-3 px-4 font-medium">Name on Card</th>
                                    <th className="py-3 px-4 font-medium">User Phone</th>
                                    <th className="py-3 px-4 font-medium">Assignment</th>
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
                                    paginatedCards.map(card => (
                                        <tr key={card.uuid} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                            <td className="py-3 px-4 font-mono text-xs">{card.uuid}</td>
                                            <td className="py-3 px-4">{card.name_on_card || '-'}</td>
                                            <td className="py-3 px-4">{card.user_phone || card.user_info?.phone || '-'}</td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${card.user_phone || card.user_info?.phone ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${card.user_phone || card.user_info?.phone ? 'bg-blue-600' : 'bg-gray-400'}`}></span>
                                                    {card.user_phone || card.user_info?.phone ? 'Assigned' : 'Unassigned'}
                                                </span>
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

                    {/* Pagination Controls */}
                    {filteredCards.length > ITEMS_PER_PAGE && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredCards.length)} of {filteredCards.length} cards
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
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Download Cards Data</h2>
                        <p className="text-gray-500 text-sm mb-6">Choose a format to export the cards list</p>
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
                            <p className="text-xs text-gray-400 text-center">{filteredCards.length} cards will be exported</p>
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
