
import React, { useState, useEffect } from 'react';
import { X, Save, FileText } from 'lucide-react';
import { Category, SavedResponse } from '../types';

interface ResponseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<SavedResponse>) => void;
  initialData?: SavedResponse | null;
}

const ResponseFormModal: React.FC<ResponseFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Category>('Geral');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
      setCategory(initialData.category);
    } else {
      setTitle('');
      setContent('');
      setCategory('Geral');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    onSave({ title, content, category });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileText className="text-blue-600" size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              {initialData ? 'Editar Resposta' : 'Nova Resposta Manual'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Título</label>
            <input
              type="text"
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Preço de Desentupimento"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Categoria</label>
            <select
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              <option value="Orçamento">Orçamento</option>
              <option value="Pesquisa de Fuga">Pesquisa de Fuga</option>
              <option value="Desentupimentos">Desentupimentos</option>
              <option value="Serviços">Serviços</option>
              <option value="Geral">Geral</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Conteúdo da Resposta</label>
            <textarea
              required
              className="w-full border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none h-48"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva aqui a resposta padrão..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-lg shadow-blue-100"
            >
              <Save size={18} />
              <span>{initialData ? 'Guardar Alterações' : 'Criar Resposta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResponseFormModal;
