
import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, User, Briefcase, MapPin, Save, FileText, DollarSign, ChevronDown, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface AppointmentModalProps {
  onClose: () => void;
  onSave: () => void;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    company_name: '',
    service_type: 'Pesquisa de Fuga',
    description: '',
    scheduled_at: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '11:00',
    expected_revenue: 0,
    phone: '',
    email: '',
    nif: '',
    stage: 'Leads'
  });

  const handleSave = async () => {
    const { error } = await supabase.from('appointments').insert([formData]);
    if (!error) {
      onSave();
      onClose();
    } else {
      alert('Erro ao guardar lead');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#F8FAFC] rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border border-white">
        <header className="px-8 py-5 border-b flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-4">
             <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100"><User size={20}/></div>
             <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Novo Lead</h2>
                <p className="text-[9px] font-bold text-blue-600 uppercase tracking-[0.2em] mt-1">Entrada de Pipeline</p>
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
                    <textarea className="w-full bg-transparent font-bold text-slate-800 outline-none text-sm resize-none" rows={3} placeholder="Localização completa..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
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
              <div className="bg-slate-50 rounded-[2.5rem] p-6 border border-slate-200 h-full flex flex-col min-h-[300px]">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block sm:text-left">Início</label>
                          <div className="bg-white border border-slate-200 rounded-2xl pl-4 pr-2 py-2 flex items-center justify-between focus-within:border-blue-500 transition-all group">
                             <input type="time" className="bg-transparent font-black text-slate-800 outline-none text-lg text-center w-full" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                             <div className="bg-blue-50 p-2 rounded-xl text-blue-600 shrink-0 group-focus-within:bg-blue-600 group-focus-within:text-white transition-colors cursor-pointer">
                                <Clock size={16} />
                             </div>
                          </div>
                       </div>
                       
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block sm:text-left">Até (Fim)</label>
                          <div className="bg-white border border-slate-200 rounded-2xl pl-4 pr-2 py-2 flex items-center justify-between focus-within:border-blue-500 transition-all group">
                             <input type="time" className="bg-transparent font-black text-slate-800 outline-none text-lg text-center w-full" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                             <div className="bg-blue-50 p-2 rounded-xl text-blue-600 shrink-0 group-focus-within:bg-blue-600 group-focus-within:text-white transition-colors cursor-pointer">
                                <Clock size={16} />
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-blue-600 rounded-[2rem] text-white shadow-xl shadow-blue-100 flex items-center justify-between shrink-0">
                   <div>
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Status Inicial</p>
                      <p className="text-lg font-black uppercase tracking-tight">Novo Lead</p>
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
           <button onClick={onClose} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
           <button onClick={handleSave} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100 flex items-center gap-3 hover:bg-blue-700 transition-all active:scale-95">
             <Save size={18}/> 
             Criar Lead no Pipeline
           </button>
        </footer>
      </div>
    </div>
  );
};

export default AppointmentModal;

