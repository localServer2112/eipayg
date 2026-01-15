import userImg from "../../assets/img/UserImg.svg";
import { CardInfoResponse } from '../../api/cards';

interface UserProfileCardProps {
  cardDetails: CardInfoResponse;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ cardDetails }) => {
  const { user_info, uuid } = cardDetails;
  const fullName = `${user_info.first_name} ${user_info.last_name}`;

  return (
    <div className="bg-white rounded-2xl p-6 mb-4 flex items-center shadow-sm">
      <img
        src={userImg}
        alt={fullName}
        className="h-16 w-16 rounded-full object-cover mr-4"
      />
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