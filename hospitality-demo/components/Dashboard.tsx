
// ... existing imports
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { AlertTriangle, TrendingUp, Users, ExternalLink, Star, DollarSign, LayoutDashboardIcon, BarChart3Icon, CalendarDays, ChevronDown, CheckCircle, MessageSquare, Clock, Zap } from 'lucide-react';
import { UserRole, View, DashboardTab, TimeRange, Alert, BrandingConfig } from '../types';

// ... (previous interfaces and data generators remain same)

interface DashboardProps {
  onNavigateToChat: (userId: number, message?: string) => void;
  onNavigateToView: (view: View) => void;
  role: UserRole;
  alerts: Alert[];
  branding: BrandingConfig;
}

// ... (getReviewData, getPerformanceData, getBookingData generators remain same)
const getReviewData = (multiplier: number) => [
  { rating: '5 Star', count: 120 * multiplier, color: '#10b981' },
  { rating: '4 Star', count: 45 * multiplier, color: '#3b82f6' },
  { rating: '3 Star', count: 12 * multiplier, color: '#f59e0b' },
  { rating: '2 Star', count: 5 * multiplier, color: '#f43f5e' },
  { rating: '1 Star', count: 2 * multiplier, color: '#e11d48' },
];

const getPerformanceData = (multiplier: number) => [
  { name: 'Front Desk', resolutionTime: 12, tickets: 45 * multiplier },
  { name: 'Housekeeping', resolutionTime: 25, tickets: 82 * multiplier },
  { name: 'Maintenance', resolutionTime: 40, tickets: 28 * multiplier },
  { name: 'F&B', resolutionTime: 15, tickets: 35 * multiplier },
  { name: 'Concierge', resolutionTime: 10, tickets: 15 * multiplier },
];

const getBookingData = (multiplier: number) => [
  { date: 'Mon', direct: 400 * multiplier, ota: 240 * multiplier },
  { date: 'Tue', direct: 300 * multiplier, ota: 139 * multiplier },
  { date: 'Wed', direct: 200 * multiplier, ota: 980 * multiplier },
  { date: 'Thu', direct: 278 * multiplier, ota: 390 * multiplier },
  { date: 'Fri', direct: 189 * multiplier, ota: 480 * multiplier },
  { date: 'Sat', direct: 239 * multiplier, ota: 380 * multiplier },
  { date: 'Sun', direct: 349 * multiplier, ota: 430 * multiplier },
];

