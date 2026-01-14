import React, { useState } from 'react';

interface AddUnitModalProps {
  onClose: () => void;
}

const AddUnitModal: React.FC<AddUnitModalProps> = ({ onClose }) => {
  const [passcode, setPasscode] = useState(['', '', '', '']);

  const handlePasscodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newPasscode = [...passcode];
    newPasscode[index] = value;
    setPasscode(newPasscode);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`passcode-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    // Overlay Container: Fixed over the whole screen with a blur
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal Content: The white card */}
      <div 
        className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Add units</h2>
        <p className="text-gray-500 text-sm mb-6">
          Credit this user by entering the amount sent and your password
        </p>

        <form className="space-y-6">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Amount sent
            </label>
            <input
              type="text"
              placeholder="N0.00"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          {/* Read-only 'You get' box */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900">
            You get: <span className="font-semibold">50 units</span>
          </div>

          {/* Passcode Section */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Enter transaction passcode
            </label>
            <div className="flex gap-4 justify-between">
              {passcode.map((digit, index) => (
                <input
                  key={index}
                  id={`passcode-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePasscodeChange(index, e.target.value)}
                  className="w-full h-14 border border-gray-200 rounded-xl text-center text-xl font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            className="w-full bg-[#1A1C1E] text-white font-medium py-3.5 rounded-xl hover:bg-gray-800 transition-colors"
          >
            Add Unit
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddUnitModal;