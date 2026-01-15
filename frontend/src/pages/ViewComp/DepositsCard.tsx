import { Search as MagnifyingGlassIcon } from "lucide-react";
import Arrowtop from "../../assets/img/ArrowTop.svg";
import { Transaction } from "../../api/types";

interface DepositsCardProps {
  transactions: Transaction[];
}

const DepositsCard: React.FC<DepositsCardProps> = ({ transactions }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm h-full flex flex-col max-h-[calc(90vh-300px)]">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Deposits</h3>
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search..."
          className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent sm:text-sm"
        />
      </div>
      <div className="space-y-4 overflow-y-auto flex-1 pr-2">
        {transactions?.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No deposits found</p>
        ) : (
          transactions?.map((deposit) => (
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
    </div>
  );
};

export default DepositsCard;
