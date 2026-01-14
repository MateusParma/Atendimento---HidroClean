
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, Plus, Calendar as CalendarIcon, List, MapPin, Send, Check } from 'lucide-react';
import { Appointment } from '../types';

interface FullCalendarViewProps {
  appointments: Appointment[];
  onEditAppt: (appt: Appointment) => void;
  onNewAppt: (date: string) => void;
  onSendTech: (appt: Appointment) => void;
}

type CalendarViewMode = 'month' | 'week' | 'day';

const FullCalendarView: React.FC<FullCalendarViewProps> = ({ appointments, onEditAppt, onNewAppt, onSendTech }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));
    
    return days;
  }, [currentDate]);

  const serviceColors: Record<string, string> = {
    'Pesquisa de Fuga': 'bg-red-500',
    'Desentupimentos': 'bg-emerald-500',
    'Limpeza de Fossas': 'bg-blue-500',
    'Reparação Canalização': 'bg-orange-500',
    'Inspeção de Vídeo': 'bg-indigo-500',
    'Outros': 'bg-slate-500',
  };

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') newDate.setMonth(currentDate.getMonth() + direction);
    else if (viewMode === 'week') newDate.setDate(currentDate.getDate() + (direction * 7));
    else newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const getDayAppts = (date: Date) => {
    const iso = date.toISOString().split('T')[0];
    return appointments.filter(a => a.scheduled_at === iso);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-8 flex items-center justify-between border-b border-slate-100 bg-slate-50/30">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter capitalize">
            {currentDate.toLocaleDateString('pt-PT', { 
              month: 'long', 
              year: 'numeric',
              day: viewMode === 'day' ? 'numeric' : undefined 
            })}
          </h2>
          <div className="flex space-x-2 mt-2">
            {(['month', 'week', 'day'] as CalendarViewMode[]).map(m => (
              <button 
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === m ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 border border-slate-200 hover:border-blue-400'}`}
              >
                {m === 'month' ? 'Mês' : m === 'week' ? 'Semana' : 'Dia'}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button onClick={() => setCurrentDate(new Date())} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase transition-all hover:bg-slate-50">Hoje</button>
          <div className="flex bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><ChevronLeft size={20} className="text-slate-600" /></button>
            <button onClick={() => navigate(1)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><ChevronRight size={20} className="text-slate-600" /></button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {viewMode === 'month' ? (
          <div className="h-full flex flex-col">
            <div className="grid grid-cols-7 border-b border-slate-100 bg-white">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
              ))}
            </div>
            <div className="flex-1 grid grid-cols-7 auto-rows-fr">
              {daysInMonth.map((date, idx) => {
                if (!date) return <div key={`e-${idx}`} className="border-r border-b border-slate-50 bg-slate-50/10"></div>;
                const dayAppts = getDayAppts(date);
                const isToday = date.toDateString() === new Date().toDateString();
                const iso = date.toISOString().split('T')[0];

                return (
                  <div 
                    key={iso} 
                    className="border-r border-b border-slate-100 p-2 min-h-[120px] hover:bg-slate-50/50 transition-all group relative cursor-pointer"
                    onClick={() => dayAppts.length === 0 ? onNewAppt(iso) : null}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-black ${isToday ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 group-hover:text-slate-900'}`}>{date.getDate()}</span>
                      <button onClick={(e) => { e.stopPropagation(); onNewAppt(iso); }} className="opacity-0 group-hover:opacity-100 p-1 bg-blue-50 text-blue-600 rounded-lg transition-all"><Plus size={12}/></button>
                    </div>
                    <div className="space-y-1">
                      {dayAppts.slice(0, 3).map(a => (
                        <div key={a.id} onClick={(e) => { e.stopPropagation(); onEditAppt(a); }} className={`px-2 py-0.5 rounded-md text-[8px] font-black text-white truncate shadow-sm transition-transform hover:scale-105 ${a.tech_sent_at ? 'bg-emerald-600' : (serviceColors[a.service_type] || serviceColors['Outros'])}`}>
                          <span className="opacity-80 mr-1">{a.start_time}</span> {a.customer_name}
                        </div>
                      ))}
                      {dayAppts.length > 3 && <p className="text-[8px] font-black text-slate-400 text-center uppercase tracking-tighter mt-1">+ {dayAppts.length - 3} serviços</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600"><List size={20}/></div>
              <h3 className="text-xl font-black text-slate-900 uppercase">Lista de Trabalhos</h3>
            </div>
            {appointments.filter(a => {
              const d = new Date(a.scheduled_at);
              if (viewMode === 'day') return d.toDateString() === currentDate.toDateString();
              const weekEnd = new Date(currentDate);
              weekEnd.setDate(currentDate.getDate() + 7);
              return d >= currentDate && d <= weekEnd;
            }).map(appt => (
              <div 
                key={appt.id} 
                className={`p-6 rounded-[2rem] border shadow-sm flex items-center space-x-6 hover:border-blue-500 transition-all cursor-pointer ${appt.tech_sent_at ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}
                onClick={() => onEditAppt(appt)}
              >
                <div className={`w-16 h-16 border-2 rounded-2xl flex flex-col items-center justify-center transition-all ${appt.tech_sent_at ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-blue-50 border-blue-600 text-blue-600'}`}>
                  <span className="text-xl font-black">{new Date(appt.scheduled_at).getDate()}</span>
                  <span className="text-[8px] font-black uppercase">{new Date(appt.scheduled_at).toLocaleDateString('pt-PT', { month: 'short' })}</span>
                </div>
                <div className="flex-1">
                  <div className={`flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest ${appt.tech_sent_at ? 'text-emerald-600' : 'text-blue-600'}`}><Clock size={12}/> <span>{appt.start_time} - {appt.end_time}</span></div>
                  <h4 className="text-lg font-black text-slate-900">{appt.customer_name}</h4>
                  <p className="text-xs text-slate-400 font-bold flex items-center"><MapPin size={12} className={`mr-2 ${appt.tech_sent_at ? 'text-emerald-500' : ''}`}/> {appt.description}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onSendTech(appt); }}
                    className={`p-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center space-x-2 ${appt.tech_sent_at ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}
                  >
                    {appt.tech_sent_at ? <Check size={18} /> : <Send size={18} />}
                  </button>
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${appt.tech_sent_at ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {appt.service_type}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FullCalendarView;
