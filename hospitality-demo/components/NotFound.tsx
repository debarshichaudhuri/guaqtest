
import React from 'react';
import { Home, Search, Ghost } from 'lucide-react';
import Footer from './Footer';

interface NotFoundProps {
    onGoHome: () => void;
}

const NotFound: React.FC<NotFoundProps> = ({ onGoHome }) => {
    return (
        <div className="min-h-screen w-full bg-[#050505] flex flex-col relative overflow-hidden font-sans">
             {/* Background Effects */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#050505] to-[#050505]"></div>
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500"></div>

             <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 text-center">
                <div className="mb-6 relative">
                    <div className="absolute inset-0 bg-blue-500/30 blur-3xl rounded-full"></div>
                    <Ghost size={80} className="text-slate-300 relative z-10 animate-bounce" />
                </div>
                
                <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-600 mb-4 tracking-tighter">
                    404
                </h1>
                
                <h2 className="text-2xl font-semibold text-white mb-2">Whoops! Room Service Lost This Page.</h2>
                <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
                    It seems you've wandered into the back of house. The page you are looking for might have been checked out or doesn't exist yet.
                </p>

                <button 
                    onClick={onGoHome}
                    className="group bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/30 transition-all hover:scale-105 flex items-center gap-2"
                >
                    <Home size={18} /> Back to Lobby
                    <ArrowIcon />
                </button>
             </div>

             <Footer />
        </div>
    );
};

const ArrowIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:translate-x-1 transition-transform">
        <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default NotFound;
