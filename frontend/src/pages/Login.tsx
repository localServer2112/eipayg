import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Fish } from 'lucide-react';
import loginSideImage from '../assets/login-visual.png';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login, error, isLoading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(username, password);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        // Full page dark background with subtle vignette
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-900 p-4">

            {/* Main Card: Centered, White, Large Rounded Corners */}
            <Card className="w-full max-w-5xl h-[600px] bg-white rounded-[2rem] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border-0">

                {/* Left Side: Image Area */}
                <div className="hidden md:block relative h-full w-full p-4">
                    <div className="h-full w-full relative rounded-3xl overflow-hidden">
                        <img
                            src={loginSideImage}
                            alt="Fresh Fish Display"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* Gradient overlay for text readability if needed, or just the image */}
                        <div className="absolute inset-0 bg-black/10" />

                        {/* Optional: The "blank white rounded rectangle" mentioned in analysis could be a decorative element. 
                            I'll omit it for now to keep it clean unless specifically requested, or maybe it was just empty space.
                        */}
                    </div>
                </div>

                {/* Right Side: Form Area */}
                <div className="flex flex-col justify-center p-12 lg:p-16">
                    {/* Branding */}
                    <div className="flex items-center gap-2 mb-10">
                        <span className="text-2xl font-bold text-sky-500 tracking-tight">Eja-iCe</span>
                        <div className="flex text-gray-400">
                            <Fish className="h-5 w-5" />
                            <Fish className="h-4 w-4 -ml-1 mt-2" />
                            <Fish className="h-3 w-3 -ml-1" />
                        </div>
                    </div>

                    <div className="mb-8">
                        {/* Exact Heading from Mockup */}
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Login to Ejalce</h2>
                        <p className="text-gray-500 text-sm">Enter username and password to continue</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                                {error}
                            </div>
                        )}

                        {/* Username Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-900" htmlFor="username">
                                Username
                            </label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="John Doe"
                                value={username}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                                required
                                className="bg-white border-gray-200 h-12 rounded-lg focus-visible:ring-sky-500"
                            />
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-900" htmlFor="password">
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="********"
                                value={password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                required
                                className="bg-white border-gray-200 h-12 rounded-lg focus-visible:ring-sky-500"
                            />
                        </div>

                        {/* Login Button */}
                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-medium bg-gray-900 text-white hover:bg-black rounded-lg mt-4"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Logging in...' : 'Login to account'}
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default Login;
