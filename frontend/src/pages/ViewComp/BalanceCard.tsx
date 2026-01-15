import { useState } from 'react';
import { PlusIcon, Package, Ban, CheckCircle } from 'lucide-react';
import AddUnitModal from './AddUnitModal';
import { storagesApi } from '../../api/storages';
import { cardsApi } from '../../api/cards';
import { toast } from 'sonner';

interface BalanceCardProps {
  balance: string;
  cardUuid: string;
  accountUuid: string;
  isBlocked: boolean;
  onRefresh: () => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balance, cardUuid, accountUuid, isBlocked, onRefresh }) => {
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check-in form state
  const [commodity, setCommodity] = useState('');
  const [weight, setWeight] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('24');

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const now = new Date();
      const checkIn = now.toISOString();
      const estimatedCheckout = new Date(now.getTime() + parseInt(estimatedHours) * 60 * 60 * 1000).toISOString();

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
      onRefresh();
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

  const handleSuspendToggle = async () => {
    setIsSubmitting(true);
    try {
      await cardsApi.block({
        card_uuid: cardUuid,
        is_blocked: !isBlocked
      });

      toast.success(isBlocked ? 'Card unblocked successfully' : 'Card suspended successfully');
      setIsSuspendModalOpen(false);
      onRefresh();
    } catch (error: any) {
      console.error('Failed to toggle card status:', error);
      const errorData = error.response?.data;
      let errorMessage = isBlocked ? 'Failed to unblock card' : 'Failed to suspend card';
      if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (errorData?.detail) {
        errorMessage = errorData.detail;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCheckInForm = () => {
    setCommodity('');
    setWeight('');
    setHourlyRate('');
    setEstimatedHours('24');
  };

  return (
    <>
      <div className="bg-white rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h2 className="text-[24px] font-bold text-gray-900">₦{balance}</h2>
          <p className="text-gray-500 text-[14px]">Total Balance</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Suspend/Unblock Card Button */}
          <button
            onClick={() => setIsSuspendModalOpen(true)}
            className={`flex items-center px-4 py-2.5 rounded-full font-medium text-xs transition-colors gap-2 ${isBlocked
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-red-600 text-white hover:bg-red-700'
              }`}
          >
            {isBlocked ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Unblock Card
              </>
            ) : (
              <>
                <Ban className="h-4 w-4" />
                Suspend Card
              </>
            )}
          </button>

          {/* Check-in Item Button */}
          <button
            onClick={() => setIsCheckInModalOpen(true)}
            className="flex items-center px-4 py-2.5 bg-gray-900 text-white rounded-full font-medium text-xs hover:bg-gray-800 transition-colors gap-2"
          >
            <Package className="h-4 w-4 text-[#05B4F3]" />
            Check in Item
          </button>

          {/* Add Unit Button */}
          <button
            onClick={() => setIsAddUnitModalOpen(true)}
            className="flex items-center px-4 py-2.5 bg-gray-900 text-white rounded-full font-medium text-xs hover:bg-gray-800 transition-colors gap-2"
          >
            <PlusIcon className="h-4 w-4 text-[#05B4F3]" />
            Add Unit
          </button>
        </div>
      </div>

      {/* Add Unit Modal */}
      {isAddUnitModalOpen && (
        <AddUnitModal
          onClose={() => setIsAddUnitModalOpen(false)}
          cardUuid={cardUuid}
          onSuccess={onRefresh}
        />
      )}

      {/* Check-in Item Modal */}
      {isCheckInModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIsCheckInModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Check in Item</h2>
            <p className="text-gray-500 text-sm mb-6">
              Add a new item to cold storage for this account
            </p>

            <form onSubmit={handleCheckIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Commodity
                </label>
                <input
                  type="text"
                  placeholder="e.g. Frozen Fish, Chicken"
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="50"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Hourly Rate (₦)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="100"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Estimated Duration (hours)
                </label>
                <input
                  type="number"
                  placeholder="24"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                />
              </div>

              <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900">
                Estimated Cost: <span className="font-semibold">₦{((parseFloat(hourlyRate) || 0) * (parseFloat(estimatedHours) || 0)).toFixed(2)}</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1A1C1E] text-white font-medium py-3.5 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : 'Check in Item'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Suspend/Unblock Confirmation Modal */}
      {isSuspendModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIsSuspendModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {isBlocked ? 'Unblock Card' : 'Suspend Card'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {isBlocked
                ? 'Are you sure you want to unblock this card? The user will be able to use it again.'
                : 'Are you sure you want to suspend this card? The user will not be able to use it until it is unblocked.'
              }
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsSuspendModalOpen(false)}
                className="px-6 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendToggle}
                disabled={isSubmitting}
                className={`px-6 py-2.5 rounded-xl font-medium text-white transition-colors disabled:opacity-50 ${isBlocked
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                  }`}
              >
                {isSubmitting ? 'Processing...' : (isBlocked ? 'Unblock' : 'Suspend')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BalanceCard;
