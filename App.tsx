
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Plus, Sparkles, Droplets, 
  MessageSquare, MapPin, Phone, TrendingUp, 
  Clock, List, LayoutGrid, ChevronRight,
  User, X, StickyNote, RefreshCw, Mail, Briefcase,
  Calendar as CalendarBrand, FileText, Upload, Download, 
  Trash2, Send, Copy, Check, CheckCircle2, MessageCircle,
  Calendar as CalendarIcon, ShieldCheck, DollarSign, Filter,
  ChevronDown, ArrowUpAZ, ArrowDownAZ, Columns, Bell, BellRing,
  Loader2, ClipboardList, File, Image as ImageIcon,
  CheckCircle, XCircle, Info
} from 'lucide-react';
import { Category, SavedResponse, Appointment, ApptStage, Attachment } from './types';
import { supabase } from './services/supabaseClient';
import { generateReminderEmail, generateClientConfirmationEmail } from './services/geminiService';
import ResponseCard from './components/ResponseCard';
import AIModal from './components/AIModal';
import ResponseFormModal from './components/ResponseFormModal';
import AppointmentModal from './components/AppointmentModal';
import FullCalendarView from './components/FullCalendarView';
import KanbanView from './components/KanbanView';

const STAGES: ApptStage[] = [
  'Leads', 'Visita Técnica', 'Orçamentos a Fazer', 'Relatórios a Fazer',
  'Aguardando Resposta', 'Serviços a Fazer', 'Em Execução', 'Retrabalho',
  'A Receber', 'Concluído', 'Recusados'
];

