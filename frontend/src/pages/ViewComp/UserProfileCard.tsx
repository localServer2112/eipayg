import { CardInfoResponse } from '../../api/cards';

interface UserProfileCardProps {
  cardDetails: CardInfoResponse;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ cardDetails }) => {
  const { user_info, uuid } = cardDetails;
  const fullName = `${user_info.first_name} ${user_info.last_name}`;
  const initials = `${user_info.first_name?.charAt(0) || ''}${user_info.last_name?.charAt(0) || ''}`.toUpperCase();

  return (
    <div className="bg-white rounded-2xl p-6 mb-4 flex items-center shadow-sm">
      <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center mr-4">
        <span className="text-white text-xl font-bold">{initials}</span>
      </div>
      <div>
        <h1 className="text-[32px] font-bold text-gray-900">{fullName}</h1>
        <div className="flex flex-wrap text-[14px] text-gray-500 mt-1 gap-x-4 gap-y-1">
          <p>Card ID: <span className="font-medium text-gray-700">{uuid}</span></p>
          <p>Location: <span className="font-medium text-gray-700">{user_info.address}</span></p> // Address is used as location
          <p>Phone Number: <span className="font-medium text-gray-700">{user_info.phone}</span></p>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;