import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/layout/MainLayout";
import ArrowLeft from "../Img/Vector.svg";
import UserProfileCard from "./ViewComp/UserProfileCard";
import BalanceCard from "./ViewComp/BalanceCard";
import DepositsCard from "./ViewComp/DepositsCard";
import SpendingsCard from "./ViewComp/SpendingsCard";

function App() {
    const navigate = useNavigate();
  return (
    <>
      <MainLayout showNavLinks={false}>
        <div className="min-h-screen p-6 sm:p-8 lg:p-2 max-w-7xl mx-auto">
          <div>
            <button onClick={() => navigate('/cards')} className="top">
              <img src={ArrowLeft} alt="" width="18.67" height="18.67" />
              <p>Back</p>
            </button>
            <UserProfileCard />
            <BalanceCard />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Deposits Card takes up 2/5 of the space on large screens */}
              <div className="lg:col-span-2">
                <DepositsCard />
              </div>
              {/* Spendings Card takes up 3/5 of the space on large screens */}
              <div className="lg:col-span-3">
                <SpendingsCard />
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}

export default App;
