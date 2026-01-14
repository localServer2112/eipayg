import { Search as MagnifyingGlassIcon } from "lucide-react";
import Arrowtop from "../../img/Arrowtop.svg";

// Mock Data for Deposits
const depositsData = Array(5).fill({
  title: "Units added",
  ref: "TRF/2025/12/001234",
  date: "12 Jun 2025",
  time: "3:10 PM",
  amount: "#190,000",
});

const DepositsCard = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm h-full">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Deposits</h3>
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search..."
          className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent sm:text-sm"
        />
      </div>
      <div className="space-y-4">
        {depositsData.map((deposit, index) => (
          <div
            key={index}
            className="flex justify-between items-center py-1 first:pt-0 last:pb-0"
          >
            <div className="flex items-start">
              <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center mr-3">
                {/* <ArrowUpRightIcon className="h-5 w-5 text-[#16A34A]" /> */}
                <img src={Arrowtop} alt="" width="9.1" height="9.1" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{deposit.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {deposit.ref} • {deposit.date} • {deposit.time}
                </p>
              </div>
            </div>
            <p className="font-bold text-primary-green text-[#16A34A]">
              {deposit.amount}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepositsCard;
