import * as pdfjsLib from 'pdfjs-dist';

// Worker PDF.js via unpkg CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Parser Khusus PDF Sales Mix / Promix Closing ESB Gacoan
 * @param {File} file - File PDF laporan ESB
 * @returns {Promise<Array<{menu_name: string, qty_sold: number}>>}
 */
export async function parseEsbSalesPdf(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        
        let fullLines = [];

        // 1. Ekstraksi seluruh teks baris dari PDF
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          const pageStrings = textContent.items
            .map(item => item.str.trim())
            .filter(Boolean);
            
          fullLines = fullLines.concat(pageStrings);
        }

        // 2. Daftar Menu Kritis SOC yang akan diambil dari bagian "Sales Menu"
        const TARGET_ITEMS = [
          { key: 'MIE GACOAN', label: 'Mie Gacoan' },
          { key: 'MIE HOMPIMPA', label: 'Mie Hompimpa' },
          { key: 'MIE SUIT', label: 'Mie Suit' },
          { key: 'UDANG KEJU', label: 'Udang Keju' },
          { key: 'LUMPIA UDANG', label: 'Lumpia Udang' },
          { key: 'SIOMAY', label: 'Siomay' },
          { key: 'UDANG RAMBUTAN', label: 'Udang Rambutan' },
          { key: 'PANGSIT GORENG', label: 'Pangsit Goreng' },
          { key: 'ES GOBAK SODOR', label: 'Es Gobak Sodor' },
          { key: 'ES TEKLEK', label: 'Es Teklek' },
          { key: 'ES SLUKU BATHOK', label: 'Es Sluku Bathok' },
          { key: 'ES PETAK UMPET', label: 'Es Petak Umpet' },
          { key: 'AIR MINERAL', label: 'Air Mineral' }
        ];

        // 3. Batasi pencarian hanya di area tabel "Sales Menu" agar tidak membaca sub-kategori
        const salesMenuIdx = fullLines.findIndex(l => l.toUpperCase().includes('SALES MENU'));
        const searchPool = salesMenuIdx !== -1 ? fullLines.slice(salesMenuIdx) : fullLines;

        const results = [];
        const foundKeys = new Set();

        for (let i = 0; i < searchPool.length; i++) {
          // Gabungkan 2 kata berurutan untuk menangani nama bertingkat (misal: "ES GOBAK" dan "SODOR")
          const currentWord = searchPool[i].toUpperCase();
          const nextWord = (searchPool[i + 1] || '').toUpperCase();
          const combinedTwo = `${currentWord} ${nextWord}`.trim();

          for (const item of TARGET_ITEMS) {
            if (foundKeys.has(item.key)) continue;

            const isMatch = currentWord === item.key || combinedTwo === item.key;

            if (isMatch) {
              // Cari token angka porsi terjual di baris-baris setelah nama menu
              const searchOffset = combinedTwo === item.key ? 2 : 1;

              for (let offset = searchOffset; offset <= searchOffset + 5; offset++) {
                const candidateStr = searchPool[i + offset] || '';
                // Bersihkan titik ribuan (misal: "2.863" menjadi "2863")
                const cleanedNumStr = candidateStr.replace(/\./g, '').replace(/,/g, '');
                const qtyVal = parseInt(cleanedNumStr, 10);

                // Validasi: kuantitas menu terjual berada dalam rentang wajar (1 - 50.000)
                if (!isNaN(qtyVal) && qtyVal > 0 && qtyVal < 50000) {
                  // Pastikan bukan baris rupiah (jika mengandung '000' panjang atau ada tanda koma rupiah)
                  if (!candidateStr.includes(',00')) {
                    results.push({
                      menu_name: item.label,
                      qty_sold: qtyVal
                    });
                    foundKeys.add(item.key);
                    break;
                  }
                }
              }
            }
          }
        }

        if (results.length === 0) {
          throw new Error("Gagal mengekstrak tabel Sales Menu. Pastikan file adalah Promix PDF resmi dari POS ESB!");
        }

        resolve(results);

      } catch (err) {
        reject(new Error(`Gagal membaca PDF ESB: ${err.message}`));
      }
    };

    reader.onerror = (err) => reject(new Error(`Gagal membaca file: ${err.message}`));
    reader.readAsArrayBuffer(file);
  });
}