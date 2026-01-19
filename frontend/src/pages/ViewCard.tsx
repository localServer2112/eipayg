import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "../layout/MainLayout";
import UserProfileCard from "./ViewComp/UserProfileCard";
import BalanceCard from "./ViewComp/BalanceCard";
import DepositsCard from "./ViewComp/DepositsCard";
import SpendingsCard from "./ViewComp/SpendingsCard";
import { cardsApi, CardInfoResponse } from "../api/cards";
import { toast } from "sonner";
import { Transaction } from "../api/types";
import arrowLeft from "../assets/img/vector.svg";

const ViewCard = () => {
  const { cardUuid } = useParams<{ cardUuid: string }>();
  const navigate = useNavigate();
  const [cardDetails, setCardDetails] = useState<CardInfoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCardDetails = useCallback(async () => {
    if (!cardUuid) {
      toast.error("Invalid card UUID");
      navigate("/cards");
      return;
    }

    try {
      setIsLoading(true);
      const response = await cardsApi.getInfo({ card_uuid: cardUuid });
      setCardDetails(response.data);
    } catch (error) {
      console.error("Failed to fetch card details:", error);
      toast.error("Failed to load card details");
      // navigate("/cards"); // Optional: redirect on error? keeping it safely here or removing to avoid loop if momentary error
    } finally {
      setIsLoading(false);
    }
  }, [cardUuid, navigate]);

  useEffect(() => {
    fetchCardDetails();
  }, [fetchCardDetails]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green"></div>
        </div>
      </MainLayout>
    );
  }

  if (!cardDetails) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Card Not Found</h2>
          <p className="text-gray-500 mb-4">Could not load details for this card.</p>
          <button
            onClick={() => navigate('/cards')}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Cards
          </button>
        </div>
      </MainLayout>
    );
  }

  // Filter transactions for deposits (Credit)
  const depositTransactions = cardDetails.account_details?.transactions?.filter(
    (t: Transaction) => t.transaction_type === "C" || t.transaction_type === "credit"
  ) || [];

  return (
    <MainLayout showNavLinks={false}>
      <div className="min-h-screen p-6 sm:p-8 lg:p-2 max-w-7xl mx-auto">
        <div>
          <button onClick={() => navigate(-1)} className="top flex items-center gap-2 mb-4 text-gray-600 hover:text-gray-900 transition-colors">
            <img src={arrowLeft} alt="" width="18.67" height="18.67" />
            <p>Back</p>
          </button>

          <UserProfileCard cardDetails={cardDetails} />

          {/* Main Grid Layout for Cards */}
          <div className="flex flex-col gap-4">
            <BalanceCard
              balance={cardDetails.account_details?.balance || '0.00'}
              cardUuid={cardDetails.uuid}
              accountUuid={cardDetails.account_details?.uuid || ''}
              isBlocked={cardDetails.is_blocked}
              onRefresh={fetchCardDetails}
            />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Deposits Card takes up 2/5 of the space on large screens */}
              <div className="lg:col-span-2">
                <DepositsCard transactions={depositTransactions} />
              </div>
              {/* Spendings Card takes up 3/5 of the space on large screens */}
              <div className="lg:col-span-3">
                <SpendingsCard
                  storageLogs={cardDetails.account_details?.storage_activities || []}
                  onRefresh={fetchCardDetails}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ViewCard;
