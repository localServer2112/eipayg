// Placeholder for the user image. Replace with the actual image import or URL.
import userImg from "../../img/UserImg.svg";

const UserProfileCard: React.FC = () => {
    const userDetails = {
        name: "Adewale Ciroma Chukwuka",
        cardId: "4982020932",
        location: "Ibadan",
        phoneNumber: "08071798413",
    };
  return (
    <div className="bg-white rounded-2xl p-6 mb-6 flex items-center shadow-sm">
      <img
        src={userImg}
        alt="Adewale Ciroma Chukwuka"
        className="h-16 w-16 rounded-full object-cover mr-4"
      />
      <div>
        <h1 className="text-[32px] font-bold text-gray-900">{userDetails.name}</h1>
        <div className="flex flex-wrap text-[14px] text-gray-500 mt-1 gap-x-4 gap-y-1">
          <p>Card ID: <span className="font-medium text-gray-700">{userDetails.cardId}</span></p>
          <p>Location: <span className="font-medium text-gray-700">{userDetails.location}</span></p>
          <p>Phone Number: <span className="font-medium text-gray-700">{userDetails.phoneNumber}</span></p>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;