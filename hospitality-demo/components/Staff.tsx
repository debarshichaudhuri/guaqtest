import React, { useState } from 'react';
import { Users, Clock, Shield, Plus, MoreVertical, Calendar } from 'lucide-react';
import { StaffMember, ShiftType, StaffRole } from '../types';

/**
 * ==============================================================================
 * 🏗️ ARCHITECTURE NOTE: STAFF & AUTHENTICATION
 * ==============================================================================
 * 
 * 1. AUTHENTICATION & RBAC:
 *    - Next.js Middleware (`middleware.ts`) should protect routes like `/staff` and `/settings`
 *      to ensure only 'ADMIN' role users can access them.
 * 
 * 2. DATABASE RELATIONSHIPS:
 *    - Staff members are `User` records in the database.
 *    - Tickets assigned to staff are foreign key relations (`assignedToId`).
 *    - Deleting a staff member should be a "Soft Delete" (flag `isActive: false`) to preserve
 *      historical ticket data.
 * ==============================================================================
 */

interface StaffProps {
    staffList: StaffMember[];
    onStaffUpdate: (list: StaffMember[]) => void;
}

const Staff: React.FC<StaffProps> = ({ staffList, onStaffUpdate }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newStaff, setNewStaff] = useState<Partial<StaffMember>>({
        role: 'Front Desk',
        currentShift: 'Morning',
        isOnDuty: true
    });

    const handleAddStaff = () => {
        if (!newStaff.name || !newStaff.email) return;
        const staff: StaffMember = {
            id: `S-${Date.now()}`,
            name: newStaff.name,
            email: newStaff.email,
            phone: newStaff.phone || '',
            role: newStaff.role as StaffRole,
            currentShift: newStaff.currentShift as ShiftType,
            isOnDuty: true,
            avatarBg: `bg-${['blue','purple','emerald','orange'][Math.floor(Math.random()*4)]}-600`
        };
        onStaffUpdate([...staffList, staff]);
        setIsAddModalOpen(false);
        setNewStaff({ role: 'Front Desk', currentShift: 'Morning', isOnDuty: true });
    };

    const toggleStatus = (id: string) => {
        onStaffUpdate(staffList.map(s => s.id === id ? { ...s, isOnDuty: !s.isOnDuty } : s));
    };

    const changeShift = (id: string, shift: ShiftType) => {
        onStaffUpdate(staffList.map(s => s.id === id ? { ...s, currentShift: shift } : s));
    };

    const deleteStaff = (id: string) => {
        if(confirm('Are you sure?')) onStaffUpdate(staffList.filter(s => s.id !== id));
    };

    return (
        <div className="p-6 h-full flex flex-col overflow-hidden min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 shrink-0 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Users className="text-purple-400"/> Staff Management
                    </h1>
                    <p className="text-slate-400 mt-1">Manage roster, shifts, and access controls.</p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-blue-900/20 w-full sm:w-auto justify-center"
                >
                    <Plus size={16}/> Add Staff
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
                {/* Roster Overview */}
                <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
                    <div className="glass-panel rounded-2xl border border-white/5 flex flex-col h-full">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                            <h3 className="text-lg font-semibold text-white">Current Roster</h3>
                            <div className="hidden sm:flex gap-2">
                                {['Morning', 'Evening', 'Night'].map((shift) => (
                                    <span key={shift} className="px-3 py-1 rounded-full text-xs border border-white/10 bg-white/5 text-slate-300">
                                        {shift}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar flex-1">
                            {staffList.map(staff => (
                                <div key={staff.id} className="p-4 rounded-xl bg-slate-800/40 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-slate-800/60 transition">
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className={`w-10 h-10 shrink-0 rounded-full ${staff.avatarBg} flex items-center justify-center text-white font-bold`}>
                                            {staff.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-white font-medium truncate">{staff.name}</h4>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                                <span className="flex items-center gap-1"><Shield size={10}/> {staff.role}</span>
                                                <span className="hidden sm:inline">•</span>
                                                <span className="flex items-center gap-1"><Clock size={10}/> {staff.currentShift} Shift</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                                        <select 
                                            value={staff.currentShift}
                                            onChange={(e) => changeShift(staff.id, e.target.value as ShiftType)}
                                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 outline-none flex-1 md:flex-none"
                                        >
                                            <option value="Morning">Morning (6A-2P)</option>
                                            <option value="Evening">Evening (2P-10P)</option>
                                            <option value="Night">Night (10P-6A)</option>
                                        </select>
                                        
                                        <button 
                                            onClick={() => toggleStatus(staff.id)}
                                            className={`px-3 py-1.5 rounded text-xs font-medium transition whitespace-nowrap ${staff.isOnDuty ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-400'}`}
                                        >
                                            {staff.isOnDuty ? 'On Duty' : 'Off Duty'}
                                        </button>
                                        
                                        <button onClick={() => deleteStaff(staff.id)} className="text-slate-500 hover:text-rose-400 p-1 md:opacity-0 md:group-hover:opacity-100 transition">
                                            <MoreVertical size={16}/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Shift Summary / Widget */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 h-fit">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Calendar size={18} className="text-blue-400"/> Shift Coverage
                    </h3>
                    <div className="space-y-6">
                        {['Morning', 'Evening', 'Night'].map(shift => {
                            const count = staffList.filter(s => s.currentShift === shift && s.isOnDuty).length;
                            const total = staffList.filter(s => s.currentShift === shift).length;
                            const percentage = total > 0 ? (count / total) * 100 : 0;
                            
                            return (
                                <div key={shift}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-300">{shift} Shift</span>
                                        <span className={`${count < 2 ? 'text-rose-400' : 'text-emerald-400'}`}>{count} Active</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${count < 2 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    {count < 2 && <p className="text-xs text-rose-400 mt-1">⚠️ Low staffing detected</p>}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Add Staff Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Add Staff Member</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Full Name</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                                    value={newStaff.name || ''}
                                    onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Email</label>
                                <input 
                                    type="email" 
                                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                                    value={newStaff.email || ''}
                                    onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Role</label>
                                    <select 
                                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white outline-none"
                                        value={newStaff.role}
                                        onChange={e => setNewStaff({...newStaff, role: e.target.value as any})}
                                    >
                                        {['Front Desk', 'Housekeeping', 'Maintenance', 'Manager', 'Chef'].map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Shift</label>
                                    <select 
                                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white outline-none"
                                        value={newStaff.currentShift}
                                        onChange={e => setNewStaff({...newStaff, currentShift: e.target.value as any})}
                                    >
                                        <option value="Morning">Morning</option>
                                        <option value="Evening">Evening</option>
                                        <option value="Night">Night</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white transition">Cancel</button>
                            <button onClick={handleAddStaff} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">Add Member</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Staff;