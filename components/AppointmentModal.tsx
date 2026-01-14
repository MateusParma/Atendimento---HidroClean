
import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, User, MapPin, Save, RefreshCw, DollarSign, Phone, Clock, AlertTriangle, CheckCircle2, FileText, Briefcase } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { ApptStage, Appointment } from '../types';

interface AppointmentModalProps {
  onClose: () => void;
  onSave: () => void;
  preSelectedDate?: string;
}

const STAGES: ApptStage[] = [
  'Leads', 'Visita Técnica', 'Orçamentos a Fazer', 'Relatórios a Fazer',
  'Aguardando Resposta', 'Serviços a Fazer', 'Em Execução', 'Retrabalho',
  'A Receber', 'Concluído', 'Recusados'
];

const SERVICE_TYPES = [
  'Pesquisa de Fuga',
  'Desentupimentos',
  'Limpeza de Fossas',
  'Reparação Canalização',
  'Inspeção de Vídeo',
  'Outros'
];

const AppointmentModal: React.FC<AppointmentModalProps> = ({ onClose, onSave, preSelectedDate }) => {
  const [loading, setLoading] = useState(false);
  const [existingAppts, setExistingAppts] = useState<Appointment[]>([]);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    phone: '',
    email: '',
    nif: '',
    address: '',
    service_type: SERVICE_TYPES[0],
    notes: '',
    date: preSelectedDate || new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '11:00',
    stage: 'Leads' as ApptStage,
    expected_revenue: '',
    probability: '50',
  });

  useEffect(() => {
    const fetchDayAppts = async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('scheduled_at', formData.date);
        if (error) throw error;
        if (data) setExistingAppts(data);
      } catch (e) {
        console.error("Erro ao buscar agendamentos do dia:", e);
      }
    };
    fetchDayAppts();
  }, [formData.date]);

  useEffect(() => {
    if (formData.end_time <= formData.start_time) {
      setTimeError("O horário de término deve ser posterior ao de início.");
    } else {
      setTimeError(null);
    }
    const hasConflict = existingAppts.some(appt => {
      const newStart = formData.start_time;
      const newEnd = formData.end_time;
      const existStart = appt.start_time || "00:00";
      const existEnd = appt.end_time || "23:59";
      return (newStart < existEnd) && (newEnd > existStart);
    });
    if (hasConflict) setConflictError("Já existe um serviço agendado neste intervalo.");
    else setConflictError(null);
  }, [formData.start_time, formData.end_time, formData.date, existingAppts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (conflictError || timeError) return;
    setLoading(true);
    try {
      const apptId = `appt_${Math.random().toString(36).substr(2, 9)}`;
      const payload: any = {
        id: apptId,
        customer_id: `cust_${Math.random().toString(36).substr(2, 6)}`,
        customer_name: formData.name,
        company_name: formData.company_name,
        service_type: formData.service_type,
        description: formData.address,
        notes: formData.notes,
        scheduled_at: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        stage: formData.stage,
        expected_revenue: parseFloat(formData.expected_revenue) || 0,
        price: parseFloat(formData.expected_revenue) || 0,
        probability: parseInt(formData.probability) || 50,
        phone: formData.phone,
        email: formData.email,
        nif: formData.nif,
        status: 'Pendente',
        attachments: []
      };
      let { error } = await supabase.from('appointments').insert([payload]);
      if (error) throw error;
      onSave();
      onClose();
    } catch (err: any) {
      console.error("Erro fatal Supabase:", err);
      alert(`Falha ao criar lead: ${err.message || 'Erro de rede.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#F8FAFC] rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] border border-white">
        <div className="px-10 py-8 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-5">
             <div className="w-14 h-14 bg-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-blue-100"><CalendarIcon className="text-white" size={28} /></div>
             <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Criar Novo Lead</h2>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Agendamento Inteligente</p>
             </div>
          </div>
          <button type="button" onClick={onClose} className="w-12 h-12 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-full flex items-center justify-center text-slate-400 transition-all"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto no-scrollbar flex-1">
          <div className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 space-y-8">
               <div className="space-y-6">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center"><User size={14} className="mr-2 text-blue-600" /> Cliente</h3>
                 <div className="grid grid-cols-1 gap-5">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="group bg-white p-4 rounded-2xl border border-slate-200 focus-within:border-blue-500 transition-all shadow-sm">
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Nome Principal</label>
                            <input required className="w-full bg-transparent text-slate-800 font-bold outline-none text-base" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="João Silva" />
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm focus-within:border-blue-500 transition-all">
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Empresa</label>
                            <div className="flex items-center"><Briefcase size={14} className="text-slate-300 mr-2" /><input className="w-full bg-transparent text-slate-800 font-bold outline-none" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} placeholder="Nome da empresa" /></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm focus-within:border-blue-500 transition-all">
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Telefone</label>
                            <div className="flex items-center"><Phone size={14} className="text-slate-300 mr-2" /><input required className="w-full bg-transparent text-slate-800 font-bold outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="9xx xxx xxx" /></div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm focus-within:border-blue-500 transition-all">
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">NIF</label>
                            <div className="flex items-center"><FileText size={14} className="text-slate-300 mr-2" /><input className="w-full bg-transparent text-slate-800 font-bold outline-none" value={formData.nif} onChange={e => setFormData({...formData, nif: e.target.value})} placeholder="Contribuinte" /></div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"><label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Morada</label><div className="flex items-start"><MapPin size={16} className="text-blue-600 mr-2 mt-1" /><textarea required rows={1} className="w-full bg-transparent text-slate-800 font-bold outline-none resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Localidade..." /></div></div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"><label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Serviço</label><div className="flex flex-wrap gap-2">{SERVICE_TYPES.map(type => (<button key={type} type="button" onClick={() => setFormData({...formData, service_type: type})} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${formData.service_type === type ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}`}>{type}</button>))}</div></div>
                 </div>
               </div>
            </div>
            <div className="lg:col-span-5 space-y-8">
               <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden h-full">
                  <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-6 flex items-center"><Clock size={16} className="mr-2" /> Agenda & Comercial</h3>
                  <div className="space-y-6">
                    <div><label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Data</label><div className="bg-slate-800 rounded-2xl p-4 flex items-center border border-slate-700"><CalendarIcon size={18} className="text-blue-400 mr-3" /><input type="date" className="bg-transparent text-white font-bold outline-none w-full [color-scheme:dark]" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Início</label><input type="time" className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold outline-none [color-scheme:dark]" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} /></div>
                        <div><label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Fim</label><input type="time" className={`w-full bg-slate-800 border rounded-2xl p-4 text-white font-bold outline-none [color-scheme:dark] transition-all ${timeError ? 'border-red-500' : 'border-slate-700'}`} value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} /></div>
                    </div>
                    {(timeError || conflictError) && (<div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl flex items-start space-x-3"><AlertTriangle className="text-red-500 shrink-0" size={20} /><p className="text-[11px] font-bold text-red-200 leading-tight">{timeError || conflictError}</p></div>)}
                    <div className="pt-4 border-t border-slate-800 space-y-4">
                        <div className="flex items-center space-x-3">
                            <div className="flex-1"><label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Valor Estimado (€)</label><div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex items-center"><DollarSign size={16} className="text-blue-400 mr-2" /><input type="number" className="bg-transparent text-white font-black outline-none w-full" value={formData.expected_revenue} onChange={e => setFormData({...formData, expected_revenue: e.target.value})} /></div></div>
                            <div className="w-1/2"><label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Etapa</label><select className="w-full bg-slate-800 text-white rounded-2xl p-4 border border-slate-700 font-bold outline-none text-[10px] uppercase" value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value as ApptStage})}>{STAGES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                        </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
          <div className="p-10 bg-white border-t border-slate-100 flex justify-end sticky bottom-0">
            <div className="flex space-x-4">
               <button type="button" onClick={onClose} className="px-8 py-4 text-slate-400 font-black text-sm hover:text-slate-600 transition-colors">Cancelar</button>
               <button type="submit" disabled={loading || !!timeError || !!conflictError} className="px-12 py-4 rounded-2xl font-black text-white shadow-2xl flex items-center space-x-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700">{loading ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}<span>Criar Lead</span></button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;
