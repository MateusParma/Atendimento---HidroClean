
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Droplets, Sparkles, TrendingUp, 
  MessageSquare, Calendar as CalendarBrand, 
  Clock, MapPin, ChevronRight, MessageCircle, 
  Send, Check, Trash2, X
} from 'lucide-react';
import { Appointment, SavedResponse, ApptStage } from './types';
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

const getDayLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  if (date.toDateString() === new Date().toDateString()) return "HOJE";
  return date.toLocaleDateString('pt-PT', { weekday: 'short' }).toUpperCase();
};

// Componente movido para fora do App para estabilidade
const ApptItem: React.FC<{ 
  appt: Appointment; 
  showStage?: boolean; 
  onClick: () => void;
  onWhatsApp: (e: React.MouseEvent, phone?: string) => void;
  onSendTech: (e: React.MouseEvent, appt: Appointment) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  confirmingDeleteId: string | null;
}> = ({ appt, showStage = false, onClick, onWhatsApp, onSendTech, onDelete, confirmingDeleteId }) => (
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
        {showStage && <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tight border border-slate-200/50">{appt.stage}</span>}
      </div>
      <h4 className="text-xl font-black text-slate-900 tracking-tight truncate leading-tight mb-1">{appt.customer_name}</h4>
      <p className="text-xs text-slate-500 font-bold flex items-center truncate"><MapPin size={13} className={`mr-1.5 ${appt.tech_sent_at ? 'text-emerald-500' : 'text-blue-500'}`} />{appt.description}</p>
    </div>
    <div className="flex items-center space-x-6 shrink-0">
       <div className="flex space-x-2">
          <button onClick={(e) => onWhatsApp(e, appt.phone)} className="p-4 rounded-xl transition-all shadow-md active:scale-95 flex items-center bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white" title="Abrir WhatsApp"><MessageCircle size={20} /></button>
          <button onClick={(e) => onSendTech(e, appt)} className={`p-4 rounded-xl transition-all shadow-md active:scale-95 flex items-center space-x-2 ${appt.tech_sent_at ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`} title="Enviar p/ Técnico">{appt.tech_sent_at ? <Check size={20} /> : <Send size={20} />}</button>
          <button onClick={(e) => onDelete(e, appt.id)} className={`p-4 rounded-xl transition-all shadow-md active:scale-95 flex items-center space-x-2 ${confirmingDeleteId === appt.id ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400 hover:text-red-500'}`} title={confirmingDeleteId === appt.id ? "Confirmar Eliminação" : "Eliminar Lead"}>{confirmingDeleteId === appt.id ? <Check size={20} /> : <Trash2 size={20} />}{confirmingDeleteId === appt.id && <span className="text-[10px] font-black uppercase tracking-tighter">Confirmar?</span>}</button>
       </div>
       <div className="text-right min-w-[80px]">
         <div className="text-xl font-black text-slate-900 leading-none">{appt.expected_revenue?.toLocaleString('pt-PT')}€</div>
         <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{appt.tech_sent_at ? 'ENVIADO' : 'NÃO ENVIADO'}</div>
       </div>
       <ChevronRight size={22} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
    </div>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<'library' | 'crm' | 'calendar'>('library');
  const [responses, setResponses] = useState<SavedResponse[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [preSelectedDate, setPreSelectedDate] = useState<string | undefined>(undefined);
  const [editingResponse, setEditingResponse] = useState<SavedResponse | null>(null);
  const [confirmingApptDeleteId, setConfirmingApptDeleteId] = useState<string | null>(null);

  useEffect(() => { loadLibrary(); loadCRM(); }, []);

  const loadLibrary = async () => {
    try {
      const { data } = await supabase.from('responses').select('*').order('last_updated', { ascending: false });
      if (data) setResponses(data.map((item: any) => ({ ...item, lastUpdated: Number(item.last_updated) })));
    } catch (e) { console.error("Erro ao carregar biblioteca:", e); }
  };

  const loadCRM = async () => {
    try {
      const { data } = await supabase.from('appointments').select('*').order('scheduled_at', { ascending: true });
      if (data) setAppointments(data as Appointment[]);
    } catch (e) { console.error("Erro ao carregar CRM:", e); }
  };

  const handleWhatsApp = (e: React.MouseEvent, phone?: string) => {
    e.stopPropagation();
    if (!phone) return alert("Telefone não disponível.");
    const clean = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${clean.startsWith('351') ? clean : '351'+clean}`, '_blank');
  };

  const handleDeleteAppt = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmingApptDeleteId === id) {
      await supabase.from('appointments').delete().eq('id', id);
      setAppointments(prev => prev.filter(a => a.id !== id));
      setConfirmingApptDeleteId(null);
    } else {
      setConfirmingApptDeleteId(id);
      setTimeout(() => setConfirmingApptDeleteId(null), 3000);
    }
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const matchSearch = (a.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [appointments, searchTerm]);

  const groupedByStage = useMemo(() => {
    const g: Record<string, Appointment[]> = {};
    STAGES.forEach(s => { g[s] = filteredAppointments.filter(a => a.stage === s); });
    return g;
  }, [filteredAppointments]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F3F4F7]">
      <aside className="w-full md:w-72 bg-white border-b md:border-r border-slate-200 p-4 md:p-6 flex flex-row md:flex-col h-auto md:h-screen sticky top-0 z-50">
        <div className="flex items-center space-x-3 mb-0 md:mb-10 mr-6 md:mr-0">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><Droplets className="text-white" size={20} /></div>
          <h1 className="font-black text-slate-800 text-lg">Hidro Clean</h1>
        </div>
        <nav className="flex md:flex-col items-center md:items-stretch space-x-2 md:space-x-0 md:space-y-1.5 flex-1">
          <button onClick={() => setView('crm')} className={`flex items-center space-x-3 px-4 py-3 rounded-xl w-full ${view === 'crm' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 transition-colors'}`}><TrendingUp size={20} /><span className="text-sm font-black">Pipeline</span></button>
          <button onClick={() => setView('calendar')} className={`flex items-center space-x-3 px-4 py-3 rounded-xl w-full ${view === 'calendar' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 transition-colors'}`}><CalendarBrand size={20} /><span className="text-sm font-black">Agenda</span></button>
          <button onClick={() => setView('library')} className={`flex items-center space-x-3 px-4 py-3 rounded-xl w-full ${view === 'library' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 transition-colors'}`}><MessageSquare size={20} /><span className="text-sm font-black">Respostas</span></button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="px-8 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input placeholder="Procurar..." className="w-full pl-11 pr-4 py-2 bg-slate-100 rounded-xl text-sm font-bold outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex space-x-3">
            <button onClick={() => setIsAIModalOpen(true)} className="p-2.5 bg-slate-900 text-white rounded-xl active:scale-95 transition-transform"><Sparkles size={18} className="text-blue-400" /></button>
            <button onClick={() => view === 'library' ? setIsFormModalOpen(true) : setIsApptModalOpen(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-xs active:scale-95 transition-transform">NOVO</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {view === 'calendar' ? (
            <FullCalendarView appointments={appointments} onEditAppt={setSelectedAppt} onNewAppt={(d) => { setPreSelectedDate(d); setIsApptModalOpen(true); }} onSendTech={() => {}} />
          ) : view === 'library' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {responses.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase())).map(res => (
                <ResponseCard key={res.id} response={res} onEdit={r => { setEditingResponse(r); setIsFormModalOpen(true); }} onDelete={loadLibrary} onDragStart={()=>{}} onDragOver={()=>{}} onDragEnd={()=>{}} />
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {STAGES.map(stage => groupedByStage[stage]?.length > 0 && (
                <div key={stage}>
                  <h3 className="text-xl font-black text-slate-900 uppercase border-l-4 border-blue-600 pl-4 mb-5">{stage}</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {groupedByStage[stage].map(appt => (
                      <ApptItem 
                        key={appt.id} 
                        appt={appt} 
                        onClick={() => setSelectedAppt(appt)} 
                        onWhatsApp={handleWhatsApp} 
                        onSendTech={() => {}}
                        onDelete={handleDeleteAppt}
                        confirmingDeleteId={confirmingApptDeleteId}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedAppt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 relative">
            <button onClick={() => setSelectedAppt(null)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={20} /></button>
            <h2 className="text-2xl font-black mb-6">{selectedAppt.customer_name}</h2>
            <div className="grid grid-cols-2 gap-6 text-left">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase">Morada</label>
                <div className="p-4 bg-slate-50 border rounded-xl font-bold">{selectedAppt.description}</div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Notas</label>
                <div className="p-4 bg-slate-50 border rounded-xl font-bold min-h-[100px]">{selectedAppt.notes || "Sem notas."}</div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase">Valor (€)</label>
                <div className="p-4 bg-slate-50 border rounded-xl font-black text-2xl">{selectedAppt.expected_revenue}€</div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Data Agendada</label>
                <div className="p-4 bg-slate-50 border rounded-xl font-bold">{new Date(selectedAppt.scheduled_at).toLocaleDateString('pt-PT')}</div>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={() => setSelectedAppt(null)} className="bg-blue-600 text-white px-10 py-4 rounded-xl font-black hover:bg-blue-700 transition-colors">FECHAR</button>
            </div>
          </div>
        </div>
      )}

      {isAIModalOpen && <AIModal onClose={() => setIsAIModalOpen(false)} onSave={(t, c, cat) => { supabase.from('responses').insert({title: t, content: c, category: cat, last_updated: Date.now()}).then(loadLibrary); setIsAIModalOpen(false); }} />}
      {isFormModalOpen && <ResponseFormModal isOpen={isFormModalOpen} onClose={() => {setIsFormModalOpen(false); setEditingResponse(null);}} onSave={() => {loadLibrary(); setIsFormModalOpen(false);}} initialData={editingResponse} />}
      {isApptModalOpen && <AppointmentModal onClose={() => setIsApptModalOpen(false)} onSave={loadCRM} preSelectedDate={preSelectedDate} />}
    </div>
  );
};

export default App;
