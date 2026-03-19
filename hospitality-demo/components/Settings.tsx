
import React, { useState, useRef } from 'react';
import { Save, Link, Star, Copy, Check, Building2, Bell, MessageSquare, ToggleLeft, ToggleRight, Upload, FileText, Trash2, Phone, Plus, Tag, Palette, Lock, UserPlus, Shield, ExternalLink, HelpCircle, Edit2, X } from 'lucide-react';
import { ReviewConfig, UserRole, DocumentFile, AffiliateContact, BrandingConfig, SystemAccount, View, ViewLabels } from '../types';

interface SettingsProps {
    role: UserRole;
    config: ReviewConfig;
    onUpdateConfig: (config: ReviewConfig) => void;
    documents: DocumentFile[];
    onUpdateDocuments: (docs: DocumentFile[]) => void;
    affiliates: AffiliateContact[];
    onUpdateAffiliates: (affiliates: AffiliateContact[]) => void;
    branding: BrandingConfig;
    onUpdateBranding: (branding: BrandingConfig) => void;
    accounts: SystemAccount[];
    onUpdateAccounts: (accounts: SystemAccount[]) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
    role, config, onUpdateConfig, 
    documents, onUpdateDocuments,
    affiliates, onUpdateAffiliates,
    branding, onUpdateBranding,
    accounts, onUpdateAccounts
}) => {
    const isReadOnly = role === 'staff';

    const [generatedLink, setGeneratedLink] = useState('');
    const [copied, setCopied] = useState(false);
    
    // File Upload State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [uploadDesc, setUploadDesc] = useState('');

    // Affiliate State
    const [newContact, setNewContact] = useState<Partial<AffiliateContact>>({ category: 'Transport' });

    // Credential Management State
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPhone, setNewUserPhone] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<'admin' | 'staff'>('staff');
    const [selectedPermissions, setSelectedPermissions] = useState<View[]>([View.DASHBOARD, View.INBOX, View.TICKETS]);
    
    // Edit Mode State
    const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

    const updateLink = (newConfig: ReviewConfig) => {
        if (isReadOnly) return;
        onUpdateConfig(newConfig);
        const baseUrl = newConfig.platform === 'google' 
            ? 'https://search.google.com/local/writereview?placeid=ChIJ...' 
            : 'https://www.tripadvisor.in/UserReviewEdit-g...';
        
        const encodedText = encodeURIComponent(newConfig.prefilledText);
        setGeneratedLink(`${baseUrl}&rating=${newConfig.minRating}&text=${encodedText}&source=wa_bot`);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // --- File Handling ---
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const newDoc: DocumentFile = {
                id: Date.now().toString(),
                name: file.name,
                type: file.type,
                size: (file.size / 1024).toFixed(2) + ' KB',
                description: uploadDesc || 'No description provided.',
                uploadDate: new Date()
            };
            onUpdateDocuments([...documents, newDoc]);
            setUploadDesc('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdateBranding({ ...branding, logoUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const deleteDoc = (id: string) => {
        if(confirm("Remove this document?")) onUpdateDocuments(documents.filter(d => d.id !== id));
    };

    // --- Affiliate Handling ---
    const addContact = () => {
        if(!newContact.label || !newContact.number) return;
        const contact: AffiliateContact = {
            id: Date.now().toString(),
            label: newContact.label,
            number: newContact.number,
            category: newContact.category as any
        };
        onUpdateAffiliates([...affiliates, contact]);
        setNewContact({ category: 'Transport', label: '', number: '' });
    };

    const deleteContact = (id: string) => {
        onUpdateAffiliates(affiliates.filter(a => a.id !== id));
    };
    
    // --- Permission Handling ---
    const togglePermission = (view: View) => {
        const newPerms = selectedPermissions.includes(view)
            ? selectedPermissions.filter(v => v !== view)
            : [...selectedPermissions, view];
        
        setSelectedPermissions(newPerms);

        // Auto-switch role if all permissions selected
        if (Object.values(View).every(v => newPerms.includes(v))) {
            setNewUserRole('admin');
        } else if (newUserRole === 'admin') {
             setNewUserRole('staff');
        }
    };

    // --- Credential Handling ---
    const handleAddCredential = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingAccountId) {
            // Update existing
            const updatedAccounts = accounts.map(acc => {
                if (acc.id === editingAccountId) {
                    return {
                        ...acc,
                        email: newUserEmail,
                        phone: newUserPhone,
                        role: newUserRole,
                        permissions: selectedPermissions
                    };
                }
                return acc;
            });
            onUpdateAccounts(updatedAccounts);
            setEditingAccountId(null);
        } else {
            // Create new
            const newAccount: SystemAccount = {
                id: `U-${Date.now()}`,
                email: newUserEmail,
                phone: newUserPhone,
                role: newUserRole,
                permissions: selectedPermissions
            };
            onUpdateAccounts([...accounts, newAccount]);
        }

        // Reset
        setNewUserEmail('');
        setNewUserPhone('');
        setNewUserPassword('');
        setNewUserRole('staff');
        setSelectedPermissions([View.DASHBOARD, View.INBOX, View.TICKETS]);
    };

    const handleEditAccount = (acc: SystemAccount) => {
        setEditingAccountId(acc.id);
        setNewUserEmail(acc.email);
        setNewUserPhone(acc.phone || '');
        setNewUserRole(acc.role);
        setSelectedPermissions(acc.permissions);
    };
    
    const cancelEdit = () => {
        setEditingAccountId(null);
        setNewUserEmail('');
        setNewUserPhone('');
        setNewUserPassword('');
        setNewUserRole('staff');
        setSelectedPermissions([View.DASHBOARD, View.INBOX, View.TICKETS]);
    }

    const handleDeleteAccount = (id: string) => {
        if(confirm('Revoke access for this user?')) {
            onUpdateAccounts(accounts.filter(a => a.id !== id));
            if (editingAccountId === id) cancelEdit();
        }
    }

    return (
        <div className="p-8 w-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">System Settings</h1>
                    {isReadOnly && <span className="text-xs text-amber-400 font-medium bg-amber-400/10 px-2 py-1 rounded mt-2 inline-block">Read Only View (Staff Access)</span>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* --- LEFT COLUMN --- */}
                <div className="space-y-8">
                     {/* Branding Card */}
                     <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Palette size={18} className="text-purple-400"/> Branding & Customization
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                    {branding.logoUrl ? (
                                        <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-cover"/>
                                    ) : (
                                        <span className="text-2xl font-bold text-slate-500">{branding.appName.charAt(0)}</span>
                                    )}
                                </div>
                                <div>
                                    <button 
                                        onClick={() => logoInputRef.current?.click()}
                                        disabled={isReadOnly}
                                        className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs border border-slate-600 transition mb-2"
                                    >
                                        Upload Logo
                                    </button>
                                    <input type="file" ref={logoInputRef} className="hidden" onChange={handleLogoUpload} accept="image/*"/>
                                    <p className="text-[10px] text-slate-500">Rec: 512x512px PNG</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Application Name (Header)</label>
                                <input 
                                    type="text" 
                                    value={branding.appName}
                                    onChange={(e) => onUpdateBranding({...branding, appName: e.target.value})}
                                    disabled={isReadOnly}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                                />
                            </div>
                             <div>
                                <label className="text-xs text-slate-400 block mb-1">Hotel Name (Chat Greeting)</label>
                                <input 
                                    type="text" 
                                    value={branding.hotelName}
                                    onChange={(e) => onUpdateBranding({...branding, hotelName: e.target.value})}
                                    disabled={isReadOnly}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact & Support Card */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-indigo-950/30">
                        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                            <HelpCircle size={18} className="text-indigo-400"/> Enterprise Support
                        </h3>
                        <p className="text-sm text-slate-400 mb-6">Need custom integrations, SLA guarantees, or on-premise deployment?</p>
                        <a 
                            href="https://guaq.framer.ai/contact-us" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full bg-white text-slate-900 hover:bg-slate-200 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
                        >
                            Contact GuaqAI Team <ExternalLink size={16}/>
                        </a>
                        <p className="text-[10px] text-slate-500 text-center mt-3">Priority support for Ultimate tier.</p>
                    </div>

                    {/* Security & Access Card (Moved to Bottom Left) */}
                    {!isReadOnly && (
                        <div className="glass-panel p-6 rounded-2xl border border-white/5">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Shield size={18} className="text-rose-400"/> Security & Team Access
                            </h3>
                            <p className="text-xs text-slate-400 mb-4">
                                {editingAccountId ? `Editing user: ${newUserEmail}` : 'Create login credentials and set visibility permissions.'}
                            </p>
                            
                            <form onSubmit={handleAddCredential} className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <div className="grid grid-cols-2 gap-3">
                                    <input 
                                        type="email" 
                                        placeholder="Staff Email" 
                                        value={newUserEmail} 
                                        onChange={e => setNewUserEmail(e.target.value)}
                                        className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-white outline-none" 
                                        required
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Phone" 
                                        value={newUserPhone} 
                                        onChange={e => setNewUserPhone(e.target.value)}
                                        className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-white outline-none" 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <Lock size={12} className="absolute left-3 top-2.5 text-slate-500"/>
                                        <input 
                                            type="password" 
                                            placeholder={editingAccountId ? "Change Password (Optional)" : "Password"} 
                                            value={newUserPassword} 
                                            onChange={e => setNewUserPassword(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded pl-8 pr-3 py-2 text-xs text-white outline-none" 
                                            required={!editingAccountId}
                                        />
                                    </div>
                                    <select 
                                        value={newUserRole} 
                                        disabled={true} 
                                        className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-white outline-none opacity-70 cursor-not-allowed"
                                    >
                                        <option value="staff">Staff (Limited)</option>
                                        <option value="admin">Admin (Full)</option>
                                    </select>
                                </div>

                                {/* Permissions Toggles */}
                                <div className="border-t border-white/5 pt-3 mt-2">
                                    <p className="text-[10px] text-slate-500 uppercase font-semibold mb-2">View Permissions</p>
                                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                                        {Object.values(View).map((view) => (
                                            <div 
                                                key={view} 
                                                onClick={() => togglePermission(view)}
                                                className={`flex items-center justify-between p-2 rounded cursor-pointer border transition ${
                                                    selectedPermissions.includes(view) 
                                                    ? 'bg-blue-900/20 border-blue-500/30' 
                                                    : 'bg-slate-800/50 border-transparent opacity-50 hover:opacity-100'
                                                }`}
                                            >
                                                <span className="text-[10px] text-slate-300">{ViewLabels[view] || view}</span>
                                                {selectedPermissions.includes(view) ? <ToggleRight size={14} className="text-blue-400"/> : <ToggleLeft size={14} className="text-slate-500"/>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {editingAccountId && (
                                        <button type="button" onClick={cancelEdit} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-xs font-medium flex items-center justify-center gap-2 transition">
                                            <X size={14}/> Cancel
                                        </button>
                                    )}
                                    <button type="submit" className={`flex-1 ${editingAccountId ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-700 hover:bg-slate-600'} text-white py-2 rounded text-xs font-medium flex items-center justify-center gap-2 transition`}>
                                        {editingAccountId ? <Save size={14} /> : <UserPlus size={14} />} 
                                        {editingAccountId ? 'Save Changes' : 'Create Account'}
                                    </button>
                                </div>
                            </form>
                            
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <p className="text-xs text-slate-500 font-medium mb-2 uppercase">Active Accounts</p>
                                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                                    {accounts.map(acc => (
                                        <div key={acc.id} className="flex justify-between items-center p-2 rounded hover:bg-white/5 group">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-slate-300">{acc.email} {acc.id === editingAccountId && '(Editing)'}</span>
                                                <span className={`text-[10px] ${acc.role === 'admin' ? 'text-emerald-400' : 'text-blue-400'}`}>{acc.role} • {acc.permissions.length} views</span>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                <button onClick={() => handleEditAccount(acc)} className="p-1 text-slate-400 hover:text-white"><Edit2 size={12}/></button>
                                                <button onClick={() => handleDeleteAccount(acc.id)} className="p-1 text-slate-400 hover:text-rose-400"><Trash2 size={12}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div className="space-y-8">
                     {/* Deep Link Config (Moved to Top Right) */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <Link size={20} className="text-blue-400"/> Review Deep Links
                        </h3>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs text-slate-400 mb-3 uppercase tracking-wider font-semibold">1. Select Platform</label>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => updateLink({...config, platform: 'google'})}
                                        disabled={isReadOnly}
                                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${config.platform === 'google' ? 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-500' : 'bg-slate-900 border border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                                    >
                                        Google Maps
                                    </button>
                                    <button 
                                        onClick={() => updateLink({...config, platform: 'tripadvisor'})}
                                        disabled={isReadOnly}
                                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${config.platform === 'tripadvisor' ? 'bg-emerald-900/30 text-emerald-400 shadow-sm ring-1 ring-emerald-500/50' : 'bg-slate-900 border border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                                    >
                                        TripAdvisor
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                     <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">2. Prefilled Feedback</label>
                                     <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">Keyword Rich</span>
                                </div>
                                <textarea 
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition resize-none"
                                    rows={3}
                                    value={config.prefilledText}
                                    onChange={(e) => !isReadOnly && updateLink({...config, prefilledText: e.target.value})}
                                    disabled={isReadOnly}
                                />
                            </div>

                            <div className="pt-2">
                                <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">3. Generated Link</label>
                                <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-700">
                                    <div className="flex-1 px-3 py-2 overflow-hidden">
                                        <p className="text-xs font-mono text-blue-400 truncate w-full">
                                            {generatedLink || 'Select a platform above to generate...'}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={handleCopy}
                                        disabled={!generatedLink}
                                        className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg transition shrink-0"
                                        title="Copy to Clipboard"
                                    >
                                        {copied ? <Check size={18} className="text-emerald-400"/> : <Copy size={18}/>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                     {/* Review Automation */}
                     <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <MessageSquare size={18} className="text-emerald-400"/> Review Automation
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                <div>
                                    <p className="text-sm text-slate-200 font-medium">Auto-Reply to Reviews</p>
                                    <p className="text-xs text-slate-500">Bot generates draft replies for new reviews.</p>
                                </div>
                                <button 
                                    onClick={() => !isReadOnly && onUpdateConfig({...config, autoReplyEnabled: !config.autoReplyEnabled})}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${config.autoReplyEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
                                >
                                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${config.autoReplyEnabled ? 'left-6' : 'left-1'}`}></div>
                                </button>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-2">Email Signature for Replies</label>
                                <input 
                                    type="text" 
                                    value={config.signature}
                                    onChange={(e) => !isReadOnly && onUpdateConfig({...config, signature: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                                    disabled={isReadOnly}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Knowledge Base */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <FileText size={18} className="text-blue-400"/> Knowledge Base (AI Context)
                        </h3>
                        <p className="text-xs text-slate-400 mb-2">Upload PDFs, Images, or Menus. The Bot Simulator will use these to answer guest queries.</p>
                        
                        <div className="flex gap-2 mb-4">
                            <input 
                                type="text" 
                                placeholder="Description (e.g. Pool Rules, Spa Menu)" 
                                value={uploadDesc}
                                onChange={(e) => setUploadDesc(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isReadOnly}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition"
                            >
                                <Upload size={14}/> Upload
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt,.jpg,.png"/>
                        </div>

                        <div className="space-y-2">
                            {documents.length === 0 ? (
                                <div className="text-center py-3 text-slate-500 text-xs border-2 border-dashed border-slate-800 rounded-xl">
                                    No documents uploaded.
                                </div>
                            ) : (
                                <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-2">
                                    {documents.map(doc => (
                                        <div key={doc.id} className="flex justify-between items-center p-2 bg-slate-800/50 rounded border border-white/5">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-1.5 bg-slate-700 rounded text-slate-300"><FileText size={12}/></div>
                                                <div className="min-w-0">
                                                    <p className="text-xs text-white truncate">{doc.name}</p>
                                                    <p className="text-[10px] text-slate-500 truncate">{doc.description}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-[10px] text-slate-500">{doc.size}</span>
                                                {!isReadOnly && (
                                                    <button onClick={() => deleteDoc(doc.id)} className="text-slate-500 hover:text-rose-400 p-1"><Trash2 size={12}/></button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Affiliate Contacts */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Phone size={18} className="text-emerald-400"/> Affiliate Contacts
                        </h3>
                        
                        <div className="flex flex-col sm:flex-row gap-2 mb-4">
                            <select 
                                value={newContact.category}
                                onChange={(e) => setNewContact({...newContact, category: e.target.value as any})}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white outline-none w-full sm:w-auto"
                            >
                                <option value="Transport">Transport</option>
                                <option value="Medical">Medical</option>
                                <option value="Services">Services</option>
                                <option value="Other">Other</option>
                            </select>
                            <input 
                                type="text" 
                                placeholder="Label" 
                                value={newContact.label}
                                onChange={(e) => setNewContact({...newContact, label: e.target.value})}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
                            />
                            <input 
                                type="text" 
                                placeholder="Number" 
                                value={newContact.number}
                                onChange={(e) => setNewContact({...newContact, number: e.target.value})}
                                className="w-full sm:w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
                            />
                            <button 
                                onClick={addContact}
                                disabled={isReadOnly}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg transition flex items-center justify-center"
                            >
                                <Plus size={16}/>
                            </button>
                        </div>

                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                            {affiliates.map(contact => (
                                <div key={contact.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl border border-white/5">
                                    <div>
                                        <p className="text-xs font-semibold text-white">{contact.label}</p>
                                        <p className="text-[10px] text-slate-400 flex items-center gap-2">
                                            <span className="bg-slate-700 px-1.5 rounded text-slate-300">{contact.category}</span> {contact.number}
                                        </p>
                                    </div>
                                    {!isReadOnly && (
                                        <button onClick={() => deleteContact(contact.id)} className="text-slate-500 hover:text-rose-400"><Trash2 size={14}/></button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;
