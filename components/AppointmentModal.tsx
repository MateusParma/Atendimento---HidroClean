
import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar as CalendarIcon, User, Briefcase, MapPin, Save, FileText, DollarSign, ChevronDown, TrendingUp, Clock, AlertCircle, Bug, Copy, ShieldAlert, AlertTriangle, PlusCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { Appointment } from '../types';

const cryptoUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const DEFAULT_SERVICES = [
  "Pesquisa de Fuga", 
  "Desentupimentos", 
  "Limpeza de Fossas", 
  "Canalização",
  "Remodelação",
  "Reparação Canalização", 
  "Inspeção de Vídeo"
];

interface AppointmentModalProps {
  onClose: () => void;
  onSave: () => void;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({ onClose, onSave }) => {
  const [existingAppts, setExistingAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [debugError, setDebugError] = useState<any>(null);
  const [isCustomService, setIsCustomService] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    company_name: '',
    service_type: DEFAULT_SERVICES[0],
    custom_service_name: '',
    description: '',
    notes: '',
    scheduled_at: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '11:00',
    expected_revenue: 0,
    phone: '',
    email: '',
    nif: '',
    stage: 'Leads' as const,
    probability: 50
  });

  useEffect(() => {
    const fetchDayAppts = async () => {
      try {
        const { data } = await supabase
          .from('appointments')
          .select('*')
          .eq('scheduled_at', formData.scheduled_at);
        if (data) setExistingAppts(data as Appointment[]);
      } catch (err) {
        console.error("Erro ao buscar agendamentos:", err);
      }
    };
    fetchDayAppts();
  }, [formData.scheduled_at]);

  const validation = useMemo(() => {
    const start = formData.start_time;
    const end = formData.end_time;
    if (start >= end) return { isValid: false, message: "A hora de fim deve ser posterior à hora de início." };
    const conflict = existingAppts.find(a => {
      const aStart = a.start_time || '00:00';
      const aEnd = a.end_time || '23:59';
      return (start < aEnd && end > aStart);
    });
    if (conflict) return { isValid: false, message: `Conflito! Já existe um serviço (${conflict.service_type}) agendado para ${conflict.customer_name} neste horário.` };
    return { isValid: true, message: null };
  }, [formData.start_time, formData.end_time, existingAppts]);

