
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Sparkles, Droplets, 
  MessageSquare, ShieldCheck, Calendar as CalendarIcon, 
  MapPin, Phone, TrendingUp, 
  Clock, List, LayoutGrid, ChevronRight,
  User, X, StickyNote, RefreshCw, Mail, Briefcase,
  ChevronDown, Calendar as CalendarBrand, ChevronLeft,
  FileText, Upload, Download, Trash2, Send, Copy, Check, Filter,
  CheckCircle2, MessageCircle
} from 'lucide-react';
import { Category, SavedResponse, Appointment, ApptStage, Attachment } from './types';
import { supabase } from './services/supabaseClient';
import ResponseCard from './components/ResponseCard';
import AIModal from './components/AIModal';
import ResponseFormModal from './components/ResponseFormModal';
import AppointmentModal from './components/AppointmentModal';
import FullCalendarView from './components/FullCalendarView';

const STAGES: ApptStage[] = [
  'Leads', 
  'Visita Técnica', 
  'Orçamentos a Fazer', 
  'Relatórios a Fazer',
  'Aguardando Resposta', 
  'Serviços a Fazer', 
  'Em Execução', 
  'Retrabalho',
  'A Receber',
  'Concluído',
  'Recusados'
];

type TimeFilter = 'today' | 'week' | 'month' | 'all' | 'specific-month';
type AppView = 'library' | 'crm' | 'calendar';
type SortMode = 'stage' | 'time';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('library');
  const [crmViewMode, setCrmViewMode] = useState<'kanban' | 'list'>('list');
  const [sortMode, setSortMode] = useState<SortMode>('stage');
  const [timeFilter, setTimeFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [responses, setResponses] = useState<SavedResponse[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

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

  // Drag and drop state for responses
  const [draggedResponseId, setDraggedResponseId] = useState<string | null>(null);

  const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  useEffect(() => {
    loadLibrary();
    loadCRM();
  }, []);

  useEffect(() => {
    if (!selectedAppt) return;
    setSyncSuccess(false);
    const timer = setTimeout(async () => {
      setIsSyncing(true);
      try {
        const { error } = await supabase
          .from('appointments')
          .update({
            customer_name: selectedAppt.customer_name,
            company_name: selectedAppt.company_name,
            service_type: selectedAppt.service_type,
            description: selectedAppt.description,
            notes: selectedAppt.notes,
            expected_revenue: selectedAppt.expected_revenue,
            stage: selectedAppt.stage,
            probability: selectedAppt.probability,
            scheduled_at: selectedAppt.scheduled_at,
            start_time: selectedAppt.start_time,
            end_time: selectedAppt.end_time,
            phone: selectedAppt.phone,
            email: selectedAppt.email,
            nif: selectedAppt.nif,
            attachments: selectedAppt.attachments || [],
            tech_sent_at: selectedAppt.tech_sent_at
          })
          .eq('id', selectedAppt.id);
        
        if (error) throw error;
        setAppointments(prev => prev.map(a => a.id === selectedAppt.id ? selectedAppt : a));
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3000);
      } catch (err) {
        console.error("Erro ao sincronizar:", err);
      } finally {
        setTimeout(() => setIsSyncing(false), 800);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [selectedAppt]);

  const loadLibrary = async () => {
    const { data } = await supabase.from('responses').select('*').order('last_updated', { ascending: false });
    if (data) setResponses(data.map((item: any) => ({ ...item, lastUpdated: Number(item.last_updated) })));
  };

  const loadCRM = async () => {
    const { data } = await supabase.from('appointments').select('*').order('scheduled_at', { ascending: true });
    if (data) setAppointments(data as Appointment[]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedAppt) return;
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert("O ficheiro deve ter no máximo 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const newAttachment: Attachment = {
        name: file.name,
        type: file.type,
        size: (file.size / 1024 / 1024).toFixed(2) + " MB",
        date: new Date().toISOString(),
        url: event.target?.result as string
      };
      const updatedAttachments = [...(selectedAppt.attachments || []), newAttachment];
      setSelectedAppt({...selectedAppt, attachments: updatedAttachments});
    };
    reader.readAsDataURL(file);
  };

  const handleSaveResponse = async (data: Partial<SavedResponse>) => {
    try {
      if (editingResponse) {
        await supabase.from('responses').update({
          title: data.title, content: data.content, category: data.category, last_updated: Date.now()
        }).eq('id', editingResponse.id);
      } else {
        await supabase.from('responses').insert([{
          id: `res_${Math.random().toString(36).substring(2, 11)}`,
          title: data.title, content: data.content, category: data.category, last_updated: Date.now()
        }]);
      }
      loadLibrary();
    } catch (err) { console.error("Erro ao salvar resposta:", err); }
  };

  const handleDeleteResponse = async (id: string) => {
    try {
      const { error } = await supabase
        .from('responses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      loadLibrary();
    } catch (err) {
      console.error("Erro ao eliminar resposta:", err);
      alert("Falha ao eliminar a resposta.");
    }
  };

  // Drag and Drop Handlers for Library Reordering
  const handleResponseDragStart = (e: React.DragEvent, id: string) => {
    setDraggedResponseId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleResponseDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    if (!draggedResponseId || draggedResponseId === overId) return;

    const dragIdx = responses.findIndex(r => r.id === draggedResponseId);
    const overIdx = responses.findIndex(r => r.id === overId);

    const newResponses = [...responses];
    const [draggedItem] = newResponses.splice(dragIdx, 1);
    newResponses.splice(overIdx, 0, draggedItem);
    
    setResponses(newResponses);
  };

  const handleResponseDragEnd = () => {
    setDraggedResponseId(null);
  };

  const handleDeleteAppt = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmingApptDeleteId === id) {
      try {
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        setAppointments(prev => prev.filter(a => a.id !== id));
        setConfirmingApptDeleteId(null);
      } catch (err) {
        console.error("Erro ao eliminar agendamento:", err);
        alert("Falha ao eliminar o agendamento.");
      }
    } else {
      setConfirmingApptDeleteId(id);
      setTimeout(() => setConfirmingApptDeleteId(null), 3000);
    }
  };

  const openWhatsApp = (e: React.MouseEvent | React.TouchEvent, phone?: string) => {
    e.stopPropagation();
    if (!phone) {
        alert("Número de telefone não disponível.");
        return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('351') ? cleanPhone : `351${cleanPhone}`;
    window.open(`https://wa.me/${finalPhone}`, '_blank');
  };

  const openGmail = (e: React.MouseEvent, email?: string) => {
    e.stopPropagation();
    if (!email) {
      alert("E-mail não disponível.");
      return;
    }
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`, '_blank');
  };

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return appointments.filter(a => {
      const matchSearch = (a.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (a.service_type || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
      const apptDate = new Date(a.scheduled_at);
      if (timeFilter === 'today') return apptDate.toDateString() === now.toDateString();
      if (timeFilter === 'week') {
        const nextWeek = new Date(startOfToday);
        nextWeek.setDate(nextWeek.getDate() + 7);
        return apptDate >= startOfToday && apptDate <= nextWeek;
      }
      if (timeFilter === 'month') return apptDate.getMonth() === now.getMonth() && apptDate.getFullYear() === now.getFullYear();
      if (timeFilter === 'specific-month') return apptDate.getMonth() === selectedMonth && apptDate.getFullYear() === now.getFullYear();
      return true;
    });
  }, [appointments, searchTerm, timeFilter, selectedMonth]);

  const groupedByStage = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    STAGES.forEach(stage => { groups[stage] = filteredAppointments.filter(a => a.stage === stage); });
    return groups;
  }, [filteredAppointments]);

  const sortedByTime = useMemo(() => {
    return [...filteredAppointments].sort((a, b) => {
      const dateCompare = a.scheduled_at.localeCompare(b.scheduled_at);
      if (dateCompare !== 0) return dateCompare;
      return (a.start_time || '').localeCompare(b.start_time || '');
    });
  }, [filteredAppointments]);

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (date.toDateString() === new Date().toDateString()) return "HOJE";
    return date.toLocaleDateString('pt-PT', { weekday: 'short' }).toUpperCase();
  };

  const handleOpenTechModal = (appt: Appointment) => {
    const msg = `⚒️ *HIDRO CLEAN - ORDEM DE SERVIÇO* ⚒️\n\n` +
                `👤 *CLIENTE:* ${appt.customer_name || 'N/A'}\n` +
                `📞 *CONTACTO:* ${appt.phone || 'N/A'}\n` +
                `📍 *MORADA:* ${appt.description || 'N/A'}\n` +
                `📅 *DATA:* ${new Date(appt.scheduled_at).toLocaleDateString('pt-PT')}\n` +
                `⏰ *HORÁRIO:* ${appt.start_time || '--:--'} às ${appt.end_time || '--:--'}\n` +
                `🔧 *SERVIÇO:* ${appt.service_type}\n\n` +
                `📝 *NOTAS TÉCNICAS:*\n${appt.notes || 'Sem notas adicionais.'}\n\n` +
                `_Por favor, confirme a recepção deste serviço._`;
    setTechMessage(msg);
    setActiveTechId(appt.id);
    setIsTechModalOpen(true);
  };

  const copyToClipboard = async () => {
    if (!activeTechId) return;
    navigator.clipboard.writeText(techMessage);
    setCopiedTech(true);

    const nowIso = new Date().toISOString();
    try {
      await supabase
        .from('appointments')
        .update({ tech_sent_at: nowIso })
        .eq('id', activeTechId);
      
      setAppointments(prev => prev.map(a => a.id === activeTechId ? { ...a, tech_sent_at: nowIso } : a));
      if (selectedAppt?.id === activeTechId) {
        setSelectedAppt({ ...selectedAppt, tech_sent_at: nowIso });
      }
    } catch (err) {
      console.error("Erro ao marcar como enviado:", err);
    }

    setTimeout(() => {
      setCopiedTech(false);
      setIsTechModalOpen(false);
      setActiveTechId(null);
    }, 1500);
  };

  const ApptItem = ({ appt, showStage = false }: { appt: Appointment, showStage?: boolean }) => (
    <div 
      key={appt.id} 
      className={`rounded-xl p-5 shadow-sm border transition-all flex items-center group cursor-pointer gap-6 ${appt.tech_sent_at ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200/60 hover:border-blue-400'}`} 
      onClick={() => setSelectedAppt(appt)}
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
            <button 
              onClick={(e) => openWhatsApp(e, appt.phone)}
              className="p-4 rounded-xl transition-all shadow-md active:scale-95 flex items-center bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white"
              title="Abrir WhatsApp"
            >
                <MessageCircle size={20} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleOpenTechModal(appt); }}
              className={`p-4 rounded-xl transition-all shadow-md active:scale-95 flex items-center space-x-2 ${appt.tech_sent_at ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
              title="Enviar p/ Técnico"
            >
                {appt.tech_sent_at ? <Check size={20} /> : <Send size={20} />}
            </button>
            <button 
              onClick={(e) => handleDeleteAppt(e, appt.id)}
              className={`p-4 rounded-xl transition-all shadow-md active:scale-95 flex items-center space-x-2 ${confirmingApptDeleteId === appt.id ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400 hover:text-red-500'}`}
              title={confirmingApptDeleteId === appt.id ? "Confirmar Eliminação" : "Eliminar Lead"}
            >
                {confirmingApptDeleteId === appt.id ? <Check size={20} /> : <Trash2 size={20} />}
                {confirmingApptDeleteId === appt.id && <span className="text-[10px] font-black uppercase tracking-tighter">Confirmar?</span>}
            </button>
         </div>
         <div className="text-right min-w-[80px]">
           <div className="text-xl font-black text-slate-900 leading-none">{appt.expected_revenue?.toLocaleString('pt-PT')}€</div>
           <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{appt.tech_sent_at ? 'ENVIADO' : 'NÃO ENVIADO'}</div>
         </div>
         <ChevronRight size={22} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F3F4F7]">
      <aside className="w-full md:w-72 bg-white border-b md:border-r border-slate-200 p-4 md:p-6 flex flex-row md:flex-col h-auto md:h-screen sticky top-0 z-50">
        <div className="flex items-center space-x-3 mb-0 md:mb-10 mr-6 md:mr-0">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><Droplets className="text-white" size={20} /></div>
          <div><h1 className="font-black text-slate-800 text-base md:text-lg tracking-tight">Hidro Clean</h1><p className="hidden md:block text-[9px] text-blue-600 font-black uppercase tracking-[0.2em]">Gestão de Funil</p></div>
        </div>
        <nav className="flex md:flex-col items-center md:items-stretch space-x-2 md:space-x-0 md:space-y-1.5 flex-1 overflow-x-auto no-scrollbar">
          <button onClick={() => setView('crm')} className={`flex items-center space-x-3 px-4 py-3 md:py-4 rounded-xl transition-all ${view === 'crm' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 font-bold'}`}>
            <TrendingUp size={20} className="shrink-0" /><span className="text-xs md:text-sm font-black">Pipeline</span>
          </button>
          <button onClick={() => setView('calendar')} className={`flex items-center space-x-3 px-4 py-3 md:py-4 rounded-xl transition-all ${view === 'calendar' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 font-bold'}`}>
            <CalendarBrand size={20} className="shrink-0" /><span className="text-xs md:text-sm font-black">Agenda</span>
          </button>
          <button onClick={() => setView('library')} className={`flex items-center space-x-3 px-4 py-3 md:py-4 rounded-xl transition-all ${view === 'library' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 font-bold'}`}>
            <MessageSquare size={20} className="shrink-0" /><span className="text-xs md:text-sm font-black">Respostas</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="px-4 md:px-8 py-3 md:py-4 bg-white border-b border-slate-200 flex flex-col md:flex-row items-center justify-between sticky top-0 z-40 gap-4">
          <div className="flex items-center space-x-4 md:space-x-6 w-full md:flex-1">
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Procurar..." className="w-full pl-11 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
             <button onClick={() => setIsAIModalOpen(true)} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-black shadow-lg"><Sparkles size={18} className="text-blue-400" /></button>
             <button onClick={() => { setPreSelectedDate(undefined); view === 'library' ? setIsFormModalOpen(true) : setIsApptModalOpen(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl shadow-xl hover:bg-blue-700 transition-all active:scale-95 flex items-center space-x-2 border border-blue-500 flex-1 md:flex-none justify-center">
                <Plus size={18} /><span className="font-black text-[10px] md:text-xs uppercase tracking-wider">{view === 'library' ? 'Novo' : 'Novo Lead'}</span>
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-4 md:p-6 no-scrollbar">
          {view === 'calendar' ? (
            <div className="h-full animate-in fade-in duration-500">
              <FullCalendarView 
                appointments={appointments} 
                onEditAppt={setSelectedAppt} 
                onNewAppt={(date) => { setPreSelectedDate(date); setIsApptModalOpen(true); }}
                onSendTech={handleOpenTechModal}
              />
            </div>
          ) : view === 'library' ? (
            <div className="overflow-y-auto h-full pr-1 no-scrollbar animate-in fade-in duration-500 pb-10">
               <div className="flex items-center justify-between mb-6">
                 <div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight">Biblioteca</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Arrasta os cards para organizar</p>
                 </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                 {responses.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase())).map(res => (
                   <ResponseCard 
                     key={res.id} 
                     response={res} 
                     onEdit={(r) => { setEditingResponse(r); setIsFormModalOpen(true); }} 
                     onDelete={handleDeleteResponse}
                     onDragStart={handleResponseDragStart}
                     onDragOver={handleResponseDragOver}
                     onDragEnd={handleResponseDragEnd}
                     isDragging={draggedResponseId === res.id}
                   />
                 ))}
               </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 md:mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm shrink-0"><CalendarBrand size={24} /></div>
                  <div><h2 className="text-2xl font-black text-slate-900 tracking-tighter">Agenda do Funil</h2><p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Filtro: {timeFilter === 'all' ? 'Geral' : timeFilter === 'specific-month' ? MONTHS[selectedMonth] : timeFilter}</p></div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center bg-white p-1 rounded-xl shadow-sm border border-slate-200/60">
                    <button onClick={() => setSortMode('stage')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all flex items-center space-x-2 ${sortMode === 'stage' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}><List size={14} /><span>Por Etapa</span></button>
                    <button onClick={() => setSortMode('time')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all flex items-center space-x-2 ${sortMode === 'time' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}><Clock size={14} /><span>Por Horário</span></button>
                  </div>

                  <div className="flex items-center bg-white p-1 rounded-xl shadow-sm border border-slate-200/60 overflow-x-auto no-scrollbar">
                    {['today', 'week', 'month', 'all'].map((f) => (
                      <button key={f} onClick={() => setTimeFilter(f)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap ${timeFilter === f ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>{f === 'today' ? 'Hoje' : f === 'week' ? 'Semana' : f === 'month' ? 'Mês' : 'Todos'}</button>
                    ))}
                    <div className="h-4 w-[1px] bg-slate-200 mx-2"></div>
                    <select className="bg-transparent text-[9px] font-black uppercase text-slate-600 outline-none cursor-pointer pr-4" value={selectedMonth} onChange={(e) => { setSelectedMonth(parseInt(e.target.value)); setTimeFilter('specific-month'); }}>{MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 no-scrollbar pb-20">
                {sortMode === 'stage' ? (
                  STAGES.map(stage => {
                    const stageAppts = groupedByStage[stage];
                    if (stageAppts.length === 0) return null;
                    return (
                      <div key={stage} className="mb-10 animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="flex items-center justify-between px-2 mb-5">
                          <div className="flex items-center space-x-4 border-l-4 border-blue-600 pl-4"><h3 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">{stage}</h3><span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-full">{stageAppts.length}</span></div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">{stageAppts.map(appt => <ApptItem key={appt.id} appt={appt} />)}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center space-x-4 border-l-4 border-emerald-600 pl-4 mb-3"><h3 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Cronograma Geral</h3><span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-full">{sortedByTime.length} Trabalhos</span></div>
                    {sortedByTime.map(appt => <ApptItem key={appt.id} appt={appt} showStage={true} />)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedAppt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-2 animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] w-full max-w-5xl h-[94vh] flex flex-col shadow-2xl overflow-hidden border border-white">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center space-x-6 min-w-0 flex-1">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-xl shrink-0 ${selectedAppt.tech_sent_at ? 'bg-emerald-600' : 'bg-blue-600'}`}><User className="text-white w-8 h-8" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-4">
                      <input className="text-2xl font-black text-slate-900 tracking-tighter bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 -ml-2 flex-1 truncate" value={selectedAppt.customer_name || ''} onChange={e => setSelectedAppt({...selectedAppt, customer_name: e.target.value})} />
                      <div className="flex items-center space-x-3">
                        {isSyncing && <div className="flex items-center space-x-2 text-blue-600 text-[8px] font-black animate-pulse bg-blue-50 px-2 py-1 rounded-full"><RefreshCw className="animate-spin" size={10} /><span>Sincronizando...</span></div>}
                        {syncSuccess && !isSyncing && <div className="flex items-center space-x-2 text-emerald-600 text-[8px] font-black animate-in fade-in zoom-in duration-300 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100"><CheckCircle2 size={10} /><span>Guardado!</span></div>}
                      </div>
                      {selectedAppt.tech_sent_at && <div className="flex items-center space-x-1.5 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[8px] font-black uppercase border border-emerald-200"><Check size={10}/> <span>Enviado ao Técnico</span></div>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {/* Telefone / WhatsApp */}
                      <div className="flex items-center overflow-hidden bg-white rounded-lg border border-slate-200 shadow-sm transition-all hover:border-emerald-500">
                        <button 
                          onClick={(e) => openWhatsApp(e, selectedAppt.phone)} 
                          className="flex items-center justify-center h-8 w-8 bg-emerald-50 text-emerald-600 border-r border-slate-100 hover:bg-emerald-600 hover:text-white transition-all"
                          title="Falar no WhatsApp"
                        >
                          <MessageCircle size={14} />
                        </button>
                        <div className="flex items-center px-3 py-1.5">
                          <input 
                            type="text" 
                            className="font-bold text-slate-700 text-[10px] bg-transparent outline-none w-24" 
                            value={selectedAppt.phone || ''} 
                            onChange={e => setSelectedAppt({...selectedAppt, phone: e.target.value})} 
                          />
                        </div>
                      </div>
                      
                      {/* E-mail / Gmail */}
                      <div className="flex items-center overflow-hidden bg-white rounded-lg border border-slate-200 shadow-sm transition-all hover:border-blue-500">
                        <button 
                          onClick={(e) => openGmail(e, selectedAppt.email)} 
                          className="flex items-center justify-center h-8 w-8 bg-blue-50 text-blue-600 border-r border-slate-100 hover:bg-blue-600 hover:text-white transition-all"
                          title="Enviar E-mail (Gmail)"
                        >
                          <Mail size={14} />
                        </button>
                        <div className="flex items-center px-3 py-1.5">
                          <input 
                            placeholder="Email" 
                            type="email" 
                            className="font-bold text-slate-700 text-[10px] bg-transparent outline-none w-40" 
                            value={selectedAppt.email || ''} 
                            onChange={e => setSelectedAppt({...selectedAppt, email: e.target.value})} 
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm"><FileText size={13} className="text-blue-600" /><input placeholder="Contribuinte (NIF)" className="font-black text-blue-700 text-[10px] bg-transparent outline-none w-28 placeholder:text-blue-300" value={selectedAppt.nif || ''} onChange={e => setSelectedAppt({...selectedAppt, nif: e.target.value})} /></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={(e) => openWhatsApp(e, selectedAppt.phone)}
                    className="h-10 px-4 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase shadow-md active:scale-95 flex items-center space-x-2 hover:bg-emerald-700"
                  >
                    <MessageCircle size={16} />
                    <span>WhatsApp</span>
                  </button>
                  <button 
                    onClick={(e) => handleDeleteAppt(e, selectedAppt.id)}
                    className={`h-10 px-4 rounded-xl font-black text-[10px] uppercase transition-all shadow-md active:scale-95 flex items-center space-x-2 ${confirmingApptDeleteId === selectedAppt.id ? 'bg-red-600 text-white animate-pulse' : 'bg-white border border-slate-100 text-slate-400 hover:text-red-500'}`}
                  >
                    {confirmingApptDeleteId === selectedAppt.id ? <Check size={16} /> : <Trash2 size={16} />}
                    <span>{confirmingApptDeleteId === selectedAppt.id ? 'Confirmar?' : 'Eliminar'}</span>
                  </button>
                  <button onClick={() => setSelectedAppt(null)} className="w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm transition-all"><X size={22} /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 no-scrollbar bg-white">
                <div className="lg:col-span-4 flex flex-col space-y-6">
                  <div className="p-5 bg-slate-50/50 rounded-[2rem] border border-slate-200/50 space-y-5">
                    <div className="flex items-start space-x-3"><div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600 mt-1 shrink-0"><Briefcase size={16} /></div><div className="flex-1"><p className="text-[7px] font-black text-slate-400 uppercase mb-1">Empresa</p><input type="text" className="font-black text-slate-700 text-xs bg-transparent outline-none w-full" value={selectedAppt.company_name || ''} onChange={e => setSelectedAppt({...selectedAppt, company_name: e.target.value})} placeholder="Nome da empresa" /></div></div>
                    <div className="flex items-start space-x-3"><div className="p-2.5 bg-blue-50 rounded-lg text-blue-600 mt-1 shrink-0"><MapPin size={16} /></div><div className="flex-1"><p className="text-[7px] font-black text-slate-400 uppercase mb-1">Morada</p><textarea className="font-black text-slate-700 text-xs bg-transparent outline-none w-full resize-none leading-tight" value={selectedAppt.description || ''} onChange={e => setSelectedAppt({...selectedAppt, description: e.target.value})} rows={2} /></div></div>
                  </div>
                  <section className="bg-slate-900 rounded-[2rem] p-5 text-white shadow-2xl"><h3 className="text-[8px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4">Comercial</h3><div className="flex items-baseline space-x-2 mb-6"><input type="number" className="text-4xl font-black bg-transparent border-none outline-none w-24 focus:ring-1 focus:ring-blue-500 rounded-lg" value={selectedAppt.expected_revenue} onChange={e => setSelectedAppt({...selectedAppt, expected_revenue: Number(e.target.value)})} /><span className="text-xl font-black text-slate-500">€</span></div><div className="space-y-4"><div><label className="text-[7px] font-black text-slate-500 uppercase block mb-2">Etapa (Arraste p/ Mudar)</label><select className="w-full bg-slate-800 text-white rounded-lg px-4 py-3 text-xs font-black uppercase border-none outline-none appearance-none cursor-pointer" value={selectedAppt.stage} onChange={e => setSelectedAppt({...selectedAppt, stage: e.target.value as ApptStage})}>{STAGES.map(s => <option key={s} value={s}>{s}</option>)}</select></div><div><div className="flex justify-between mb-2"><label className="text-[7px] font-black text-slate-500 uppercase">Probabilidade</label><span className="text-xs font-black text-blue-400">{selectedAppt.probability}%</span></div><input type="range" min="0" max="100" className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500" value={selectedAppt.probability} onChange={e => setSelectedAppt({...selectedAppt, probability: Number(e.target.value)})} /></div></div></section>
                </div>
                
                <div className="lg:col-span-8 flex flex-col space-y-6">
                  <div className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase mb-2 ml-1">Serviço</span><select className="bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase px-6 py-3.5 shadow-xl border-none outline-none" value={selectedAppt.service_type} onChange={e => setSelectedAppt({...selectedAppt, service_type: e.target.value})}>{["Pesquisa de Fuga", "Desentupimentos", "Limpeza de Fossas", "Reparação Canalização", "Inspeção de Vídeo", "Outros"].map(opt => <option key={opt}>{opt}</option>)}</select></div>
                      <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase mb-2 ml-1">Agenda</span><div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex flex-col space-y-3 shadow-sm"><div className="flex items-center space-x-3 text-slate-900 font-black"><CalendarIcon size={14} className="text-blue-600 shrink-0" /><input type="date" className="bg-transparent border-none outline-none cursor-pointer flex-1 text-xs font-black" value={selectedAppt.scheduled_at} onChange={e => setSelectedAppt({...selectedAppt, scheduled_at: e.target.value})} /></div><div className="h-[1px] bg-slate-100"></div><div className="flex items-center justify-between"><div className="bg-blue-600 text-white px-2 py-1 rounded-md text-[9px] font-black flex items-center"><input type="time" className="bg-transparent border-none outline-none text-[9px] font-black [color-scheme:dark]" value={selectedAppt.start_time} onChange={e => setSelectedAppt({...selectedAppt, start_time: e.target.value})} /></div><span className="text-slate-300 font-black text-[7px] uppercase tracking-tighter">Até</span><div className="bg-blue-600 text-white px-2 py-1 rounded-md text-[9px] font-black flex items-center"><input type="time" className="bg-transparent border-none outline-none text-[9px] font-black [color-scheme:dark]" value={selectedAppt.end_time} onChange={e => setSelectedAppt({...selectedAppt, end_time: e.target.value})} /></div></div></div></div>
                  </div>
                  <div className="flex flex-col space-y-3"><h3 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center px-2"><StickyNote className="mr-2 text-blue-600 w-3.5 h-3.5" /> Notas Técnicas</h3><textarea className="w-full h-32 bg-slate-50/30 border border-slate-200 rounded-2xl p-4 text-slate-700 font-medium text-sm resize-none outline-none focus:ring-2 focus:ring-blue-100" placeholder="Detalhes técnicos aqui..." value={selectedAppt.notes || ''} onChange={(e) => setSelectedAppt({...selectedAppt, notes: e.target.value})} /></div>
                  <div className="bg-slate-50/30 rounded-[2rem] p-5 border border-slate-200/50"><div className="flex items-center justify-between mb-4 px-1"><h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center"><Upload size={14} className="mr-2" /> Anexos</h3><label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase flex items-center transition-all shadow-md"><Plus size={12} className="mr-1" /> Adicionar<input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} /></label></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{(selectedAppt.attachments || []).map((att, i) => (<div key={i} className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center justify-between group shadow-sm"><div className="flex items-center space-x-2 overflow-hidden"><div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0"><FileText size={14}/></div><div className="min-w-0"><p className="text-[9px] font-bold text-slate-800 truncate">{att.name}</p><p className="text-[7px] font-black text-slate-400 uppercase">{att.size}</p></div></div><div className="flex space-x-1"><a href={att.url} download={att.name} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Download size={14}/></a><button onClick={() => { const updated = [...(selectedAppt.attachments || [])]; updated.splice(i, 1); setSelectedAppt({...selectedAppt, attachments: updated}); }} className="p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12}/></button></div></div>))}{(selectedAppt.attachments || []).length === 0 && <div className="col-span-full py-4 text-center border-2 border-dashed border-slate-200 rounded-xl"><p className="text-[7px] font-black text-slate-300 uppercase">Sem ficheiros</p></div>}</div></div>
                </div>
              </div>
              <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
                 <div className="flex items-center space-x-3 text-[8px] font-black text-slate-400 uppercase tracking-widest"><ShieldCheck size={16} className="text-emerald-500" /><span>Smart CRM v5.0 Platinum</span></div>
                 <div className="flex items-center space-x-3">
                    <button onClick={() => handleOpenTechModal(selectedAppt)} className={`px-6 py-3.5 text-white rounded-xl font-black text-xs shadow-xl transition-all active:scale-95 flex items-center space-x-2 ${selectedAppt.tech_sent_at ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-500 hover:bg-emerald-600'}`}>{selectedAppt.tech_sent_at ? <Check size={16} /> : <Send size={16} />}<span>{selectedAppt.tech_sent_at ? 'Reenviar Técnico' : 'Enviar p/ Técnico'}</span></button>
                    <button onClick={() => setSelectedAppt(null)} className="px-10 py-3.5 bg-slate-900 text-white rounded-xl font-black text-xs shadow-xl hover:bg-black active:scale-95 transition-all">Guardar e Sair</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {isTechModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl flex flex-col overflow-hidden border border-white">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/30">
                 <div className="flex items-center space-x-3"><div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white"><Send size={20} /></div><div><h3 className="text-lg font-black text-slate-900 tracking-tight">Enviar ao Técnico</h3><p className="text-[10px] font-black text-emerald-600 uppercase">Mensagem Padrão Hidro Clean</p></div></div>
                 <button onClick={() => { setIsTechModalOpen(false); setActiveTechId(null); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={20}/></button>
              </div>
              <div className="p-6 flex-1"><label className="block text-[8px] font-black text-slate-400 uppercase mb-3">Mensagem para Copiar</label><textarea className="w-full h-80 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-mono text-xs leading-relaxed resize-none focus:ring-2 focus:ring-emerald-100 outline-none" value={techMessage} onChange={(e) => setTechMessage(e.target.value)} /></div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center"><button onClick={copyToClipboard} className={`w-full py-4 rounded-xl font-black text-xs shadow-xl flex items-center justify-center space-x-2 transition-all active:scale-95 ${copiedTech ? 'bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white`}>{copiedTech ? <Check size={18} /> : <Copy size={18} />}<span>{copiedTech ? 'Enviado! (Copiado)' : 'Copiar e Marcar como Enviado'}</span></button></div>
           </div>
        </div>
      )}

      {isAIModalOpen && <AIModal onClose={() => setIsAIModalOpen(false)} onSave={(title, content, category) => handleSaveResponse({title, content, category})} />}
      <ResponseFormModal isOpen={isFormModalOpen} onClose={() => { setIsFormModalOpen(false); setEditingResponse(null); }} onSave={handleSaveResponse} initialData={editingResponse} />
      {isApptModalOpen && <AppointmentModal onClose={() => setIsApptModalOpen(false)} onSave={loadCRM} preSelectedDate={preSelectedDate} />}
    </div>
  );
};

export default App;
