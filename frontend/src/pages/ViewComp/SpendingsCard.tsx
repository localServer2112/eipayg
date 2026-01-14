 import {
   Search as MagnifyingGlassIcon,
 } from "lucide-react";

// Mock Data for Spendings
const spendingsData = [
  { date: "12 May 2025 @ 12:15pm", weight: "2kg", price: "N2,300", coldRoomId: "#34AA56" },
  { date: "12 May 2025 @ 12:15pm", weight: "2kg", price: "N2,300", coldRoomId: "#34AA56" },
  { date: "12 May 2025 @ 12:15pm", weight: "2kg", price: "N4,500", coldRoomId: "#34AA56" },
  { date: "12 May 2025 @ 12:15pm", weight: "2kg", price: "N6,200", coldRoomId: "#34AA56" },
  { date: "12 May 2025 @ 12:15pm", weight: "2kg", price: "N8,750", coldRoomId: "#34AA56" },
  { date: "12 May 2025 @ 12:15pm", weight: "2kg", price: "N10,000", coldRoomId: "#34AA56" },
];

const SpendingsCard = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">Spendings</h3>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name or coldroom ID..."
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent sm:text-sm"
          />
        </div>
        <button className="px-4 py-2.5 border border-[#18181B] text-[1A1A1A] rounded-full font-medium text-xs hover:bg-gray-50 transition-colors whitespace-nowrap">
          Download History
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full w-full">
          <thead>
            <tr className="text-left text-xs font-medium text-[#101828] uppercase tracking-wider border-b border-gray-100">
              <th className="pb-3 pl-2">Transaction Date</th>
              <th className="pb-3">Weight</th>
              <th className="pb-3">Price</th>
              <th className="pb-3 pr-2 text-right">Cold Room ID</th>
            </tr>
          </thead>
          <tbody className="text-sm text-[#101828]">
            {spendingsData.map((spending, index) => (
              <tr key={index} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                <td className="py-4 pl-2 whitespace-nowrap">{spending.date}</td>
                <td className="py-4 whitespace-nowrap">{spending.weight}</td>
                <td className="py-4 whitespace-nowrap font-medium">{spending.price}</td>
                <td className="py-4 pr-2 whitespace-nowrap text-right underline text-gray-600">{spending.coldRoomId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SpendingsCard;