  const availableSlots = useMemo(() => {
    const slots = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
    return slots.map(time => {
      const [h, m] = time.split(':').map(Number);
      const endTime = `${(h + 2).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      const hasConflict = existingAppts.some(a => (time < (a.end_time || '23:59') && endTime > (a.start_time || '00:00')));
      return { time, endTime, hasConflict };
    });
  }, [existingAppts]);

  const handleSave = async () => {
    if (!formData.customer_name.trim()) { alert("Nome do cliente obrigatório."); return; }
    if (!validation.isValid) { alert(validation.message); return; }
    
    setLoading(true);
    const finalServiceType = isCustomService ? formData.custom_service_name.trim() : formData.service_type;
    
    if (!finalServiceType) { alert("Defina o tipo de serviço."); setLoading(false); return; }

    const payload = {
      id: cryptoUUID(),
      customer_name: formData.customer_name.trim(),
      company_name: formData.company_name.trim() || null,
      service_type: finalServiceType,
      description: formData.description.trim() || 'Sem morada',
      notes: formData.notes.trim() || null,
      scheduled_at: formData.scheduled_at,
      start_time: formData.start_time,
      end_time: formData.end_time,
      expected_revenue: Number(formData.expected_revenue) || 0,
      price: Number(formData.expected_revenue) || 0,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      nif: formData.nif.trim() || null,
      stage: formData.stage,
      probability: Number(formData.probability) || 50,
      status: 'Pendente',
      attachments: []
    };

    try {
      const { error } = await supabase.from('appointments').insert(payload);
      if (error) setDebugError(error);
      else { onSave(); onClose(); }
    } catch (err: any) {
      setDebugError(err);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="bg-[#F8FAFC] rounded-[3rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh] border border-white">
        <header className="px-8 py-5 border-b flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-4">
             <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg"><User size={20}/></div>
             <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Novo Lead Hidro Clean</h2>
                <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-1">Gestão de Conflitos & Serviços Dinâmicos</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X size={20}/></button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-white">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-7 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Cliente Principal</label>
                     <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                        <User size={16} className="text-slate-400"/>
                        <input className="w-full bg-transparent font-bold text-slate-800 outline-none text-sm" placeholder="Nome do Cliente" value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Empresa (Opcional)</label>
                     <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                        <Briefcase size={16} className="text-slate-400"/>
                        <input className="w-full bg-transparent font-bold text-slate-800 outline-none text-sm" placeholder="Nome da Empresa" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none text-sm" placeholder="Telemóvel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none text-sm" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none text-sm" placeholder="NIF" value={formData.nif} onChange={e => setFormData({...formData, nif: e.target.value})} />
               </div>

               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Morada do Serviço</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                     <MapPin size={16} className="text-slate-400"/>
                     <input className="w-full bg-transparent font-bold text-slate-800 outline-none text-sm" placeholder="Localização completa..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/30 p-6 rounded-[2.5rem] border border-blue-100">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest ml-2">Tipo de Serviço</label>
                     <div className="relative">
                        <select 
                          className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 font-black text-slate-800 outline-none text-xs uppercase appearance-none cursor-pointer" 
                          value={isCustomService ? "CUSTOM" : formData.service_type} 
                          onChange={e => {
                            if (e.target.value === "CUSTOM") {
                              setIsCustomService(true);
                            } else {
                              setIsCustomService(false);
                              setFormData({...formData, service_type: e.target.value});
                            }
                          }}
                        >
                           {DEFAULT_SERVICES.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                           <option value="CUSTOM" className="text-blue-600 font-black">+ ADICIONAR NOVO TIPO</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/>
                     </div>
                  </div>
                  
                  {isCustomService ? (
                    <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                      <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest ml-2">Nome do Novo Serviço</label>
                      <div className="bg-white border-2 border-emerald-200 rounded-2xl px-4 py-2.5 flex items-center gap-3">
                        <PlusCircle size={16} className="text-emerald-500"/>
                        <input 
                          className="w-full bg-transparent font-black text-slate-800 outline-none text-sm" 
                          placeholder="Ex: Instalação de Painéis" 
                          value={formData.custom_service_name} 
                          onChange={e => setFormData({...formData, custom_service_name: e.target.value})} 
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor Estimado (€)</label>
                       <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-3">
                          <DollarSign size={16} className="text-blue-400"/>
                          <input type="number" className="w-full bg-transparent font-black text-white outline-none text-sm" placeholder="0" value={formData.expected_revenue} onChange={e => setFormData({...formData, expected_revenue: Number(e.target.value)})} />
                       </div>
                    </div>
                  )}
               </div>

               {isCustomService && (
                 <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Valor (€)</label>
                    <input type="number" className="w-full bg-transparent font-black text-white outline-none text-sm" placeholder="0" value={formData.expected_revenue} onChange={e => setFormData({...formData, expected_revenue: Number(e.target.value)})} />
                 </div>
               )}

               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Observações Técnicas</label>
                  <textarea className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-4 font-bold text-slate-800 outline-none text-sm h-32 resize-none" placeholder="Acessos, detalhes..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
               </div>
            </div>

            <div className="col-span-12 lg:col-span-5 space-y-6">
               <div className={`p-8 rounded-[3rem] border transition-all ${validation.isValid ? 'bg-slate-50 border-slate-100' : 'bg-red-50 border-red-200 shadow-xl shadow-red-50'}`}>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center">
                    <CalendarIcon size={16} className="mr-2 text-blue-600"/> Agenda de Serviço
                  </h3>
                  
                  <div className="space-y-6">
                    <input type="date" className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-black text-slate-800 outline-none shadow-sm" value={formData.scheduled_at} onChange={e => setFormData({...formData, scheduled_at: e.target.value})} />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-4 flex items-center justify-between shadow-sm">
                         <input type="time" className="bg-transparent font-black text-slate-800 outline-none w-full" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                         <Clock size={16} className="text-blue-400"/>
                      </div>
                      <div className={`border rounded-2xl px-4 py-4 flex items-center justify-between shadow-sm ${formData.start_time >= formData.end_time ? 'bg-red-100 border-red-300' : 'bg-white border-slate-200'}`}>
                         <input type="time" className="bg-transparent font-black text-slate-800 outline-none w-full" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                         <Clock size={16} className="text-blue-400"/>
                      </div>
                    </div>

                    {!validation.isValid && (
                      <div className="bg-red-600 text-white p-4 rounded-2xl flex items-start gap-3 animate-pulse shadow-lg">
                        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                        <p className="text-[10px] font-black uppercase tracking-tight">{validation.message}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Horários Livres Sugeridos</label>
                      <div className="flex flex-wrap gap-2">
                        {availableSlots.map(slot => (
                          <button 
                            key={slot.time}
                            disabled={slot.hasConflict}
                            onClick={() => setFormData({ ...formData, start_time: slot.time, end_time: slot.endTime })}
                            className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all border ${
                              formData.start_time === slot.time 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                              : slot.hasConflict 
                                ? 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
               </div>

               <div className="bg-blue-600 p-8 rounded-[3rem] text-white flex items-center justify-between shadow-xl shadow-blue-100">
                  <div>
                    <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Status do Lead</p>
                    <h4 className="text-2xl font-black uppercase">Novo Projeto</h4>
                  </div>
                  <div className="bg-white/20 p-4 rounded-2xl"><TrendingUp size={24}/></div>
               </div>
            </div>
          </div>
        </div>

        <footer className="px-8 py-6 border-t bg-slate-50 flex items-center justify-between">
           <button onClick={onClose} className="text-xs font-black text-slate-400 uppercase tracking-widest">Cancelar</button>
           <button 
             onClick={handleSave} 
             disabled={loading || !validation.isValid}
             className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-blue-100 active:scale-95 disabled:grayscale"
           >
             {loading ? <Clock className="animate-spin" size={18}/> : <Save size={18}/>}
             <span>{loading ? 'A Guardar...' : 'Criar Novo Agendamento'}</span>
           </button>
        </footer>
      </div>
    </div>
  );
};

export default AppointmentModal;
