
import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Sparkles, X, ChevronLeft, UserPlus, User, ChevronDown } from 'lucide-react';
import { ChatSender, Message, StaffMember } from '../types';

interface UserType {
    id: number;
    name: string;
    status: 'online' | 'offline' | 'critical';
    avatarBg: string;
    lastMsg: string;
    time: string;
    unread: number;
    phone: string;
    type?: 'Business' | 'Leisure' | 'Couple' | 'Family';
    assignedTo?: string; 
}

const initialUsers: UserType[] = [
    { id: 1, name: 'Room 304 (John)', status: 'critical', avatarBg: 'bg-indigo-600', lastMsg: 'The AC is dripping water on the bed.', time: '2m', unread: 1, phone: '+91 98765 43210', type: 'Business' },
    { id: 2, name: 'Room 102 (Sarah)', status: 'online', avatarBg: 'bg-emerald-600', lastMsg: 'Could you send fresh towels?', time: '15m', unread: 0, phone: '+91 98765 12345', type: 'Couple' },
    { id: 3, name: 'Room 505 (Mike)', status: 'offline', avatarBg: 'bg-amber-600', lastMsg: 'Thanks for the quick service!', time: '1h', unread: 0, phone: '+91 91234 56789', type: 'Family' },
    { id: 4, name: 'Room 201 (Lee)', status: 'online', avatarBg: 'bg-rose-600', lastMsg: 'Cab booking confirmed?', time: '2h', unread: 0, phone: '+91 99887 77665', type: 'Business' },
    { id: 5, name: 'Room 404 (David)', status: 'offline', avatarBg: 'bg-purple-600', lastMsg: 'Is the pool open?', time: '3h', unread: 0, phone: '+91 98765 00001', type: 'Leisure' },
    { id: 6, name: 'Room 105 (Alice)', status: 'online', avatarBg: 'bg-cyan-600', lastMsg: 'Late checkout request', time: '4h', unread: 0, phone: '+91 98765 00002', type: 'Business' },
    { id: 7, name: 'Room 303 (Tom)', status: 'offline', avatarBg: 'bg-teal-600', lastMsg: 'Dinner reservation for 2', time: '5h', unread: 0, phone: '+91 98765 00003', type: 'Couple' },
    { id: 8, name: 'Room 501 (Emma)', status: 'offline', avatarBg: 'bg-pink-600', lastMsg: 'WiFi password please', time: '6h', unread: 0, phone: '+91 98765 00004', type: 'Leisure' },
];

const initialChatHistory: Record<number, Message[]> = {
    1: [
        { id: '1', sender: ChatSender.USER, text: 'Hi, the AC in my room is leaking water onto the nightstand. It\'s quite messy.', timestamp: new Date(Date.now() - 120000), status: 'read' },
        { id: '2', sender: ChatSender.BOT, text: 'We are terribly sorry about this, John. I have notified the maintenance team immediately.', timestamp: new Date(Date.now() - 60000), status: 'read' }
    ],
    2: [
         { id: '1', sender: ChatSender.USER, text: 'Could you send fresh towels?', timestamp: new Date(Date.now() - 900000), status: 'read' }
    ],
    3: [
        { id: '1', sender: ChatSender.BOT, text: 'Hope you enjoyed the breakfast!', timestamp: new Date(Date.now() - 3600000), status: 'read' },
        { id: '2', sender: ChatSender.USER, text: 'Thanks for the quick service!', timestamp: new Date(Date.now() - 3500000), status: 'read' }
    ],
    4: [
        { id: '1', sender: ChatSender.USER, text: 'Can I get a cab to the airport at 5 PM?', timestamp: new Date(Date.now() - 7200000), status: 'read' },
        { id: '2', sender: ChatSender.BOT, text: 'Certainly! I have booked a sedan for you at 5 PM. The driver details will be shared shortly.', timestamp: new Date(Date.now() - 7100000), status: 'read' },
        { id: '3', sender: ChatSender.USER, text: 'Cab booking confirmed?', timestamp: new Date(Date.now() - 7000000), status: 'read' }
    ],
    5: [ { id: '1', sender: ChatSender.USER, text: 'Is the pool open?', timestamp: new Date(Date.now() - 10800000), status: 'read' } ],
    6: [ { id: '1', sender: ChatSender.USER, text: 'Can I request a late checkout until 2 PM?', timestamp: new Date(Date.now() - 14400000), status: 'read' } ],
    7: [ { id: '1', sender: ChatSender.USER, text: 'Please reserve a table for 2 at the rooftop restaurant for 8 PM.', timestamp: new Date(Date.now() - 18000000), status: 'read' } ],
    8: [ { id: '1', sender: ChatSender.USER, text: 'WiFi password please', timestamp: new Date(Date.now() - 21600000), status: 'read' } ],
};

