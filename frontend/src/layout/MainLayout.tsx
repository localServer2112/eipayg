import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, CreditCard, Package, LogOut, Fish, User } from 'lucide-react';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Cards', path: '/cards', icon: CreditCard },
        { label: 'Storage', path: '/storage', icon: Package },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Navigation - Dark Header */}
            <header className="bg-gray-900 text-white shadow-md z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
                        <Fish className="h-6 w-6 text-brand" />
                        <span className="text-xl font-bold tracking-tight text-brand">Eja-iCe</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 text-sm text-gray-300">
                            <User className="h-4 w-4" />
                            <span>{user?.first_name} {user?.last_name || 'Admin'}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            className="text-gray-300 hover:text-white hover:bg-gray-800"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex flex-1 max-w-7xl mx-auto w-full">
                {/* Sidebar (Optional: Hidden on mobile, or collapsible) - Keeping it simple for now as Top Nav was emphasized, 
             but typically Shadcn uses Sidebar. The mockup showed top nav.
             Let's use a subtle sidebar or just secondary top nav? 
             The prompt analysis mentioned "Top Navigation" specifically. Let's put secondary nav below or keep sidebar.
             I'll keep a slim sidebar for functionality but style it cleanly.
         */}
                <aside className="hidden md:block w-64 bg-white border-r border-gray-100 py-6">
                    <nav className="space-y-1 px-3">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <Button
                                    key={item.path}
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={`w-full justify-start ${isActive ? 'bg-brand/10 text-brand font-semibold' : 'text-gray-600 hover:text-gray-900'}`}
                                    onClick={() => navigate(item.path)}
                                >
                                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-brand' : 'text-gray-400'}`} />
                                    {item.label}
                                </Button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};
