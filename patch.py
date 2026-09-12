import os
import re

file_path = os.path.join("src", "pages", "BreakSystem.jsx")

if not os.path.exists(file_path):
    # Fallback jika dijalankan dari dalam folder src/pages
    file_path = "BreakSystem.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Pastikan import FiMaximize2 tersedia
if "FiMaximize2" not in content:
    content = content.replace("FiDownload", "FiDownload,\n  FiMaximize2")

# 2. Tambahkan role CEL ke izin canReportViolation
can_report_pattern = r"(const canReportViolation\s*=\s*Boolean\([^;]+?\);)"
new_can_report = """const canReportViolation = Boolean(
    isManager || 
    roleLower === 'quality_control' || 
    roleLower === 'stocker' || 
    roleLower === 'cel' ||
    placementLower.includes('quality control') || 
    placementLower.includes('qc') || 
    placementLower.includes('stocker') ||
    placementLower.includes('cel')
  );"""
content = re.sub(can_report_pattern, new_can_report, content, flags=re.DOTALL)

# 3. Tambahkan state previewImageUrl dan reportIncidentDate
if "previewImageUrl" not in content:
    content = content.replace(
        "const [showReportViolationModal, setShowReportViolationModal] = useState(false);",
        "const [showReportViolationModal, setShowReportViolationModal] = useState(false);\n  const [previewImageUrl, setPreviewImageUrl] = useState(null);\n  const [reportIncidentDate, setReportIncidentDate] = useState(() => new Date().toISOString().substring(0, 10));"
    )

# 4. Potong teks rusak mulai dari tombol shift picker yang terpotong dan sambungkan penutup valid
marker = '<div className="pt-2 space-y-2">'
if marker in content:
    parts = content.split(marker)
    clean_top = parts[0] + marker

    tail_code = """
                <button 
                  type="button" 
                  onClick={handleConfirmShiftAndOpenCamera} 
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FiCamera className="text-sm" /> Lanjutkan Buka Kamera
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowShiftPicker(false)} 
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL KAMERA FULL SCREEN */}
        {isCameraOpen && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between z-50 animate-in fade-in duration-200">
            <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-white relative z-10">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <h3 className="font-black text-xs tracking-widest uppercase text-slate-200">
                  VERIFIKASI WAJAH: {cameraMode} {cameraMode === 'IN' ? `(${isManager ? 'Manager Duty' : selectedStation} - SHIFT ${selectedShiftHour.toString().padStart(2, '0')}:00)` : ''}
                </h3>
              </div>
              <button type="button" onClick={closeCamera} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors cursor-pointer">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
              {!capturedImage ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover -scale-x-100" 
                  />
                  
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 bg-slate-950/40">
                    <div className="relative w-full max-w-[280px] aspect-[3/4] rounded-[100px] border-4 border-dashed border-white/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)] flex flex-col items-center justify-center">
                      <div className="absolute top-8 text-center text-white/90 text-xs font-bold bg-slate-900/80 px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm">
                        Posisikan Wajah di Dalam Oval
                      </div>
                    </div>
                  </div>

                  {humanDetectionStatus === 'HUMAN_DETECTED' && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                      <button 
                        type="button" 
                        onClick={handleCapture} 
                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-5 rounded-full shadow-2xl border-4 border-white/80 active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
                      >
                        <FiCamera className="text-2xl" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-slate-900">
                  <div className="w-full max-w-sm aspect-[4/5] rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl relative">
                    <img src={capturedImage} alt="Preview Foto" className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                      <FiCheckCircle /> WAJAH VALID
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
              {capturedImage ? (
                <div className="flex gap-3 max-w-sm mx-auto">
                  <button 
                    type="button" 
                    onClick={() => { setCapturedImage(null); openCamera(cameraMode); }} 
                    className="flex-1 bg-slate-800 text-slate-200 font-bold py-3.5 rounded-2xl text-xs border border-slate-700 hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FiRefreshCw /> Foto Ulang
                  </button>
                  <button 
                    type="button" 
                    disabled={isLoading} 
                    onClick={handleConfirmSubmission} 
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 rounded-2xl text-xs shadow-lg shadow-indigo-600/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isLoading ? 'Memproses Data...' : 'Konfirmasi Absen'}
                  </button>
                </div>
              ) : (
                <div className="text-xs font-black text-slate-300 text-center font-mono py-1">
                  {humanDetectionStatus === 'LOADING_ENGINE' && <span className="animate-pulse text-indigo-400">Mengaktifkan Sensor Kamera...</span>}
                  {humanDetectionStatus === 'NOT_DETECTED' && <span className="text-rose-400">🚨 Kamera Tidak Siap</span>}
                  {humanDetectionStatus === 'HUMAN_DETECTED' && <span className="text-emerald-400">✓ Posisikan Wajah &amp; Tekan Tombol Kamera</span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL FULL PREVIEW FOTO */}
        {previewImageUrl && (
          <div 
            onClick={() => setPreviewImageUrl(null)}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[70] cursor-pointer animate-in fade-in duration-200"
          >
            <button 
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2.5 rounded-full transition-colors"
            >
              <FiX className="text-xl" />
            </button>
            <img 
              src={previewImageUrl} 
              alt="Bukti Layar Penuh" 
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" 
            />
          </div>
        )}

      </div>
    </div>
  );
}
"""
    content = clean_top + tail_code

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("BERHASIL: BreakSystem.jsx berhasil diperbaiki tanpa error sintaks.")