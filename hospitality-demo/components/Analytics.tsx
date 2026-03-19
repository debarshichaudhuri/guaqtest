
import React, { useState } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { TrendingUp, Users, DollarSign, Calendar, MapPin, Activity, Building2, Target, Layers, ChevronDown, ChevronRight, Utensils, Sparkles, X, CheckCircle, AlertTriangle, Trash2, Download, Printer, ArrowUpRight, ArrowDownRight, Sliders } from 'lucide-react';
import { CompetitorData, View, FloorPlanNode } from '../types';

/**
 * ==============================================================================
 * 🏗️ ARCHITECTURE NOTE: ANALYTICS & DATA AGGREGATION
 * ==============================================================================
 * 
 * 1. SERVER-SIDE AGGREGATION (Database Layer):
 *    - Currently, we mock data in the client.
 *    - In Production: Do NOT fetch raw data (e.g., all 10,000 tickets) to the client to calculate stats.
 *    - Use SQL Aggregations or Prisma GroupBy in the Server Component:
 *      `await prisma.ticket.groupBy({ by: ['category'], _count: true })`
 * 
 * 2. CHARTS (Client Components):
 *    - Recharts requires the DOM, so this component must be a Client Component (`'use client'`).
 *    - Pass the aggregated JSON data from the Server Page to this Client Component as props.
 * 
 * 3. AI INSIGHTS:
 *    - The "Menu Engineering" insights should be generated via a background job (Cron) that analyzes
 *      POS data weekly, rather than on-demand, due to high token usage.
 * 
 * 4. PERFORMANCE:
 *    - `ResponsiveContainer` should be used carefully as it needs explicit parent height.
 * ==============================================================================
 */

interface AnalyticsProps {
    onNavigateToView?: (view: View) => void;
}

// ... Existing Data Constants ...
const retentionData = [
    { stage: '1st Visit', count: 1200 },
    { stage: '2nd Visit', count: 450 },
    { stage: '3rd+ Visit', count: 180 },
    { stage: 'Loyal (5+)', count: 65 },
];

const spendingData = [
    { name: 'Room Revenue', value: 65, color: '#3b82f6' },
    { name: 'F&B Dining', value: 20, color: '#10b981' },
    { name: 'Spa & Wellness', value: 10, color: '#8b5cf6' },
    { name: 'Other Services', value: 5, color: '#f59e0b' },
];

const competitorRadarData = [
  { subject: 'Price Value', A: 120, B: 110, C: 130, fullMark: 150 },
  { subject: 'Cleanliness', A: 98, B: 130, C: 120, fullMark: 150 },
  { subject: 'Service', A: 86, B: 130, C: 110, fullMark: 150 },
  { subject: 'Location', A: 99, B: 100, C: 100, fullMark: 150 },
  { subject: 'Amenities', A: 85, B: 90, C: 110, fullMark: 150 },
  { subject: 'Food', A: 65, B: 85, C: 100, fullMark: 150 },
];

const competitorStats = [
    { name: 'Country Inn (Us)', adr: 8000, rating: 4.8, occupancy: 92, color: '#8b5cf6' },
    { name: 'Fortune Valley View', adr: 8500, rating: 4.7, occupancy: 88, color: '#10b981' },
    { name: 'Tea Tree Suites', adr: 6500, rating: 4.5, occupancy: 75, color: '#f59e0b' },
    { name: 'Hometown Galleria', adr: 5500, rating: 4.2, occupancy: 60, color: '#64748b' },
];

// Rate Parity Data
const rateParityData = [
    { date: 'Mon', direct: 8000, booking: 8200, agoda: 7900 },
    { date: 'Tue', direct: 7800, booking: 8000, agoda: 7800 },
    { date: 'Wed', direct: 7500, booking: 7800, agoda: 7400 }, // Disparity
    { date: 'Thu', direct: 8200, booking: 8500, agoda: 8200 },
    { date: 'Fri', direct: 9000, booking: 9200, agoda: 9100 },
    { date: 'Sat', direct: 9500, booking: 9800, agoda: 9600 },
    { date: 'Sun', direct: 8500, booking: 8800, agoda: 8500 },
];

