import React, { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Category } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import { 
  FolderTree, 
  Plus, 
  Trash2, 
  Edit3, 
  TrendingDown, 
  TrendingUp, 
  X, 
  Check, 
  Layers, 
  Search, 
  ChevronRight, 
  AlertTriangle,
  FolderPlus
} from 'lucide-react';

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', 
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b'
];

const CATEGORY_ICONS = [
  'Utensils', 'ShoppingCart', 'Coffee', 'Home', 'Building', 'Zap', 
  'Wifi', 'Car', 'Fuel', 'Navigation', 'Wrench', 'Activity', 
  'Pill', 'ShieldPlus', 'Dumbbell', 'Smile', 'Plane', 'Tv', 
  'GraduationCap', 'BookOpen', 'Banknote', 'Award', 'PiggyBank', 
  'PlusCircle', 'Folder', 'Gift', 'Heart', 'Briefcase'
];

export const CategoryManager: React.FC = () => {
  const { 
    categories, 
    transactions, 
    saveCategory, 
    deleteCategory 
  } = useFinanceStore();

  const [activeType, setActiveType] = useState<'expense' | 'income'>('expense');
  const [search, setSearch] = useState('');
  
  // Modal de Criação / Edição de Categoria
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Campos do formulário
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [icon, setIcon] = useState('Folder');
  const [color, setColor] = useState('#ef4444');

  const openNewCategoryModal = (defaultParentId?: string) => {
    setEditingCategory(null);
    setName('');
    setParentId(defaultParentId || null);
    setIcon(activeType === 'income' ? 'Banknote' : 'Folder');
    setColor(activeType === 'income' ? '#10b981' : '#ef4444');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setParentId(cat.parentId || null);
    setIcon(cat.icon);
    setColor(cat.color);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    saveCategory({
      id: editingCategory?.id,
      name: name.trim(),
      type: activeType,
      parentId: parentId || null,
      icon,
      color,
    });

    setIsModalOpen(false);
  };

  // Filtrar categorias por tipo (expense ou income)
  const currentCategories = categories.filter((c) => c.type === activeType);
  const rootCategories = currentCategories.filter((c) => !c.parentId);

  // Mapear total de transações por categoria
  const categoryUsageCount: Record<string, number> = {};
  transactions.forEach((t) => {
    if (t.categoryId) {
      categoryUsageCount[t.categoryId] = (categoryUsageCount[t.categoryId] || 0) + 1;
    }
    if (t.isSplit && t.splits) {
      t.splits.forEach((s) => {
        categoryUsageCount[s.categoryId] = (categoryUsageCount[s.categoryId] || 0) + 1;
      });
    }
  });

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-950 select-none">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-emerald-400" />
            Gerenciador de Categorias & Subcategorias
          </h2>
          <p className="text-xs text-slate-400">
            Cadastre novas categorias, organize níveis ilimitados de subcategorias ou exclua classificações.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Alternador Despesa / Receita */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveType('expense')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeType === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Despesas ({categories.filter(c => c.type === 'expense').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveType('income')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeType === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Receitas ({categories.filter(c => c.type === 'income').length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => openNewCategoryModal()}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Categoria Principal</span>
          </button>
        </div>
      </div>

      {/* Barra de Busca de Categorias */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Buscar nas categorias de ${activeType === 'expense' ? 'despesa' : 'receita'}...`}
          className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Árvore Hierárquica de Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rootCategories
          .filter((cat) => cat.name.toLowerCase().includes(search.toLowerCase()))
          .map((parent) => {
            const subcategories = currentCategories.filter((c) => c.parentId === parent.id);
            const parentUsage = categoryUsageCount[parent.id] || 0;

            return (
              <div
                key={parent.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors"
              >
                <div>
                  {/* Cabeçalho da Categoria Pai */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm"
                        style={{ backgroundColor: parent.color }}
                      >
                        <IconRenderer name={parent.icon} className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100">{parent.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {parentUsage} {parentUsage === 1 ? 'lançamento' : 'lançamentos'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openNewCategoryModal(parent.id)}
                        className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                        title="Adicionar Subcategoria nesta pasta"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(parent)}
                        className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
                        title="Editar Categoria"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const confirmMsg = subcategories.length > 0
                            ? `Deseja excluir "${parent.name}" e todas as suas ${subcategories.length} subcategorias?`
                            : `Deseja realmente excluir a categoria "${parent.name}"?`;
                          if (confirm(confirmMsg)) {
                            deleteCategory(parent.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                        title="Excluir Categoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Lista de Subcategorias */}
                  {subcategories.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                        Subcategorias ({subcategories.length})
                      </span>

                      {subcategories.map((sub) => {
                        const subUsage = categoryUsageCount[sub.id] || 0;
                        return (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between px-2 py-1 bg-slate-950/60 rounded border border-slate-800/60 hover:border-slate-700 transition-colors group"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: sub.color }}
                              />
                              <span className="text-xs text-slate-200">{sub.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({subUsage})</span>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => openEditModal(sub)}
                                className="p-0.5 text-slate-400 hover:text-slate-200"
                                title="Editar Subcategoria"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Deseja excluir a subcategoria "${sub.name}"?`)) {
                                    deleteCategory(sub.id);
                                  }
                                }}
                                className="p-0.5 text-slate-400 hover:text-rose-400"
                                title="Excluir Subcategoria"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => openNewCategoryModal(parent.id)}
                  className="w-full py-1 text-[11px] font-medium text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 rounded border border-dashed border-slate-800 hover:border-emerald-500/30 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Subcategoria</span>
                </button>
              </div>
            );
          })}
      </div>

      {/* Modal Criar / Editar Categoria */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: color }}
                >
                  <IconRenderer name={icon} className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">
                  {editingCategory ? 'Editar Categoria' : parentId ? 'Nova Subcategoria' : 'Nova Categoria Principal'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Farmácia, Viagens, Salário, Internet..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Categoria Pai (Opcional para criar Subcategoria)
                </label>
                <select
                  value={parentId || ''}
                  onChange={(e) => setParentId(e.target.value || null)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Nenhuma (Categoria Principal de Topo)</option>
                  {rootCategories
                    .filter((c) => c.id !== editingCategory?.id)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        Pasta: {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Seletor de Cores */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cor da Categoria
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seletor de Ícones */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ícone Representativo
                </label>
                <div className="grid grid-cols-7 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-950 rounded-lg border border-slate-800">
                  {CATEGORY_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`p-2 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                        icon === ic
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-100'
                      }`}
                    >
                      <IconRenderer name={ic} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md cursor-pointer"
                >
                  Salvar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
