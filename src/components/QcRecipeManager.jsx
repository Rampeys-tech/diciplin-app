'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../api';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiTrash2, FiSave, FiCheckCircle } from 'react-icons/fi';

export default function QcRecipeManager() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [menuName, setMenuName] = useState('');
  const [ingredientName, setIngredientName] = useState('');
  const [standardAmount, setStandardAmount] = useState('');
  const [unit, setUnit] = useState('gram');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    const { data } = await supabase
      .from('product_recipes')
      .select('*')
      .order('menu_name', { ascending: true });
    if (data) setRecipes(data);
  };

  const handleAddRecipe = async (e) => {
    e.preventDefault();
    if (!menuName || !ingredientName || !standardAmount) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('product_recipes').insert([
        {
          menu_name: menuName.trim(),
          ingredient_name: ingredientName.trim(),
          standard_amount: Number(standardAmount),
          unit,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        }
      ]);

      if (error) throw error;
      setIngredientName('');
      setStandardAmount('');
      loadRecipes();
      alert("✓ Standar gramasi berhasil ditambahkan!");
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecipe = async (id) => {
    if (!confirm("Hapus resep standar ini?")) return;
    try {
      await supabase.from('product_recipes').delete().eq('id', id);
      loadRecipes();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
      <div className="border-b border-slate-100 pb-3">
        <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
          Khusus Role QC
        </span>
        <h2 className="text-base font-black text-slate-900 mt-1">Master Standar Gramasi & SOC Produk</h2>
        <p className="text-xs text-slate-400">Kunci perhitungan otomatis deviasi bahan baku harian</p>
      </div>

      {/* Form Input QC */}
      <form onSubmit={handleAddRecipe} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Nama Menu ESB</label>
          <input
            type="text"
            placeholder="Misal: Mie Hompimpa"
            value={menuName}
            onChange={(e) => setMenuName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Bahan Baku Fisik</label>
          <input
            type="text"
            placeholder="Misal: Ayam Tabur"
            value={ingredientName}
            onChange={(e) => setIngredientName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Takaran Standar</label>
          <div className="flex gap-1.5">
            <input
              type="number"
              step="0.1"
              placeholder="Misal: 25"
              value={standardAmount}
              onChange={(e) => setStandardAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500"
              required
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold outline-none"
            >
              <option value="gram">gram</option>
              <option value="pcs">pcs</option>
              <option value="ml">ml</option>
              <option value="porsi">porsi</option>
            </select>
          </div>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <FiPlus />
            <span>Simpan Resep</span>
          </button>
        </div>
      </form>

      {/* Tabel Data Resep yang Sudah Diinput QC */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-black">
              <th className="pb-2">Menu Produk</th>
              <th className="pb-2">Bahan Baku</th>
              <th className="pb-2">Takaran SOC</th>
              <th className="pb-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recipes.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="py-2.5 font-bold text-slate-900">{r.menu_name}</td>
                <td className="py-2.5 text-slate-600">{r.ingredient_name}</td>
                <td className="py-2.5 font-mono font-bold text-indigo-600">
                  {r.standard_amount} {r.unit}
                </td>
                <td className="py-2.5 text-right">
                  <button
                    onClick={() => handleDeleteRecipe(r.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Hapus"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
            {recipes.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-400">
                  Belum ada data SOC yang diinput oleh QC.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}