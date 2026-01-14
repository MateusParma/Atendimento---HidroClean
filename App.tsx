
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, Plus, Sparkles, Droplets, 
  MessageSquare, ShieldCheck, Calendar as CalendarIcon, 
  MapPin, Phone, TrendingUp, 
  Clock, List, LayoutGrid, ChevronRight,
  User, X, StickyNote, RefreshCw, Mail, Briefcase,
  ChevronDown, Calendar as CalendarBrand, ChevronLeft,
  FileText, Upload, Download, Trash2, Send, Copy, Check, Filter,
  CheckCircle2, MessageCircle, BarChart3, SortAsc
} from 'lucide-react';
import { Category, SavedResponse, Appointment, ApptStage, Attachment } from './types';
import { supabase } from './services/supabaseClient';
import ResponseCard from './components/ResponseCard';
import AIModal from './components/AIModal';
import ResponseFormModal from './components/ResponseFormModal';
import AppointmentModal from './components/AppointmentModal';
import FullCalendarView from './components/FullCalendarView';

const STAGES: ApptStage[] = [
  'Leads', 'Visita Técnica', 'Orçamentos a Fazer', 'Relatórios a Fazer',
  'Aguardando Resposta', 'Serviços a Fazer', 'Em Execução', 'Retrabalho',
  'A Receber', 'Concluído', 'Recusados'
];

interface ApptItemProps {
  appt: Appointment;
  showStage?: boolean;
  onClick: () => void;
  onWhatsApp: (e: any, phone?: string) => void;
  onSendTech: (e: any, appt: Appointment) => void;
  onDelete: (e: any, id: string) => void;
  confirmingDeleteId: string | null;
  // Added key to interface to match usage in map
  key?: string;
}

