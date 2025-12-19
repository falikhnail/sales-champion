import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface HistoryRecord {
  id: string;
  product_name: string;
  product_unit: string;
  region_name: string;
  base_price: number;
  region_price: number;
  discounts: { label: string; amount: number }[];
  net_price: number;
  margin_amount: number;
  margin_type: string;
  final_price: number;
  notes: string | null;
  created_at: string;
  customer?: { name: string } | null;
}

export function exportHistoryToExcel(records: HistoryRecord[]) {
  const worksheetData = [
    ['RIWAYAT KALKULASI HARGA'],
    ['Tanggal Ekspor:', format(new Date(), 'd MMMM yyyy, HH:mm', { locale: idLocale })],
    [''],
    ['Tanggal', 'Produk', 'Satuan', 'Region', 'Pelanggan', 'Harga Region', 'Detail Diskon', 'Total Diskon', 'Harga Nett', 'Margin', 'Tipe Margin', 'Harga Final', 'Catatan']
  ];

  records.forEach(record => {
    const totalDiscount = record.discounts.reduce((sum, d) => sum + d.amount, 0);
    const discountDetails = record.discounts.map(d => `${d.label}: Rp ${d.amount.toLocaleString('id-ID')}`).join('; ') || '-';
    
    worksheetData.push([
      format(new Date(record.created_at), 'd MMM yyyy HH:mm', { locale: idLocale }),
      record.product_name,
      record.product_unit,
      record.region_name,
      record.customer?.name || '-',
      `Rp ${Number(record.region_price).toLocaleString('id-ID')}`,
      discountDetails,
      `-Rp ${totalDiscount.toLocaleString('id-ID')}`,
      `Rp ${Number(record.net_price).toLocaleString('id-ID')}`,
      `+Rp ${Number(record.margin_amount).toLocaleString('id-ID')}`,
      record.margin_type,
      `Rp ${Number(record.final_price).toLocaleString('id-ID')}`,
      record.notes || '-'
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  worksheet['!cols'] = [
    { wch: 18 }, { wch: 20 }, { wch: 8 }, { wch: 12 }, { wch: 20 },
    { wch: 15 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 12 }, { wch: 18 }, { wch: 25 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Harga');

  const fileName = `Riwayat_Harga_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportHistoryToPDF(records: HistoryRecord[]) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const primaryColor: [number, number, number] = [99, 102, 241];
  const textColor: [number, number, number] = [30, 41, 59];
  const mutedColor: [number, number, number] = [100, 116, 139];
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RIWAYAT KALKULASI HARGA', pageWidth / 2, 12, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tanggal Ekspor: ${format(new Date(), 'd MMMM yyyy, HH:mm', { locale: idLocale })} | Total: ${records.length} record`, pageWidth / 2, 20, { align: 'center' });

  let y = 35;
  const lineHeight = 6;
  const colX = [10, 38, 85, 105, 130, 160, 200, 235, 270];
  
  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(5, y - 4, pageWidth - 10, 8, 'F');
  
  doc.setTextColor(...textColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Tanggal', colX[0], y);
  doc.text('Produk', colX[1], y);
  doc.text('Region', colX[2], y);
  doc.text('Pelanggan', colX[3], y);
  doc.text('Harga Region', colX[4], y);
  doc.text('Diskon', colX[5], y);
  doc.text('Harga Nett', colX[6], y);
  doc.text('Harga Final', colX[7], y);
  
  y += 8;
  
  records.forEach((record, index) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
      
      // Repeat header on new page
      doc.setFillColor(241, 245, 249);
      doc.rect(5, y - 4, pageWidth - 10, 8, 'F');
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Tanggal', colX[0], y);
      doc.text('Produk', colX[1], y);
      doc.text('Region', colX[2], y);
      doc.text('Pelanggan', colX[3], y);
      doc.text('Harga Region', colX[4], y);
      doc.text('Diskon', colX[5], y);
      doc.text('Harga Nett', colX[6], y);
      doc.text('Harga Final', colX[7], y);
      y += 8;
    }
    
    const totalDiscount = record.discounts.reduce((sum, d) => sum + d.amount, 0);
    
    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(5, y - 4, pageWidth - 10, lineHeight + 2, 'F');
    }
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    doc.setFontSize(7);
    doc.text(format(new Date(record.created_at), 'd MMM yy HH:mm', { locale: idLocale }), colX[0], y);
    
    doc.setTextColor(...textColor);
    doc.text(record.product_name.substring(0, 25), colX[1], y);
    doc.text(record.region_name, colX[2], y);
    doc.text((record.customer?.name || '-').substring(0, 15), colX[3], y);
    doc.text(`Rp ${Number(record.region_price).toLocaleString('id-ID')}`, colX[4], y);
    
    doc.setTextColor(220, 38, 38);
    doc.text(`-Rp ${totalDiscount.toLocaleString('id-ID')}`, colX[5], y);
    
    doc.setTextColor(...textColor);
    doc.text(`Rp ${Number(record.net_price).toLocaleString('id-ID')}`, colX[6], y);
    
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rp ${Number(record.final_price).toLocaleString('id-ID')}`, colX[7], y);
    
    y += lineHeight + 2;
    
    // Show discount details if any
    if (record.discounts.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(...mutedColor);
      const discountText = record.discounts.map(d => `${d.label}: -Rp ${d.amount.toLocaleString('id-ID')}`).join(' | ');
      doc.text(`  ↳ ${discountText}`, colX[1], y);
      y += 4;
    }
  });

  // Footer
  doc.setTextColor(...mutedColor);
  doc.setFontSize(7);
  doc.text('Dokumen ini dihasilkan oleh Sales Price Calculator', pageWidth / 2, pageHeight - 8, { align: 'center' });

  const fileName = `Riwayat_Harga_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
