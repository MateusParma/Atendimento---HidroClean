
import React from 'react';
import { Appointment, ApptStage } from '../types';
import { MapPin, Clock, ChevronRight, MessageCircle } from 'lucide-react';

interface KanbanViewProps {
  stages: ApptStage[];
  appointments: Appointment[];
  onEditAppt: (appt: Appointment) => void;
  onWhatsApp: (phone?: string) => void;
}

const KanbanView: React.FC<KanbanViewProps> = ({ stages, appointments, onEditAppt, onWhatsApp }) => {
  return (
    <div className="flex space-x-6 overflow-x-auto pb-6 no-scrollbar min-h-[calc(100vh-250px)]">
      {stages.map((stage) => {
        const stageAppts = appointments.filter((a) => a.stage === stage);
        return (
          <div key={stage} className="flex-shrink-0 w-80 flex flex-col">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                {stage}
              </h3>
              <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-md">
                {stageAppts.length}
              </span>
            </div>
            
            <div className="bg-slate-200/40 rounded-[2rem] p-3 flex-1 space-y-3 border border-slate-200/50">
              {stageAppts.map((appt) => (
                <div
                  key={appt.id}
                  onClick={() => onEditAppt(appt)}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-blue-400 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[8px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded">
                      {appt.service_type}
                    </span>
                    <div className="text-[9px] font-black text-slate-900">{appt.expected_revenue}€</div>
                  </div>
                  
                  <h4 className="text-sm font-black text-slate-900 mb-2 truncate">{appt.customer_name}</h4>
                  
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold truncate">
                      <MapPin size={12} className="text-blue-500 shrink-0" />
                      {appt.description}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                      <Clock size={12} className="text-blue-500 shrink-0" />
                      {new Date(appt.scheduled_at + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} • {appt.start_time}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onWhatsApp(appt.phone); }}
                      className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                    >
                      <MessageCircle size={14} />
                    </button>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              ))}
              
              {stageAppts.length === 0 && (
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vazio</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanView;