export const STAGE_COLORS: Record<ApptStage, { bg: string, text: string, border: string, dot: string }> = {
  'Leads': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  'Visita Técnica': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  'Orçamentos a Fazer': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  'Relatórios a Fazer': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  'Aguardando Resposta': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500' },
  'Serviços a Fazer': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  'Em Execução': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  'Retrabalho': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  'A Receber': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  'Concluído': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'Recusados': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' }
};

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const App: React.FC = () => {
  const [view, setView] = useState<'crm' | 'calendar' | 'library'>('crm');
  const [sortMode, setSortMode] = useState<'stage' | 'time' | 'kanban'>('stage');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [timeFilter, setTimeFilter] = useState<'today' | 'semana' | 'mês' | 'todos'>('today');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [searchTerm, setSearchTerm] = useState('');
  
  const [responses, setResponses] = useState<SavedResponse[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<SavedResponse | null>(null);
  
  const startTimeRef = useRef<HTMLInputElement>(null);
  const endTimeRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [techMessage, setTechMessage] = useState('');
  const [copiedTech, setCopiedTech] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [notifications, setNotifications] = useState<{id: string, msg: string}[]>([]);

  useEffect(() => { loadLibrary(); loadCRM(); }, []);

  useEffect(() => {
    const checkReminders = async () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      const dueAppts = appointments.filter(a => {
        if (!a.reminder_enabled || a.reminder_sent || a.scheduled_at !== todayStr || !a.start_time) return false;
        
        const [hours, minutes] = a.start_time.split(':').map(Number);
        const apptTime = new Date();
        apptTime.setHours(hours, minutes, 0, 0);
        
        const diffInMs = apptTime.getTime() - now.getTime();
        const diffInMinutes = Math.round(diffInMs / 60000);
        
        return diffInMinutes >= 55 && diffInMinutes <= 65;
      });

      for (const appt of dueAppts) {
        await generateReminderEmail(appt);
        const id = Math.random().toString();
        setNotifications(prev => [...prev, { id, msg: `Lembrete enviado para ${appt.customer_name}` }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 8000);

        await supabase.from('appointments').update({ reminder_sent: true }).eq('id', appt.id);
        setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, reminder_sent: true } : a));
      }
    };

    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [appointments]);

  useEffect(() => {
    if (!selectedAppt) return;
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
            reminder_enabled: selectedAppt.reminder_enabled,
            reminder_email: selectedAppt.reminder_email,
            reminder_sent: selectedAppt.reminder_sent,
            attachments: selectedAppt.attachments || []
          })
          .eq('id', selectedAppt.id);
        
        if (!error) {
          setAppointments(prev => prev.map(a => a.id === selectedAppt.id ? selectedAppt : a));
          setSyncSuccess(true);
          setTimeout(() => setSyncSuccess(false), 2000);
        }
      } catch (err) { console.error(err); } finally { setIsSyncing(false); }
    }, 1000);
    return () => clearTimeout(timer);
  }, [selectedAppt]);

  const loadLibrary = async () => {
    const { data } = await supabase.from('responses').select('*').order('last_updated', { ascending: false });
    if (data) setResponses(data.map((item: any) => ({ ...item, lastUpdated: Number(item.last_updated) })));
  };

  const loadCRM = async () => {
    const { data } = await supabase.from('appointments').select('*').order('scheduled_at', { ascending: false });
    if (data) setAppointments(data as Appointment[]);
  };

  const handleWhatsApp = (phone?: string) => {
    if (!phone) return;
    const clean = phone.replace(/\D/g, '');
    const final = clean.startsWith('351') ? clean : `351${clean}`;
    window.open(`https://wa.me/${final}`, '_blank');
  };

  const handleMoveApptStage = async (apptId: string, newStage: ApptStage) => {
    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, stage: newStage } : a));
    const { error } = await supabase
      .from('appointments')
      .update({ stage: newStage })
      .eq('id', apptId);
      
    if (error) {
      console.error("Erro ao mover lead:", error);
      loadCRM();
    } else {
      const id = Math.random().toString();
      setNotifications(prev => [...prev, { id, msg: `Lead movido para ${newStage}!` }]);
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
    }
  };

  const handleSendConfirmationEmail = async (appt: Appointment) => {
    if (!appt.email) {
      alert("Erro: O cliente não possui um endereço de e-mail registado.");
      return;
    }
    setIsGeneratingEmail(true);
    const id = Math.random().toString();
    setNotifications(prev => [...prev, { id, msg: `A gerar confirmação via IA...` }]);
    try {
      const bodyText = await generateClientConfirmationEmail(appt);
      const subject = `Confirmação de Agendamento - Hidro Clean (${appt.service_type})`;
      const mailtoUrl = `mailto:${appt.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
      window.location.href = mailtoUrl;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, msg: `E-mail preparado com sucesso!` } : n));
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
    } catch (error) {
      console.error(error);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, msg: `Erro ao gerar e-mail.` } : n));
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleGenerateOS = async (appt: Appointment) => {
    const dataFormatada = new Date(appt.scheduled_at + 'T00:00:00').toLocaleDateString('pt-PT');
    const message = `🛠️ *ORDEM DE SERVIÇO - HIDRO CLEAN*\n` +
      `----------------------------------------\n` +
      `👤 *CLIENTE:* ${appt.customer_name || 'N/A'}\n` +
      `${appt.company_name ? `🏢 *EMPRESA:* ${appt.company_name}\n` : ''}` +
      `📍 *MORADA:* ${appt.description || 'N/A'}\n` +
      `📞 *CONTACTO:* ${appt.phone || 'N/A'}\n` +
      `----------------------------------------\n` +
      `📅 *DATA:* ${dataFormatada}\n` +
      `⏰ *HORA:* ${appt.start_time || '--:--'} às ${appt.end_time || '--:--'}\n` +
      `⚡ *SERVIÇO:* ${appt.service_type.toUpperCase()}\n` +
      `----------------------------------------\n` +
      `📝 *NOTAS TÉCNICAS:*\n${appt.notes || 'Sem observações adicionais.'}\n` +
      `----------------------------------------\n` +
      `✅ *Por favor, confirme a receção desta OS.*`;
    setTechMessage(message);
    setIsTechModalOpen(true);
    const now = new Date().toISOString();
    try {
      await supabase.from('appointments').update({ tech_sent_at: now }).eq('id', appt.id);
      setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, tech_sent_at: now } : a));
      if (selectedAppt?.id === appt.id) setSelectedAppt({ ...selectedAppt, tech_sent_at: now });
    } catch (err) {
      console.error("Erro ao atualizar status da OS:", err);
    }
  };

  const handleDeleteAppt = async (id: string) => {
    if (confirmDeleteId === id) {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (!error) {
        setConfirmDeleteId(null);
        loadCRM();
        if (selectedAppt?.id === id) setSelectedAppt(null);
      }
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedAppt) return;
    setIsUploading(true);
    const newAttachments = [...(selectedAppt.attachments || [])];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const filePath = `appointments/${selectedAppt.id}/${fileName}`;
      try {
        const { error } = await supabase.storage.from('attachments').upload(filePath, file);
        if (error) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            const fallbackAttachment: Attachment = { name: file.name, type: file.type, size: `${(file.size / 1024 / 1024).toFixed(2)} MB`, date: new Date().toISOString(), url: base64data };
            setSelectedAppt(prev => prev ? { ...prev, attachments: [...(prev.attachments || []), fallbackAttachment] } : null);
          };
          reader.readAsDataURL(file);
        } else {
          const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(filePath);
          const attachment: Attachment = { name: file.name, type: file.type, size: `${(file.size / 1024 / 1024).toFixed(2)} MB`, date: new Date().toISOString(), url: publicUrl };
          newAttachments.push(attachment);
        }
      } catch (err) { console.error("Erro no upload:", err); }
    }
    if (newAttachments.length > (selectedAppt.attachments?.length || 0)) setSelectedAppt({ ...selectedAppt, attachments: newAttachments });
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    if (!selectedAppt) return;
    const filtered = selectedAppt.attachments?.filter((_, i) => i !== index) || [];
    setSelectedAppt({ ...selectedAppt, attachments: filtered });
  };

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return appointments.filter(a => {
      const matchSearch = (a.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (a.service_type || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
      if (timeFilter === 'today') return a.scheduled_at === todayStr;
      const apptDate = new Date(a.scheduled_at + 'T00:00:00');
      if (timeFilter === 'semana') return apptDate >= monday && apptDate <= sunday;
      if (timeFilter === 'mês') return apptDate.getMonth() === selectedMonth && apptDate.getFullYear() === now.getFullYear();
      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.scheduled_at + 'T' + (a.start_time || '00:00')).getTime();
      const dateB = new Date(b.scheduled_at + 'T' + (b.start_time || '00:00')).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [appointments, searchTerm, timeFilter, selectedMonth, sortOrder]);

  const groupedByStage = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    STAGES.forEach(stage => { 
      const items = filteredAppointments.filter(a => a.stage === stage);
      if (items.length > 0) groups[stage] = items;
    });
    return groups;
  }, [filteredAppointments]);

  const AppointmentCard = ({ appt }: { appt: Appointment }) => {
    const now = new Date();
    const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const isToday = appt.scheduled_at === todayStr;
    const isConfirming = confirmDeleteId === appt.id;
    const stageColor = STAGE_COLORS[appt.stage];

    return (
      <div 
        onClick={() => setSelectedAppt(appt)} 
        className={`bg-white border-y border-r border-slate-200 rounded-2xl p-5 flex items-center gap-6 shadow-sm hover:border-blue-400 transition-all cursor-pointer group relative overflow-hidden`}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-2 ${stageColor.dot}`}></div>
        <div className="w-20 shrink-0 text-center flex flex-col items-center">
          <div className="bg-blue-600 text-white w-full py-2 rounded-xl border-2 border-blue-600 flex flex-col items-center shadow-lg shadow-blue-100">
            <span className="text-2xl font-black">{new Date(appt.scheduled_at + 'T00:00:00').getDate()}</span>
            <span className="text-[10px] font-black uppercase">{isToday ? 'HOJE' : new Date(appt.scheduled_at + 'T00:00:00').toLocaleDateString('pt-PT', { weekday: 'short' }).toUpperCase()}</span>
          </div>
          <div className="mt-2 text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 flex items-center justify-center gap-1"><Clock size={12}/>{appt.start_time}</div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${stageColor.bg} ${stageColor.text} ${stageColor.border}`}>
              {appt.stage}
            </span>
            <span className="text-blue-600 text-[9px] font-black uppercase tracking-widest">• {appt.service_type}</span>
            {appt.reminder_enabled && <Bell size={10} className={`${appt.reminder_sent ? 'text-emerald-500' : 'text-blue-400 animate-pulse'}`} />}
          </div>
          <h4 className="text-xl font-black text-slate-900 leading-tight mb-1">{appt.customer_name}</h4>
          <p className="text-xs text-slate-500 font-bold flex items-center gap-2"><MapPin size={14} className="text-blue-500"/>{appt.description}</p>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={(e) => { e.stopPropagation(); handleWhatsApp(appt.phone); }} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="WhatsApp"><MessageCircle size={20}/></button>
           <button onClick={(e) => { e.stopPropagation(); handleGenerateOS(appt); }} className={`p-3 rounded-xl transition-all shadow-sm flex items-center justify-center ${appt.tech_sent_at ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-white border border-slate-200 text-slate-400 hover:bg-indigo-600 hover:text-white'}`} title="Enviar Ordem de Serviço (OS)"><ClipboardList size={20}/></button>
           <button onClick={(e) => { e.stopPropagation(); handleDeleteAppt(appt.id); }} className={`p-3 rounded-xl transition-all flex items-center gap-2 shadow-sm ${isConfirming ? 'bg-red-600 text-white animate-pulse px-4' : 'bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white'}`} title={isConfirming ? "Confirmar?" : "Eliminar"}><Trash2 size={20}/>{isConfirming && <span className="text-[10px] font-black uppercase tracking-tighter">Confirmar?</span>}</button>
        </div>
        <div className="text-right min-w-[100px] border-l pl-6 border-slate-100">
           <div className="text-2xl font-black text-slate-900 leading-none">{appt.expected_revenue}€</div>
           <div className="text-[9px] font-black text-slate-400 mt-1 uppercase">{appt.tech_sent_at ? 'OS Enviada' : 'Pendente OS'}</div>
        </div>
        <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600 transition-colors"/>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#F3F4F7]">
      <div className="fixed top-6 right-6 z-[200] space-y-3">
        {notifications.map(n => (
          <div key={n.id} className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-10 duration-500 border border-blue-500/30">
            <div className="bg-blue-600 p-2 rounded-xl"><Bell size={18}/></div>
            <p className="text-xs font-black uppercase tracking-tight">{n.msg}</p>
          </div>
        ))}
      </div>

      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col h-screen sticky top-0 z-50">
        <div className="flex items-center space-x-3 mb-10">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><Droplets className="text-white" size={20} /></div>
          <div><h1 className="font-black text-slate-800 text-lg leading-tight">Hidro Clean</h1><p className="text-[9px] text-blue-600 font-black uppercase tracking-widest">Gestão de Funil</p></div>
        </div>
        <nav className="flex-1 space-y-1">
          <button onClick={() => setView('crm')} className={`flex items-center space-x-3 px-4 py-4 rounded-xl w-full transition-all ${view === 'crm' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 font-bold'}`}>
            <TrendingUp size={20} /><span className="text-sm">Pipeline</span>
          </button>
          <button onClick={() => setView('calendar')} className={`flex items-center space-x-3 px-4 py-4 rounded-xl w-full transition-all ${view === 'calendar' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 font-bold'}`}>
            <CalendarBrand size={20} /><span className="text-sm">Agenda</span>
          </button>
          <button onClick={() => setView('library')} className={`flex items-center space-x-3 px-4 py-4 rounded-xl w-full transition-all ${view === 'library' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 font-bold'}`}>
            <MessageSquare size={20} /><span className="text-sm">Respostas</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="px-8 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input placeholder="Procurar lead..." className="w-full pl-11 pr-4 py-2 bg-slate-100 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-blue-400" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex items-center space-x-4">
             <button onClick={() => setIsAIModalOpen(true)} className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg hover:scale-110 transition-transform"><Sparkles size={18} className="text-blue-400" /></button>
             <button onClick={() => setIsApptModalOpen(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-xl uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all"><Plus size={16}/> Novo Lead</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-[#F3F4F7]">
          {view === 'crm' && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 border border-slate-200 shadow-sm"><CalendarIcon size={24}/></div>
                  <div><h2 className="text-2xl font-black text-slate-900">Funil de Vendas</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Exibindo: {timeFilter.toUpperCase()}</p></div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-white p-1 rounded-xl flex border border-slate-200 shadow-sm overflow-hidden">
                    <button onClick={() => setSortMode('stage')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase flex items-center gap-2 transition-all ${sortMode === 'stage' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><List size={14}/> Por Etapa</button>
                    <button onClick={() => setSortMode('kanban')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase flex items-center gap-2 transition-all ${sortMode === 'kanban' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><Columns size={14}/> Kanban</button>
                    <button onClick={() => setSortMode('time')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase flex items-center gap-2 transition-all ${sortMode === 'time' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><Clock size={14}/> Lista Geral</button>
                  </div>
                  
                  <button 
                    onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-[9px] font-black uppercase text-slate-600 hover:bg-slate-50 hover:border-blue-400 transition-all shadow-sm"
                  >
                    {sortOrder === 'newest' ? <ArrowDownAZ size={16} className="text-blue-600"/> : <ArrowUpAZ size={16} className="text-blue-600"/>}
                    <span>{sortOrder === 'newest' ? 'Mais Recente' : 'Mais Antigo'}</span>
                  </button>

                  <div className="bg-white p-1 rounded-xl flex border border-slate-200 shadow-sm items-center px-2">
                    <button onClick={() => setTimeFilter('today')} className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${timeFilter === 'today' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>HOJE</button>
                    <button onClick={() => setTimeFilter('semana')} className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${timeFilter === 'semana' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>SEMANA</button>
                    <button onClick={() => setTimeFilter('mês')} className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${timeFilter === 'mês' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>MÊS</button>
                    <button onClick={() => setTimeFilter('todos')} className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${timeFilter === 'todos' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>TODOS</button>
                    <div className="h-4 w-[1px] bg-slate-200 mx-2"></div>
                    <select className="bg-transparent text-[9px] font-black uppercase outline-none cursor-pointer text-slate-600 pr-2" value={selectedMonth} onChange={e => { setSelectedMonth(Number(e.target.value)); setTimeFilter('mês'); }}>
                      {MONTHS.map((m, i) => <option key={m} value={i}>{m.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* ÍNDICE DE CORES BONITO */}
              <div className="bg-white/60 border border-slate-200 rounded-3xl p-4 mb-8 flex flex-wrap items-center justify-center gap-4 shadow-sm animate-in fade-in duration-700">
                <div className="flex items-center gap-1.5 mr-2 text-[9px] font-black text-slate-400 uppercase tracking-widest"><Info size={14}/> Legenda:</div>
                {STAGES.map(stage => (
                  <div key={stage} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-100 shadow-sm">
                    <div className={`w-2 h-2 rounded-full ${STAGE_COLORS[stage].dot}`}></div>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">{stage}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-12 pb-10">
                {sortMode === 'kanban' ? (
                  <KanbanView stages={STAGES} appointments={filteredAppointments} onEditAppt={setSelectedAppt} onWhatsApp={handleWhatsApp} onMoveAppt={handleMoveApptStage} />
                ) : sortMode === 'stage' ? (
                  STAGES.map(stage => groupedByStage[stage] && (
                    <div key={stage} className="animate-in fade-in slide-in-from-left-4 duration-500">
                      <h3 className="text-sm font-black text-slate-800 uppercase mb-6 flex items-center gap-3">
                        <div className={`w-1.5 h-6 rounded-full shadow-sm ${STAGE_COLORS[stage].dot}`}></div>
                        {stage} <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-black">{groupedByStage[stage].length}</span>
                      </h3>
                      <div className="space-y-4">
                        {groupedByStage[stage].map(appt => <AppointmentCard key={appt.id} appt={appt}/>)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase mb-6 flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-sm shadow-emerald-200"></div>
                      Lista Filtrada <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-black">{filteredAppointments.length}</span>
                    </h3>
                    {filteredAppointments.map(appt => <AppointmentCard key={appt.id} appt={appt}/>)}
                  </div>
                )}
                {filteredAppointments.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-24 bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <div className="bg-slate-200 p-8 rounded-full mb-6 text-slate-400 shadow-inner"><Filter size={48}/></div>
                    <p className="font-black text-xs text-slate-400 uppercase tracking-[0.3em]">Nenhum pedido encontrado</p>
                    {timeFilter !== 'todos' && <button onClick={() => setTimeFilter('todos')} className="mt-4 text-[10px] font-black text-blue-600 uppercase underline hover:text-blue-800">Ver todo o histórico</button>}
                  </div>
                )}
              </div>
            </>
          )}
          {view === 'calendar' && <FullCalendarView appointments={filteredAppointments} onEditAppt={setSelectedAppt} onNewAppt={() => setIsApptModalOpen(true)} onSendTech={handleGenerateOS} />}
          {view === 'library' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {responses.map(res => <ResponseCard key={res.id} response={res} onEdit={r => { setEditingResponse(r); setIsFormModalOpen(true); }} onDelete={loadLibrary} onDragStart={()=>{}} onDragOver={()=>{}} onDragEnd={()=>{}} />)}
             </div>
          )}
        </div>
      </main>

      {/* MODAL DETALHES (FICHA PLATINUM) */}
      {selectedAppt && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-6xl h-[95vh] flex flex-col shadow-2xl border border-white overflow-hidden">
            <header className="px-10 py-6 border-b flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center space-x-6 flex-1">
                <div className={`w-16 h-16 ${STAGE_COLORS[selectedAppt.stage].dot} rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100`}><User size={32}/></div>
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <input className="text-3xl font-black text-slate-900 bg-transparent outline-none w-full border-b border-transparent focus:border-blue-100" value={selectedAppt.customer_name} onChange={e => setSelectedAppt({...selectedAppt, customer_name: e.target.value})} />
                    <div className="flex items-center gap-2">
                       {isSyncing && <div className="flex items-center gap-2 text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full animate-pulse"><RefreshCw size={12} className="animate-spin"/> Guardando...</div>}
                       {syncSuccess && <div className="flex items-center gap-2 text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full"><Check size={12}/> Sincronizado</div>}
                    </div>
                    
                    {/* BOTÕES DE AÇÃO RÁPIDA DE STATUS - MOVIDOS PARA CÁ */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 gap-1.5 ml-auto mr-4">
                        <button 
                          onClick={() => { handleMoveApptStage(selectedAppt.id, 'Concluído'); setSelectedAppt(null); }}
                          className="px-3 py-2 bg-white text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl font-black text-[9px] uppercase transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <CheckCircle size={14}/> Concluir
                        </button>
                        <button 
                          onClick={() => { handleMoveApptStage(selectedAppt.id, 'Recusados'); setSelectedAppt(null); }}
                          className="px-3 py-2 bg-white text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl font-black text-[9px] uppercase transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <XCircle size={14}/> Recusar
                        </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <button onClick={() => handleWhatsApp(selectedAppt.phone)} className="p-2.5 bg-emerald-50 text-emerald-600 border-r border-slate-200 hover:bg-emerald-600 hover:text-white transition-all"><MessageCircle size={16}/></button>
                      <input className="px-4 py-2 text-xs font-bold outline-none w-36 text-slate-700" value={selectedAppt.phone} onChange={e => setSelectedAppt({...selectedAppt, phone: e.target.value})} placeholder="Telemóvel" />
                    </div>
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <button className="p-2.5 bg-blue-50 text-blue-600 border-r border-slate-200 hover:bg-blue-600 hover:text-white transition-all"><Mail size={16}/></button>
                      <input className="px-4 py-2 text-xs font-bold outline-none w-48 text-slate-700" value={selectedAppt.email} onChange={e => setSelectedAppt({...selectedAppt, email: e.target.value})} placeholder="Email" />
                    </div>
                    <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl text-xs font-black text-blue-700 flex items-center gap-2 tracking-tight uppercase"><FileText size={16}/> <input className="bg-transparent outline-none w-28 placeholder:text-blue-300" value={selectedAppt.nif} onChange={e => setSelectedAppt({...selectedAppt, nif: e.target.value})} placeholder="CONTRIBUINTE" /></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <button onClick={() => handleWhatsApp(selectedAppt.phone)} className="px-8 py-4 bg-[#00A884] text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-emerald-50 flex items-center gap-3 hover:scale-105 transition-all"><MessageCircle size={18}/> WhatsApp</button>
                 <button onClick={(e) => { e.stopPropagation(); if (confirmDeleteId === selectedAppt.id) handleDeleteAppt(selectedAppt.id); else { setConfirmDeleteId(selectedAppt.id); setTimeout(() => setConfirmDeleteId(null), 3000); } }} className={`px-8 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-3 transition-all ${confirmDeleteId === selectedAppt.id ? 'bg-red-600 text-white animate-pulse shadow-red-100' : 'bg-white border border-slate-200 text-slate-400 hover:bg-red-500 hover:text-white shadow-sm'}`}><Trash2 size={18}/> {confirmDeleteId === selectedAppt.id ? 'Confirmar?' : 'Eliminar'}</button>
                 <button onClick={() => setSelectedAppt(null)} className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all"><X size={24}/></button>
              </div>
            </header>

            <div className="flex-1 p-10 grid grid-cols-12 gap-10 overflow-y-auto no-scrollbar bg-white">
              <div className="col-span-4 space-y-8">
                 <div className="p-8 bg-slate-50/50 rounded-[3rem] border border-slate-100 space-y-8">
                    <div className="flex gap-4 items-start">
                       <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl mt-1 shadow-sm"><Briefcase size={20}/></div>
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Empresa</p>
                          <input className="w-full font-black text-slate-800 text-sm bg-transparent outline-none placeholder:text-slate-300" value={selectedAppt.company_name} onChange={e => setSelectedAppt({...selectedAppt, company_name: e.target.value})} placeholder="Nome da empresa" />
                       </div>
                    </div>
                    <div className="flex gap-4 items-start">
                       <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl mt-1 shadow-sm"><MapPin size={20}/></div>
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Morada</p>
                          <textarea className="w-full font-black text-slate-800 text-sm bg-transparent outline-none resize-none leading-relaxed placeholder:text-slate-300" rows={3} value={selectedAppt.description} onChange={e => setSelectedAppt({...selectedAppt, description: e.target.value})} placeholder="Morada completa..." />
                       </div>
                    </div>
                 </div>

                 <section className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                    <div className={`absolute top-0 right-0 w-32 h-32 ${STAGE_COLORS[selectedAppt.stage].dot} opacity-20 blur-[60px] transition-all`}></div>
                    <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-8">Comercial</h3>
                    <div className="flex items-baseline gap-2 mb-10">
                       <input type="number" className="text-6xl font-black bg-transparent outline-none w-40 [appearance:textfield] focus:text-blue-400 transition-colors" value={selectedAppt.expected_revenue} onChange={e => setSelectedAppt({...selectedAppt, expected_revenue: Number(e.target.value)})} />
                       <span className="text-3xl font-black text-slate-500">€</span>
                    </div>
                    <div className="space-y-8">
                       <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase block mb-4 tracking-widest">Etapa do Funil</label>
                          <select 
                            className={`w-full bg-slate-800 text-white rounded-2xl px-5 py-4.5 text-xs font-black uppercase border border-slate-700 outline-none appearance-none cursor-pointer hover:bg-slate-700 transition-all`} 
                            value={selectedAppt.stage} 
                            onChange={e => setSelectedAppt({...selectedAppt, stage: e.target.value as ApptStage})}
                          >
                             {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                       </div>
                       <div>
                          <div className="flex justify-between mb-4">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Probabilidade</label>
                             <span className="text-sm font-black text-blue-400">{selectedAppt.probability}%</span>
                          </div>
                          <input type="range" className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer" min="0" max="100" value={selectedAppt.probability} onChange={e => setSelectedAppt({...selectedAppt, probability: Number(e.target.value)})} />
                       </div>
                    </div>
                 </section>

                 <div className="p-8 bg-blue-50/50 rounded-[3rem] border border-blue-100 space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center"><BellRing size={16} className="mr-2" /> Lembrete 1h Antes</h3>
                       <button onClick={() => setSelectedAppt({...selectedAppt, reminder_enabled: !selectedAppt.reminder_enabled})} className={`w-12 h-6 rounded-full transition-all relative ${selectedAppt.reminder_enabled ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${selectedAppt.reminder_enabled ? 'left-7' : 'left-1'}`}></div></button>
                    </div>
                    {selectedAppt.reminder_enabled && (
                       <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <p className="text-[9px] font-bold text-blue-400 leading-tight">Avisaremos automaticamente via e-mail antes do serviço.</p>
                          <div className="bg-white p-3 rounded-xl border border-blue-100 flex items-center shadow-sm">
                             <Mail size={14} className="text-blue-300 mr-2" />
                             <input className="w-full bg-transparent text-[11px] font-black outline-none text-slate-700" placeholder="Email para destino" value={selectedAppt.reminder_email || ''} onChange={e => setSelectedAppt({...selectedAppt, reminder_email: e.target.value})} />
                          </div>
                          {selectedAppt.reminder_sent && ( <div className="flex items-center gap-2 text-[8px] font-black text-emerald-600 uppercase"> <CheckCircle2 size={12} /> Lembrete enviado com sucesso </div> )}
                       </div>
                    )}
                 </div>
              </div>

              <div className="col-span-8 space-y-10">
                 <div className="grid grid-cols-2 gap-8 p-8 bg-slate-50 rounded-[3rem] border border-slate-100 pr-5">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-4 ml-1 tracking-widest">Serviço</p>
                       <div className="relative">
                         <select className="w-full bg-blue-600 text-white rounded-[1.5rem] px-6 py-5 text-xs font-black uppercase shadow-xl shadow-blue-50 border-none outline-none appearance-none cursor-pointer hover:bg-blue-700 transition-all" value={selectedAppt.service_type} onChange={e => setSelectedAppt({...selectedAppt, service_type: e.target.value})}>
                            {["Pesquisa de Fuga", "Desentupimentos", "Limpeza de Fossas", "Reparação Canalização", "Inspeção de Vídeo", "Outros"].map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                         </select>
                         <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" size={18}/>
                       </div>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-4 ml-1 tracking-widest">Agenda</p>
                       <div className="bg-white border border-slate-200 rounded-[2.5rem] p-5 flex flex-col space-y-5 shadow-sm">
                          <div className="flex items-center gap-4 text-xs font-black text-slate-700 px-2">
                            <CalendarIcon size={18} className="text-blue-600"/>
                            <input type="date" className="bg-transparent outline-none w-full cursor-pointer font-black" value={selectedAppt.scheduled_at} onChange={e => setSelectedAppt({...selectedAppt, scheduled_at: e.target.value})} />
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-100 pt-4 gap-2">
                             <div className="flex-1 bg-blue-50 border border-blue-100 rounded-full py-2 px-3 flex items-center justify-center gap-2 group hover:bg-blue-100 transition-all">
                                <Clock size={16} className="text-blue-600 shrink-0 cursor-pointer" onClick={() => startTimeRef.current?.showPicker()} />
                                <input ref={startTimeRef} type="time" className="bg-transparent text-blue-900 font-black text-base outline-none w-full text-center cursor-text" value={selectedAppt.start_time || ''} onChange={e => setSelectedAppt({...selectedAppt, start_time: e.target.value})} />
                             </div>
                             <span className="text-[8px] font-black text-slate-300 uppercase shrink-0">Até</span>
                             <div className="flex-1 bg-slate-50 border border-slate-200 rounded-full py-2 px-3 flex items-center justify-center gap-2 group hover:bg-slate-100 transition-all">
                                <Clock size={16} className="text-slate-500 shrink-0 cursor-pointer" onClick={() => endTimeRef.current?.showPicker()} />
                                <input ref={endTimeRef} type="time" className="bg-transparent text-slate-800 font-black text-base outline-none w-full text-center cursor-text" value={selectedAppt.end_time || ''} onChange={e => setSelectedAppt({...selectedAppt, end_time: e.target.value})} />
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center px-4"><StickyNote className="mr-3 text-blue-600" size={18} /> Notas Técnicas</h3>
                    <textarea className="w-full h-48 bg-slate-50/50 border border-slate-100 rounded-[2.5rem] p-8 text-slate-700 font-bold text-sm leading-relaxed outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-blue-200 transition-all placeholder:text-slate-300 shadow-inner" placeholder="Detalhes técnicos aqui..." value={selectedAppt.notes} onChange={e => setSelectedAppt({...selectedAppt, notes: e.target.value})} />
                 </div>
                 <div className="bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100">
                    <div className="flex items-center justify-between mb-8 px-4">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center"><Upload className="mr-3 text-blue-600" size={18}/> Anexos (Imagens/PDF)</h3>
                       <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all shadow-lg shadow-blue-100 disabled:opacity-50">{isUploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16}/>} Adicionar Ficheiros</button>
                       <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,application/pdf" onChange={handleFileUpload} />
                    </div>
                    {selectedAppt.attachments && selectedAppt.attachments.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {selectedAppt.attachments.map((file, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm group relative hover:border-blue-400 transition-all">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl shrink-0 ${file.type.includes('pdf') ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>{file.type.includes('pdf') ? <File size={18} /> : <ImageIcon size={18} />}</div>
                              <div className="flex-1 min-w-0"><p className="text-[10px] font-black text-slate-800 truncate mb-0.5">{file.name}</p><p className="text-[8px] font-bold text-slate-400 uppercase">{file.size}</p></div>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                              <a href={file.url} target="_blank" rel="noreferrer" className="flex-1 text-center py-1.5 bg-slate-50 text-slate-600 text-[8px] font-black uppercase rounded-lg hover:bg-blue-600 hover:text-white transition-all">Abrir</a>
                              <button onClick={() => removeAttachment(idx)} className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={12}/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white/50 shadow-inner"><div className="bg-slate-100 p-4 rounded-full mb-3 text-slate-300"><FileText size={24}/></div><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sem ficheiros carregados</p></div>
                    )}
                 </div>
              </div>
            </div>

            <footer className="px-10 py-6 border-t bg-slate-50/30 flex items-center justify-between">
              <div className="flex items-center space-x-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]"><ShieldCheck size={18} className="text-emerald-500" /> Smart CRM v5.2 Platinum + IA</div>
              <div className="flex items-center space-x-4">
                 <button onClick={() => handleSendConfirmationEmail(selectedAppt)} disabled={isGeneratingEmail} className="px-8 py-5 bg-white border border-slate-200 text-slate-700 rounded-[1.5rem] font-black text-xs uppercase shadow-sm flex items-center gap-3 hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-95 disabled:opacity-50">{isGeneratingEmail ? <Loader2 className="animate-spin text-blue-600" size={18} /> : <Mail size={18} className="text-blue-600" />}{isGeneratingEmail ? 'A preparar...' : 'Confirmar Cliente'}</button>
                 <button onClick={(e) => { e.stopPropagation(); handleGenerateOS(selectedAppt); }} className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black text-xs shadow-xl shadow-blue-50/50 flex items-center gap-4 transition-all active:scale-95"><ClipboardList size={20}/> Gerar OS p/ Técnico</button>
                 <button onClick={() => setSelectedAppt(null)} className="px-12 py-5 bg-slate-900 hover:bg-black text-white rounded-[1.5rem] font-black text-xs shadow-xl transition-all active:scale-95">Guardar e Sair</button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {isTechModalOpen && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white">
            <div className="p-8 bg-blue-50 border-b border-blue-100 flex items-center justify-between"><h3 className="text-xl font-black text-blue-800 tracking-tight">Ordem de Serviço Pronta</h3><button onClick={() => setIsTechModalOpen(false)} className="text-blue-400 hover:text-blue-600 transition-colors"><X size={24}/></button></div>
            <div className="p-8 space-y-6"><div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 font-mono text-xs whitespace-pre-wrap text-slate-700 leading-relaxed max-h-96 overflow-y-auto shadow-inner">{techMessage}</div><button onClick={() => { navigator.clipboard.writeText(techMessage); setCopiedTech(true); setTimeout(() => setCopiedTech(false), 2000); }} className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 ${copiedTech ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-slate-900 text-white hover:bg-black shadow-slate-100'}`}>{copiedTech ? <Check size={20}/> : <Copy size={20}/>}<span>{copiedTech ? 'Copiado com Sucesso!' : 'Copiar para WhatsApp'}</span></button></div>
          </div>
        </div>
      )}

      {isAIModalOpen && <AIModal onClose={() => setIsAIModalOpen(false)} onSave={(t, c, cat) => { supabase.from('responses').insert({title: t, content: c, category: cat, last_updated: Date.now()}).then(loadLibrary); setIsAIModalOpen(false); }} />}
      {isFormModalOpen && <ResponseFormModal isOpen={isFormModalOpen} onClose={() => {setIsFormModalOpen(false); setEditingResponse(null);}} onSave={(d) => { if(editingResponse) supabase.from('responses').update({...d, last_updated: Date.now()}).eq('id', editingResponse.id).then(loadLibrary); else supabase.from('responses').insert({...d, last_updated: Date.now()}).then(loadLibrary); setIsFormModalOpen(false); }} initialData={editingResponse} />}
      {isApptModalOpen && <AppointmentModal onClose={() => setIsApptModalOpen(false)} onSave={loadCRM} />}
    </div>
  );
};

export default App;
