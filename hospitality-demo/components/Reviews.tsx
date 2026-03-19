import React, { useState } from 'react';
import { Star, MessageSquare, Send, ThumbsUp, MapPin, CheckCircle, RefreshCw, Zap } from 'lucide-react';
import { Review, ReviewConfig } from '../types';
import { generateReviewReply } from '../services/geminiService';

/**
 * ==============================================================================
 * 🏗️ ARCHITECTURE NOTE: BACKGROUND JOBS & QUEUES
 * ==============================================================================
 * 
 * 1. AUTO-PILOT JOB:
 *    - The "Auto-Pilot" feature iterates through pending reviews. In a production app with
 *      thousands of reviews, this cannot be done in the browser.
 *    - Migration: Use a Background Queue (e.g., BullMQ, Inngest, or Trigger.dev).
 *    - Flow: 
 *      1. Admin clicks "Run Auto-Pilot".
 *      2. Server Action triggers a Job.
 *      3. Worker processes reviews one by one, calls Gemini API, updates DB.
 *      4. UI updates via Realtime subscription or Polling.
 * 
 * 2. WEBHOOKS:
 *    - To get reviews in real-time, configure Google Business Profile / TripAdvisor Webhooks
 *      that hit your API route `/api/webhooks/reviews`.
 * ==============================================================================
 */

interface ReviewsProps {
    reviews: Review[];
    onUpdateReviews: (reviews: Review[] | ((prev: Review[]) => Review[])) => void;
    config: ReviewConfig;
}

const Reviews: React.FC<ReviewsProps> = ({ reviews, onUpdateReviews, config }) => {
    const [filter, setFilter] = useState<'all' | 'pending' | 'replied'>('all');
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [isAutoPiloting, setIsAutoPiloting] = useState(false);

    const filteredReviews = reviews.filter(r => {
        if (filter === 'all') return true;
        if (filter === 'pending') return r.status === 'Pending';
        return r.status === 'Replied';
    });

    const handleGenerateReply = async (review: Review) => {
        setGeneratingId(review.id);
        const reply = await generateReviewReply(review.comment, review.rating, review.guestName, config.signature);
        setDrafts(prev => ({ ...prev, [review.id]: reply }));
        setGeneratingId(null);
    };

    const handleSendReply = (reviewId: string) => {
        const replyText = drafts[reviewId];
        if (!replyText) return;

        const updated = reviews.map(r => r.id === reviewId ? { ...r, status: 'Replied' as const, response: replyText } : r);
        onUpdateReviews(updated);
        
        // Clear draft
        const newDrafts = { ...drafts };
        delete newDrafts[reviewId];
        setDrafts(newDrafts);
    };

    const runAutoPilot = async () => {
        if (!config.autoReplyEnabled) {
            alert("Please enable Auto-Reply in Settings first.");
            return;
        }
        
        const pending = reviews.filter(r => r.status === 'Pending');
        if (pending.length === 0) return;

        setIsAutoPiloting(true);

        for (const review of pending) {
            // Simulate AI delay for effect
            await new Promise(r => setTimeout(r, 1200));
            const reply = await generateReviewReply(review.comment, review.rating, review.guestName, config.signature);
            
            // Functionally update state to ensure we don't lose progress or overwrite other changes
            onUpdateReviews((prev) => prev.map(r => r.id === review.id ? { ...r, status: 'Replied', response: reply } : r));
        }

        setIsAutoPiloting(false);
    };

    return (
        <div className="p-6 h-full flex flex-col min-w-0">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-8 shrink-0 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Star className="text-amber-400" fill="currentColor"/> Guest Reviews
                    </h1>
                    <p className="text-slate-400 mt-1">Manage online reputation and automate responses.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                     <button 
                        onClick={runAutoPilot}
                        disabled={isAutoPiloting}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition whitespace-nowrap ${
                            isAutoPiloting 
                            ? 'bg-purple-600/50 cursor-wait text-purple-200' 
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20'
                        }`}
                     >
                         <Zap size={16} className={isAutoPiloting ? 'animate-pulse' : ''} />
                         {isAutoPiloting ? 'Running Auto-Pilot...' : 'Run Auto-Pilot'}
                     </button>

                    <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 overflow-x-auto">
                        {['all', 'pending', 'replied'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition whitespace-nowrap ${filter === f ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-y-auto pb-4 custom-scrollbar">
                {filteredReviews.length === 0 && (
                    <div className="col-span-2 text-center text-slate-500 py-20 flex flex-col items-center">
                        <MessageSquare size={48} className="opacity-20 mb-4"/>
                        <p>No reviews found matching this filter.</p>
                    </div>
                )}
                {filteredReviews.map(review => (
                    <div key={review.id} className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white font-bold text-lg">
                                    {review.guestName.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold">{review.guestName}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span>{review.date}</span>
                                        <span>•</span>
                                        <span className="capitalize flex items-center gap-1">
                                            {review.platform === 'google' ? <MapPin size={10}/> : <ThumbsUp size={10}/>} {review.platform}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(star => (
                                    <Star key={star} size={14} className={star <= review.rating ? "text-amber-400" : "text-slate-700"} fill={star <= review.rating ? "currentColor" : "none"}/>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 text-slate-300 text-sm italic mb-4">
                            "{review.comment}"
                        </div>

                        <div className="mt-auto">
                            {review.status === 'Replied' ? (
                                <div className="pl-4 border-l-2 border-emerald-500/30">
                                    <p className="text-xs text-emerald-400 font-semibold mb-1 flex items-center gap-1"><CheckCircle size={12}/> Replied</p>
                                    <p className="text-sm text-slate-400 line-clamp-2">{review.response}</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {drafts[review.id] ? (
                                        <div className="animate-in fade-in slide-in-from-top-2">
                                            <textarea 
                                                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-blue-500 h-24 resize-none"
                                                value={drafts[review.id]}
                                                onChange={(e) => setDrafts({...drafts, [review.id]: e.target.value})}
                                            />
                                            <div className="flex gap-2 mt-2">
                                                <button onClick={() => handleSendReply(review.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                                                    <Send size={14}/> Send Reply
                                                </button>
                                                <button onClick={() => handleGenerateReply(review)} className="px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg">
                                                    <RefreshCw size={14}/>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => handleGenerateReply(review)}
                                            disabled={generatingId === review.id}
                                            className="w-full py-2.5 rounded-lg border border-dashed border-slate-600 hover:border-blue-500 text-slate-400 hover:text-blue-400 text-sm transition flex items-center justify-center gap-2 group"
                                        >
                                            {generatingId === review.id ? (
                                                <><span className="animate-spin"><RefreshCw size={14}/></span> Drafting...</>
                                            ) : (
                                                <><MessageSquare size={14} className="group-hover:scale-110 transition"/> Draft AI Reply</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Reviews;