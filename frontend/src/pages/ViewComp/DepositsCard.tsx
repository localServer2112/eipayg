import { useState } from "react";
import { Search as MagnifyingGlassIcon, Download, FileText, FileSpreadsheet, ChevronLeft, ChevronRight } from "lucide-react";
import Arrowtop from "../../assets/img/ArrowTop.svg";
import { Transaction } from "../../api/types";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DepositsCardProps {
  transactions: Transaction[];
}

const ITEMS_PER_PAGE = 10;

const DepositsCard: React.FC<DepositsCardProps> = ({ transactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const filteredTransactions = transactions?.filter(t => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    return (
      t.description?.toLowerCase().includes(s) ||
      t.amount?.toLowerCase().includes(s) ||
      t.uuid?.toLowerCase().includes(s)
    );
  }) ?? [];

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const downloadCSV = () => {
    const headers = ['UUID', 'Description', 'Amount', 'Date'];
    const rows = filteredTransactions.map(t => [
      t.uuid,
      t.description || t.transaction_type || 'Deposit',
      t.amount,
      new Date(t.created || '').toLocaleDateString(),
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `deposits_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('CSV downloaded');
    setIsDownloadModalOpen(false);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Deposits Report', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, {
      startY: 38,
      head: [['UUID', 'Description', 'Amount (₦)', 'Date']],
      body: filteredTransactions.map(t => [
        t.uuid.substring(0, 8) + '...',
        t.description || t.transaction_type || 'Deposit',
        t.amount,
        new Date(t.created || '').toLocaleDateString(),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [26, 28, 30] },
      styles: { fontSize: 8 },
    });
    doc.save(`deposits_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF downloaded');
    setIsDownloadModalOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm h-full flex flex-col max-h-[calc(90vh-300px)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Deposits</h3>
        <button
          onClick={() => setIsDownloadModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </button>
      </div>
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search..."
          className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent sm:text-sm"
        />
      </div>
      <div className="space-y-4 overflow-y-auto flex-1 pr-2">
        {filteredTransactions.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No deposits found</p>
        ) : (
          paginatedTransactions.map((deposit) => (
            <div
              key={deposit.uuid}
              className="flex justify-between items-center py-1 first:pt-0 last:pb-0"
            >
              <div className="flex items-start">
                <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center mr-3">
                  <img src={Arrowtop} alt="" width="9.1" height="9.1" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{deposit.description || deposit.transaction_type || 'Deposit'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {deposit.uuid.substring(0, 8)}... • {new Date(deposit.created || '').toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="font-bold text-primary-green text-[#16A34A]">
                ₦{deposit.amount}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-gray-500">
          <span>
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-1">{currentPage}/{totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

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
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Download Deposits</h2>
            <p className="text-gray-500 text-sm mb-6">Choose a format to export the deposits list</p>
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
              <p className="text-xs text-gray-400 text-center">{filteredTransactions.length} deposits will be exported</p>
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
    </div>
  );
};

export default DepositsCard;