// F&B Data
const menuEngineeringData = [
  { name: 'Lobster Bisque', profit: 450, popularity: 20, category: 'Puzzle' }, // High Profit, Low Vol
  { name: 'Club Sandwich', profit: 150, popularity: 85, category: 'Plowhorse' }, // Low Profit, High Vol
  { name: 'Wagyu Steak', profit: 800, popularity: 60, category: 'Star' }, // High Profit, High Vol
  { name: 'Green Salad', profit: 50, popularity: 15, category: 'Dog' }, // Low Profit, Low Vol
  { name: 'Tiramisu', profit: 300, popularity: 70, category: 'Star' },
  { name: 'Truffle Pasta', profit: 550, popularity: 50, category: 'Star' },
  { name: 'Burger', profit: 100, popularity: 90, category: 'Plowhorse' },
];

const inventoryForecastData = [
    { day: 'Mon', consumption: 40, waste: 5, occupancy: 60 },
    { day: 'Tue', consumption: 35, waste: 4, occupancy: 55 },
    { day: 'Wed', consumption: 50, waste: 8, occupancy: 70 },
    { day: 'Thu', consumption: 60, waste: 6, occupancy: 80 },
    { day: 'Fri', consumption: 90, waste: 12, occupancy: 95 },
    { day: 'Sat', consumption: 100, waste: 15, occupancy: 98 },
    { day: 'Sun', consumption: 85, waste: 10, occupancy: 85 },
];

// Mock Floor Data
const floorData: FloorPlanNode[] = [
    { id: '101', name: '101', type: 'room', floor: 1, sentimentScore: 90, issues: 0 },
    { id: '102', name: '102', type: 'room', floor: 1, sentimentScore: 65, issues: 1 },
    { id: '103', name: '103', type: 'room', floor: 1, sentimentScore: 95, issues: 0 },
    { id: '104', name: '104', type: 'room', floor: 1, sentimentScore: 88, issues: 0 },
    { id: '105', name: '105', type: 'room', floor: 1, sentimentScore: 40, issues: 2 },
    
    { id: '301', name: '301', type: 'room', floor: 3, sentimentScore: 85, issues: 0 },
    { id: '302', name: '302', type: 'room', floor: 3, sentimentScore: 92, issues: 0 },
    { id: '303', name: '303', type: 'room', floor: 3, sentimentScore: 78, issues: 0 },
    { id: '304', name: '304', type: 'room', floor: 3, sentimentScore: 30, issues: 3 }, // Critical
    { id: '305', name: '305', type: 'room', floor: 3, sentimentScore: 80, issues: 0 },

    { id: '401', name: '401', type: 'room', floor: 4, sentimentScore: 95, issues: 0 },
    { id: '402', name: '402', type: 'room', floor: 4, sentimentScore: 98, issues: 0 },
    { id: '403', name: '403', type: 'room', floor: 4, sentimentScore: 88, issues: 0 },
    { id: '404', name: '404', type: 'room', floor: 4, sentimentScore: 92, issues: 0 },
    { id: '405', name: '405', type: 'room', floor: 4, sentimentScore: 90, issues: 0 },
    { id: '406', name: '406', type: 'room', floor: 4, sentimentScore: 96, issues: 0 },

    { id: '505', name: '505', type: 'room', floor: 5, sentimentScore: 90, issues: 0 },
];