const upsellSuggestions = [
    { id: 1, trigger: 'Business', text: 'Offer Laundry Service (10% Off)', content: "Since you're here for work, would you like to use our express laundry service? We're offering 10% off for you." },
    { id: 2, trigger: 'Couple', text: 'Suggest Candlelight Dinner', content: "We have a lovely table available at Spice (Rooftop) for a candlelight dinner tonight. Shall I reserve it for you?" },
    { id: 3, trigger: 'Family', text: 'Propose Local Sightseeing Tour', content: "If you're looking to explore Manipal, we have a private cab available for a half-day temple tour." },
    { id: 4, trigger: 'Any', text: 'Spa Appointment', content: "Relax after your journey! We have a slot open at the Spa at 6 PM." }
];

interface InboxProps {
    targetChatId: number | null;
    initialMessage: string;
    staffList: StaffMember[];
}

const Inbox: React.FC<InboxProps> = ({ targetChatId, initialMessage, staffList }) => {
    const [selectedUserId, setSelectedUserId] = useState<number>(targetChatId || 1);
    const [chatHistory, setChatHistory] = useState<Record<number, Message[]>>(initialChatHistory);
    const [inputText, setInputText] = useState(initialMessage);
    const [showCoPilot, setShowCoPilot] = useState(false);
    
    // User Management State
    const [users, setUsers] = useState<UserType[]>(initialUsers);
    const [showAssignDropdown, setShowAssignDropdown] = useState(false);
    
    // Mobile View State
    const [showMobileList, setShowMobileList] = useState(!targetChatId);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (targetChatId) {
            setSelectedUserId(targetChatId);
            setInputText(initialMessage);
            setShowMobileList(false);
        }
    }, [targetChatId, initialMessage]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, selectedUserId, showMobileList]);

    const activeUser = users.find(u => u.id === selectedUserId) || users[0];
    const messages = chatHistory[selectedUserId] || [];

    const handleSendMessage = (text = inputText) => {
        if (!text.trim()) return;
        const newMsg: Message = {
            id: Date.now().toString(),
            sender: ChatSender.BOT,
            text: text,
            timestamp: new Date(),
            status: 'sent'
        };
        setChatHistory(prev => ({
            ...prev,
            [selectedUserId]: [...(prev[selectedUserId] || []), newMsg]
        }));
        setInputText('');
    };

    const handleUserSelect = (id: number) => {
        setSelectedUserId(id);
        setShowMobileList(false);
        setShowAssignDropdown(false);
    };

    const handleAssignStaff = (staff: StaffMember) => {
        setUsers(prev => prev.map(u => 
            u.id === selectedUserId ? { ...u, assignedTo: staff.name } : u
        ));
        setShowAssignDropdown(false);
    };

    return (
        <div className="flex h-full w-full bg-slate-950 overflow-hidden">
            
            {/* LEFT SIDEBAR: USER LIST */}
            <div className={`
                w-full md:w-80 border-r border-white/10 flex flex-col bg-slate-900 shrink-0 h-full
                ${showMobileList ? 'flex' : 'hidden md:flex'}
            `}>
                 <div className="p-4 border-b border-white/10 shrink-0">
                    <h2 className="text-white font-semibold mb-4">Live Inbox</h2>
                    <div className="relative group">
                        <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                        <input type="text" placeholder="Search..." className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-blue-500"/>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {users.map(u => (
                        <div key={u.id} onClick={() => handleUserSelect(u.id)} className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition ${selectedUserId === u.id ? 'bg-blue-600/10 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}>
                            <div className="flex justify-between items-start mb-1">
                                <h4 className={`text-sm font-medium ${selectedUserId === u.id ? 'text-white' : 'text-slate-300'}`}>{u.name}</h4>
                                <span className="text-xs text-slate-500">{u.time}</span>
                            </div>
                            <p className="text-xs text-slate-400 truncate mb-1">{u.lastMsg}</p>
                            {u.assignedTo && (
                                <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit">
                                    <User size={10} /> {u.assignedTo}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT SIDE: CHAT AREA */}
            <div className={`flex-1 flex flex-col h-full bg-slate-950 relative min-w-0 ${!showMobileList ? 'flex' : 'hidden md:flex'}`}>
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900 shrink-0">
                    <div className="flex items-center gap-3">
                         <button onClick={() => setShowMobileList(true)} className="md:hidden text-slate-400 hover:text-white">
                             <ChevronLeft />
                         </button>

                         <div className={`w-10 h-10 rounded-full ${activeUser.avatarBg} flex items-center justify-center text-white font-bold`}>{activeUser.name.charAt(0)}</div>
                         <div>
                             <h3 className="text-white font-medium flex items-center gap-2">
                                 {activeUser.name}
                                 {activeUser.assignedTo && (
                                     <span className="text-[10px] font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                                         Assigned: {activeUser.assignedTo}
                                     </span>
                                 )}
                             </h3>
                             <p className="text-xs text-slate-400">{activeUser.type || 'Guest'} • {activeUser.phone}</p>
                         </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <button 
                                onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition ${showAssignDropdown ? 'bg-slate-700 text-white border-slate-600' : 'text-slate-400 border-slate-700 hover:bg-white/5'}`} 
                                title="Assign Staff"
                            >
                                <UserPlus size={16}/>
                                <span className="text-xs font-medium hidden sm:inline">Assign</span>
                                <ChevronDown size={14} className="hidden sm:inline"/>
                            </button>
                            {showAssignDropdown && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50">
                                    <p className="text-[10px] font-semibold text-slate-500 px-3 py-2 uppercase">Assign to:</p>
                                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                        {staffList.filter(s => s.isOnDuty).map(staff => (
                                            <button 
                                                key={staff.id}
                                                onClick={() => handleAssignStaff(staff)}
                                                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                                            >
                                                <div className={`w-2 h-2 rounded-full ${staff.avatarBg}`}></div>
                                                {staff.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button onClick={() => setShowCoPilot(!showCoPilot)} className={`p-2 rounded-full transition ${showCoPilot ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-white/10'}`} title="Toggle Upsell Co-Pilot">
                            <Sparkles size={20}/>
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                    {/* Messages Area - SCROLLABLE */}
                    <div className="flex-1 flex flex-col min-h-0 relative">
                        <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar bg-[url('https://i.pinimg.com/originals/97/c0/07/97c00726d1d9cb622556a4d7d323fb39.png')] bg-repeat opacity-90 grayscale-[0.8]">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender === ChatSender.BOT ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-xl text-sm shadow-md break-words ${msg.sender === ChatSender.BOT ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                                        <div className="whitespace-pre-wrap">{msg.text}</div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        
                        {/* Input Area */}
                        <div className="p-4 bg-slate-900 border-t border-white/10 shrink-0">
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..." 
                                    className="flex-1 bg-slate-800 text-white px-4 py-3 rounded-full text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button onClick={() => handleSendMessage()} className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition">
                                    <Send size={20}/>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Upsell Co-Pilot Sidebar */}
                    {showCoPilot && (
                        <div className="absolute right-0 top-0 bottom-0 w-72 bg-slate-900 border-l border-white/10 flex flex-col animate-in slide-in-from-right z-20 shadow-2xl h-full">
                            <div className="p-4 border-b border-white/10 bg-purple-900/20 flex justify-between items-center shrink-0">
                                <div>
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Sparkles size={16} className="text-purple-400"/> Upsell Co-Pilot
                                    </h3>
                                    <p className="text-xs text-purple-300 mt-1">AI-suggested offers</p>
                                </div>
                                <button onClick={() => setShowCoPilot(false)} className="text-slate-400 hover:text-white"><X size={16}/></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {upsellSuggestions.filter(s => s.trigger === activeUser.type || s.trigger === 'Any').map(s => (
                                    <div key={s.id} className="bg-slate-800 border border-slate-700 p-3 rounded-xl hover:border-purple-500/50 transition group">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.trigger}</span>
                                            <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">High%</span>
                                        </div>
                                        <h4 className="text-sm font-medium text-slate-200 mb-1">{s.text}</h4>
                                        <p className="text-xs text-slate-500 mb-3 line-clamp-3">{s.content}</p>
                                        <button 
                                            onClick={() => handleSendMessage(s.content)}
                                            className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg transition flex items-center justify-center gap-2"
                                        >
                                            Send Offer <Send size={12}/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Inbox;