const ApptItem = ({ 
  appt, 
  showStage = false, 
  onClick, 
  onWhatsApp, 
  onSendTech, 
  onDelete, 
  confirmingDeleteId 
}: ApptItemProps) => {
  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "HOJE";
    return date.toLocaleDateString('pt-PT', { weekday: 'short' }).toUpperCase();
  };

  return (
    <div 
      className={`rounded-xl p-5 shadow-sm border transition-all flex items-center group cursor-pointer gap-6 ${appt.tech_sent_at ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200/60 hover:border-blue-400'}`} 
      onClick={onClick}
    >
      <div className="text-center w-24 shrink-0 flex flex-col items-center">
        <div className={`border-2 rounded-xl flex flex-col items-center justify-center py-2 transition-all shadow-sm w-full ${appt.tech_sent_at ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-blue-600 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
          <span className="text-2xl font-black leading-tight">{new Date(appt.scheduled_at).getDate()}</span>
          <span className="text-[10px] font-black uppercase tracking-wider">{getDayLabel(appt.scheduled_at)}</span>
        </div>
        <div className={`mt-2 w-full py-1.5 rounded-lg text-xs font-black flex items-center justify-center border shadow-sm ${appt.tech_sent_at ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}><Clock size={12} className="mr-1.5" />{appt.start_time}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <span className={`${appt.tech_sent_at ? 'text-emerald-600' : 'text-blue-600'} text-[10px] font-black uppercase tracking-widest block`}>{appt.service_type}</span>
          {showStage && (
            <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tight border border-slate-200/50">
              {appt.stage}
            </span>
          )}
        </div>
        <h4 className="text-xl font-black text-slate-900 tracking-tight truncate leading-tight mb-1">{appt.customer_name}</h4>
        <p className="text-xs text-slate-500 font-bold flex items-center truncate"><MapPin size={13} className={`mr-1.5 ${appt.tech_sent_at ? 'text-emerald-500' : 'text-blue-500'}`} />{appt.description}</p>
      </div>
      
      <div className="flex items-center space-x-6 shrink-0">
         <div className="flex space-x-2">
            <button onClick={(e) => onWhatsApp(e, appt.phone)} className="p-4 rounded-xl transition-all shadow-md active:scale-95 flex items-center bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white" title="Abrir WhatsApp"><MessageCircle size={20} /></button>
            <button onClick={(e) => onSendTech(e, appt)} className={`p-4 rounded-xl transition-all shadow-md active:scale-95 flex items-center space-x-2 ${appt.tech_sent_at ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`} title="Enviar p/ Técnico">{appt.tech_sent_at ? <Check size={20} /> : <Send size={20} />}</button>
            <button onClick={(e) => onDelete(e, appt.id)} className={`p-4 rounded-xl transition-all shadow-md active:scale-95 flex items-center space-x-2 ${confirmingDeleteId === appt.id ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400 hover:text-red-500'}`} title={confirmingDeleteId === appt.id ? "Confirmar Eliminação" : "Eliminar Lead"}>{confirmingDeleteId === appt.id ? <Check size={20} /> : <Trash2 size={20} />}{confirmingDeleteId === appt.id && <span className="text-[10px] font-black uppercase tracking-tighter ml-2">Confirmar?</span>}</button>
         </div>
         <div className="text-right min-w-[80px]">
           <div className="text-xl font-black text-slate-900 leading-none">{appt.expected_revenue?.toLocaleString('pt-PT')}€</div>
           <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{appt.tech_sent_at ? 'ENVIADO' : 'NÃO ENVIADO'}</div>
         </div>
         <ChevronRight size={22} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<'library' | 'crm' | 'calendar'>('crm');
  const [sortMode, setSortMode] = useState<'stage' | 'time'>('stage');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'month'>('all');
  const [responses, setResponses] = useState<SavedResponse[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [preSelectedDate, setPreSelectedDate] = useState<string | undefined>(undefined);
  const [editingResponse, setEditingResponse] = useState<SavedResponse | null>(null);
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [techMessage, setTechMessage] = useState('');
  const [copiedTech, setCopiedTech] = useState(false);
  const [activeTechId, setActiveTechId] = useState<string | null>(null);
  const [confirmingApptDeleteId, setConfirmingApptDeleteId] = useState<string | null>(null);

  useEffect(() => { loadLibrary(); loadCRM(); }, []);

  const loadLibrary = async () => {
    const { data } = await supabase.from('responses').select('*').order('last_updated', { ascending: false });
    if (data) setResponses(data.map((item: any) => ({ ...item, lastUpdated: Number(item.last_updated) })));
  };

  const loadCRM = async () => {
    const { data } = await supabase.from('appointments').select('*').order('scheduled_at', { ascending: true });
    if (data) setAppointments(data as Appointment[]);
  };

  const handleWhatsApp = (phone?: string) => {
    if (!phone) return alert("Telefone não disponível.");
    const clean = phone.replace(/\D/g, '');
    const final = clean.startsWith('351') ? clean : `351${clean}`;
    window.open(`https://wa.me/${final}`, '_blank');
  };

  const handleSendTechAction = (appt: Appointment) => {
    const msg = `⚒️ *HIDRO CLEAN - ORDEM DE SERVIÇO* ⚒️\n\n` +
                `👤 *CLIENTE:* ${appt.customer_name || 'N/A'}\n` +
                `📍 *MORADA:* ${appt.description || 'N/A'}\n` +
                `📅 *DATA:* ${new Date(appt.scheduled_at).toLocaleDateString('pt-PT')}\n` +
                `⏰ *HORÁRIO:* ${appt.start_time || '--:--'}\n` +
                `🔧 *SERVIÇO:* ${appt.service_type}\n\n` +
                `📝 *NOTAS:* ${appt.notes || 'Sem notas.'}`;
    setTechMessage(msg);
    setActiveTechId(appt.id);
    setIsTechModalOpen(true);
  };

  const confirmCopyTech = async () => {
    if (!activeTechId) return;
    navigator.clipboard.writeText(techMessage);
    setCopiedTech(true);
    const now = new Date().toISOString();
    await supabase.from('appointments').update({ tech_sent_at: now }).eq('id', activeTechId);
    setAppointments(prev => prev.map(a => a.id === activeTechId ? { ...a, tech_sent_at: now } : a));
    setTimeout(() => { setCopiedTech(false); setIsTechModalOpen(false); }, 1000);
  };

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    return appointments.filter(a => {
      const matchSearch = (a.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (a.service_type || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
      
      const apptDate = new Date(a.scheduled_at);
      if (timeFilter === 'today') return apptDate.toDateString() === now.toDateString();
      if (timeFilter === 'month') return apptDate.getMonth() === now.getMonth() && apptDate.getFullYear() === now.getFullYear();
      
      return true;
    });
  }, [appointments, searchTerm, timeFilter]);

  const groupedByStage = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    STAGES.forEach(stage => { 
      groups[stage] = filteredAppointments
        .filter(a => a.stage === stage)
        .sort((a, b) => sortMode === 'time' ? a.scheduled_at.localeCompare(b.scheduled_at) : 0);
    });
    return groups;
  }, [filteredAppointments, sortMode]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F3F4F7]">
      <aside className="w-full md:w-72 bg-white border-b md:border-r border-slate-200 p-4 md:p-6 flex flex-row md:flex-col h-auto md:h-screen sticky top-0 z-50">
        <div className="flex items-center space-x-3 mb-0 md:mb-10 mr-6 md:mr-0">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><Droplets className="text-white" size={20} /></div>
          <h1 className="font-black text-slate-800 text-lg">Hidro Clean</h1>
        </div>
        <nav className="flex md:flex-col items-center md:items-stretch space-x-2 md:space-x-0 md:space-y-1.5 flex-1">
          <button onClick={() => setView('crm')} className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all w-full ${view === 'crm' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <TrendingUp size={20} /><span className="text-sm font-black">Pipeline CRM</span>
          </button>
          <button onClick={() => setView('calendar')} className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all w-full ${view === 'calendar' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <CalendarBrand size={20} /><span className="text-sm font-black">Agenda Global</span>
          </button>
          <button onClick={() => setView('library')} className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all w-full ${view === 'library' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <MessageSquare size={20} /><span className="text-sm font-black">Biblioteca</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="px-8 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input placeholder="Filtrar por nome ou serviço..." className="w-full pl-11 pr-4 py-2 bg-slate-100 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-blue-400" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex space-x-3">
             <button onClick={() => setIsAIModalOpen(true)} className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg hover:scale-105 transition-transform"><Sparkles size={18} className="text-blue-400" /></button>
             <button onClick={() => view === 'library' ? setIsFormModalOpen(true) : setIsApptModalOpen(true)} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-xs shadow-xl uppercase tracking-widest hover:bg-blue-700 transition-colors">Novo Registro</button>
          </div>
        </header>

        {/* Sub-Header de Filtros */}
        <div className="px-8 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
           <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Visualizar:</span>
              {(['all', 'today', 'month'] as const).map(f => (
                <button 
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${timeFilter === f ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {f === 'all' ? 'Tudo' : f === 'today' ? 'Hoje' : 'Este Mês'}
                </button>
              ))}
           </div>
           
           {view === 'crm' && (
             <div className="flex items-center space-x-2 border-l pl-4 border-slate-200">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Ordenar:</span>
                <button onClick={() => setSortMode('stage')} className={`p-1.5 rounded-lg transition-all ${sortMode === 'stage' ? 'bg-blue-100 text-blue-600' : 'text-slate-400'}`} title="Por Etapa"><LayoutGrid size={16}/></button>
                <button onClick={() => setSortMode('time')} className={`p-1.5 rounded-lg transition-all ${sortMode === 'time' ? 'bg-blue-100 text-blue-600' : 'text-slate-400'}`} title="Cronológico"><Clock size={16}/></button>
             </div>
           )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC] no-scrollbar">
          {view === 'calendar' ? (
            <FullCalendarView 
              appointments={appointments} 
              onEditAppt={setSelectedAppt} 
              onNewAppt={(d) => { setPreSelectedDate(d); setIsApptModalOpen(true); }}
              onSendTech={handleSendTechAction}
            />
          ) : view === 'library' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {responses.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase())).map(res => (
                <ResponseCard 
                  key={res.id} 
                  response={res} 
                  onEdit={r => { setEditingResponse(r); setIsFormModalOpen(true); }} 
                  onDelete={loadLibrary}
                  onDragStart={()=>{}} onDragOver={()=>{}} onDragEnd={()=>{}}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-12 pb-20">
              {STAGES.map(stage => groupedByStage[stage]?.length > 0 && (
                <div key={stage} className="animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-black text-slate-800 uppercase flex items-center tracking-widest">
                      <div className="w-1.5 h-6 bg-blue-600 rounded-full mr-3 shadow-sm shadow-blue-200"></div>
                      {stage}
                    </h3>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-500 rounded-md text-[10px] font-black shadow-sm">
                      {groupedByStage[stage].length} {groupedByStage[stage].length === 1 ? 'REGISTO' : 'REGISTOS'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {groupedByStage[stage].map(appt => (
                      <ApptItem 
                        key={appt.id} 
                        appt={appt} 
                        onClick={() => setSelectedAppt(appt)} 
                        onWhatsApp={(e) => { e.stopPropagation(); handleWhatsApp(appt.phone); }}
                        onSendTech={(e, a) => { e.stopPropagation(); handleSendTechAction(a); }}
                        onDelete={async (e, id) => { 
                          e.stopPropagation(); 
                          if(confirmingApptDeleteId === id) {
                            await supabase.from('appointments').delete().eq('id', id);
                            loadCRM();
                            setConfirmingApptDeleteId(null);
                          } else setConfirmingApptDeleteId(id);
                        }}
                        confirmingDeleteId={confirmingApptDeleteId}
                      />
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Added explicit check for Object.values cast to Appointment[][] to fix 'length' error */}
              {Object.values(groupedByStage).every((g: Appointment[]) => g.length === 0) && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                   <div className="bg-slate-100 p-6 rounded-full mb-4"><Filter size={40} className="opacity-20"/></div>
                   <p className="font-black text-xs uppercase tracking-widest">Nenhum resultado para estes filtros</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal Técnico */}
      {isTechModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border">
              <div className="p-6 border-b bg-emerald-50/30 flex justify-between items-center">
                 <h3 className="text-lg font-black text-slate-900">Enviar ao Técnico</h3>
                 <button onClick={() => setIsTechModalOpen(false)} className="hover:rotate-90 transition-transform"><X size={20}/></button>
              </div>
              <div className="p-6">
                <textarea className="w-full h-64 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono text-slate-700 leading-relaxed outline-none focus:border-emerald-500" value={techMessage} readOnly />
                <button onClick={confirmCopyTech} className="w-full mt-6 py-4 bg-emerald-600 text-white rounded-xl font-black text-xs shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all hover:bg-emerald-700">
                  {copiedTech ? <Check size={18} /> : <Copy size={18} />}
                  <span>{copiedTech ? 'Copiado para o ClipBoard!' : 'Copiar e Marcar como Enviado'}</span>
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Outros Modais */}
      {isAIModalOpen && <AIModal onClose={() => setIsAIModalOpen(false)} onSave={(t, c, cat) => { supabase.from('responses').insert({title: t, content: c, category: cat, last_updated: Date.now()}).then(loadLibrary); setIsAIModalOpen(false); }} />}
      {isFormModalOpen && <ResponseFormModal isOpen={isFormModalOpen} onClose={() => {setIsFormModalOpen(false); setEditingResponse(null);}} onSave={(d) => {
        if(editingResponse) supabase.from('responses').update({...d, last_updated: Date.now()}).eq('id', editingResponse.id).then(loadLibrary);
        else supabase.from('responses').insert({...d, last_updated: Date.now()}).then(loadLibrary);
        setIsFormModalOpen(false);
      }} initialData={editingResponse} />}
      {isApptModalOpen && <AppointmentModal onClose={() => setIsApptModalOpen(false)} onSave={loadCRM} preSelectedDate={preSelectedDate} />}
      
      {/* Visualização de Detalhe da Lead */}
      {selectedAppt && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-end">
           <div className="h-full w-full max-w-xl bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
              <div className="p-8 border-b flex justify-between items-center">
                 <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-black">HC</div>
                    <h2 className="text-xl font-black">Detalhes da Lead</h2>
                 </div>
                 <button onClick={() => setSelectedAppt(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={24}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                     <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-2">{selectedAppt.stage}</span>
                     <h3 className="text-2xl font-black text-slate-900 mb-4">{selectedAppt.customer_name}</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2 text-slate-500 font-bold text-sm"><Phone size={16}/> <span>{selectedAppt.phone || 'N/A'}</span></div>
                        <div className="flex items-center space-x-2 text-slate-500 font-bold text-sm"><Clock size={16}/> <span>{selectedAppt.start_time}h</span></div>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Morada do Serviço</h4>
                     <p className="bg-white border p-4 rounded-2xl text-slate-700 font-bold flex items-start"><MapPin size={18} className="mr-3 text-blue-500 shrink-0"/> {selectedAppt.description}</p>
                  </div>
                  <div className="space-y-4">
                     <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Notas Internas</h4>
                     <p className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl text-slate-700 font-medium italic min-h-[100px]">{selectedAppt.notes || 'Nenhuma nota adicionada.'}</p>
                  </div>
              </div>
              <div className="p-8 border-t bg-slate-50 flex space-x-4">
                 <button onClick={() => handleWhatsApp(selectedAppt.phone)} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center space-x-2"><MessageCircle size={18}/> <span>WhatsApp</span></button>
                 <button onClick={() => handleSendTechAction(selectedAppt)} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center space-x-2"><Send size={18}/> <span>Técnico</span></button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
