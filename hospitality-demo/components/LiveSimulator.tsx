
import React, { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw, Smartphone, Star, MessageCircle, ThumbsUp, ThumbsDown, Wifi, Paperclip, FileText, Check, AlertTriangle, PlayCircle, Loader2 } from 'lucide-react';
import { Message, ChatSender, SimulationStage, Alert, ReviewConfig, DocumentFile, AffiliateContact, BrandingConfig } from '../types';
import { generateBotResponse } from '../services/geminiService';

// ... (props and interfaces same as before)
interface LiveSimulatorProps {
  onTicketCreate: (ticket: any) => void;
  onCreateAlert: (alert: Alert) => void;
  reviewConfig: ReviewConfig;
  documents: DocumentFile[];
  affiliates: AffiliateContact[];
  branding: BrandingConfig;
}

const LiveSimulator: React.FC<LiveSimulatorProps> = ({ 
    onTicketCreate, onCreateAlert, reviewConfig,
    documents, affiliates, branding
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: ChatSender.BOT,
      text: `Welcome to ${branding.hotelName}! 🏨 I am Guaq, your personal assistant. Type "Hi" to get started.`,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [stage, setStage] = useState<SimulationStage>(SimulationStage.IDLE);
  const [stageFlash, setStageFlash] = useState(false); // Visual cue state

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isTyping]);
  
  // Flash effect on stage change
  useEffect(() => {
      setStageFlash(true);
      const timer = setTimeout(() => setStageFlash(false), 600);
      return () => clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
     if (messages.length === 1 && messages[0].id === '1') {
         setMessages([{
             id: '1',
             sender: ChatSender.BOT,
             text: `Welcome to ${branding.hotelName}! 🏨 I am Guaq, your personal assistant. Type "Hi" to get started.`,
             timestamp: new Date()
         }]);
     }
  }, [branding]);

  const handleSendMessage = async (textOverride?: string) => {
    const text = textOverride || inputText;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: ChatSender.USER,
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Determine stage transition logic
    let currentStage = stage;
    const lowerInput = text.toLowerCase();
    
    // --- SERVICE TICKET AUTOMATION (Housekeeping/Maintenance) ---
    const hkKeywords = ['towel', 'soap', 'shampoo', 'clean', 'room service', 'water', 'coffee', 'pillow', 'sheet'];
    const maintKeywords = ['ac', 'air conditioning', 'light', 'broken', 'leak', 'hot water', 'wifi', 'internet', 'fan'];

    if (hkKeywords.some(k => lowerInput.includes(k))) {
        const ticketId = `T-${Date.now().toString().slice(-4)}`;
        onTicketCreate({
            id: ticketId,
            roomId: '505 (Sim)',
            guestName: 'Simulated Guest',
            category: 'Housekeeping',
            description: `Guest requested item via Chat: "${text}"`,
            status: 'New',
            priority: 'Medium',
            createdAt: new Date()
        });
        onCreateAlert({
            id: Date.now(),
            userId: 999,
            type: 'info',
            msg: `Room 505: Housekeeping Request - ${text}`,
            time: 'Just now'
        });
    } else if (maintKeywords.some(k => lowerInput.includes(k))) {
        const ticketId = `T-${Date.now().toString().slice(-4)}`;
        onTicketCreate({
            id: ticketId,
            roomId: '505 (Sim)',
            guestName: 'Simulated Guest',
            category: 'Maintenance',
            description: `Issue reported via Chat: "${text}"`,
            status: 'New',
            priority: 'High',
            createdAt: new Date()
        });
        onCreateAlert({
            id: Date.now(),
            userId: 999,
            type: 'warning',
            msg: `Room 505: Maintenance Issue - ${text}`,
            time: 'Just now'
        });
    }

    // --- CHECKOUT INTENT LOGIC ---
    if (lowerInput.includes('checkout') || lowerInput.includes('check out') || lowerInput.includes('leaving')) {
         const ticketId = `T-${Date.now().toString().slice(-4)}`;
         onTicketCreate({
            id: ticketId,
            roomId: '505 (Sim)',
            guestName: 'Simulated Guest',
            category: 'Front Desk',
            description: 'Guest requested checkout via Chat.',
            status: 'New',
            priority: 'Medium',
            createdAt: new Date()
         });
         onCreateAlert({
             id: Date.now(),
             userId: 999,
             type: 'info',
             msg: 'Room 505 requested checkout. Ticket created.',
             time: 'Just now'
         });
    }

    // --- POST STAY LOGIC ---
    if (stage === SimulationStage.POST_STAY) {
        const rating = parseInt(lowerInput.match(/\d/)?.[0] || '0');
        
        if (rating > 0 && rating <= 5) {
            await new Promise(r => setTimeout(r, 1000));
            setIsTyping(false);

            if (rating >= 4) {
                 const baseUrl = reviewConfig.platform === 'google' 
                    ? 'https://search.google.com/local/writereview?placeid=ChIJ...' 
                    : 'https://www.tripadvisor.in/UserReviewEdit-g...';
                 const encodedText = encodeURIComponent(reviewConfig.prefilledText);
                 const deepLink = `${baseUrl}&rating=${reviewConfig.minRating}&text=${encodedText}`;

                 const botMsg: Message = {
                     id: Date.now().toString(),
                     sender: ChatSender.BOT,
                     text: `We are delighted you enjoyed your stay! 🌟\n\nIt would mean the world to us if you could share this on ${reviewConfig.platform === 'google' ? 'Google' : 'TripAdvisor'}. It only takes 10 seconds! 👇\n\n${deepLink}`,
                     timestamp: new Date()
                 };
                 setMessages(prev => [...prev, botMsg]);
                 setStage(SimulationStage.IDLE);
                 return;
            } else {
                 currentStage = SimulationStage.SERVICE_RECOVERY;
                 setStage(currentStage);

                 const alertId = Date.now();
                 onCreateAlert({
                     id: alertId,
                     userId: 999,
                     type: 'critical',
                     msg: `Room 505 (Sim): Negative Post-Stay Rating (${rating}/5). Manual recovery needed.`,
                     time: 'Just now'
                 });

                 const ticketId = `T-${Date.now().toString().slice(-4)}`;
                 onTicketCreate({
                    id: ticketId,
                    roomId: '505 (Sim)',
                    guestName: 'Simulated Guest',
                    category: 'Front Desk', 
                    description: `Guest rated ${rating}/5 in post-stay feedback. Reason: User input pending.`,
                    status: 'New',
                    priority: 'Critical',
                    createdAt: new Date()
                 });
            }
        }
    }

    // --- PULSE CHECK LOGIC ---
    if (stage === SimulationStage.PULSE_CHECK) {
      const rating = parseInt(lowerInput.match(/\d/)?.[0] || '0');
      if (rating > 0 && rating < 4) {
        currentStage = SimulationStage.SERVICE_RECOVERY;
        setStage(currentStage);
        
        const ticketId = `T-${Date.now().toString().slice(-4)}`;
        onTicketCreate({
          id: ticketId,
          roomId: '505 (Sim)',
          guestName: 'Simulated Guest',
          category: 'Housekeeping',
          description: `Guest rated ${rating}/5 during Pulse Check. Negative sentiment detected.`,
          status: 'New',
          priority: 'High',
          createdAt: new Date()
        });

        onCreateAlert({
            id: Date.now(),
            userId: 999,
            type: 'critical',
            msg: `Room 505 (Sim): Pulse Check Alert (${rating}/5). Ticket #${ticketId} created.`,
            time: 'Just now'
        });

      } else if (rating >= 4) {
        currentStage = SimulationStage.IDLE;
        setStage(currentStage);
      }
    }

    // Call Gemini
    const history = messages.map(m => `${m.sender}: ${m.text}`);
    const botText = await generateBotResponse(history, userMsg.text, currentStage, documents, affiliates);

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: ChatSender.BOT,
      text: botText,
      timestamp: new Date()
    };

    setIsTyping(false);
    setMessages(prev => [...prev, botMsg]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          // Simulate upload
          const msg: Message = {
              id: Date.now().toString(),
              sender: ChatSender.USER,
              text: `Sent a file: ${file.name}`,
              timestamp: new Date(),
              isMedia: true
          };
          setMessages(prev => [...prev, msg]);
          
          setIsTyping(true);
          
          let responseText = "Thank you! I have received your document.";
          
          // Specific Logic for Pre-Arrival ID Collection
          if (stage === SimulationStage.PRE_ARRIVAL) {
              responseText = "Thank you! I've received your ID. Your pre-check-in is now complete. Your key will be ready at the counter! 🔑";
              setStage(SimulationStage.IDLE);
          }

          setTimeout(() => {
              setIsTyping(false);
              setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  sender: ChatSender.BOT,
                  text: responseText,
                  timestamp: new Date()
              }]);
          }, 1500);
      }
  };

  const triggerPulseCheck = () => {
    setStage(SimulationStage.PULSE_CHECK);
    setMessages(prev => [...prev, { id: 'sys', sender: ChatSender.SYSTEM, text: '--- Pulse Check Triggered ---', timestamp: new Date() }]);
    
    setIsTyping(true);
    setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: ChatSender.BOT,
            text: "Hello! We hope you're settling in well. On a scale of 1-5, how would you rate your stay so far? 🌟",
            timestamp: new Date()
        }]);
    }, 1000);
  };

  const triggerPreArrival = () => {
    setStage(SimulationStage.PRE_ARRIVAL);
    setMessages(prev => [...prev, { id: 'sys', sender: ChatSender.SYSTEM, text: '--- Pre-Arrival Flow ---', timestamp: new Date() }]);
    
    setIsTyping(true);
    setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: ChatSender.BOT,
            text: `Greetings from ${branding.hotelName}! We are preparing for your arrival tomorrow. 🏨\n\nTo speed up your check-in, could you please share a photo of your ID card here using the attachment button below?`,
            timestamp: new Date()
        }]);
    }, 1000);
  };

  const triggerPostStayReview = () => {
    setStage(SimulationStage.POST_STAY);
    setMessages(prev => [...prev, { id: 'sys', sender: ChatSender.SYSTEM, text: '--- Post-Stay Triggered ---', timestamp: new Date() }]);

      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: ChatSender.BOT,
            text: `Thank you for choosing ${branding.hotelName}! We hope you had a pleasant journey home. 🚗\n\nCould you rate your overall experience with us from 1 to 5?`,
            timestamp: new Date()
        }]);
    }, 1000);
  };

  const resetChat = () => {
    setMessages([{
      id: Date.now().toString(),
      sender: ChatSender.BOT,
      text: `Welcome to ${branding.hotelName}! 🏨 I am Guaq, your personal assistant. Type "Hi" to get started.`,
      timestamp: new Date()
    }]);
    setStage(SimulationStage.IDLE);
    setInputText('');
  }

  // Visual helper for stage
  const getStageBadge = (s: SimulationStage) => {
      const config = {
          [SimulationStage.IDLE]: { color: 'bg-slate-700 text-slate-300', icon: PlayCircle },
          [SimulationStage.PRE_ARRIVAL]: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/50', icon: Loader2 },
          [SimulationStage.CHECK_IN]: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/50', icon: Check },
          [SimulationStage.PULSE_CHECK]: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/50', icon: RefreshCw },
          [SimulationStage.POST_STAY]: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50', icon: Star },
          [SimulationStage.SERVICE_RECOVERY]: { color: 'bg-rose-500/20 text-rose-400 border-rose-500/50', icon: AlertTriangle },
          [SimulationStage.BOOKING]: { color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50', icon: Check },
      }[s];

      const Icon = config.icon;

      return (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-transparent ${config.color} transition-all duration-300`}>
              <Icon size={14} className={s !== SimulationStage.IDLE ? 'animate-pulse' : ''} />
              <span className="font-mono text-xs font-bold">{s}</span>
          </div>
      );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden bg-slate-950">
      
      {/* PHONE SIMULATOR AREA */}
      <div className="flex-1 flex items-center justify-center relative p-4 lg:p-8 min-h-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 to-slate-950 pointer-events-none"></div>

          <div className={`relative z-10 w-full max-w-[360px] h-full max-h-[720px] flex flex-col shadow-2xl rounded-[3rem] bg-slate-950 overflow-hidden ring-1 transition-all duration-500 ${stageFlash ? 'border-4 border-blue-500 ring-blue-400 ring-4' : 'border-8 border-slate-900 ring-white/10'}`}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-xl z-20"></div>

              {/* ... Header and Chat Body ... */}
              <div className="bg-slate-900 text-white px-6 pt-3 pb-2 flex justify-between items-center text-[10px] z-10 select-none shrink-0">
                  <span>9:41</span>
                  <div className="flex gap-1.5">
                      <Wifi size={12}/>
                      <div className="w-4 h-2 bg-white rounded-[2px]"></div>
                  </div>
              </div>

              <div className="bg-slate-800/90 backdrop-blur-md p-3 flex items-center gap-3 border-b border-white/5 z-10 shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md overflow-hidden">
                    {branding.logoUrl ? (
                         <img src={branding.logoUrl} alt="B" className="w-full h-full object-cover"/>
                    ) : (
                         <span>{branding.appName.charAt(0)}</span>
                    )}
                </div>
                <div>
                    <h3 className="text-white font-semibold text-sm">Guaq Assistant</h3>
                    <p className="text-blue-400 text-[10px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Online
                    </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950 scrollbar-hide">
                 {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === ChatSender.USER ? 'justify-end' : 'justify-start'} ${msg.sender === ChatSender.SYSTEM ? 'justify-center' : ''}`}>
                        {msg.sender === ChatSender.SYSTEM ? (
                            <span className="text-[10px] text-slate-500 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800 animate-in fade-in zoom-in">{msg.text}</span>
                        ) : (
                            <div className={`max-w-[85%] p-3 text-sm rounded-2xl shadow-sm break-words animate-in slide-in-from-bottom-2 ${
                                msg.sender === ChatSender.USER ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                            }`}>
                                {msg.isMedia && <div className="flex items-center gap-2 mb-1 text-xs opacity-80"><FileText size={12}/> Attachment</div>}
                                {msg.text}
                            </div>
                        )}
                    </div>
                 ))}
                 {isTyping && (
                     <div className="flex justify-start">
                        <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-700">
                             <div className="flex gap-1">
                                 <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                                 <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-100"></span>
                                 <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-200"></span>
                             </div>
                        </div>
                     </div>
                 )}
                 <div ref={messagesEndRef}/>
              </div>

              <div className="p-3 bg-slate-900 border-t border-white/5 shrink-0">
                  <div className="flex items-center gap-2 bg-slate-800 rounded-full px-4 py-2 border border-slate-700">
                      <button onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-white transition">
                          <Paperclip size={16}/>
                      </button>
                      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                      
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type..."
                        className="bg-transparent flex-1 text-white text-sm outline-none placeholder-slate-500"
                      />
                      <button onClick={() => handleSendMessage()} className="text-blue-500">
                          <Send size={18} />
                      </button>
                  </div>
              </div>
          </div>
      </div>

      {/* CONTROLS PANEL */}
      <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col shrink-0 z-20 shadow-xl overflow-hidden h-[40%] lg:h-full">
          <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-900">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Smartphone className="text-blue-400" size={20}/> Simulator
              </h2>
              <button onClick={resetChat} className="text-xs flex items-center gap-1 text-slate-400 hover:text-white bg-white/5 px-2 py-1 rounded transition">
                  <RefreshCw size={12}/> Reset
              </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* STAGE INDICATOR */}
              <div className={`p-4 rounded-xl border flex justify-between items-center transition-colors duration-500 ${stageFlash ? 'bg-blue-900/30 border-blue-500/50' : 'bg-slate-800/50 border-slate-700'}`}>
                  <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Current Stage</span>
                  {getStageBadge(stage)}
              </div>

              {/* Triggers */}
              <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Workflow Scenarios</h3>
                  <div className="grid grid-cols-1 gap-2">
                       <button onClick={triggerPreArrival} className="flex items-center gap-3 px-3 py-3 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 text-sm font-medium border border-orange-500/20 transition text-left group">
                          <div className="p-1.5 bg-orange-500/20 rounded-md group-hover:bg-orange-500/30 transition"><Check size={16}/></div>
                          <div>
                              <span className="block text-white">Pre-Arrival Check-in</span>
                              <span className="text-xs opacity-70">Day before arrival flow</span>
                          </div>
                       </button>

                       <button onClick={triggerPulseCheck} className="flex items-center gap-3 px-3 py-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-sm font-medium border border-blue-500/20 transition text-left group">
                          <div className="p-1.5 bg-blue-500/20 rounded-md group-hover:bg-blue-500/30 transition"><RefreshCw size={16}/></div>
                          <div>
                              <span className="block text-white">Pulse Check</span>
                              <span className="text-xs opacity-70">Simulate mid-stay check-in</span>
                          </div>
                       </button>

                       <button onClick={triggerPostStayReview} className="flex items-center gap-3 px-3 py-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-sm font-medium border border-purple-500/20 transition text-left group">
                          <div className="p-1.5 bg-purple-500/20 rounded-md group-hover:bg-purple-500/30 transition"><Star size={16}/></div>
                          <div>
                              <span className="block text-white">Post-Stay Feedback</span>
                              <span className="text-xs opacity-70">Trigger review workflow</span>
                          </div>
                       </button>
                  </div>
              </div>

              {/* User Responses */}
              <div>
                   <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick User Responses</h3>
                   <div className="space-y-2">
                      <button onClick={() => handleSendMessage('Can I get some extra towels?')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition">
                          <AlertTriangle size={14} className="text-amber-400"/> Request Towels
                      </button>
                      <button onClick={() => handleSendMessage('I want to checkout now')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition">
                          <Check size={14} className="text-blue-400"/> "I want to checkout"
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleSendMessage('5')} className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition">
                            <ThumbsUp size={14} className="text-emerald-400"/> Rate 5/5
                        </button>
                        <button onClick={() => handleSendMessage('2')} className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition">
                            <ThumbsDown size={14} className="text-rose-400"/> Rate 2/5
                        </button>
                      </div>
                   </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default LiveSimulator;
