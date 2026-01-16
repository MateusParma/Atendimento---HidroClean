
import React, { useState } from 'react';
import { Appointment, ApptStage } from '../types';
import { MapPin, Clock, ChevronRight, MessageCircle } from 'lucide-react';
import { STAGE_COLORS } from '../App';

interface KanbanViewProps {
  stages: ApptStage[];
  appointments: Appointment[];
  onEditAppt: (appt: Appointment) => void;
  onWhatsApp: (phone?: string) => void;
  onMoveAppt?: (apptId: string, newStage: ApptStage) => void;
}

const KanbanView: React.FC<KanbanViewProps> = ({ stages, appointments, onEditAppt, onWhatsApp, onMoveAppt }) => {
  const [draggedApptId, setDraggedApptId] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<ApptStage | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedApptId(id);
    e.dataTransfer.setData('apptId', id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      const target = e.target as HTMLElement;
      target.style.opacity = '0.4';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedApptId(null);
    setActiveStage(null);
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent, stage: ApptStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeStage !== stage) setActiveStage(stage);
  };

  const handleDrop = (e: React.DragEvent, stage: ApptStage) => {
    e.preventDefault();
    const apptId = e.dataTransfer.getData('apptId');
    if (onMoveAppt && apptId) {
      onMoveAppt(apptId, stage);
    }
    setActiveStage(null);
    setDraggedApptId(null);
  };

  return (
    <div className="flex space-x-6 overflow-x-auto pb-6 no-scrollbar min-h-[calc(100vh-250px)]">
      {stages.map((stage) => {
        const stageAppts = appointments.filter((a) => a.stage === stage);
        const isTarget = activeStage === stage;
        const sColor = STAGE_COLORS[stage];

        return (
          <div 
            key={stage} 
            className="flex-shrink-0 w-80 flex flex-col"
            onDragOver={(e) => handleDragOver(e, stage)}
            onDrop={(e) => handleDrop(e, stage)}
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isTarget ? 'bg-blue-400 animate-ping' : sColor.dot}`}></span>
                {stage}
              </h3>
              <span className={`${sColor.bg} ${sColor.text} text-[10px] font-black px-2 py-0.5 rounded-md border ${sColor.border}`}>
                {stageAppts.length}
              </span>
            </div>
            
            <div className={`rounded-[2rem] p-3 flex-1 space-y-3 border transition-all duration-200 ${
              isTarget 
                ? 'bg-blue-50/50 border-blue-300 ring-4 ring-blue-500/5' 
                : 'bg-slate-200/40 border-slate-200/50'
            }`}>
              {stageAppts.map((appt) => (
                <div
                  key={appt.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, appt.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onEditAppt(appt)}
                  className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-blue-400 transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden ${
                    draggedApptId === appt.id ? 'shadow-none ring-2 ring-blue-400' : ''
                  }`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${sColor.dot}`}></div>
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
                      {new Date(appt.scheduled_at + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} • {appt.start_time}-{appt.end_time}
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
                <div className={`h-24 flex items-center justify-center border-2 border-dashed rounded-2xl transition-colors ${
                  isTarget ? 'border-blue-300 text-blue-400 bg-blue-50' : 'border-slate-300 text-slate-400'
                }`}>
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    {isTarget ? 'Solte aqui' : 'Vazio'}
                  </span>
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