const Analytics: React.FC<AnalyticsProps> = ({ onNavigateToView }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'competitors' | 'food'>('overview');
    const [showAiMenuInsight, setShowAiMenuInsight] = useState(false);
    
    // Menu Configuration State
    const [menuConfig, setMenuConfig] = useState({
        cuisine: 'International',
        strategy: 'High Margin',
        dietary: 'Balanced'
    });

    // Floor Map Component
    const FloorMap = ({ floor }: { floor: number }) => {
        const rooms = floorData.filter(r => r.floor === floor);
        return (
            <div className="flex-1 bg-slate-900/50 p-4 rounded-xl border border-white/5 min-w-[200px]">
                <h4 className="text-sm font-semibold text-slate-400 mb-3">Floor {floor}</h4>
                <div className="flex flex-wrap gap-2">
                    {rooms.map(room => (
                        <div 
                            key={room.id}
                            className={`w-12 h-10 rounded text-xs font-bold flex items-center justify-center transition-all cursor-pointer border ${
                                room.issues > 0 
                                ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse' 
                                : room.sentimentScore >= 80 
                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                    : 'bg-amber-500/20 border-amber-500 text-amber-300'
                            }`}
                            title={`Room ${room.name}: Sentiment ${room.sentimentScore}%`}
                        >
                            {room.name}
                        </div>
                    ))}
                    {rooms.length === 0 && <span className="text-xs text-slate-600 italic">No Data</span>}
                </div>
            </div>
        )
    };

    return (
        <div className="p-8 w-full">
            
            {/* AI Menu Design Overlay */}
            {showAiMenuInsight && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="glass-panel w-full max-w-5xl h-[85vh] rounded-3xl relative border border-white/10 shadow-2xl flex overflow-hidden">
                        <button onClick={() => setShowAiMenuInsight(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white z-10"><X size={24}/></button>
                        
                        {/* Left: Controls & Insights */}
                        <div className="w-1/3 bg-slate-900/50 p-8 border-r border-white/5 overflow-y-auto">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-xl text-white">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">AI Designer</h3>
                                    <p className="text-slate-400 text-sm">Menu Engineering</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                    <h4 className="text-emerald-400 font-bold text-sm mb-2">Strategy: "{menuConfig.strategy}"</h4>
                                    <p className="text-slate-300 text-xs leading-relaxed">
                                        The AI has rearranged items to prioritize <strong>{menuConfig.strategy}</strong> items (like Wagyu Steak) in the visual center, adhering to <strong>{menuConfig.cuisine}</strong> aesthetics.
                                    </p>
                                </div>

                                <div>
                                    <h5 className="text-xs text-slate-500 uppercase font-semibold mb-3">Detected Patterns</h5>
                                    <div className="space-y-3">
                                        {menuEngineeringData.filter(i => i.category === 'Star').slice(0, 3).map(item => (
                                            <div key={item.name} className="flex items-center justify-between text-sm">
                                                <span className="text-white">{item.name}</span>
                                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs border border-emerald-500/30">Star</span>
                                            </div>
                                        ))}
                                         {menuEngineeringData.filter(i => i.category === 'Puzzle').slice(0, 2).map(item => (
                                            <div key={item.name} className="flex items-center justify-between text-sm">
                                                <span className="text-white">{item.name}</span>
                                                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs border border-amber-500/30">Puzzle</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5 space-y-3">
                                    <button className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl text-sm font-medium border border-slate-600 flex items-center justify-center gap-2">
                                        <Printer size={16}/> Export PDF
                                    </button>
                                    <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-medium shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
                                        <CheckCircle size={16}/> Apply Design
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right: Preview */}
                        <div className="w-2/3 bg-[#fdfbf7] text-slate-900 p-12 overflow-y-auto relative bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
                            <div className="absolute top-4 right-4 bg-black/10 px-3 py-1 rounded text-xs font-mono opacity-50">PREVIEW MODE</div>
                            
                            <div className="text-center mb-12">
                                <h1 className="font-serif text-4xl font-bold tracking-widest text-slate-800 mb-2 uppercase">The Dining Room</h1>
                                <div className="w-16 h-[2px] bg-slate-800 mx-auto"></div>
                                <p className="font-serif italic text-slate-600 mt-2">Country Inn & Suites</p>
                            </div>

                            <div className="grid grid-cols-2 gap-12">
                                <div>
                                    <h2 className="font-serif text-xl border-b border-slate-300 pb-2 mb-6 tracking-wider">Chef's Signature</h2>
                                    <div className="space-y-6">
                                        {/* Highlight Stars */}
                                        {menuEngineeringData.filter(i => i.category === 'Star').map(item => (
                                            <div key={item.name} className="relative group">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h3 className="font-bold text-lg">{item.name}</h3>
                                                    <span className="font-bold">₹{Math.floor(item.profit * 1.5)}</span>
                                                </div>
                                                <p className="text-sm text-slate-600 italic">Premium selection, locally sourced.</p>
                                                <div className="absolute -left-4 top-1 text-amber-500 opacity-100">★</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <h2 className="font-serif text-xl border-b border-slate-300 pb-2 mb-6 tracking-wider">Entrées & Mains</h2>
                                    <div className="space-y-6">
                                        {/* Puzzles & Plowhorses */}
                                        {menuEngineeringData.filter(i => i.category === 'Puzzle' || i.category === 'Plowhorse').map(item => (
                                            <div key={item.name}>
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h3 className="font-medium text-lg">{item.name}</h3>
                                                    <span className="font-medium">₹{Math.floor(item.profit * 1.3)}</span>
                                                </div>
                                                <p className="text-sm text-slate-500">Classic favorite.</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Analytics & Insights</h1>
                    <p className="text-slate-400 mt-1">Data-driven decision making for hotel operations.</p>
                </div>
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 w-full md:w-auto overflow-x-auto">
                    <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${activeTab === 'overview' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Overview</button>
                    <button onClick={() => setActiveTab('competitors')} className={`px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${activeTab === 'competitors' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Competitors</button>
                    <button onClick={() => setActiveTab('food')} className={`px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${activeTab === 'food' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Food & Bev</button>
                </div>
            </div>

            {/* FOOD & BEVERAGE TAB */}
            {activeTab === 'food' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Menu Engineering */}
                        <div className="glass-panel p-6 rounded-2xl border border-white/5 relative">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Utensils size={18} className="text-orange-400"/> Menu Engineering
                                </h3>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis type="number" dataKey="popularity" name="Popularity" unit="%" stroke="#94a3b8" label={{ value: 'Popularity', position: 'insideBottomRight', offset: 0, fill: '#94a3b8' }} />
                                        <YAxis type="number" dataKey="profit" name="Profit" unit="₹" stroke="#94a3b8" label={{ value: 'Profit', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                                        <Scatter name="Items" data={menuEngineeringData} fill="#8884d8">
                                            {menuEngineeringData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.category === 'Star' ? '#10b981' : entry.category === 'Dog' ? '#ef4444' : '#f59e0b'} />
                                            ))}
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-4 mt-4 text-xs">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Stars (Keep)</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Puzzle/Plowhorse (Reprice)</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Dogs (Remove)</span>
                            </div>
                        </div>

                        {/* Inventory Forecasting */}
                        <div className="glass-panel p-6 rounded-2xl border border-white/5">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Activity size={18} className="text-blue-400"/> Inventory Forecast & Waste
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={inventoryForecastData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                                        <Legend />
                                        <Area type="monotone" dataKey="consumption" name="Consumption (kg)" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                                        <Area type="monotone" dataKey="waste" name="Waste (kg)" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                                        <Line type="monotone" dataKey="occupancy" name="Occupancy %" stroke="#10b981" strokeWidth={2} dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-white/5">
                                <p className="text-xs text-slate-400">AI Insight: <span className="text-white">High waste predicted for Friday due to 95% occupancy surge. Increase prep efficiency for perishable greens.</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Menu Configuration Engine (Prominent Bottom Card) */}
                    <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-gradient-to-r from-slate-900 to-slate-900/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
                            <div className="max-w-md">
                                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                                    <Sliders size={24} className="text-purple-400"/> Menu Configuration Engine
                                </h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Before generating your new menu layout, configure the AI's design parameters. This ensures the output matches your restaurant's brand and profitability goals.
                                </p>
                            </div>

                            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Cuisine Focus</label>
                                    <select 
                                        value={menuConfig.cuisine}
                                        onChange={(e) => setMenuConfig({...menuConfig, cuisine: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                                    >
                                        <option>International</option>
                                        <option>Italian</option>
                                        <option>Pan-Asian</option>
                                        <option>Indian Traditional</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Profit Strategy</label>
                                    <select 
                                        value={menuConfig.strategy}
                                        onChange={(e) => setMenuConfig({...menuConfig, strategy: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                                    >
                                        <option>High Margin</option>
                                        <option>Volume Driver</option>
                                        <option>Upsell Focus</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Dietary Emphasis</label>
                                    <select 
                                        value={menuConfig.dietary}
                                        onChange={(e) => setMenuConfig({...menuConfig, dietary: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                                    >
                                        <option>Balanced</option>
                                        <option>Vegan Friendly</option>
                                        <option>Gluten Free</option>
                                    </select>
                                </div>
                            </div>

                            <button 
                                onClick={() => setShowAiMenuInsight(true)}
                                className="w-full md:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-xl shadow-purple-900/30 flex items-center justify-center gap-3 transition transform hover:scale-105"
                            >
                                <Sparkles size={20}/> Generate Menu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* OVERVIEW TAB (Simplified for this file View) */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-2">
                     {/* Sentiment Floor Plan */}
                     <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <MapPin size={18} className="text-blue-400"/> Live Floor Sentiment
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            <FloorMap floor={5} />
                            <FloorMap floor={4} />
                            <FloorMap floor={3} />
                            <FloorMap floor={1} />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="glass-panel p-6 rounded-2xl border border-white/5">
                            <h3 className="text-lg font-semibold text-white mb-6">Revenue Mix</h3>
                             <div className="h-[300px] w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={spendingData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                                            {spendingData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                             </div>
                        </div>
                        <div className="glass-panel p-6 rounded-2xl border border-white/5">
                            <h3 className="text-lg font-semibold text-white mb-6">Guest Retention Funnel</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={retentionData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false}/>
                                        <XAxis type="number" stroke="#94a3b8" hide/>
                                        <YAxis dataKey="stage" type="category" stroke="#94a3b8" width={80} tick={{fontSize: 12}} />
                                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155'}}/>
                                        <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                     </div>
                </div>
            )}

             {/* COMPETITORS TAB */}
             {activeTab === 'competitors' && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="glass-panel p-6 rounded-2xl border border-white/5">
                               <h3 className="text-lg font-semibold text-white mb-6">Market Positioning (Radar)</h3>
                               <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={competitorRadarData}>
                                            <PolarGrid stroke="#334155" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                            <Radar name="Country Inn" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                                            <Radar name="Fortune Valley" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                                            <Legend />
                                            <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155'}}/>
                                        </RadarChart>
                                    </ResponsiveContainer>
                               </div>
                          </div>
                          
                          {/* Rate Parity Chart (New) */}
                          <div className="glass-panel p-6 rounded-2xl border border-white/5">
                               <h3 className="text-lg font-semibold text-white mb-6 flex items-center justify-between">
                                   <span>Rate Parity Monitor</span>
                                   <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-1 rounded border border-rose-500/30">Parity Breach (Wed)</span>
                               </h3>
                               <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={rateParityData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                                            <Legend />
                                            <Line type="monotone" dataKey="direct" name="Direct Site" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                            <Line type="monotone" dataKey="booking" name="Booking.com" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                            <Line type="monotone" dataKey="agoda" name="Agoda" stroke="#f59e0b" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                               </div>
                          </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="glass-panel p-6 rounded-2xl border border-white/5">
                               <h3 className="text-lg font-semibold text-white mb-6">Competitor Benchmarking</h3>
                               <div className="space-y-4">
                                    {competitorStats.map((comp, idx) => (
                                        <div key={idx} className="p-4 rounded-xl bg-slate-800/40 border border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full" style={{backgroundColor: comp.color}}></div>
                                                <div>
                                                    <p className="font-medium text-white text-sm">{comp.name}</p>
                                                    <p className="text-xs text-slate-400">Occ: {comp.occupancy}%</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white font-bold">₹{comp.adr}</p>
                                                <div className="flex items-center gap-1 justify-end text-xs text-amber-400">
                                                    <Star size={10} fill="currentColor"/> {comp.rating}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                               </div>
                          </div>

                          {/* SWOT Analysis Card (New) */}
                          <div className="glass-panel p-6 rounded-2xl border border-white/5">
                               <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                   <Target size={18} className="text-emerald-400"/> SWOT Analysis
                               </h3>
                               <div className="grid grid-cols-2 gap-4 h-[350px]">
                                   <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                                       <h4 className="text-emerald-400 font-bold text-xs uppercase mb-2 flex items-center gap-2"><ArrowUpRight size={14}/> Strengths</h4>
                                       <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                                           <li>Highest ADR in compset</li>
                                           <li>Rooftop Pool USP</li>
                                           <li>92% Direct Booking Retention</li>
                                       </ul>
                                   </div>
                                   <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">
                                       <h4 className="text-rose-400 font-bold text-xs uppercase mb-2 flex items-center gap-2"><ArrowDownRight size={14}/> Weaknesses</h4>
                                       <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                                           <li>F&B Score (65/150) lags</li>
                                           <li>Slow Check-in (Avg 12m)</li>
                                       </ul>
                                   </div>
                                   <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                                       <h4 className="text-blue-400 font-bold text-xs uppercase mb-2 flex items-center gap-2"><Sparkles size={14}/> Opportunities</h4>
                                       <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                                           <li>Corporate Corp. rates</li>
                                           <li>Spa Weekend Packages</li>
                                       </ul>
                                   </div>
                                   <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                                       <h4 className="text-amber-400 font-bold text-xs uppercase mb-2 flex items-center gap-2"><AlertTriangle size={14}/> Threats</h4>
                                       <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                                           <li>New 5-star opening Q4</li>
                                           <li>OTA Commission Hikes</li>
                                       </ul>
                                   </div>
                               </div>
                          </div>
                     </div>
                 </div>
             )}
        </div>
    );
};

// Simple Star Icon for this file context
const Star = ({ size, fill, className }: { size: number, fill?: string, className?: string }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill={fill || "none"} 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

export default Analytics;
