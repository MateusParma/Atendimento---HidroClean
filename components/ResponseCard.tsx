
import React, { useState } from 'react';
import { SavedResponse } from '../types';
import { Copy, Check, Edit2, Trash2, Calendar, GripVertical } from 'lucide-react';

interface ResponseCardProps {
  response: SavedResponse;
  onEdit: (res: SavedResponse) => void;
  onDelete: (id: string) => void;
  viewMode?: 'grid' | 'list';
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  isDragging?: boolean;
}

const ResponseCard: React.FC<ResponseCardProps> = ({ 
  response, 
  onEdit, 
  onDelete, 
  viewMode = 'grid',
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging
}) => {
  const [copied, setCopied] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(response.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('pt-PT', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }).format(new Date(ts));
  };

  const categoryColors: Record<string, string> = {
    'Orçamento': 'bg-blue-100 text-blue-700 border-blue-200',
    'Pesquisa de Fuga': 'bg-red-100 text-red-700 border-red-200',
    'Desentupimentos': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Serviços': 'bg-purple-100 text-purple-700 border-purple-200',
    'Geral': 'bg-slate-100 text-slate-700 border-slate-200',
    'Outros': 'bg-amber-100 text-amber-700 border-amber-200',
  };

  const isList = viewMode === 'list';

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConfirmingDelete) {
      onDelete(response.id);
      setIsConfirmingDelete(false);
    } else {
      setIsConfirmingDelete(true);
      setTimeout(() => setIsConfirmingDelete(false), 3000);
    }
  };

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, response.id)}
      onDragOver={(e) => onDragOver(e, response.id)}
      onDragEnd={onDragEnd}
      className={`bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-30 border-dashed border-blue-400 scale-95 shadow-none' : 'opacity-100'
      } ${
        isList ? 'p-4 flex flex-col sm:flex-row sm:items-center gap-4' : 'p-5 flex flex-col h-full'
      }`}
    >
      {/* Drag Handle Indicator */}
      <div className="absolute top-2 right-2 text-slate-200 group-hover:text-slate-300 transition-colors pointer-events-none">
        <GripVertical size={16} />
      </div>

      {!isList && (
        <div className="flex justify-between items-start mb-3">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryColors[response.category] || categoryColors['Outros']}`}>
            {response.category}
          </span>
          <div className="flex items-center space-x-1 lg:opacity-0 group-hover:opacity-100 transition-opacity mr-4">
            {!isConfirmingDelete && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(response); }}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar"
              >
                <Edit2 size={16} />
              </button>
            )}
            <button 
              onClick={handleDeleteClick}
              className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg transition-all text-xs font-black uppercase tracking-tighter ${
                isConfirmingDelete 
                ? 'bg-red-600 text-white animate-pulse' 
                : 'p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50'
              }`}
              title={isConfirmingDelete ? "Confirmar Eliminação" : "Eliminar"}
            >
              {isConfirmingDelete ? (
                <>
                  <Check size={14} />
                  <span>Confirmar?</span>
                </>
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          </div>
        </div>
      )}

      <div className={`${isList ? 'flex-1 min-w-0' : 'flex-1'}`}>
        {isList && (
           <div className="flex items-center space-x-2 mb-1">
             <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${categoryColors[response.category] || categoryColors['Outros']}`}>
              {response.category}
            </span>
           </div>
        )}
        <h3 className={`font-bold text-slate-800 truncate ${isList ? 'text-base' : 'text-lg mb-2 pr-10'}`}>
          {response.title}
        </h3>
        
        <div className="relative">
          <p className={`text-slate-600 text-sm leading-relaxed whitespace-pre-wrap ${isList ? 'line-clamp-1' : 'line-clamp-4'}`}>
            {response.content}
          </p>
          {!isList && <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent"></div>}
        </div>
      </div>

      <div className={`${isList ? 'flex items-center space-x-3 shrink-0' : 'mt-4 flex items-center justify-between pt-4 border-t border-slate-100'}`}>
        {!isList && (
          <div className="flex items-center text-xs text-slate-400">
            <Calendar size={12} className="mr-1" />
            {formatDate(response.lastUpdated)}
          </div>
        )}

        <div className="flex items-center space-x-2">
          {isList && (
            <div className="flex items-center space-x-1 lg:opacity-0 group-hover:opacity-100 transition-opacity mr-2">
              {!isConfirmingDelete && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(response); }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
              )}
              <button 
                onClick={handleDeleteClick}
                className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg transition-all text-xs font-black uppercase tracking-tighter ${
                  isConfirmingDelete 
                  ? 'bg-red-600 text-white animate-pulse' 
                  : 'p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                {isConfirmingDelete ? (
                  <>
                    <Check size={14} />
                    <span>Confirmar?</span>
                  </>
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </div>
          )}
          
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              copied 
                ? 'bg-emerald-50 text-emerald-600' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200'
            }`}
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>{isList ? 'Copiar' : 'Copiar Texto'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponseCard;
