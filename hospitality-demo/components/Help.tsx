import React, { useState } from 'react';
import { HelpCircle, Search, ChevronRight, MessageCircle, BarChart2, Layout, CheckCircle, X, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';
import { generateHelpAnswer } from '../services/geminiService';

// --- CONTENT DATABASE ---
const articleDatabase: Record<string, string> = {
    "System Overview & Dashboard Navigation": `
# System Overview & Dashboard Navigation

Welcome to the GuaqAI Hospitality Operations Portal. This platform is designed to be your central command center for hotel operations, guest experience management, and reputation analytics.

## The Dashboard View
Upon logging in, you are greeted by the **Overview Dashboard**. This view aggregates critical real-time data from across your property.

### Key Sections:
1.  **Summary Cards**: Located at the top, these provide instant visibility into:
    *   **Active Guests**: Current occupancy based on PMS sync.
    *   **Sentiment Score**: A real-time AI-calculated score (0-5) based on recent chats and reviews.
    *   **Pending Alerts**: Critical operational issues requiring immediate manager attention.

2.  **Guest Retention Table**:
    This dynamic list highlights specific guests who require attention. The AI analyzes historical data to tag guests as "VIP", "Loyal", or "At Risk".
    *   *Action Buttons*: Use the quick action buttons (e.g., "Upsell Spa", "Apologize") to jump directly into the **Live Inbox** with a pre-drafted message.

3.  **Navigation Sidebar**:
    The sidebar on the left (collapsible on tablets) is your primary navigation tool.
    *   **Live Inbox**: Chat with guests via WhatsApp/Telegram.
    *   **Bot Simulator**: Test your AI Concierge configuration.
    *   **Service Tickets**: Kanban board for maintenance and housekeeping tasks.
    *   **Campaigns**: Marketing broadcast tools.
    *   **Analytics**: Deep dive into data.
    *   **Settings**: Configure branding, users, and AI context.

## Role-Based Access
*   **Admin (General Manager)**: Full access to all modules, including Settings and Staff Management.
*   **Staff (Front Desk)**: Restricted view. Can access Inbox, Tickets, and Dashboard but cannot modify system configurations or see sensitive revenue analytics.
`,

    "Setting up Hotel Branding": `
# Setting up Hotel Branding

Make the GuaqAI system your own by configuring the branding settings. This ensures that all guest-facing interfaces (like the Chatbot Simulator preview) and internal dashboards reflect your property's identity.

## Accessing Branding Settings
1.  Navigate to **Settings** via the sidebar.
2.  Locate the **Branding & Customization** card (usually in the top-left column).

## Configuration Options
*   **Logo Upload**: 
    *   Click "Upload Logo" to select a file from your device.
    *   *Recommendation*: Use a square PNG image (512x512px) with a transparent background for the best result in the sidebar and chat headers.
*   **Application Name**: 
    *   This sets the browser tab title and the name displayed in the top-left of the sidebar. 
    *   *Example*: "Grand Hyatt Ops" or "GuaqAI".
*   **Hotel Name**: 
    *   Crucial for the AI Chatbot. The bot uses this name in its welcome messages and system prompts.
    *   *Example*: "Country Inn & Suites by Radisson, Manipal".

Once saved, these changes update globally across the application immediately.
`,

    "Adding your first Staff Member": `
# Adding your first Staff Member

Efficient operations require your entire team to be on board. The Staff Management module allows you to create accounts, assign roles, and manage shifts.

## Step-by-Step Guide

1.  **Navigate to Staff Roster**: Click on the "Staff Roster" icon in the sidebar.
2.  **Open Add Modal**: Click the blue "+ Add Staff" button in the top right corner.
3.  **Fill Details**:
    *   **Full Name**: Required for display in tickets and chats.
    *   **Email**: Used as the login username.
    *   **Role**: Select from the dropdown (Front Desk, Housekeeping, Maintenance, Manager, Chef). This determines their default permissions.
    *   **Shift**: Assign their primary shift (Morning, Evening, Night).
4.  **Confirm**: Click "Add Member".

## Managing Access
To grant actual system login credentials to this staff member:
1.  Go to **Settings** > **Security & Team Access**.
2.  Enter their Email (must match the one in Roster).
3.  Set a temporary Password.
4.  **Permissions**: Toggle the views they are allowed to see. For example, a Housekeeping staff might only need access to "Service Tickets" and not "Financial Analytics".
`,

    "Training the Bot with Knowledge Base": `
# Training the Bot with Knowledge Base

One of GuaqAI's most powerful features is RAG (Retrieval-Augmented Generation). This allows the AI Concierge to answer specific questions about your property by "reading" your actual documents.

## How it Works
Instead of hard-coding answers, you upload files (PDFs, Images, Text), and the AI references them when a guest asks a relevant question.

## Uploading Documents
1.  Go to **Settings**.
2.  Find the **Knowledge Base (AI Context)** card.
3.  **Description**: Enter a short label for the file (e.g., "Spa Menu 2024", "Pool Rules"). This helps the AI understand *what* the file contains.
4.  **Upload**: Click the Upload button and select your file. Supported formats: .pdf, .docx, .txt, .jpg, .png.

## Best Practices
*   **Menus**: Upload your Restaurant and Spa menus. The bot can then answer "How much is the Thai Curry?" or "Do you have a Deep Tissue massage?".
*   **Policy Documents**: Upload a PDF containing Check-in/out times, Pet Policies, and Smoking rules.
*   **Fact Sheets**: Upload room dimension and amenity lists.

## Testing
After uploading, go to the **Bot Simulator**.
*   *User*: "What time does the pool close?"
*   *Bot*: (Reads your uploaded Pool Rules) "The pool remains open from 6:00 AM to 10:00 PM daily."
`,

    "Understanding Bot Simulator Stages": `
# Understanding Bot Simulator Stages

The Guest Lifecycle is not static; a guest's needs change from before they arrive to after they leave. The **Bot Simulator** allows you to test how the AI behaves at each distinct stage of the journey.

## The Stages

1.  **PRE_ARRIVAL (Day -1)**:
    *   *Trigger*: System sends a welcome message 24 hours before check-in.
    *   *Goal*: Confirm arrival time and collect ID documents.
    *   *AI Behavior*: Asks for ID photos. If a user uploads an image, the AI interprets it as an ID submission.

2.  **CHECK_IN (Day 0)**:
    *   *Trigger*: Guest arrives at the lobby.
    *   *Goal*: share WiFi details and room orientation.
    *   *AI Behavior*: Proactively offers "CountryInn_Guest" WiFi password.

3.  **PULSE_CHECK (Mid-Stay)**:
    *   *Trigger*: 24 hours after check-in.
    *   *Goal*: Gauge sentiment early to fix issues before checkout.
    *   *AI Behavior*: Asks for a 1-5 rating.
        *   *Rating 1-3*: Triggers **Service Recovery** mode.
        *   *Rating 4-5*: Notes positive sentiment.

4.  **POST_STAY (Checkout + 1 Day)**:
    *   *Trigger*: 24 hours after checkout.
    *   *Goal*: Generate online reviews.
    *   *AI Behavior*: Asks for a final rating.
        *   *Rating 4-5*: Sends a Google/TripAdvisor deep link.
        *   *Rating 1-3*: Apologizes and asks for internal feedback (prevents bad public reviews).

5.  **SERVICE_RECOVERY**:
    *   *Trigger*: Negative feedback detected in Pulse Check or Post Stay.
    *   *Goal*: De-escalate.
    *   *AI Behavior*: Highly empathetic, apologetic, and immediately raises a **Critical Alert** on the Dashboard for human intervention.
`,

    "Handling Handover to Human Agent": `
# Handling Handover to Human Agent

While the AI can handle 80% of queries, some situations require a human touch. GuaqAI provides a seamless handover protocol via the **Live Inbox**.

## Detecting the Need
The AI is trained to detect frustration. If a guest says "I want to speak to a human" or "Manager please", or if the sentiment score drops drastically, the chat is flagged.

## The Handover Process
1.  **Notification**: The chat in the **Live Inbox** sidebar will turn **Red** (Status: Critical).
2.  **Intervention**: A human staff member clicks on the chat.
3.  **Takeover**: simply typing a message in the input box overrides the bot. The bot will automatically pause responding to that specific user for a set duration (or until re-enabled), allowing the staff member to have a natural conversation.

## Assigning Staff
In the Inbox header, use the **Assign** button to route the conversation to a specific department (e.g., "Room 304 needs Maintenance"). The assigned staff member will see the chat highlighted in their view.
`,

    "Managing Service Tickets": `
# Managing Service Tickets

The **Service Tickets** module is a Kanban-style board for tracking operational requests. It ensures no guest request falls through the cracks.

## Creating a Ticket
Tickets are created in two ways:
1.  **Manual**: Click "+ Create Ticket" on the Tickets page. Useful for requests received via phone or walk-in.
2.  **AI-Automated**: The Chatbot automatically creates tickets based on keywords.
    *   *Guest says*: "My AC is leaking." -> *System*: Creates a **Maintenance** ticket with **High Priority**.
    *   *Guest says*: "Need extra towels." -> *System*: Creates a **Housekeeping** ticket.

## Ticket Lifecycle
*   **New**: The request has just come in. It appears in the first column.
*   **In Progress**: Drag the card to the middle column when a staff member starts working on it.
*   **Resolved**: Drag to the final column upon completion. The guest can be automatically notified (optional configuration).

## Priorities
Tickets are color-coded:
*   **Critical (Red)**: Safety issues, AC failure, Leakage.
*   **High (Orange)**: F&B delay, Room change.
*   **Medium (Blue)**: Amenities request.
*   **Low (Grey)**: General inquiry.
`,

    "Staff Rostering & Shifts": `
# Staff Rostering & Shifts

The **Staff Roster** view provides a snapshot of who is working now and allows for shift planning.

## Overview Card
The "Shift Coverage" widget on the right shows the distribution of staff across Morning, Evening, and Night shifts.
*   **Low Staffing Alert**: If a shift has fewer than 2 active staff members, a warning ⚠️ is displayed, prompting the manager to call in backup.

## Managing Status
*   **On Duty / Off Duty**: Toggle the button next to a staff member's name to change their live status. Only "On Duty" staff appear in the assignment dropdowns in the Inbox and Ticket modules.
*   **Changing Shifts**: Use the dropdown to reassign a staff member to a different shift block (e.g., move from Morning to Evening).

## Roles
Roles defined here (e.g., Housekeeping vs. Maintenance) determine the default categorization for tickets assigned to them.
`,

    "Review Auto-Pilot Configuration": `
# Review Auto-Pilot Configuration

Responding to reviews is critical for SEO and guest relationships, but it is time-consuming. The **Review Auto-Pilot** uses Generative AI to draft personalized responses.

## Configuration
1.  Go to **Settings** > **Review Automation**.
2.  **Enable Auto-Reply**: Toggle the switch to ON.
3.  **Signature**: Set your default sign-off (e.g., "Warm Regards, John Doe, General Manager").

## Using Auto-Pilot
1.  Navigate to the **Guest Reviews** page.
2.  You will see a list of "Pending" reviews from Google and TripAdvisor.
3.  **Single Reply**: Click the "Draft AI Reply" button on a specific card. The AI reads the review, analyzes the sentiment, and drafts a context-aware response. You can edit it before sending.
4.  **Bulk Auto-Pilot**: Click the "Run Auto-Pilot" button at the top.
    *   The system iterates through *all* pending reviews.
    *   It generates responses for each.
    *   *Note*: In this prototype, it simulates the posting. In production, this connects to the Google Business Profile API.

## Intelligence
The AI handles:
*   **Positive Reviews**: Thanks the guest, mentions specific highlights they liked (e.g., "Glad you liked the pool!").
*   **Negative Reviews**: Apologizes, does *not* make excuses, and offers to take the conversation offline.
`,

    "Reading the Floor Sentiment Map": `
# Reading the Floor Sentiment Map

The **Analytics** > **Overview** tab features a "Live Floor Sentiment" heatmap. This is a visual representation of guest happiness across your property physically.

## How to Read It
*   **Green Room**: High Sentiment (4-5 stars). Guest is happy.
*   **Yellow Room**: Neutral Sentiment (3 stars). No major complaints, but no praise.
*   **Red Room**: Low Sentiment (1-2 stars). **Action Required.**

## Interaction
*   Clicking on a room number reveals details about *why* the sentiment is low.
    *   *Example*: Clicking a Red "304" might reveal "Open Ticket: AC Leakage" and "Negative Chat: Wifi issues".
*   **Pulse Effect**: Rooms with active, unresolved critical tickets will pulse visually to draw attention.

## Use Case
A Duty Manager should check this map every morning. If an entire floor is Yellow/Red, it might indicate a systemic issue (e.g., "Floor 3 Wifi Router is down" or "Floor 2 Housekeeping staff is underperforming").
`,

    "Using Menu Engineering Insights": `
# Using Menu Engineering Insights

Located in **Analytics** > **Food & Bev**, this tool helps optimize your restaurant's profitability using the "BCG Matrix" approach tailored for hospitality.

## The Matrix Categories
The scatter chart plots items based on **Profitability** (Y-axis) vs. **Popularity** (X-axis).
1.  **Stars (High Profit, High Popularity)**: Your best items (e.g., Wagyu Steak). *Strategy*: Keep quality high, promote visibly.
2.  **Plowhorses (Low Profit, High Popularity)**: Crowd pleasers (e.g., Burger). *Strategy*: Increase price slightly or reduce portion cost.
3.  **Puzzles (High Profit, Low Popularity)**: Hidden gems (e.g., Lobster Bisque). *Strategy*: Rebrand, better photos, or staff recommendations to increase sales.
4.  **Dogs (Low Profit, Low Popularity)**: Dead weight (e.g., Green Salad). *Strategy*: Remove from menu.

## AI Menu Designer
Click "Generate AI Menu" to launch the designer.
*   **Golden Triangle**: The AI re-layouts the menu to place "Star" items in the top-right and center (where eyes look first).
*   **Visual Cues**: It adds boxes or icons around high-profit items to draw attention.
*   **Export**: You can visualize the new layout and export it as a PDF for printing.
`,

    "Competitor Analysis Radar": `
# Competitor Analysis Radar

Located in **Analytics** > **Competitors**, this radar chart benchmarks your property against your selected "Compset" (Competitive Set).

## Metrics
We compare across 6 axes:
1.  **Price Value**: Perceived value for money.
2.  **Cleanliness**: Based on review keywords.
3.  **Service**: Staff interaction ratings.
4.  **Location**: Proximity convenience.
5.  **Amenities**: Pool, Gym, Spa quality.
6.  **Food**: F&B quality.

## Reading the Chart
*   **Your Property**: Represented by the Purple filled area.
*   **Competitors**: Represented by Green/Orange outlines.
*   **Gap Analysis**: Look for areas where the Purple shape is smaller than the others.
    *   *Example*: If your "Food" score is 65 but competitors are at 85, this is a clear area for investment (Hire new chef, revamp menu).
    *   *Example*: If your "Price Value" is 120 (highest), you might have room to *increase* room rates without losing occupancy.
`
};

const Help: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const handleSearch = async (e?: React.KeyboardEvent) => {
      if (e && e.key !== 'Enter') return;
      if (!searchTerm.trim()) {
          setAiAnswer(null);
          return;
      }

      setIsAiSearching(true);
      setAiAnswer(null); // Clear previous
      
      try {
          // Check if we have an exact article match first
          const exactMatch = Object.keys(articleDatabase).find(k => k.toLowerCase().includes(searchTerm.toLowerCase()));
          
          if (exactMatch && !searchTerm.toLowerCase().includes('how') && !searchTerm.toLowerCase().includes('what')) {
              // If user types "Ticket" and we have "Managing Service Tickets", maybe just show the article?
              // But the user requested AI search, so let's let AI answer but maybe reference the article.
          }

          const answer = await generateHelpAnswer(searchTerm);
          setAiAnswer(answer);
      } catch (err) {
          setAiAnswer("I'm having trouble connecting to the knowledge base right now. Please try again.");
      } finally {
          setIsAiSearching(false);
      }
  };

  const guides = [
    {
      category: 'Getting Started',
      icon: RocketIcon,
      articles: [
        { title: 'System Overview & Dashboard Navigation', readTime: '2 min' },
        { title: 'Setting up Hotel Branding', readTime: '1 min' },
        { title: 'Adding your first Staff Member', readTime: '3 min' },
      ]
    },
    {
      category: 'AI Concierge',
      icon: MessageCircle,
      articles: [
        { title: 'Training the Bot with Knowledge Base', readTime: '5 min' },
        { title: 'Understanding Bot Simulator Stages', readTime: '3 min' },
        { title: 'Handling Handover to Human Agent', readTime: '2 min' },
      ]
    },
    {
      category: 'Operations',
      icon: Layout,
      articles: [
        { title: 'Managing Service Tickets', readTime: '3 min' },
        { title: 'Staff Rostering & Shifts', readTime: '2 min' },
        { title: 'Review Auto-Pilot Configuration', readTime: '4 min' },
      ]
    },
    {
      category: 'Analytics',
      icon: BarChart2,
      articles: [
        { title: 'Reading the Floor Sentiment Map', readTime: '3 min' },
        { title: 'Using Menu Engineering Insights', readTime: '5 min' },
        { title: 'Competitor Analysis Radar', readTime: '2 min' },
      ]
    }
  ];

  return (
    <div className="p-8 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pb-24 min-w-0 relative">
       <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-12">
             <div className="inline-flex items-center justify-center p-3 bg-blue-600/20 rounded-2xl mb-4 text-blue-400">
                <HelpCircle size={32} />
             </div>
             <h1 className="text-3xl font-bold text-white mb-3">How can we help you?</h1>
             <p className="text-slate-400 mb-6">Search our knowledge base or browse guides below.</p>
             
             <div className="relative max-w-lg mx-auto">
                <Search className="absolute left-4 top-3.5 text-slate-500" size={20}/>
                <input 
                  type="text" 
                  placeholder="Ask AI (e.g., 'How do I add a new user?')"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearch}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-12 pr-12 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-lg"
                />
                <button 
                    onClick={() => handleSearch()}
                    disabled={isAiSearching}
                    className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-white transition"
                >
                    {isAiSearching ? <Sparkles size={18} className="animate-spin text-purple-400"/> : <ArrowRight size={18}/>}
                </button>
             </div>

             {/* AI Answer Card */}
             {aiAnswer && (
                 <div className="mt-6 max-w-lg mx-auto text-left animate-in fade-in slide-in-from-top-2">
                     <div className="glass-panel p-6 rounded-2xl border border-purple-500/30 bg-purple-900/10">
                         <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2 mb-3">
                             <Sparkles size={16}/> AI Answer
                         </h3>
                         <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                             {aiAnswer}
                         </div>
                     </div>
                 </div>
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
             {guides.map((guide, idx) => (
               <div key={idx} className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-white/10 transition group cursor-default">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-slate-800 rounded-lg text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition">
                        <guide.icon size={20} />
                     </div>
                     <h3 className="font-semibold text-white">{guide.category}</h3>
                  </div>
                  <div className="space-y-3">
                     {guide.articles.map((article, i) => (
                        <div 
                            key={i} 
                            onClick={() => setSelectedArticle(article.title)}
                            className="flex items-center justify-between text-sm group/item cursor-pointer p-2 rounded hover:bg-white/5 transition"
                        >
                           <span className="text-slate-400 group-hover/item:text-blue-400 transition">{article.title}</span>
                           <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition">
                              <span className="text-[10px] text-slate-600">{article.readTime}</span>
                              <ChevronRight size={12} className="text-slate-500"/>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
             ))}
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-slate-900/50">
              <h3 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h3>
              <div className="space-y-4">
                 {[
                    { q: "How do I reset the AI's context?", a: "Go to Settings > Knowledge Base and clear uploaded documents, or use the 'Reset Chat' button in the Simulator." },
                    { q: "Can I use WhatsApp Business API?", a: "Yes, the production version connects directly to Meta's Cloud API. This demo uses a simulated environment." },
                    { q: "How is the sentiment score calculated?", a: "We use Natural Language Processing (NLP) to analyze guest messages, reviews, and feedback in real-time." },
                 ].map((faq, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-800/30 border border-white/5">
                       <h4 className="font-semibold text-white mb-2 flex items-start gap-2">
                          <span className="text-blue-500 mt-1"><CheckCircle size={14}/></span> {faq.q}
                       </h4>
                       <p className="text-sm text-slate-400 pl-6 leading-relaxed">{faq.a}</p>
                    </div>
                 ))}
              </div>
          </div>

          <div className="mt-12 text-center border-t border-white/5 pt-8">
             <p className="text-slate-400 text-sm mb-4">Still need support?</p>
             <div className="flex justify-center gap-4">
                <a 
                    href="https://guaq.framer.ai/contact-us" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                >
                    Contact Support <ExternalLink size={14}/>
                </a>
                <a 
                    href="https://discord.gg/invite/nZQTDeqSmm" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                >
                    Join Community <ExternalLink size={14}/>
                </a>
             </div>
          </div>

       </div>

       {/* Article Reader Modal */}
       {selectedArticle && (
           <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedArticle(null)}>
               <div className="bg-slate-900 border border-white/10 w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                   <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900 shrink-0">
                       <h3 className="font-bold text-white text-lg truncate pr-4">{selectedArticle}</h3>
                       <button onClick={() => setSelectedArticle(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition">
                           <X size={20}/>
                       </button>
                   </div>
                   <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-950">
                       <div className="prose prose-invert prose-sm max-w-none">
                           <ArticleContent content={articleDatabase[selectedArticle] || "Content coming soon..."} />
                       </div>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

// Simple Markdown-ish parser component
const ArticleContent = ({ content }: { content: string }) => {
    return (
        <div className="space-y-4 text-slate-300 leading-relaxed">
            {content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-white mb-4 mt-2 pb-2 border-b border-white/10">{line.replace('# ', '')}</h1>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-blue-400 mb-3 mt-6">{line.replace('## ', '')}</h2>;
                if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold text-white mb-2 mt-4">{line.replace('### ', '')}</h3>;
                if (line.startsWith('* ')) return <li key={i} className="ml-4 list-disc marker:text-blue-500">{line.replace('* ', '')}</li>;
                if (line.startsWith('1. ')) return <div key={i} className="ml-4 flex gap-2"><span className="font-bold text-slate-500">{line.split('.')[0]}.</span> <span>{line.substring(3)}</span></div>;
                if (line.trim() === '') return <br key={i}/>;
                return <p key={i}>{line}</p>;
            })}
        </div>
    )
}

const RocketIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
);

export default Help;