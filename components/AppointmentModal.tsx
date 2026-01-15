
import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar as CalendarIcon, User, Briefcase, MapPin, Save, FileText, DollarSign, ChevronDown, TrendingUp, Clock, AlertCircle, Bug, Copy } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { Appointment } from '../types';

// Função utilitária para gerar UUID v4 caso o banco falhe ou receba null
const cryptoUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface AppointmentModalProps {
  onClose: () => void;
  onSave: () => void;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({ onClose, onSave }) => {
  const [existingAppts, setExistingAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [debugError, setDebugError] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    company_name: '',
    service_type: 'Pesquisa de Fuga',
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

  const availableSlots = useMemo(() => {
    const slots = [];
    const busyTimes = existingAppts.map(a => ({
      start: a.start_time || '00:00',
      end: a.end_time || '23:59'
    }));

    for (let h = 8; h <= 18; h++) {
      const time = `${h.toString().padStart(2, '0')}:00`;
      const isBusy = busyTimes.some(b => time >= b.start && time < b.end);
      if (!isBusy) slots.push(time);
    }
    return slots.slice(0, 5);
  }, [existingAppts]);

  const timeError = useMemo(() => {
    if (formData.start_time >= formData.end_time) {
      return "O horário de fim deve ser após o início.";
    }
    return null;
  }, [formData.start_time, formData.end_time]);

  const handleSave = async () => {
    if (!formData.customer_name.trim()) {
      alert("Por favor, introduza o nome do cliente.");
      return;
    }
    
    setLoading(true);
    setDebugError(null);

    // Gerar um ID único no frontend para evitar o erro de violação de restrição NOT NULL (23502)
    const newId = cryptoUUID();

    const payload = {
      id: newId,
      customer_name: formData.customer_name.trim(),
      company_name: formData.company_name.trim() || null,
      service_type: formData.service_type || 'Outros',
      description: formData.description.trim() || 'Sem morada definida',
      notes: formData.notes.trim() || null,
      scheduled_at: formData.scheduled_at,
      start_time: formData.start_time || '09:00',
      end_time: formData.end_time || '10:00',
      expected_revenue: Number(formData.expected_revenue) || 0,
      price: Number(formData.expected_revenue) || 0,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      nif: formData.nif.trim() || null,
      stage: formData.stage || 'Leads',
      probability: Number(formData.probability) || 50,
      status: 'Pendente',
      attachments: []
    };

    try {
      const { error } = await supabase
        .from('appointments')
        .insert(payload);
      
      if (error) {
        console.error("Erro Supabase:", error);
        setDebugError(error);
      } else {
        onSave();
        onClose();
      }
    } catch (err: any) {
      setDebugError({ 
        message: err.message || "Exceção de Rede", 
        details: "Verifique a conexão com o novo projeto Supabase." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#F8FAFC] rounded-[3rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh] border border-white">
        <header className="px-8 py-5 border-b flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-4">
             <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100"><User size={20}/></div>
             <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Novo Lead</h2>
                <p className="text-[9px] font-bold text-blue-600 uppercase tracking-[0.2em] mt-1">Novo Projeto Supabase</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X size={20}/></button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-white">
          {debugError && (
            <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-[2rem] animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 text-red-700">
                  <Bug size={24} />
                  <h3 className="font-black uppercase text-sm tracking-widest">Erro no Novo Projeto</h3>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(debugError, null, 2));
                    alert("Erro copiado!");
                  }}
                  className="bg-red-100 text-red-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2"
                >
                  <Copy size={14} /> Copiar Erro
                </button>
              </div>
              
              <pre className="bg-white/50 p-4 rounded-2xl border border-red-100 font-mono text-[11px] text-red-800 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(debugError, null, 2)}
              </pre>

              <div className="mt-4 p-4 bg-white rounded-xl border border-red-200">
                <p className="text-xs font-bold text-slate-700">Análise do Sistema:</p>
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                  Se vir o erro "relation does not exist", certifique-se de que executou o SQL completo no SQL Editor do novo projeto Supabase.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-7 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Cliente Principal</label>
                     <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3 focus-within:border-blue-500 transition-all">
                        <User size={16} className="text-slate-400 shrink-0"/>
                        <input className="w-full bg-transparent font-bold text-slate-800 outline-none text-sm" placeholder="Nome do Cliente" value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Empresa</label>
                     <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3 focus-within:border-blue-500 transition-all">
                        <Briefcase size={16} className="text-slate-400 shrink-0"/>
                        <input className="w-full bg-transparent font-bold text-slate-800 outline-none text-sm" placeholder="Nome da Empresa" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Telemóvel</label>
                     <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none text-sm focus:border-blue-500" placeholder="912..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Email</label>
                     <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none text-sm focus:border-blue-500" placeholder="Email..." value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">NIF</label>
                     <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none text-sm focus:border-blue-500" placeholder="Contribuinte" value={formData.nif} onChange={e => setFormData({...formData, nif: e.target.value})} />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Morada do Serviço</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-start gap-3 focus-within:border-blue-500 transition-all">
                    <MapPin size={16} className="text-blue-600 mt-1 shrink-0"/>
                    <textarea className="w-full bg-transparent font-bold text-slate-800 outline-none text-sm resize-none" rows={2} placeholder="Localização completa..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Notas do Serviço / Observações</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-start gap-3 focus-within:border-blue-500 transition-all">
                    <FileText size={16} className="text-slate-400 mt-1 shrink-0"/>
                    <textarea className="w-full bg-transparent font-bold text-slate-800 outline-none text-sm resize-none" rows={3} placeholder="Acessos, detalhes técnicos..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Tipo de Serviço</label>
                     <div className="relative">
                       <select className="w-full bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl px-4 py-3 font-black text-xs uppercase outline-none appearance-none cursor-pointer pr-10" value={formData.service_type} onChange={e => setFormData({...formData, service_type: e.target.value})}>
                          {["Pesquisa de Fuga", "Desentupimentos", "Limpeza de Fossas", "Reparação Canalização", "Inspeção de Vídeo", "Outros"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                       </select>
                       <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none"/>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor Estimado (€)</label>
                     <div className="bg-slate-900 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-inner">
                        <DollarSign size={16} className="text-blue-400 shrink-0"/>
                        <input type="number" className="w-full bg-transparent font-black text-white outline-none text-sm" value={formData.expected_revenue} onChange={e => setFormData({...formData, expected_revenue: Number(e.target.value)})} />
                     </div>
                  </div>
               </div>
            </div>

            <div className="col-span-12 lg:col-span-5">
              <div className="bg-slate-50 rounded-[2.5rem] p-6 border border-slate-200 h-full flex flex-col">
                <div className="flex-1 space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <CalendarIcon size={14} className="text-blue-600"/> Agenda do Lead
                  </h3>
                  
                  <div className="space-y-5">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Agendamento</label>
                       <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3 focus-within:border-blue-500 transition-all">
                          <CalendarIcon size={16} className="text-blue-600 shrink-0"/>
                          <input type="date" className="w-full bg-transparent font-bold text-slate-800 outline-none text-sm" value={formData.scheduled_at} onChange={e => setFormData({...formData, scheduled_at: e.target.value})} />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Início</label>
                          <div className={`bg-white border rounded-2xl pl-4 pr-2 py-2 flex items-center justify-between transition-all group ${timeError ? 'border-red-300' : 'border-slate-200 focus-within:border-blue-500'}`}>
                             <input type="time" className="bg-transparent font-black text-slate-800 outline-none text-lg text-center w-full" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                             <div className="bg-blue-50 p-2 rounded-xl text-blue-600 shrink-0"><Clock size={16} /></div>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Até (Fim)</label>
                          <div className={`bg-white border rounded-2xl pl-4 pr-2 py-2 flex items-center justify-between transition-all group ${timeError ? 'border-red-300' : 'border-slate-200 focus-within:border-blue-500'}`}>
                             <input type="time" className="bg-transparent font-black text-slate-800 outline-none text-lg text-center w-full" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                             <div className="bg-blue-50 p-2 rounded-xl text-blue-600 shrink-0"><Clock size={16} /></div>
                          </div>
                       </div>
                    </div>

                    {timeError && (
                      <div className="bg-red-50 text-red-600 p-3 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-tight animate-in slide-in-from-top-2">
                        <AlertCircle size={16}/> {timeError}
                      </div>
                    )}

                    <div className="space-y-3">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Próximos Horários Disponíveis</label>
                       <div className="flex flex-wrap gap-2">
                          {availableSlots.length > 0 ? availableSlots.map(time => (
                            <button 
                              key={time}
                              type="button"
                              onClick={() => {
                                const [h, m] = time.split(':').map(Number);
                                const endH = h + 2;
                                setFormData({
                                  ...formData, 
                                  start_time: time,
                                  end_time: `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
                                });
                              }}
                              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            >
                              {time}
                            </button>
                          )) : (
                            <p className="text-[10px] font-bold text-slate-400">Sem horários livres nesta data.</p>
                          )}
                       </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-blue-600 rounded-[2rem] text-white shadow-xl shadow-blue-100 flex items-center justify-between shrink-0">
                   <div>
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Status Inicial</p>
                      <p className="text-lg font-black uppercase tracking-tight">Lead Iniciado</p>
                   </div>
                   <div className="bg-white/20 p-3 rounded-xl">
                      <TrendingUp size={24}/>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="px-10 py-6 border-t bg-slate-50 flex justify-end items-center space-x-4 shrink-0">
           <button type="button" onClick={onClose} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors" disabled={loading}>Cancelar</button>
           <button 
             type="button"
             onClick={handleSave} 
             disabled={loading}
             className={`px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 transition-all active:scale-95 bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700 disabled:opacity-50`}
           >
             <Save size={18}/> 
             {loading ? 'A sincronizar...' : 'Criar Lead no Novo Projeto'}
           </button>
        </footer>
      </div>
    </div>
  );
};

export default AppointmentModal;
