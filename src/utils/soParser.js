import * as XLSX from 'xlsx';

/**
 * Utility Parser Excel SO Harian Resmi Resto
 * Membaca sheet 'INPUT SO HARIAN' dan mengekstrak stok fisik baris TOTAL.
 * 
 * @param {File} file - File .xlsx yang diunggah oleh Store Manager
 * @param {number} targetDay - Tanggal hari ini (default: tanggal hari ini 1-31)
 * @returns {Promise<{date: number, total_items_parsed: number, items: Array}>}
 */
export async function parseDailyStockOpname(file, targetDay = new Date().getDate()) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // 1. Cari Sheet 'INPUT SO HARIAN' (case-insensitive & trim spasi)
        const targetSheetName = workbook.SheetNames.find(
          name => name.trim().toUpperCase() === 'INPUT SO HARIAN'
        );

        if (!targetSheetName) {
          throw new Error(
            "Sheet 'INPUT SO HARIAN' tidak ditemukan dalam file Excel. Pastikan menggunakan template SO resmi!"
          );
        }

        const worksheet = workbook.Sheets[targetSheetName];
        // Konversi sheet ke matriks baris (array of arrays)
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

        if (!rows || rows.length === 0) {
          throw new Error("Sheet 'INPUT SO HARIAN' kosong atau tidak terbaca.");
        }

        // 2. Deteksi Letak Baris & Kolom Tanggal Target
        // Baris tanggal biasanya ada di baris ke-2 (index 1 atau 2)
        let targetColIndex = -1;
        let dateRowIndex = -1;

        for (let r = 0; r < Math.min(6, rows.length); r++) {
          const row = rows[r] || [];
          for (let c = 3; c < row.length; c++) {
            const cellVal = parseInt(row[c]);
            if (cellVal === parseInt(targetDay)) {
              dateRowIndex = r;
              // Di format SO harian, kolom konversi total gramasi berada tepat di kolom samping tanggalnya
              targetColIndex = c + 1;
              break;
            }
          }
          if (targetColIndex !== -1) break;
        }

        if (targetColIndex === -1) {
          throw new Error(
            `Kolom tanggal ${targetDay} tidak ditemukan di baris header tanggal Excel.`
          );
        }

        // 3. Ekstraksi Baris Utama Bahan Baku (Hanya Baris TOTAL / V.20)
        const extractedItems = [];

        for (let r = dateRowIndex + 1; r < rows.length; r++) {
          const row = rows[r] || [];
          const itemCode = row[0]; // Kolom A: Kode Bar
          const itemName = row[1]; // Kolom B: Nama Item Stok Opname
          const unit = row[2];     // Kolom C: Satuan (GR / PCS / KARTON)
          const totalValue = row[targetColIndex]; // Kolom Nilai Total Fisik

          if (
            itemName &&
            totalValue !== null &&
            totalValue !== undefined &&
            !isNaN(totalValue)
          ) {
            // Saring hanya baris utama (ada kode item, atau nama mengandung (V.), atau satuan GR/PCS)
            const isMainItem = 
              itemCode || 
              String(itemName).includes('(V.') || 
              String(unit).toUpperCase() === 'GR' || 
              String(unit).toUpperCase() === 'PCS';

            if (isMainItem) {
              extractedItems.push({
                item_code: itemCode ? String(itemCode).trim() : null,
                item_name: String(itemName).trim(),
                unit: unit ? String(unit).trim().toUpperCase() : 'GR',
                physical_closing_stock: parseFloat(totalValue)
              });
            }
          }
        }

        resolve({
          date: targetDay,
          total_items_parsed: extractedItems.length,
          items: extractedItems
        });

      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(new Error(`Gagal membaca file: ${err.message}`));
    reader.readAsArrayBuffer(file);
  });
}