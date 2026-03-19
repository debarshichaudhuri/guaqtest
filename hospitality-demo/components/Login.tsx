
import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, ArrowRight, Building2, Phone, Mail, Globe, Chrome, CheckCircle2, Rocket, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { BrandingConfig } from '../types';
import Footer from './Footer';
import NotFound from './NotFound';

interface LoginProps {
  onLogin: (email: string, password: string, role: 'admin' | 'staff') => void;
  branding: BrandingConfig;
}

const Login: React.FC<LoginProps> = ({ onLogin, branding }) => {
  const [activeMethod, setActiveMethod] = useState<'email' | 'phone'>('email');
  const [clientId, setClientId] = useState('demo-hotel');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [show404, setShow404] = useState(false);
  
  // View State for Scroll Snap
  const [showPricing, setShowPricing] = useState(false);
  
  const pricingScrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const startScrollTop = useRef<number>(0);
  const minSwipeDistance = 50;

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
        if (show404) return;
        if (showPricing) {
            // Pricing View: Scroll Up at top -> Go to Login
            if (pricingScrollRef.current && pricingScrollRef.current.scrollTop <= 5) {
                if (e.deltaY < -30) {
                    setShowPricing(false);
                }
            }
        } else {
            // Login View: Scroll Down -> Go to Pricing
            if (e.deltaY > 30) {
                setShowPricing(true);
            }
        }
    };

    const handleTouchStart = (e: TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
        if (pricingScrollRef.current) {
            startScrollTop.current = pricingScrollRef.current.scrollTop;
        } else {
            startScrollTop.current = 0;
        }
    };

    const handleTouchEnd = (e: TouchEvent) => {
        if (show404) return;
        const touchEndY = e.changedTouches[0].clientY;
        const distance = touchStartY.current - touchEndY;

        if (showPricing) {
            // Swipe Down to go back to Login
            if (distance < -30) {
                 if (startScrollTop.current <= 5 && (pricingScrollRef.current?.scrollTop || 0) <= 5) {
                     setShowPricing(false);
                 }
            }
        } else {
            // Swipe Up to go to Pricing
            if (distance > minSwipeDistance) {
                setShowPricing(true);
            }
        }
    };

    window.addEventListener('wheel', handleWheel);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
        window.removeEventListener('wheel', handleWheel);
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [showPricing, show404]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAuthFlow('staff');
  };

  const handleAuthFlow = (role: 'admin' | 'staff') => {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        if (role === 'admin') {
            onLogin(email, password, 'admin');
        } else {
            // Mock check: if email contains 'admin', treat as admin
            const resolvedRole: 'admin' | 'staff' = email.includes('admin') ? 'admin' : 'staff';
            onLogin(email, password, resolvedRole);
        }
      }, 800);
  };

  if (show404) {
      return <NotFound onGoHome={() => setShow404(false)} />;
  }

  return (
    <div className="h-[100dvh] w-full bg-[#050505] overflow-hidden relative font-sans text-slate-200">
        
        {/* Background Layer (Static) */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505] pointer-events-none"></div>
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] pointer-events-none"></div>

        {/* Scrolling Container */}
        <div 
            className="w-full h-full transition-transform duration-700 ease-in-out"
            style={{ transform: `translateY(${showPricing ? '-100%' : '0%'})` }}
        >
            {/* SECTION 1: LOGIN HERO */}
            <div className="h-[100dvh] w-full flex flex-col relative overflow-y-auto custom-scrollbar">
                <div className="flex-1 flex items-center justify-center p-4 min-h-[600px]">
                    <div className="relative z-10 w-full max-w-md">
                        <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl">
                        
                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-600/20">
                            {branding.logoUrl ? (
                                <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                                <span className="text-white font-bold text-xl">{branding.appName.charAt(0)}</span>
                            )}
                            </div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">{branding.appName}</h1>
                            <p className="text-slate-400 text-sm mt-1">Hospitality Operations Portal</p>
                        </div>

                        {/* Explore Demo Button */}
                        <button 
                            onClick={() => handleAuthFlow('admin')}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition transform hover:scale-[1.02] mb-5 border border-emerald-500/20"
                        >
                            <Rocket size={18} /> Explore Demo as Admin
                        </button>

                        <div className="flex items-center gap-3 mb-5">
                            <div className="h-[1px] bg-white/10 flex-1"></div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Or Sign In</span>
                            <div className="h-[1px] bg-white/10 flex-1"></div>
                        </div>

                        {/* Login Methods Tabs */}
                        <div className="flex p-1 bg-slate-900/50 rounded-xl mb-5 border border-white/5">
                            <button 
                            onClick={() => setActiveMethod('email')}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg transition flex items-center justify-center gap-2 ${activeMethod === 'email' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                            >
                            <Mail size={14} /> Email
                            </button>
                            <button 
                            onClick={() => setActiveMethod('phone')}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg transition flex items-center justify-center gap-2 ${activeMethod === 'phone' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                            >
                            <Phone size={14} /> Phone
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            {/* Client ID (Multi-tenant) */}
                            <div className="relative group">
                                <Building2 className="absolute left-3 top-3 text-slate-500 group-focus-within:text-blue-400 transition" size={16} />
                                <input 
                                type="text" 
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                placeholder="Client ID (e.g. hotel-slug)" 
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>

                            {/* Credentials */}
                            {activeMethod === 'email' ? (
                                <div className="relative group">
                                    <User className="absolute left-3 top-3 text-slate-500 group-focus-within:text-blue-400 transition" size={16} />
                                    <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@property.com" 
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                            ) : (
                                <div className="relative group">
                                    <Phone className="absolute left-3 top-3 text-slate-500 group-focus-within:text-blue-400 transition" size={16} />
                                    <input 
                                    type="tel" 
                                    placeholder="+91 99999 00000" 
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                            )}

                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 text-slate-500 group-focus-within:text-blue-400 transition" size={16} />
                                <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••" 
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 outline-none transition"
                                required={activeMethod === 'email'}
                                />
                            </div>

                            <div className="flex justify-end">
                                <button type="button" onClick={() => setShow404(true)} className="text-[10px] text-blue-400 hover:text-blue-300 transition">Forgot Password?</button>
                            </div>

                            <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition transform hover:scale-[1.02]"
                            >
                            {isLoading ? (
                                <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span>
                            ) : (
                                <>Login <ArrowRight size={18} /></>
                            )}
                            </button>
                        </form>

                        {/* Social / Divider */}
                        <div className="mt-5 pt-5 border-t border-white/5 grid grid-cols-2 gap-3">
                            <button onClick={() => setShow404(true)} className="flex items-center justify-center gap-2 py-2.5 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-200 transition">
                                <Chrome size={16} /> Google
                            </button>
                            <button onClick={() => setShow404(true)} className="flex items-center justify-center gap-2 py-2.5 bg-[#1a1a1a] text-white border border-white/10 rounded-xl text-xs font-bold hover:bg-slate-900 transition">
                                <Globe size={16} /> SSO
                            </button>
                        </div>
                        </div>
                    </div>
                </div>

                {/* Visual Nudge to Pricing */}
                <div className="shrink-0 pb-8 flex justify-center animate-bounce">
                    <button 
                        onClick={() => setShowPricing(true)}
                        className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition group cursor-pointer"
                    >
                        <span className="text-[10px] font-medium uppercase tracking-widest opacity-70 group-hover:opacity-100">View Pricing</span>
                        <ChevronDown size={20} />
                    </button>
                </div>
            </div>

            {/* SECTION 2: PRICING */}
            <div className="h-[100dvh] w-full bg-[#050505] relative z-10 flex flex-col">
                {/* Fixed Top Bar with Gradient for visibility */}
                <div className="absolute top-0 left-0 w-full z-30 pt-6 pb-12 bg-gradient-to-b from-[#050505] via-[#050505]/90 to-transparent pointer-events-none"></div>

                {/* Back Button */}
                <div className="absolute top-4 w-full flex justify-center z-40">
                    <button 
                        onClick={() => setShowPricing(false)}
                        className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition group cursor-pointer bg-[#050505]/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/5"
                    >
                        <ChevronUp size={20} />
                        <span className="text-[10px] font-medium uppercase tracking-widest opacity-70 group-hover:opacity-100">Back to Login</span>
                    </button>
                </div>

                <div ref={pricingScrollRef} className="flex-1 overflow-y-auto custom-scrollbar relative z-20">
                    <div className="min-h-full flex flex-col">
                        <div className="flex-1 flex flex-col items-center px-6 pt-32 pb-16">
                            <div className="max-w-7xl mx-auto w-full">
                                <div className="text-center mb-10">
                                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Transparent Pricing</h2>
                                    <p className="text-slate-400 max-w-2xl mx-auto">Scalable solutions for every property size.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-10">
                                    {/* Basic Tier */}
                                    <div className="glass-panel p-6 lg:p-8 rounded-3xl border border-white/5 hover:border-blue-500/30 transition flex flex-col hover:bg-white/5">
                                        <div className="mb-4">
                                            <h3 className="text-xl font-bold text-white">Basic</h3>
                                            <p className="text-sm text-slate-500 mt-1">For independent hotels</p>
                                        </div>
                                        <div className="mb-6">
                                            <span className="text-3xl font-bold text-white">$699</span>
                                            <span className="text-slate-500">/mo</span>
                                            <p className="text-xs text-slate-400 mt-1">or ₹50,000 INR /mo billed annually</p>
                                        </div>
                                        <div className="space-y-3 mb-8 flex-1">
                                            {['Review Automation', 'Check-in/Out Messages', 'Standard Dashboard', 'Email Support'].map(f => (
                                                <div key={f} className="flex items-center gap-3 text-sm text-slate-300">
                                                    <CheckCircle2 size={16} className="text-blue-500 shrink-0"/> {f}
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => handleAuthFlow('admin')} className="w-full py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition font-medium">Get Started</button>
                                    </div>

                                    {/* Pro Tier */}
                                    <div className="glass-panel p-6 lg:p-8 rounded-3xl border border-blue-500/50 bg-blue-500/10 relative flex flex-col transform md:-translate-y-4 shadow-2xl shadow-blue-900/20">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-b-lg uppercase tracking-wider">Best Value</div>
                                        <div className="mb-4 mt-2">
                                            <h3 className="text-xl font-bold text-white">Pro</h3>
                                            <p className="text-sm text-slate-300 mt-1">For busy properties</p>
                                        </div>
                                        <div className="mb-6">
                                            <span className="text-4xl font-bold text-white">$999</span>
                                            <span className="text-slate-400">/mo</span>
                                            <p className="text-xs text-blue-300 mt-1">or ₹80,000 INR /mo billed annually</p>
                                        </div>
                                        <div className="space-y-3 mb-8 flex-1">
                                            {['Everything in Basic', 'Campaign Management', 'Service Ticketing System', 'Intelligent Chatbot', 'Basic Data Analytics'].map(f => (
                                                <div key={f} className="flex items-center gap-3 text-sm text-white font-medium">
                                                    <CheckCircle2 size={16} className="text-blue-400 shrink-0"/> {f}
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => handleAuthFlow('admin')} className="w-full py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition font-bold shadow-lg">Start Free Trial</button>
                                    </div>

                                    {/* Ultimate Tier */}
                                    <div className="glass-panel p-6 lg:p-8 rounded-3xl border border-white/5 hover:border-purple-500/30 transition flex flex-col hover:bg-white/5">
                                        <div className="mb-4">
                                            <h3 className="text-xl font-bold text-white">Ultimate</h3>
                                            <p className="text-sm text-slate-500 mt-1">For enterprise chains</p>
                                        </div>
                                        <div className="mb-6">
                                            <span className="text-3xl font-bold text-white">Contact Us</span>
                                            <p className="text-xs text-slate-400 mt-1">Custom volume pricing</p>
                                        </div>
                                        <div className="space-y-3 mb-8 flex-1">
                                            {['Everything in Pro', 'Review & Upsell Auto-Pilot', 'Full Data Analytics Suite', 'Dedicated Account Manager', 'Custom Integrations'].map(f => (
                                                <div key={f} className="flex items-center gap-3 text-sm text-slate-300">
                                                    <CheckCircle2 size={16} className="text-purple-500 shrink-0"/> {f}
                                                </div>
                                            ))}
                                        </div>
                                        <a 
                                            href="https://guaq.framer.ai/contact-us" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="w-full py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition font-medium flex items-center justify-center gap-2"
                                        >
                                            Contact Sales <ExternalLink size={16}/>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-auto">
                            <Footer />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Login;
