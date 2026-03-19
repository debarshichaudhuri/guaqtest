import React, { useState, useEffect } from 'react';
import { Send, Image, Video, Users, DollarSign, Filter, Eye, MousePointer, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { CampaignFilter, Campaign } from '../types';

/**
 * ==============================================================================
 * 🏗️ ARCHITECTURE NOTE: CAMPAIGNS & MARKETING
 * ==============================================================================
 * 
 * 1. BULK MESSAGING (WhatsApp/Email API):
 *    - In Production, do not iterate and send messages in the request loop.
 *    - Use a dedicated provider (Twilio / Meta Business API / SendGrid).
 * 
 * 2. ANALYTICS TRACKING:
 *    - To track "Read Rate" and "Click Rate", links in the messages must be shortened
 *      with unique tokens (e.g., `hotel.com/c/xyz123`).
 *    - Create a middleware endpoint `GET /c/[token]` that records the click in DB 
 *      before redirecting.
 * ==============================================================================
 */

const mockCampaignHistory: Campaign[] = [
    { id: '1', name: 'Diwali Gala Dinner', status: 'Sent', sentDate: 'Oct 25, 2024', audienceSize: 450, readRate: 98, clickRate: 45, revenue: 12500, content: '' },
    { id: '2', name: 'Monsoon Spa Retreat', status: 'Sent', sentDate: 'Aug 10, 2024', audienceSize: 210, readRate: 92, clickRate: 38, revenue: 8400, content: '' },
    { id: '3', name: 'New Year Early Bird', status: 'Scheduled', sentDate: 'Dec 01, 2024', audienceSize: 800, content: '' },
];

const Campaigns: React.FC = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaignHistory);
    const [filters, setFilters] = useState<CampaignFilter>({
        ageRange: [25, 60],
        minSpend: 0,
        interests: [],
        location: 'all'
    });
    const [audienceSize, setAudienceSize] = useState(142);
    const [estCost, setEstCost] = useState(0);
    const [isScheduled, setIsScheduled] = useState(false);
    
    // Form State
    const [campaignName, setCampaignName] = useState('');
    const [messageContent, setMessageContent] = useState('');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    
    // Feedback State
    const [notification, setNotification] = useState<{type: 'success' | 'error', msg: string} | null>(null);

    useEffect(() => {
        let size = 142; // Base
        
        if (filters.minSpend > 500) size = Math.floor(size * 0.4);
        if (filters.minSpend > 1000) size = Math.floor(size * 0.2);
        
        if (filters.interests.includes('spa')) size = Math.floor(size * 0.6);
        if (filters.interests.includes('dining')) size = Math.floor(size * 0.8);
        
        if (filters.location === 'local') size = Math.floor(size * 0.5);
        if (filters.location === 'international') size = Math.floor(size * 0.15);

        const ageSpan = filters.ageRange[1] - filters.ageRange[0];
        if (ageSpan < 20) size = Math.floor(size * 0.7);

        setAudienceSize(Math.max(5, size));
    }, [filters]);

    useEffect(() => {
        setEstCost(Number((audienceSize * 0.08).toFixed(2)));
    }, [audienceSize]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const toggleInterest = (interest: string) => {
        setFilters(prev => ({
            ...prev,
            interests: prev.interests.includes(interest) 
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const handleLaunch = () => {
        if (!campaignName.trim()) {
            setNotification({ type: 'error', msg: 'Campaign Name is required.' });
            return;
        }

        if (isScheduled && (!scheduleDate || !scheduleTime)) {
            setNotification({ type: 'error', msg: 'Please select both Date and Time for scheduling.' });
            return;
        }

        const newCampaign: Campaign = {
            id: Date.now().toString(),
            name: campaignName,
            status: isScheduled ? 'Scheduled' : 'Sent',
            sentDate: isScheduled ? `${new Date(scheduleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Just Now',
            audienceSize: audienceSize,
            content: messageContent,
            readRate: 0,
            clickRate: 0,
            revenue: 0
        };

        setCampaigns([newCampaign, ...campaigns]);
        setNotification({ type: 'success', msg: isScheduled ? 'Campaign scheduled successfully!' : 'Campaign launched successfully!' });
        
        // Reset Form
        setCampaignName('');
        setMessageContent('');
        setScheduleDate('');
        setScheduleTime('');
        setIsScheduled(false);
    };

    return (
        <div className="p-8 w-full">
            
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 ${
                    notification.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-white' : 'bg-rose-900/90 border-rose-500/50 text-white'
                }`}>
                    {notification.type === 'success' ? <CheckCircle size={20} className="text-emerald-400"/> : <AlertCircle size={20} className="text-rose-400"/>}
                    <p className="font-medium">{notification.msg}</p>
                </div>
            )}

            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Campaigns</h1>
            <p className="text-slate-400 mb-8">Create targeted broadcast campaigns and track performance.</p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                {/* Filters Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Filter size={18} className="text-blue-400"/> Target Audience
                        </h3>
                        
                        {/* Age Slider Mock */}
                        <div className="mb-6">
                            <div className="flex justify-between text-xs text-slate-400 mb-2">
                                <span>Age Range</span>
                                <span className="text-white">{filters.ageRange[0]} - {filters.ageRange[1]} years</span>
                            </div>
                            <input 
                                type="range" 
                                min="18" 
                                max="80" 
                                value={filters.ageRange[1]} 
                                onChange={(e) => setFilters({...filters, ageRange: [filters.ageRange[0], parseInt(e.target.value)]})}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        {/* Spend Tier */}
                        <div className="mb-6">
                            <label className="block text-xs text-slate-400 mb-2">Min. Lifetime Spend ($)</label>
                            <select 
                                value={filters.minSpend}
                                onChange={(e) => setFilters({...filters, minSpend: parseInt(e.target.value)})}
                                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                            >
                                <option value="0">All Guests</option>
                                <option value="500">High Value (&gt; $500)</option>
                                <option value="1000">VIP (&gt; $1000)</option>
                            </select>
                        </div>

                        {/* Location */}
                        <div className="mb-6">
                            <label className="block text-xs text-slate-400 mb-2">Guest Origin</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['All', 'Local', 'Outstation', 'International'].map((loc) => (
                                    <button 
                                        key={loc}
                                        onClick={() => setFilters({...filters, location: loc.toLowerCase() as any})}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${
                                            filters.location === loc.toLowerCase() 
                                            ? 'bg-blue-600 border-blue-500 text-white' 
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {loc}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Interests */}
                        <div>
                            <label className="block text-xs text-slate-400 mb-2">Interest Tags</label>
                            <div className="flex flex-wrap gap-2">
                                {['Spa', 'Dining', 'Business', 'Family', 'Golf'].map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => toggleInterest(tag.toLowerCase())}
                                        className={`px-3 py-1.5 rounded-full text-xs border transition ${
                                            filters.interests.includes(tag.toLowerCase())
                                            ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="glass-card p-4 rounded-xl border border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                 <Users size={20}/>
                             </div>
                             <div>
                                 <p className="text-xs text-slate-500">Matched Audience</p>
                                 <p className="text-xl font-bold text-white">{audienceSize}</p>
                             </div>
                         </div>
                         <div className="h-8 w-[1px] bg-slate-700"></div>
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                 <DollarSign size={20}/>
                             </div>
                             <div>
                                 <p className="text-xs text-slate-500">Est. Cost</p>
                                 <p className="text-xl font-bold text-white">${estCost}</p>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Campaign Creator */}
                <div className="lg:col-span-8">
                    <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-purple-500 border border-white/5 h-full flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-1">Compose Message</h3>
                                <p className="text-slate-400 text-sm">Design your WhatsApp template message.</p>
                            </div>
                            
                            {/* Schedule Toggle */}
                            <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-lg border border-slate-700">
                                <span className={`text-xs font-medium ${isScheduled ? 'text-white' : 'text-slate-400'}`}>Schedule for later</span>
                                <button 
                                    onClick={() => setIsScheduled(!isScheduled)}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${isScheduled ? 'bg-purple-600' : 'bg-slate-600'}`}
                                >
                                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${isScheduled ? 'left-6' : 'left-1'}`}></div>
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-4 flex-1">
                             <div>
                                <label className="block text-xs text-slate-400 mb-2 font-medium">CAMPAIGN NAME <span className="text-rose-400">*</span></label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Weekend Spa Flash Sale" 
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 transition" 
                                    value={campaignName}
                                    onChange={(e) => setCampaignName(e.target.value)}
                                />
                             </div>
                             
                             <div>
                                <label className="block text-xs text-slate-400 mb-2 font-medium">MESSAGE BODY (Variables: {'{GuestName}'})</label>
                                <textarea 
                                    rows={6}
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 resize-none transition"
                                    placeholder="Relax this weekend, {GuestName}! 🌿 Show this message at the spa for a complimentary 15min foot massage with any therapy."
                                    value={messageContent}
                                    onChange={(e) => setMessageContent(e.target.value)}
                                ></textarea>
                             </div>

                             {isScheduled && (
                                 <div className="animate-in fade-in slide-in-from-top-2 bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-600">
                                     <label className="block text-xs text-purple-300 mb-2 font-medium flex items-center gap-2">
                                         <Clock size={14}/> SCHEDULE DATE & TIME <span className="text-rose-400">*</span>
                                     </label>
                                     <div className="grid grid-cols-2 gap-4">
                                         <div>
                                            <label className="text-[10px] text-slate-400 block mb-1">DATE</label>
                                            <input 
                                                type="date" 
                                                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none w-full placeholder-slate-500"
                                                value={scheduleDate}
                                                onChange={(e) => setScheduleDate(e.target.value)}
                                            />
                                         </div>
                                         <div>
                                            <label className="text-[10px] text-slate-400 block mb-1">TIME</label>
                                            <input 
                                                type="time" 
                                                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none w-full placeholder-slate-500"
                                                value={scheduleTime}
                                                onChange={(e) => setScheduleTime(e.target.value)}
                                            />
                                         </div>
                                     </div>
                                 </div>
                             )}

                             <div className="flex gap-4">
                                 <button className="flex-1 bg-slate-800 border border-slate-600 hover:bg-slate-700 text-slate-300 py-3 rounded-lg text-xs flex items-center justify-center gap-2 transition">
                                     <Image size={16}/> Add Image
                                 </button>
                                 <button className="flex-1 bg-slate-800 border border-slate-600 hover:bg-slate-700 text-slate-300 py-3 rounded-lg text-xs flex items-center justify-center gap-2 transition">
                                     <Video size={16}/> Add Video
                                 </button>
                             </div>
                        </div>
                        <div className="pt-6 mt-6 border-t border-white/5">
                            <button 
                                onClick={handleLaunch}
                                className={`w-full text-white py-3 rounded-lg font-medium shadow-lg flex justify-center items-center gap-2 transition hover:translate-y-[-1px] ${isScheduled ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/50' : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/50'}`}
                            >
                                {isScheduled ? <Calendar size={18} /> : <Send size={18} />} 
                                {isScheduled ? `Schedule Campaign` : `Launch Campaign to ${audienceSize} Guests`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Campaign History */}
            <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-slate-900/50">
                    <h3 className="text-lg font-semibold text-white">Campaign List</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-900/50">
                            <tr className="text-xs text-slate-400 uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">Campaign Name</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Sent Date</th>
                                <th className="px-6 py-4 font-medium text-right">Read Rate</th>
                                <th className="px-6 py-4 font-medium text-right">Click Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {campaigns.map((camp) => (
                                <tr key={camp.id} className="hover:bg-white/5 transition animate-in fade-in slide-in-from-left-2">
                                    <td className="px-6 py-4 font-medium text-white">{camp.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs border ${
                                            camp.status === 'Sent' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                            camp.status === 'Scheduled' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            'bg-slate-700 text-slate-300 border-slate-600'
                                        }`}>
                                            {camp.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">{camp.sentDate}</td>
                                    <td className="px-6 py-4 text-right">
                                        {camp.readRate ? (
                                            <div className="flex items-center justify-end gap-2 text-slate-300">
                                                <Eye size={14} className="text-blue-400"/> {camp.readRate}%
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                         {camp.clickRate ? (
                                            <div className="flex items-center justify-end gap-2 text-slate-300">
                                                <MousePointer size={14} className="text-purple-400"/> {camp.clickRate}%
                                            </div>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Campaigns;