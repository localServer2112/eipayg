import { useState } from "react";
import { Search as MagnifyingGlassIcon, Download, FileText, FileSpreadsheet } from "lucide-react";
import { StorageEntry } from "../../api/types";
import { storagesApi } from "../../api/storages";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface SpendingsCardProps {
  storageLogs: StorageEntry[];
  onRefresh: () => void;
  balance?: string;
}

const SpendingsCard: React.FC<SpendingsCardProps> = ({ storageLogs, onRefresh, balance }) => {
  const [checkoutStorageId, setCheckoutStorageId] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const handleCheckout = async (storageUuid: string) => {
    setIsCheckingOut(true);
    try {
      const response = await storagesApi.checkout({
        storage_uuid: storageUuid,
        check_out: new Date().toISOString()
      });

      toast.success(`Checked out! Cost: ₦${response.data.total_cost}`);
      setCheckoutStorageId(null);
      onRefresh();
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

  const downloadCSV = () => {
    const headers = ['Commodity', 'Weight (kg)', 'Daily Rate (₦)', 'Check-in Date', 'Check-out Date', 'Status', 'Duration (hrs)', 'Cost (₦)'];

    const rows = storageLogs.map(log => {
      const checkInTime = new Date(log.check_in).getTime();
      const checkOutTime = log.check_out ? new Date(log.check_out).getTime() : Date.now();
      const durationHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
      const cost = durationHours * parseFloat(log.hourly_rate);

      return [
        log.commodity,
        log.weight,
        (parseFloat(log.hourly_rate) * 24).toFixed(2),
        new Date(log.check_in).toLocaleString(),
        log.check_out ? new Date(log.check_out).toLocaleString() : 'N/A',
        log.check_out ? 'Checked Out' : 'Active',
        durationHours.toFixed(2),
        cost.toFixed(2)
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `storage_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast.success('CSV downloaded successfully');
    setIsDownloadModalOpen(false);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Storage History Report', 14, 22);

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    // Table data
    const tableData = storageLogs.map(log => {
      const checkInTime = new Date(log.check_in).getTime();
      const checkOutTime = log.check_out ? new Date(log.check_out).getTime() : Date.now();
      const durationHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
      const cost = durationHours * parseFloat(log.hourly_rate);

      return [
        log.commodity,
        `${log.weight} kg`,
        `₦${(parseFloat(log.hourly_rate) * 24).toFixed(2)}`,
        new Date(log.check_in).toLocaleDateString(),
        log.check_out ? new Date(log.check_out).toLocaleDateString() : '-',
        log.check_out ? 'Checked Out' : 'Active',
        `₦${cost.toFixed(2)}`
      ];
    });

    autoTable(doc, {
      startY: 38,
      head: [['Commodity', 'Weight', 'Rate/day', 'Check-in', 'Check-out', 'Status', 'Cost']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [26, 28, 30] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 35 },
        6: { halign: 'right' }
      }
    });

    // Summary
    const totalItems = storageLogs.length;
    const activeItems = storageLogs.filter(l => !l.check_out).length;
    const totalCost = storageLogs.reduce((sum, log) => {
      const checkInTime = new Date(log.check_in).getTime();
      const checkOutTime = log.check_out ? new Date(log.check_out).getTime() : Date.now();
      const durationHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
      return sum + (durationHours * parseFloat(log.hourly_rate));
    }, 0);

    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Total Items: ${totalItems}`, 14, finalY + 10);
    doc.text(`Active Items: ${activeItems}`, 14, finalY + 16);
    doc.text(`Total Cost: ₦${totalCost.toFixed(2)}`, 14, finalY + 22);

    doc.save(`storage_history_${new Date().toISOString().split('T')[0]}.pdf`);

    toast.success('PDF downloaded successfully');
    setIsDownloadModalOpen(false);
  };

  const filteredLogs = storageLogs?.filter(log => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.commodity?.toLowerCase().includes(search) ||
      log.uuid?.toLowerCase().includes(search)
    );
  }) || [];

  // Sort to show active items first
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (!a.check_out && b.check_out) return -1;
    if (a.check_out && !b.check_out) return 1;
    return new Date(b.check_in).getTime() - new Date(a.check_in).getTime();
  });

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm h-full flex flex-col max-h-[calc(90vh-300px)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">Storage History</h3>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent sm:text-sm"
          />
        </div>
        <button
          onClick={() => setIsDownloadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 border border-[#18181B] text-[1A1A1A] rounded-full font-medium text-xs hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          <Download className="h-4 w-4" />
          Download History
        </button>
      </div>

      <div className="overflow-auto flex-1">
        <table className="min-w-full w-full">
          <thead className="sticky top-0 bg-white">
            <tr className="text-left text-xs font-medium text-[#101828] uppercase tracking-wider border-b border-gray-100">
              <th className="pb-3 pl-2">Item</th>
              <th className="pb-3">Weight</th>
              <th className="pb-3">Rate/day</th>
              <th className="pb-3">Check-in</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 pr-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm text-[#101828]">
            {sortedLogs.length === 0 ? (
              <tr><td colSpan={6} className="py-4 text-center text-gray-500">No storage history found</td></tr>
            ) : (
              sortedLogs.map((log, index) => {
                const isActive = !log.check_out;
                return (
                  <tr key={log.uuid || index} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pl-2 whitespace-nowrap">
                      <span className="font-medium">{log.commodity}</span>
                      <br />
                      <span className="text-xs text-gray-400">{log.uuid?.substring(0, 8)}</span>
                    </td>
                    <td className="py-4 whitespace-nowrap">{log.weight} kg</td>
                    <td className="py-4 whitespace-nowrap">₦{(parseFloat(log.hourly_rate) * 24).toFixed(2)}</td>
                    <td className="py-4 whitespace-nowrap text-xs text-gray-600">
                      {new Date(log.check_in).toLocaleDateString()}
                      <br />
                      {new Date(log.check_in).toLocaleTimeString()}
                    </td>
                    <td className="py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isActive ? 'Active' : 'Checked Out'}
                      </span>
                    </td>
                    <td className="py-4 pr-2 whitespace-nowrap text-right">
                      {isActive ? (
                        <button
                          onClick={() => setCheckoutStorageId(log.uuid)}
                          className="px-3 py-1.5 bg-gray-900 text-white rounded-full text-xs font-medium hover:bg-gray-800 transition-colors"
                        >
                          Checkout
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {log.check_out && new Date(log.check_out).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

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
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Download History</h2>
            <p className="text-gray-500 text-sm mb-6">
              Choose a format to download your storage history
            </p>

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
              <p className="text-xs text-gray-400 text-center">
                {storageLogs.length} items will be exported
              </p>
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

      {/* Checkout Confirmation Modal */}
      {checkoutStorageId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setCheckoutStorageId(null)}
        >
          <div
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const storage = storageLogs.find(s => s.uuid === checkoutStorageId);
              if (!storage) return null;

              const checkInTime = new Date(storage.check_in).getTime();
              const now = Date.now();
              const durationHours = (now - checkInTime) / (1000 * 60 * 60);
              const estimatedCost = durationHours * parseFloat(storage.hourly_rate);
              const currentBalance = parseFloat(balance || '0');
              const hasInsufficientBalance = currentBalance < estimatedCost;

              return (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Confirm Checkout</h2>
                  <p className="text-gray-500 text-sm mb-6">
                    Are you sure you want to checkout this item?
                  </p>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-6">
                    <p><span className="font-medium">Commodity:</span> {storage.commodity}</p>
                    <p><span className="font-medium">Weight:</span> {storage.weight} kg</p>
                    <p><span className="font-medium">Daily Rate:</span> ₦{(parseFloat(storage.hourly_rate) * 24).toFixed(2)}</p>
                    <p><span className="font-medium">Duration:</span> {durationHours.toFixed(1)} hours</p>
                    <p className="text-lg font-bold pt-2 border-t">
                      Estimated Cost: ₦{estimatedCost.toFixed(2)}
                    </p>
                    {balance && (
                      <p className={`font-medium ${hasInsufficientBalance ? 'text-red-600' : 'text-green-600'}`}>
                        Current Balance: ₦{currentBalance.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {hasInsufficientBalance && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                      <p className="text-red-700 text-sm font-medium">
                        Insufficient balance. You need ₦{(estimatedCost - currentBalance).toFixed(2)} more to checkout this item.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setCheckoutStorageId(null)}
                      className="px-6 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleCheckout(checkoutStorageId)}
                      disabled={isCheckingOut || hasInsufficientBalance}
                      className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCheckingOut ? 'Processing...' : 'Confirm Checkout'}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpendingsCard;
