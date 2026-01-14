import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import Pencil from "../../Img/Pencil.svg";
import AddUnitModal from './AddUnitModal';

const BalanceCard = () => {
  // State to control the visibility of the modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="bg-white rounded-2xl p-6 mb-6 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="text-[24px] font-bold text-gray-900">N345,000</h2>
          <p className="text-gray-500 text-[14px]">Total Balance</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2.5 bg-gray-900 text-white rounded-full font-medium text-xs hover:bg-gray-800 transition-colors gap-4">
            {/* <PenSquareIcon className="h-4 w-4 mr-2 text-[#05B4F3]" /> */}
            <img src={Pencil} alt="Pencil" width="12" height="12" />
            Edit Details
          </button>
          
          {/* Updated Button: Now triggers the modal opening */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2.5 bg-gray-900 text-white rounded-full font-medium text-xs hover:bg-gray-800 transition-colors gap-2"
          >
            <PlusIcon className="h-4 w-4 mr-2 text-[#05B4F3]" />
            Add Unit
          </button>
        </div>
      </div>

      {/* Conditionally render the modal when state is true */}
      {isModalOpen && (
        <AddUnitModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};

export default BalanceCard;

// import { PenSquareIcon, PlusIcon } from 'lucide-react';

// const BalanceCard = () => {
//   return (
//     <div className="bg-white rounded-2xl p-6 mb-6 flex justify-between items-center shadow-sm">
//       <div>
//         <h2 className="text-3xl font-bold text-gray-900">N345,000</h2>
//         <p className="text-gray-500 text-sm">Total Balance</p>
//       </div>
//       <div className="flex space-x-3">
//         <button className="flex items-center px-4 py-2.5 bg-gray-900 text-white rounded-full font-medium text-sm hover:bg-gray-800 transition-colors">
//           <PenSquareIcon className="h-4 w-4 mr-2 text-[#05B4F3]" />
//           Edit Details
//         </button>
//         <button className="flex items-center px-4 py-2.5 bg-gray-900 text-white rounded-full font-medium text-sm hover:bg-gray-800 transition-colors">
//           <PlusIcon className="h-4 w-4 mr-2 text-[#05B4F3]" />
//           Add Unit
//         </button>
//       </div>
//     </div>
//   );
// };

// export default BalanceCard;