import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Product, Region, ProfitMargin, PriceCalculation } from '@/types/pricing';

interface ExportData {
  product: Product;
  region: Region;
  calculation: PriceCalculation;
  margin: ProfitMargin;
}

export function exportToExcel(data: ExportData) {
  const { product, region, calculation, margin } = data;
  
  const worksheetData = [
    ['LAPORAN HARGA JUAL'],
    [''],
    ['Tanggal', new Date().toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })],
    [''],
    ['INFORMASI PRODUK'],
    ['Nama Produk', product.name],
    ['Kategori', product.category],
    ['Satuan', product.unit],
    ['Region', region.name],
    [''],
    ['RINCIAN HARGA'],
    ['Harga Dasar', `Rp ${calculation.basePrice.toLocaleString('id-ID')}`],
    ['Harga Pricelist', `Rp ${calculation.regionPrice.toLocaleString('id-ID')}`],
    [''],
    ['POTONGAN/DISKON'],
  ];

  if (calculation.discounts.length > 0) {
    calculation.discounts.forEach(d => {
      worksheetData.push([d.label, `-Rp ${d.amount.toLocaleString('id-ID')}`]);
    });
  } else {
    worksheetData.push(['Tidak ada diskon', '-']);
  }

  const discountTotal = calculation.discounts.reduce((sum, d) => sum + d.amount, 0);
  worksheetData.push(['Total Potongan', `-Rp ${discountTotal.toLocaleString('id-ID')}`]);
  worksheetData.push(['']);
  worksheetData.push(['Harga Nett', `Rp ${calculation.netPrice.toLocaleString('id-ID')}`]);
  worksheetData.push(['']);
  worksheetData.push(['MARGIN KEUNTUNGAN']);
  worksheetData.push(['Tipe Pembayaran', margin.type === 'tempo' ? `Tempo ${margin.tempoTerm} hari` : 'Cash']);
  worksheetData.push(['Margin', `+Rp ${calculation.margin.toLocaleString('id-ID')}`]);
  worksheetData.push(['']);
  worksheetData.push(['HARGA JUAL FINAL', `Rp ${calculation.finalPrice.toLocaleString('id-ID')}`]);

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Set column widths
  worksheet['!cols'] = [{ wch: 20 }, { wch: 35 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Harga');

  const fileName = `Laporan_Harga_${product.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportToPDF(data: ExportData) {
  const { product, region, calculation, margin } = data;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor = [99, 102, 241]; // Indigo
  const textColor = [30, 41, 59]; // Slate 800
  const mutedColor = [100, 116, 139]; // Slate 500
  
  let y = 20;

  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN HARGA JUAL', pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, pageWidth / 2, 28, { align: 'center' });

  y = 50;

  // Product Info Section
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMASI PRODUK', 20, y);
  y += 8;

  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  const addRow = (label: string, value: string, isBold = false) => {
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(label, 20, y);
    
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(value, pageWidth - 20, y, { align: 'right' });
    y += 8;
  };

  addRow('Nama Produk', product.name);
  addRow('Kategori', product.category);
  addRow('Satuan', product.unit);
  addRow('Region', region.name);
  
  y += 5;

  // Price Details Section
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RINCIAN HARGA', 20, y);
  y += 8;

  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  addRow('Harga Dasar', `Rp ${calculation.basePrice.toLocaleString('id-ID')}`);
  addRow('Harga Pricelist', `Rp ${calculation.regionPrice.toLocaleString('id-ID')}`);
  
  y += 5;

  // Discounts Section
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('POTONGAN / DISKON', 20, y);
  y += 8;

  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  if (calculation.discounts.length > 0) {
    calculation.discounts.forEach(d => {
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(d.label, 20, y);
      
      doc.setTextColor(220, 38, 38); // Red
      doc.text(`-Rp ${d.amount.toLocaleString('id-ID')}`, pageWidth - 20, y, { align: 'right' });
      y += 8;
    });
  } else {
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.setFontSize(10);
    doc.text('Tidak ada diskon', 20, y);
    y += 8;
  }

  const discountTotal = calculation.discounts.reduce((sum, d) => sum + d.amount, 0);
  
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Potongan', 20, y);
  doc.setTextColor(220, 38, 38);
  doc.text(`-Rp ${discountTotal.toLocaleString('id-ID')}`, pageWidth - 20, y, { align: 'right' });
  y += 12;

  // Net Price
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.rect(15, y - 5, pageWidth - 30, 15, 'F');
  
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Harga Nett', 20, y + 4);
  doc.text(`Rp ${calculation.netPrice.toLocaleString('id-ID')}`, pageWidth - 20, y + 4, { align: 'right' });
  y += 20;

  // Margin Section
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MARGIN KEUNTUNGAN', 20, y);
  y += 8;

  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  addRow('Tipe Pembayaran', margin.type === 'tempo' ? `Tempo ${margin.tempoTerm} hari` : 'Cash');
  
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Margin', 20, y);
  
  doc.setTextColor(34, 197, 94); // Green
  doc.setFont('helvetica', 'bold');
  doc.text(`+Rp ${calculation.margin.toLocaleString('id-ID')}`, pageWidth - 20, y, { align: 'right' });
  y += 15;

  // Final Price
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(15, y, pageWidth - 30, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('HARGA JUAL FINAL', 20, y + 10);
  
  doc.setFontSize(16);
  doc.text(`Rp ${calculation.finalPrice.toLocaleString('id-ID')}`, pageWidth - 20, y + 16, { align: 'right' });

  // Footer
  y = doc.internal.pageSize.getHeight() - 15;
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Dokumen ini dihasilkan oleh Sales Price Calculator', pageWidth / 2, y, { align: 'center' });

  const fileName = `Laporan_Harga_${product.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
