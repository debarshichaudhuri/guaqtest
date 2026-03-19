import React, { useState, DragEvent } from 'react';
import { 
  ClipboardList, CheckCircle2, Clock, AlertCircle, MoreHorizontal, 
  Search, ArrowRight, User, X, Trash2, Calendar
} from 'lucide-react';
import { Ticket, TicketStatus, StaffMember, TicketPriority, TicketCategory } from '../types';

/**
 * ==============================================================================
 * 🏗️ ARCHITECTURE NOTE: TICKET SYSTEM
 * ==============================================================================
 * 
 * 1. SERVER ACTIONS (CRUD):
 *    - `createTicket`, `updateTicket`, `deleteTicket` should be Server Actions.
 *    - `revalidatePath('/tickets')` should be called after mutations to refresh the list.
 * 
 * 2. OPTIMISTIC UPDATES:
 *    - The Drag & Drop functionality requires instant feedback.
 *    - Use `useOptimistic` hook in Next.js to update the UI immediately while the
 *      server action processes the status change in the background.
 * ==============================================================================
 */

interface TicketsProps {
  tickets: Ticket[];
  onTicketUpdate: (tickets: Ticket[]) => void;
  staffList: StaffMember[];
}

const Tickets: React.FC<TicketsProps> = ({ tickets, onTicketUpdate, staffList }) => {
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Ticket State
  const [newTicketData, setNewTicketData] = useState<Partial<Ticket>>({
      priority: 'Medium',
      category: 'Housekeeping',
      status: 'New'
  });

  const moveTicket = (id: string, newStatus: TicketStatus) => {
    const updatedTickets = tickets.map(t => 
      t.id === id ? { ...t, status: newStatus } : t
    );
    onTicketUpdate(updatedTickets);
  };

  const handleDelete = (id: string) => {
      if(confirm('Are you sure you want to delete this ticket?')) {
          onTicketUpdate(tickets.filter(t => t.id !== id));
          setSelectedTicket(null);
      }
  };

  const handleCreate = () => {
      if(!newTicketData.roomId || !newTicketData.description) return;
      
      const newTicket: Ticket = {
          id: `T-${Date.now().toString().slice(-4)}`,
          roomId: newTicketData.roomId,
          guestName: newTicketData.guestName || 'Guest',
          category: newTicketData.category as TicketCategory,
          description: newTicketData.description,
          priority: newTicketData.priority as TicketPriority,
          status: 'New',
          createdAt: new Date(),
          assignedTo: newTicketData.assignedTo
      };
      
      onTicketUpdate([newTicket, ...tickets]);
      setIsCreateModalOpen(false);
      setNewTicketData({ priority: 'Medium', category: 'Housekeeping', status: 'New' });
  };

  const handleUpdateTicket = (updated: Ticket) => {
      onTicketUpdate(tickets.map(t => t.id === updated.id ? updated : t));
      setSelectedTicket(null);
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'Critical': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'High': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'Medium': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const onDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
      setDraggedTicketId(id);
      e.dataTransfer.setData("text/plain", id);
      e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>, status: TicketStatus) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain");
      if (id) {
          moveTicket(id, status);
      }
      setDraggedTicketId(null);
  };

  const Column = ({ status, items }: { status: TicketStatus, items: Ticket[] }) => (
    <div 
        className="flex-1 min-w-[300px] flex flex-col h-full"
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, status)}
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          {status === 'New' && <AlertCircle size={18} className="text-rose-400" />}
          {status === 'In Progress' && <Clock size={18} className="text-blue-400" />}
          {status === 'Resolved' && <CheckCircle2 size={18} className="text-emerald-400" />}
          {status}
          <span className="ml-2 text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{items.length}</span>
        </h3>
        <button className="text-slate-500 hover:text-white"><MoreHorizontal size={16} /></button>
      </div>
      
      <div className={`flex-1 bg-slate-900/50 rounded-xl border border-white/5 p-3 space-y-3 overflow-y-auto custom-scrollbar transition ${draggedTicketId ? 'bg-slate-800/30 border-dashed' : ''}`}>
        {items.map(ticket => (
          <div 
            key={ticket.id} 
            draggable
            onDragStart={(e) => onDragStart(e, ticket.id)}
            onClick={() => setSelectedTicket(ticket)}
            className="glass-panel p-4 rounded-xl border border-white/5 hover:border-white/20 transition group relative cursor-grab active:cursor-grabbing hover:bg-slate-800/50"
          >
            <div className="flex justify-between items-start mb-2">
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(ticket.priority)} uppercase tracking-wider`}>
                 {ticket.priority}
               </span>
               <span className="text-xs text-slate-500">{new Date(ticket.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-200 mb-1">{ticket.category}: {ticket.roomId}</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">{ticket.description}</p>
            
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
               <div className="flex items-center gap-2 text-xs text-slate-500">
                  <User size={12}/> {ticket.assignedTo ? staffList.find(s => s.id === ticket.assignedTo)?.name || ticket.assignedTo : 'Unassigned'}
               </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-lg min-h-[100px]">
            <span className="text-xs">Drag tickets here</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden min-w-0 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 shrink-0 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             <ClipboardList className="text-blue-400"/> Service Tickets
           </h1>
           <p className="text-slate-400 mt-1">Track, manage, and resolve guest requests in real-time.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <div className="relative hidden md:block">
                <Search className="absolute left-3 top-2.5 text-slate-500" size={16}/>
                <input type="text" placeholder="Search tickets..." className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-blue-500"/>
            </div>
            <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-blue-900/20 w-full md:w-auto"
            >
                + Create Ticket
            </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
         <Column status="New" items={tickets.filter(t => t.status === 'New')} />
         <Column status="In Progress" items={tickets.filter(t => t.status === 'In Progress')} />
         <Column status="Resolved" items={tickets.filter(t => t.status === 'Resolved')} />
      </div>

      {/* TICKET DETAIL MODAL */}
      {selectedTicket && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90%]">
                  <div className="p-6 border-b border-white/10 flex justify-between items-start">
                      <div>
                          <h3 className="text-xl font-bold text-white flex items-center gap-3">
                              Ticket #{selectedTicket.id}
                              <span className={`text-xs px-2 py-0.5 rounded border uppercase tracking-wider ${getPriorityColor(selectedTicket.priority)}`}>{selectedTicket.priority}</span>
                          </h3>
                          <p className="text-slate-400 text-sm mt-1">Created at {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                      </div>
                      <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-white p-1"><X size={20}/></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs text-slate-500 uppercase font-semibold block mb-1">Room / Area</label>
                              <p className="text-white font-medium">{selectedTicket.roomId}</p>
                          </div>
                          <div>
                              <label className="text-xs text-slate-500 uppercase font-semibold block mb-1">Category</label>
                              <p className="text-white font-medium">{selectedTicket.category}</p>
                          </div>
                          <div>
                              <label className="text-xs text-slate-500 uppercase font-semibold block mb-1">Guest Name</label>
                              <p className="text-white font-medium">{selectedTicket.guestName}</p>
                          </div>
                          <div>
                              <label className="text-xs text-slate-500 uppercase font-semibold block mb-1">Status</label>
                              <select 
                                  value={selectedTicket.status}
                                  onChange={(e) => handleUpdateTicket({...selectedTicket, status: e.target.value as TicketStatus})}
                                  className="bg-slate-800 border border-slate-700 text-white text-sm rounded px-2 py-1 outline-none focus:border-blue-500 w-full"
                              >
                                  <option value="New">New</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Resolved">Resolved</option>
                              </select>
                          </div>
                      </div>

                      <div>
                          <label className="text-xs text-slate-500 uppercase font-semibold block mb-2">Description</label>
                          <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5 text-slate-200 text-sm leading-relaxed">
                              {selectedTicket.description}
                          </div>
                      </div>

                      <div>
                          <label className="text-xs text-slate-500 uppercase font-semibold block mb-2">Assigned Staff</label>
                          <select 
                              value={selectedTicket.assignedTo || ''}
                              onChange={(e) => handleUpdateTicket({...selectedTicket, assignedTo: e.target.value})}
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                          >
                              <option value="">-- Unassigned --</option>
                              {staffList.filter(s => s.isOnDuty).map(staff => (
                                  <option key={staff.id} value={staff.id}>{staff.name} ({staff.role})</option>
                              ))}
                          </select>
                      </div>
                  </div>

                  <div className="p-6 border-t border-white/10 bg-slate-900/50 flex justify-between items-center rounded-b-2xl">
                      <button 
                          onClick={() => handleDelete(selectedTicket.id)}
                          className="text-rose-400 hover:text-rose-300 text-sm flex items-center gap-2 px-3 py-2 rounded hover:bg-rose-400/10 transition"
                      >
                          <Trash2 size={16}/> Delete Ticket
                      </button>
                      <button 
                          onClick={() => setSelectedTicket(null)}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-blue-900/20"
                      >
                          Done
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* CREATE TICKET MODAL */}
      {isCreateModalOpen && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-6">Create New Ticket</h3>
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs text-slate-400 block mb-1">Room / Area</label>
                              <input 
                                  type="text" 
                                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                                  value={newTicketData.roomId || ''}
                                  onChange={e => setNewTicketData({...newTicketData, roomId: e.target.value})}
                                  placeholder="e.g. 304"
                              />
                          </div>
                          <div>
                              <label className="text-xs text-slate-400 block mb-1">Priority</label>
                              <select 
                                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white outline-none"
                                  value={newTicketData.priority}
                                  onChange={e => setNewTicketData({...newTicketData, priority: e.target.value as any})}
                              >
                                  <option value="Low">Low</option>
                                  <option value="Medium">Medium</option>
                                  <option value="High">High</option>
                                  <option value="Critical">Critical</option>
                              </select>
                          </div>
                      </div>
                      <div>
                          <label className="text-xs text-slate-400 block mb-1">Category</label>
                          <select 
                              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white outline-none"
                              value={newTicketData.category}
                              onChange={e => setNewTicketData({...newTicketData, category: e.target.value as any})}
                          >
                              {['Housekeeping', 'Maintenance', 'F&B', 'Front Desk', 'Concierge'].map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="text-xs text-slate-400 block mb-1">Description</label>
                          <textarea 
                              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500 h-24 resize-none"
                              value={newTicketData.description || ''}
                              onChange={e => setNewTicketData({...newTicketData, description: e.target.value})}
                              placeholder="Describe the issue..."
                          />
                      </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                      <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white transition">Cancel</button>
                      <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">Create Ticket</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Tickets;