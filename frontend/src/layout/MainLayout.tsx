import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { LogOut, Fish, User, ChevronDown } from 'lucide-react';

interface MainLayoutProps {
    children: React.ReactNode;
    // 1. Add optional prop. Defaults to true if not passed.
    showNavLinks?: boolean; 
}

// 2. Destructure the prop and set default value to true
export const MainLayout: React.FC<MainLayoutProps> = ({ children, showNavLinks = true }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { label: 'Overview', path: '/dashboard' },
        { label: 'Cards', path: '/cards' },
        { label: 'Storage', path: '/storage' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-[#1A1C1E] text-white shadow-sm z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[141px] flex items-end justify-between pb-8">
                    
                    {/* Left: Logo */}
                    <div className="flex items-center gap-2 cursor-pointer mb-1" onClick={() => navigate('/dashboard')}>
                        <Fish className="h-8 w-8 text-blue-400" />
                        <span className="text-2xl font-bold tracking-tight text-blue-400">Eja-iCe</span>
                    </div>

                    {/* 3. Wrap the NAV block in a conditional check */}
                    {showNavLinks && (
                        <nav className="hidden md:flex items-center gap-4">
                            {navItems.map((item) => {
                                const isActive = location.pathname.startsWith(item.path);
                                return (
                                    <div 
                                        key={item.path}
                                        onClick={() => navigate(item.path)}
                                        className={`
                                            h-[45px] flex items-center px-6 border-b-2 cursor-pointer transition-colors text-sm font-medium
                                            ${isActive 
                                                ? 'border-white text-white bg-[#EEF2FF33]' 
                                                : 'border-transparent text-gray-400 hover:text-gray-200'}
                                        `}
                                    >
                                        {item.label}
                                    </div>
                                );
                            })}
                        </nav>
                    )}

                    {/* Right: User Profile & Actions */}
                    <div className="flex items-center gap-4 mb-1">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-600">
                                <User className="h-6 w-6 text-gray-300" />
                            </div>
                            <ChevronDown className="h-5 w-5 text-gray-400 cursor-pointer" />
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            className="hidden md:flex text-gray-400 hover:text-white hover:bg-white/10"
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
                {children}
            </main>
        </div>
    );
};

// import React from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { Button } from '@/components/ui/button';
// import { useAuth } from '../context/AuthContext';
// import { LogOut, Fish, User, ChevronDown } from 'lucide-react';

// interface MainLayoutProps {
//     children: React.ReactNode;
// }

// export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
//     const { logout } = useAuth();
//     const navigate = useNavigate();
//     const location = useLocation();

//     const handleLogout = () => {
//         logout();
//         navigate('/login');
//     };

//     const navItems = [
//         { label: 'Overview', path: '/dashboard' },
//         { label: 'Cards', path: '/cards' },
//         { label: 'Storage', path: '/storage' },
//     ];

//     return (
//         <div className="min-h-screen bg-gray-50 flex flex-col">
//             {/* Top Navigation - Dark Header */}
//             {/* Removed h-32 from here, height is controlled by the inner container */}
//             <header className="bg-[#1A1C1E] text-white shadow-sm z-50">
                
//                 {/* UPDATES APPLIED:
//                    1. h-[231px]: Sets exact height to 231px
//                    2. items-end: Pushes everything to the bottom
//                    3. pb-8: Adds padding so items don't touch the edge
//                 */}
//                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[121px] flex items-end justify-between pb-8">
                    
//                     {/* 1. Left: Logo */}
//                     {/* mb-1 aligns the text baseline with the navigation links */}
//                     <div className="flex items-center gap-2 cursor-pointer mb-1" onClick={() => navigate('/dashboard')}>
//                         {/* Increased icon size slightly to match the larger header */}
//                         <Fish className="h-8 w-8 text-blue-400" />
//                         <span className="text-2xl font-bold tracking-tight text-blue-400">Eja-iCe</span>
//                     </div>

//                     {/* 2. Center: Navigation Links */}
//                     {/* Removed h-full so they don't stretch the whole 231px */}
//                     <nav className="hidden md:flex items-center gap-4">
//                         {navItems.map((item) => {
//                             const isActive = location.pathname.startsWith(item.path);
                            
//                             return (
//                                 <div 
//                                     key={item.path}
//                                     onClick={() => navigate(item.path)}
//                                     className={`
//                                         h-[45px] flex items-center px-6 border-b-2 cursor-pointer transition-colors text-sm font-medium
//                                         ${isActive 
//                                             ? 'border-white text-white bg-[#EEF2FF33]' 
//                                             : 'border-transparent text-gray-400 hover:text-gray-200'}
//                                     `}
//                                 >
//                                     {item.label}
//                                 </div>
//                             );
//                         })}
//                     </nav>

//                     {/* 3. Right: User Profile & Actions */}
//                     {/* mb-1 ensures alignment with logo/nav */}
//                     <div className="flex items-center gap-4 mb-1">
//                         <div className="flex items-center gap-3">
//                             <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-600">
//                                 <User className="h-6 w-6 text-gray-300" />
//                             </div>
//                             <ChevronDown className="h-5 w-5 text-gray-400 cursor-pointer" />
//                         </div>

//                         <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={handleLogout}
//                             className="hidden md:flex text-gray-400 hover:text-white hover:bg-white/10"
//                         >
//                             <LogOut className="h-5 w-5" />
//                         </Button>
//                     </div>
//                 </div>
//             </header>

//             {/* Main Content Area */}
//             <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
//                 {children}
//             </main>
//         </div>
//     );
// };

// export default MainLayout;