interface SummaryCardProps {
    label: string;
    value: string;
    icon: any;
    color: string;
    bg: string;
    sub: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, icon: Icon, color, bg, sub }) => (
    <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-white/5">
        <div>
            <p className="text-slate-400 text-sm font-medium">{label}</p>
            <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
            <p className="text-xs text-slate-500 mt-1">{sub}</p>
        </div>
        <div className={`p-3 rounded-xl ${bg} ${color}`}>
            <Icon size={24} />
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ onNavigateToChat, onNavigateToView, role, alerts, branding }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.OVERVIEW);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [multiplier, setMultiplier] = useState(1);

  const isAdmin = role === 'admin';

  useEffect(() => {
    // Simulate data refresh multiplier based on time range
    const rangeMap: Record<string, number> = { 'today': 0.15, 'week': 1, 'month': 4, 'quarter': 12, 'year': 52, 'custom': 2 };
    setMultiplier(rangeMap[timeRange] || 1);
  }, [timeRange]);

  // Generate dynamic data
  const reviewData = getReviewData(multiplier);
  const perfData = getPerformanceData(multiplier);
  const bookingData = getBookingData(multiplier);

  // Helper to generate summary cards based on tab and date range
  const getSummaryData = (): SummaryCardProps[] => {
      if (activeTab === DashboardTab.OVERVIEW) {
          return [
              { label: 'Active Guests', value: Math.floor(142 * multiplier * 0.5 + 50).toString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10', sub: '92% Occupancy' },
              { label: 'Sentiment Score', value: '4.8', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10', sub: '+0.2 this period' },
              { label: 'Pending Alerts', value: alerts.length.toString(), icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-400/10', sub: 'Action Required' },
          ];
      }
      if (activeTab === DashboardTab.REVIEWS) {
          return [
            { label: 'Total Reviews', value: Math.floor(184 * multiplier).toString(), icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-400/10', sub: 'Across Google & TripAdvisor' },
            { label: 'Avg Rating', value: '4.8', icon: Star, color: 'text-amber-400', bg: 'bg-amber-400/10', sub: 'Maintained Top Tier' },
            { label: 'Response Rate', value: '98%', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-400/10', sub: 'Auto-replied by AI' },
          ];
      }
      if (activeTab === DashboardTab.PERFORMANCE) {
          return [
              { label: 'Total Tickets', value: Math.floor(205 * multiplier).toString(), icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10', sub: 'Resolved Successfully' },
              { label: 'Avg Resolution', value: '18m', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10', sub: '-2m vs prev period' },
              { label: 'SLA Breaches', value: Math.floor(3 * multiplier).toString(), icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-400/10', sub: 'Requires Attention' },
          ];
      }
      if (activeTab === DashboardTab.BOOKINGS) {
          return [
              { label: 'Total Revenue', value: `₹${(12.5 * multiplier).toFixed(1)}L`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10', sub: 'Gross Bookings' },
              { label: 'Direct Bookings', value: Math.floor(145 * multiplier).toString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10', sub: `${Math.floor(30 + Math.random() * 10)}% of total share` },
              { label: 'Comm. Saved', value: `₹${(1.2 * multiplier).toFixed(1)}L`, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10', sub: 'vs OTA fees' },
          ];
      }
      return [];
  };

  const renderTabs = () => (
    <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-white/5 mb-6 overflow-x-auto">
        {[
            { id: DashboardTab.OVERVIEW, label: 'Overview', icon: LayoutDashboardIcon },
            { id: DashboardTab.REVIEWS, label: 'Review Automation', icon: Star },
            { id: DashboardTab.PERFORMANCE, label: 'Dept. Performance', icon: BarChart3Icon },
            { id: DashboardTab.BOOKINGS, label: 'Direct Bookings', icon: DollarSign }
        ].map((tab) => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                    activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
                <tab.icon size={16} /> {tab.label}
            </button>
        ))}
    </div>
  );

  const handleCustomDateApply = () => {
      setTimeRange('custom');
      setShowDatePicker(false);
  };

  const renderTimeFilter = () => (
      <div className="relative">
          <button 
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 bg-slate-800 text-slate-300 text-xs border border-slate-700 rounded-lg px-3 py-2 hover:border-blue-500 transition"
          >
            <CalendarDays size={14}/>
            <span className="capitalize">{timeRange === 'custom' ? 'Custom Range' : `This ${timeRange}`}</span>
            <ChevronDown size={12}/>
          </button>

          {showDatePicker && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <p className="text-xs font-semibold text-slate-400 mb-2 uppercase">Quick Select</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                      {['today', 'week', 'month', 'quarter', 'year'].map(r => (
                          <button 
                            key={r} 
                            onClick={() => { setTimeRange(r as TimeRange); setShowDatePicker(false); }}
                            className={`text-xs p-2 rounded border transition ${timeRange === r ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                          >
                              {r}
                          </button>
                      ))}
                  </div>
                  <div className="border-t border-slate-700 pt-3">
                      <p className="text-xs font-semibold text-slate-400 mb-2 uppercase">Custom Range</p>
                      <div className="space-y-2">
                          <input type="date" className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-xs text-slate-200" />
                          <input type="date" className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-xs text-slate-200" />
                          <button onClick={handleCustomDateApply} className="w-full bg-blue-600 text-white text-xs py-2 rounded hover:bg-blue-500 transition">Apply</button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );

  return (
    <div className="p-4 md:p-8 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div className="w-full md:w-auto">
           <h1 className="text-3xl font-bold text-white tracking-tight break-words">Dashboard</h1>
           <p className="text-slate-400 mt-1 break-words">
             {isAdmin ? `Operations for ${branding.hotelName}` : 'Operational Tasks & Alerts'}
           </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
             {renderTimeFilter()}
             <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg text-emerald-400 text-sm flex items-center gap-2 shadow-sm whitespace-nowrap">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="hidden md:inline">PMS Synced</span>
             </div>
        </div>
      </div>

      {isAdmin && renderTabs()}

      {isAdmin && (
        <div className="space-y-6">
            
            {/* COMMON: Summary Cards for all tabs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2">
                {getSummaryData().map((stat, idx) => (
                    <SummaryCard key={idx} {...stat} />
                ))}
            </div>

            {/* OVERVIEW TAB CONTENT */}
            {activeTab === DashboardTab.OVERVIEW && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/5">
                        <h3 className="text-lg font-semibold text-white mb-4">Guest Retention & Upsell Opportunities</h3>
                        <div className="overflow-x-auto min-w-0 w-full">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs text-slate-500 border-b border-slate-700/50 uppercase tracking-wider">
                                        <th className="pb-3 font-semibold pl-2">Guest</th>
                                        <th className="pb-3 font-semibold">Status</th>
                                        <th className="pb-3 font-semibold">Insight</th>
                                        <th className="pb-3 font-semibold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-slate-300">
                                    {[
                                      { name: "Mr. Sharma", status: "Loyal", color: "blue", insight: "Visits every December", action: "Send Offer", msg: "Special early-bird offer for December..." },
                                      { name: "Dr. Aditi Rao", status: "VIP", color: "purple", insight: "High Spa Intent (Last: $200)", action: "Book Spa", msg: "We have a slot open at the Spa..." },
                                      { name: "Ms. Jennifer L.", status: "New", color: "amber", insight: "Family Trip (4 Pax)", action: "Upsell Dining", msg: "Would you like to reserve a family dinner table?" },
                                      { name: "Mr. David Kim", status: "Returning", color: "emerald", insight: "Requested Late Checkout prev.", action: "Offer Late C/O", msg: "Complimentary late checkout until 2 PM?" },
                                      { name: "Mrs. Gupta", status: "Regular", color: "blue", insight: "Loves Italian Food", action: "Send Menu", msg: "New seasonal Italian menu at our restaurant." },
                                      { name: "John Smith", status: "New", color: "amber", insight: "Business Traveler", action: "Laundry Offer", msg: "Express laundry service available for your meeting." },
                                      { name: "Sarah Connor", status: "Risk", color: "rose", insight: "Complained about wifi", action: "Apologize", msg: "We've upgraded our wifi speed. Hope it helps." },
                                      { name: "Michael Scott", status: "VIP", color: "purple", insight: "Conference Organizer", action: "Group Deal", msg: "Special rates for your conference attendees." },
                                    ].map((row, idx) => (
                                      <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                                          <td className="py-4 pl-2 font-medium">{row.name}</td>
                                          <td className="py-4"><span className={`bg-${row.color}-500/10 text-${row.color}-400 px-2 py-0.5 rounded text-xs border border-${row.color}-500/20`}>{row.status}</span></td>
                                          <td className="py-4 text-emerald-400">{row.insight}</td>
                                          <td className="py-4 text-right">
                                              <button onClick={() => onNavigateToChat(idx + 10, row.msg)} className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3 py-1.5 rounded transition">{row.action}</button>
                                          </td>
                                      </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 text-center">
                            <button onClick={() => onNavigateToView(View.ANALYTICS)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1">
                                View All Insights <ExternalLink size={12}/>
                            </button>
                        </div>
                    </div>
                    <AlertsSection alerts={alerts} onNavigateToView={onNavigateToView} />
                </div>
            )}

            {/* ... REVIEWS, PERFORMANCE, BOOKINGS TABS (Content remains largely same but updated data passed in via props) ... */}
            {activeTab === DashboardTab.REVIEWS && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <h3 className="text-lg font-semibold text-white mb-4">Review Ratings Distribution</h3>
                        <div className="h-[300px] min-w-0 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reviewData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false}/>
                                    <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} hide/>
                                    <YAxis dataKey="rating" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={50}/>
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                                        {reviewData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    {/* ... Right Column Stats ... */}
                     <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-center">
                         <div className="text-center mb-6">
                            <h2 className="text-4xl font-bold text-white mb-2">4.8 / 5.0</h2>
                            <div className="flex justify-center gap-1 mb-2">
                                {[1,2,3,4,5].map(s => <Star key={s} fill="#fbbf24" stroke="#fbbf24" size={24}/>)}
                            </div>
                            <p className="text-slate-400 text-sm">Based on {Math.floor(184 * multiplier)} reviews</p>
                         </div>
                         <div className="space-y-4">
                             <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl border border-white/5">
                                 <div className="flex items-center gap-3">
                                     <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-400"><CheckCircle size={20}/></div>
                                     <div>
                                         <p className="text-sm font-medium text-white">Auto-Response Rate</p>
                                         <p className="text-xs text-slate-500">For positive reviews</p>
                                     </div>
                                 </div>
                                 <span className="text-xl font-bold text-white">98%</span>
                             </div>
                             <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl border border-white/5">
                                 <div className="flex items-center gap-3">
                                     <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400"><ExternalLink size={20}/></div>
                                     <div>
                                         <p className="text-sm font-medium text-white">Deep Link Conversions</p>
                                         <p className="text-xs text-slate-500">Clicks from Chatbot</p>
                                     </div>
                                 </div>
                                 <span className="text-xl font-bold text-white">42%</span>
                             </div>
                         </div>
                         <button onClick={() => onNavigateToView(View.REVIEWS)} className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl transition text-sm font-medium border border-slate-700">
                             Manage All Reviews
                         </button>
                    </div>
                 </div>
            )}
            
            {/* ... Performance and Booking Tabs remain structurally same ... */}
             {activeTab === DashboardTab.PERFORMANCE && (
                <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-white">Department Resolution Times (Minutes)</h3>
                        </div>
                        <div className="h-[350px] min-w-0 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={perfData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false}/>
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false}/>
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false}/>
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                    <Legend />
                                    <Bar dataKey="resolutionTime" name="Avg Resolution Time (min)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="tickets" name="Total Tickets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === DashboardTab.BOOKINGS && (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/5">
                        <h3 className="text-lg font-semibold text-white mb-6">Direct vs OTA Revenue</h3>
                        <div className="h-[350px] min-w-0 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={bookingData}>
                                    <defs>
                                        <linearGradient id="colorDirect" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorOta" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                    <Legend />
                                    <Area type="monotone" dataKey="direct" name="Direct Booking (Zero Commission)" stroke="#10b981" fillOpacity={1} fill="url(#colorDirect)" />
                                    <Area type="monotone" dataKey="ota" name="OTA (Booking/Agoda)" stroke="#f43f5e" fillOpacity={1} fill="url(#colorOta)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                     <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-center gap-6">
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <h4 className="text-emerald-400 text-sm font-semibold uppercase tracking-wider mb-2">Commission Saved</h4>
                            <p className="text-3xl font-bold text-white">₹{(1.2 * multiplier).toFixed(1)}L</p>
                            <p className="text-xs text-emerald-300/70 mt-1">Via WhatsApp Link</p>
                        </div>
                         <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                            <h4 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Direct Bookings</h4>
                            <p className="text-3xl font-bold text-white">{Math.floor(145 * multiplier)}</p>
                            <p className="text-xs text-slate-500 mt-1">Conversion Rate: 3.2%</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}

      {!isAdmin && (
        <div className="w-full max-w-4xl mx-auto mt-8">
            <AlertsSection alerts={alerts} onNavigateToView={onNavigateToView} fullWidth />
        </div>
      )}
    </div>
  );
};

const AlertsSection = ({ alerts, onNavigateToView, fullWidth = false }: { alerts: Alert[], onNavigateToView: (view: View) => void, fullWidth?: boolean }) => (
    <div className={`glass-panel p-6 rounded-2xl flex flex-col border border-white/5 ${fullWidth ? 'min-h-[600px] h-full' : 'min-h-[400px] h-full'}`}>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
        </span>
        Action Required
      </h3>
      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {alerts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <p>No active alerts</p>
            </div>
        ) : (
            alerts.map(alert => (
                <div key={alert.id} className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl relative group hover:bg-rose-500/20 transition">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold tracking-wider text-rose-300 bg-rose-900/40 px-2 py-0.5 rounded uppercase">{alert.type}</span>
                        <span className="text-xs text-rose-300/70">{alert.time}</span>
                    </div>
                    <p className="text-sm text-rose-100 mt-2 font-medium leading-snug">{alert.msg}</p>
                    <button 
                        onClick={() => onNavigateToView(View.TICKETS)}
                        className="mt-3 text-xs bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 rounded-lg w-full transition font-medium shadow-sm"
                    >
                        Resolve Ticket
                    </button>
                </div>
            ))
        )}
      </div>
    </div>
);

export default Dashboard;
