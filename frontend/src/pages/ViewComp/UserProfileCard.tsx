import { useState, useEffect } from 'react';
import userImg from "../../assets/img/UserImg.svg";
import { cardsApi, CardInfoResponse } from '../../api/cards';

interface UserProfileCardProps {
  cardUuid?: string;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ cardUuid }) => {
  const [cardDetails, setCardDetails] = useState<CardInfoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCardDetails = async () => {
      if (!cardUuid) {
        setError('No card UUID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await cardsApi.getInfo({ card_uuid: cardUuid });
        setCardDetails(response.data);
      } catch (err) {
        console.error('Failed to fetch card details:', err);
        setError('Failed to load user details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCardDetails();
  }, [cardUuid]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 mb-6 flex items-center shadow-sm animate-pulse">
        <div className="h-16 w-16 rounded-full bg-gray-200 mr-4" />
        <div className="flex-1">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="flex gap-4">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !cardDetails) {
    return (
      <div className="bg-white rounded-2xl p-6 mb-6 flex items-center shadow-sm">
        <div className="text-red-500">{error || 'Unable to load user details'}</div>
      </div>
    );
  }

  const { user_info, uuid } = cardDetails;
  const fullName = `${user_info.first_name} ${user_info.last_name}`;

  return (
    <div className="bg-white rounded-2xl p-6 mb-6 flex items-center shadow-sm">
      <img
        src={userImg}
        alt={fullName}
        className="h-16 w-16 rounded-full object-cover mr-4"
      />
      <div>
        <h1 className="text-[32px] font-bold text-gray-900">{fullName}</h1>
        <div className="flex flex-wrap text-[14px] text-gray-500 mt-1 gap-x-4 gap-y-1">
          <p>Card ID: <span className="font-medium text-gray-700">{uuid}</span></p>
          <p>Location: <span className="font-medium text-gray-700">{user_info.address}</span></p>
          <p>Phone Number: <span className="font-medium text-gray-700">{user_info.phone}</span></p>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;