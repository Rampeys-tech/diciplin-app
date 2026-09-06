import os

path = "src/pages/AreaDashboard.jsx"
if not os.path.exists(path):
    path = "src/AreaDashboard.jsx"

if not os.path.exists(path):
    print("File AreaDashboard.jsx tidak ditemukan! Sesuaikan path di script patch.py")
    exit()

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Bersihkan angka statis -4600 gr pada totalDeviasiGram
old_dev_calc = """  const totalDeviasiGram = useMemo(() => {
    return SO_DEVIATION_DATA
      .filter(item => item.unit === 'gr')
      .reduce((acc, curr) => acc + Math.abs(curr.selisih), 0);
  }, [SO_DEVIATION_DATA]);"""

new_dev_calc = """  const totalDeviasiGram = useMemo(() => {
    const list = SO_DEVIATION_DATA.filter(item => {
      if (selectedDevOutlet === 'ALL') return true;
      return item.outletId === selectedDevOutlet;
    });
    return list
      .filter(item => item.unit === 'gr' && item.selisih < 0)
      .reduce((acc, curr) => acc + Math.abs(curr.selisih), 0);
  }, [SO_DEVIATION_DATA, selectedDevOutlet]);"""

if old_dev_calc in content:
    content = content.replace(old_dev_calc, new_dev_calc)
    print("✓ Perbaikan totalDeviasiGram berhasil diterapkan.")
else:
    print("! totalDeviasiGram sudah disesuaikan atau format berbeda.")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch selesai! Silakan jalankan 'npm run dev' atau 'git push' ke Vercel.")