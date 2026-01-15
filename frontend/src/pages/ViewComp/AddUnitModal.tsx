import React, { useState } from 'react';
import { toast } from 'sonner';
import { cardsApi } from '../../api/cards';

interface AddUnitModalProps {
  onClose: () => void;
  cardUuid: string;
  onSuccess: () => void;
}

const AddUnitModal: React.FC<AddUnitModalProps> = ({ onClose, cardUuid, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddUnit = async () => {
    if (!amount) {
      toast.error('Please enter an amount');
      return;
    }

    try {
      setIsLoading(true);
      // Strip currency symbol if present
      const cleanAmount = amount.replace(/[^0-9.]/g, '');

      await cardsApi.topUp({
        card_uuid: cardUuid,
        amount: cleanAmount,
        description: 'Web Top-up'
      });

      toast.success('Units added successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Top up failed:', error);
      const errorData = error.response?.data;
      let errorMessage = 'Failed to add units';
      if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (errorData?.detail) {
        errorMessage = errorData.detail;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Add units</h2>
        <p className="text-gray-500 text-sm mb-6">
          Credit this user by entering the amount to add
        </p>

        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleAddUnit(); }}>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Amount
            </label>
            <input
              type="text"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900">
            To be credited: <span className="font-semibold">₦{amount || '0'}</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1A1C1E] text-white font-medium py-3.5 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Add Unit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddUnitModal;
