
import React, { useState } from 'react';
import { Wand2, Sparkles, X, Loader2, Save } from 'lucide-react';
import { generateAIResponse } from '../services/geminiService';
import { Category } from '../types';

interface AIModalProps {
  onClose: () => void;
  onSave: (title: string, content: string, category: Category) => void;
}

const AIModal: React.FC<AIModalProps> = ({ onClose, onSave }) => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Geral');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const text = await generateAIResponse(prompt);
      setResult(text);
      if (!title) {
        setTitle(prompt.slice(0, 30));
      }
    } catch (err) {
      alert('Erro ao gerar resposta com a IA.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAction = () => {
    if (!title || !result) {
      alert("Por favor, preencha o título e gere uma resposta.");
      return;
    }
    onSave(title, result, category);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-8 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-100">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Assistente IA Hidro Clean</h2>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Geração de Respostas Inteligentes</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 no-scrollbar">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
              Instruções para a IA
            </label>
            <textarea
              className="w-full bg-white border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none h-32 font-medium text-slate-700"
              placeholder="Ex: Explique ao cliente que usamos tecnologia de som para achar fugas de água sem partir a parede."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-2xl font-black flex items-center space-x-2 disabled:opacity-50 transition-all shadow-xl active:scale-95"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Wand2 size={18} className="text-blue-400" />
                )}
                <span>{loading ? 'Consultando IA...' : 'Gerar Texto'}</span>
              </button>
            </div>
          </div>

          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Resposta Sugerida</label>
                 <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50">
                    <textarea
                      className="w-full bg-transparent border-none focus:ring-0 text-slate-800 font-medium leading-relaxed min-h-[150px] resize-y"
                      value={result}
                      onChange={(e) => setResult(e.target.value)}
                    />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-2 rounded-2xl border border-slate-200">
                  <label className="block text-[10px] font-bold text-slate-400 px-3 pt-1 uppercase">Título da Resposta</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1 bg-transparent text-slate-800 font-bold outline-none"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Explicação Detecção"
                  />
                </div>
                <div className="bg-white p-2 rounded-2xl border border-slate-200">
                  <label className="block text-[10px] font-bold text-slate-400 px-3 pt-1 uppercase">Categoria</label>
                  <select
                    className="w-full px-3 py-1 bg-transparent text-slate-800 font-bold outline-none appearance-none"
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
              </div>
            </div>
          )}
        </div>

        {result && (
          <div className="p-8 bg-white border-t border-slate-100 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors"
            >
              Descartar
            </button>
            <button
              onClick={handleSaveAction}
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-2xl font-black flex items-center space-x-2 transition-all shadow-xl shadow-blue-100 active:scale-95"
            >
              <Save size={18} />
              <span>Salvar na Biblioteca</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIModal;
