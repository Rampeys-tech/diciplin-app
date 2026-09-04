'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../api';
import { useAuth } from '../context/AuthContext';
import { parseDailyStockOpname } from '../utils/soParser';
import { parseEsbSalesPdf } from '../utils/esbPdfParser';
import { 
  FiUploadCloud, 
  FiFileText, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiClock, 
  FiSend,
  FiShoppingBag
} from 'react-icons/fi';

export default function StoreKpiPortal() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('closing'); // 'closing' atau 'tasks'
  const [tasks, setTasks] = useState([]);
  const [selectedDept, setSelectedDept] = useState('ALL');
  
  // State Form Closing & Sales
  const [salesNetto, setSalesNetto] = useState('');
  const [sosMinutes, setSosMinutes] = useState('');
  const [complaintCount, setComplaintCount] = useState('0');
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Hasil Parse Excel SO Harian
  const [parsedItems, setParsedItems] = useState([]);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [parsedExcelName, setParsedExcelName] = useState('');
  const [excelError, setExcelError] = useState(null);

  // State Hasil Parse PDF Sales ESB
  const [parsedSales, setParsedSales] = useState([]);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [parsedPdfName, setParsedPdfName] = useState('');
  const [pdfError, setPdfError] = useState(null);

  useEffect(() => {
    async function init() {
      if (!user?.id) return;
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('*, outlets(*)')
        .eq('id', user.id)
        .single();
      if (prof) {
        setProfile(prof);
        loadTasks(prof.outlet_id);
      }
    }
    init();
  }, [user]);

  const loadTasks = async (outletId) => {
    try {
      const { data } = await supabase
        .from('department_tasks')
        .select('*')
        .or(`outlet_id.eq.${outletId},outlet_id.is.null`)
        .order('deadline', { ascending: true });
      if (data) setTasks(data);
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Handler Pembacaan Excel SO Harian
  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    setExcelError(null);
    setParsedExcelName(file.name);

    try {
      const result = await parseDailyStockOpname(file);
      setParsedItems(result.items);
    } catch (err) {
      setExcelError(err.message);
      setParsedItems([]);
    } finally {
      setIsParsingExcel(false);
    }
  };

  // 2. Handler Pembacaan PDF Sales Mix ESB
  const handlePdfSalesUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingPdf(true);
    setPdfError(null);
    setParsedPdfName(file.name);

    try {
      const salesResult = await parseEsbSalesPdf(file);
      setParsedSales(salesResult);
    } catch (err) {
      setPdfError(err.message);
      setParsedSales([]);
    } finally {
      setIsParsingPdf(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    const notes = prompt("Tuliskan ringkasan bukti pengerjaan / nomor BAP:");
    if (!notes) return;

    try {
      const { error } = await supabase
        .from('department_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: user.id,
          completion_notes: notes
        })
        .eq('id', taskId);

      if (error) throw error;
      alert("✓ Tugas selesai dicatat!");
      loadTasks(profile.outlet_id);
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const handleSubmitClosing = async (e) => {
    e.preventDefault();
    if (!salesNetto) return alert("Masukkan total sales netto hari ini");
    
    if (parsedItems.length === 0 || parsedSales.length === 0) {
      if (!confirm("Salah satu berkas (Excel SO atau PDF Sales) belum diunggah. Tetap kirim laporan?")) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('store_daily_closings').insert([
        {
          outlet_id: profile?.outlet_id,
          sales_netto: Number(salesNetto),
          speed_of_service_minutes: Number(sosMinutes || 0),
          complaint_count: parseInt(complaintCount || 0),
          deviation_summary: {
            physical_stock: parsedItems,
            esb_sales: parsedSales
          },
          investigation_notes: investigationNotes,
          submitted_by: user?.id
        }
      ]);

      if (error) throw error;
      alert("✓ Data closing, stok opname, dan data penjualan berhasil dikirim ke Area Manager!");
      setSalesNetto('');
      setSosMinutes('');
      setInvestigationNotes('');
      setParsedItems([]);
      setParsedSales([]);
      setParsedExcelName('');
      setParsedPdfName('');
    } catch (err) {
      alert(`Gagal kirim: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter(t => selectedDept === 'ALL' || t.department === selectedDept);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER OUTLET */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              {profile?.outlets?.code || '7005'} - Portal Operasional Store
            </span>
            <h1 className="text-xl font-black text-slate-900 mt-1">{profile?.outlets?.name || 'Gacoan MT Haryono'}</h1>
            <p className="text-xs text-slate-500">Store Manager: <span className="font-bold text-slate-700">{profile?.full_name || 'Manager Duty'}</span></p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('closing')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${activeTab === 'closing' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
            >
              Closing & SO Deviasi
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${activeTab === 'tasks' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
            >
              To-Do Dept ({tasks.filter(t => t.status !== 'completed').length})
            </button>
          </div>
        </div>

        {/* TAB 1: FORM CLOSING & DUA SLOT BERKAS */}
        {activeTab === 'closing' && (
          <form onSubmit={handleSubmitClosing} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">Validasi Closing & Audit Deviasi Harian</h2>
              <p className="text-xs text-slate-400">Sinkronisasi stok fisik dan penjualan POS ESB sebelum checkout shift midnight</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-500 block mb-1">Sales Netto (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 35000000"
                  value={salesNetto}
                  onChange={(e) => setSalesNetto(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-500 block mb-1">Speed of Service (Menit)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Contoh: 8.5"
                  value={sosMinutes}
                  onChange={(e) => setSosMinutes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-500 block mb-1">Total Komplain Tamu</label>
                <input
                  type="number"
                  value={complaintCount}
                  onChange={(e) => setComplaintCount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* DUA KOLOM UNGGAH BERKAS: EXCEL SO & PDF SALES ESB */}
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase text-slate-500 block">
                Unggah Berkas Pendukung Closing (Excel SO + PDF Promix ESB)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. SLOT EXCEL SO HARIAN */}
                <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-3xl p-5 text-center space-y-2 bg-slate-50/50 transition-colors">
                  <FiUploadCloud className="text-2xl text-indigo-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">1. Excel SO Harian (.xlsx)</p>
                  <p className="text-[10px] text-slate-400">
                    {parsedExcelName ? `File: ${parsedExcelName}` : 'Ekstrak stok fisik baris TOTAL'}
                  </p>
                  <input 
                    type="file" 
                    accept=".xlsx, .xls"
                    onChange={handleExcelUpload}
                    className="text-xs text-slate-500 mx-auto block cursor-pointer pt-1"
                  />
                  {parsedItems.length > 0 && (
                    <span className="inline-block text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ {parsedItems.length} Bahan Fisik Terbaca
                    </span>
                  )}
                  {excelError && (
                    <p className="text-[10px] text-rose-600 font-bold">{excelError}</p>
                  )}
                </div>

                {/* 2. SLOT PDF SALES PROMIX ESB */}
                <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-3xl p-5 text-center space-y-2 bg-slate-50/50 transition-colors">
                  <FiFileText className="text-2xl text-indigo-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">2. PDF Sales Promix ESB (.pdf)</p>
                  <p className="text-[10px] text-slate-400">
                    {parsedPdfName ? `File: ${parsedPdfName}` : 'Ekstrak porsi penjualan menu'}
                  </p>
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={handlePdfSalesUpload}
                    className="text-xs text-slate-500 mx-auto block cursor-pointer pt-1"
                  />
                  {parsedSales.length > 0 && (
                    <span className="inline-block text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ {parsedSales.length} Menu Terjual Terbaca
                    </span>
                  )}
                  {pdfError && (
                    <p className="text-[10px] text-rose-600 font-bold">{pdfError}</p>
                  )}
                </div>

              </div>

              {(isParsingExcel || isParsingPdf) && (
                <div className="p-3 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 animate-pulse">
                  <FiClock className="animate-spin" />
                  <span>Sedang memproses dan mengekstrak berkas...</span>
                </div>
              )}

              {/* DUA TABEL PREVIEW HASIL PARSE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                
                {/* Preview Bahan Fisik */}
                {parsedItems.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <FiCheckCircle className="text-emerald-600" />
                        <span>Stok Fisik ({parsedItems.length} Item)</span>
                      </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-200/50 pr-1 text-xs">
                      {parsedItems.map((item, idx) => (
                        <div key={idx} className="py-1.5 flex items-center justify-between">
                          <span className="font-medium text-slate-800 truncate pr-2">{item.item_name}</span>
                          <span className="font-mono font-bold text-indigo-700 shrink-0">
                            {item.physical_closing_stock.toLocaleString('id-ID')} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview Penjualan Menu ESB */}
                {parsedSales.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <FiShoppingBag className="text-indigo-600" />
                        <span>Menu Terjual ({parsedSales.length} Menu)</span>
                      </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-200/50 pr-1 text-xs">
                      {parsedSales.map((sale, idx) => (
                        <div key={idx} className="py-1.5 flex items-center justify-between">
                          <span className="font-medium text-slate-800 truncate pr-2">{sale.menu_name}</span>
                          <span className="font-mono font-bold text-emerald-700 shrink-0">
                            {sale.qty_sold.toLocaleString('id-ID')} Porsi
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase text-slate-500 block mb-1">
                Keterangan Deviasi / Investigasi Singkat (BAP)
              </label>
              <textarea
                rows="3"
                placeholder="Wajib diisi jika terdapat selisih gramasi atau temuan operasional kritis..."
                value={investigationNotes}
                onChange={(e) => setInvestigationNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs font-medium outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-60"
            >
              <FiSend />
              <span>{isSubmitting ? 'Mengirim Data...' : 'Kirim Laporan Closing & Deviasi ke Area Manager'}</span>
            </button>
          </form>
        )}

        {/* TAB 2: TO-DO SLA 5 DEPARTEMEN */}
        {activeTab === 'tasks' && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900">Instruksi & Project Departemen</h2>
                <p className="text-xs text-slate-400">Task resmi dari Area Manager dengan tenggat waktu tegas</p>
              </div>

              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Departemen</option>
                <option value="ordering">Ordering (Bahan Baku)</option>
                <option value="mnr">M&R (Maintenance)</option>
                <option value="payroll">Payroll (HR & SP)</option>
                <option value="schedule">Schedule (Shift)</option>
                <option value="marketing_cel">Marketing & CEL</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-10 text-xs font-medium text-slate-400">
                  Tidak ada tugas aktif untuk departemen ini.
                </div>
              ) : (
                filteredTasks.map((t) => {
                  const isOverdue = new Date(t.deadline) < new Date() && t.status !== 'completed';
                  return (
                    <div 
                      key={t.id} 
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        t.status === 'completed' 
                          ? 'bg-slate-50 border-slate-200 opacity-60' 
                          : isOverdue 
                          ? 'bg-rose-50/50 border-rose-200' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                            Dept: {t.department}
                          </span>
                          {isOverdue && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md">
                              Over Deadline
                            </span>
                          )}
                          {t.priority === 'urgent' && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                              Urgent
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-black text-slate-900">{t.title}</p>
                        {t.description && <p className="text-[11px] text-slate-500">{t.description}</p>}
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1 font-mono">
                          <FiClock />
                          <span>Deadline: {new Date(t.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {t.status === 'completed' ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                          <FiCheckCircle />
                          <span>Selesai</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCompleteTask(t.id)}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                        >
                          Selesaikan Tugas
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}