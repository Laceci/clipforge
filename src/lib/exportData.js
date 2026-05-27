import { toast } from 'sonner';

/**
 * Export rows to a CSV file download.
 * columns: [{ label: 'Title', key: 'title' }]
 *          or [{ label: 'Title', getValue: (row) => row.title }]
 */
export function exportCSV(rows, columns, filename) {
  const escape = (val) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return /[,\n"]/.test(str) ? `"${str}"` : str;
  };

  const header = columns.map(c => escape(c.label)).join(',');
  const body   = rows.map(row =>
    columns.map(c => escape(c.getValue ? c.getValue(row) : (row[c.key] ?? ''))).join(',')
  ).join('\n');

  const blob = new Blob(['﻿' + header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

/**
 * Export rows to a styled PDF using html2canvas + jsPDF.
 */
export async function exportPDF(rows, columns, filename, title) {
  // Build an off-screen styled table
  const wrap = document.createElement('div');
  wrap.style.cssText = [
    'position:fixed', 'left:-9999px', 'top:0',
    'background:#0f0f1a', 'padding:28px 32px', 'width:960px',
    'font-family:Inter,system-ui,sans-serif', 'color:#e2e8f0',
    'border-radius:12px',
  ].join(';');

  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <div>
        <h2 style="margin:0;font-size:20px;font-weight:800;color:#a3e635;">${title}</h2>
        <p style="margin:4px 0 0;font-size:12px;color:#64748b;">
          Exported ${new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
          &nbsp;·&nbsp; ${rows.length} record${rows.length !== 1 ? 's' : ''}
        </p>
      </div>
      <p style="font-size:11px;color:#475569;font-weight:600;letter-spacing:.06em;">ClipForge / ShortFlow</p>
    </div>
  `;

  const table = document.createElement('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;font-size:12px;';

  // Header row
  const thead = table.createTHead();
  const htr   = thead.insertRow();
  htr.style.cssText = 'background:#a3e635;color:#0f0f1a;';
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col.label;
    th.style.cssText = 'padding:9px 14px;text-align:left;font-weight:700;white-space:nowrap;';
    htr.appendChild(th);
  });

  // Body rows
  const tbody = table.createTBody();
  rows.forEach((row, i) => {
    const tr = tbody.insertRow();
    tr.style.cssText = `background:${i % 2 === 0 ? '#161627' : '#1e1e35'};`;
    columns.forEach(col => {
      const td = tr.insertCell();
      td.textContent = col.getValue ? col.getValue(row) : (row[col.key] ?? '—');
      td.style.cssText = 'padding:8px 14px;border-bottom:1px solid #1e2a4a;color:#cbd5e1;vertical-align:middle;';
    });
  });

  wrap.appendChild(table);
  document.body.appendChild(wrap);

  try {
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF }   = await import('jspdf');

    const canvas  = await html2canvas(wrap, { scale: 1.6, useCORS: true, backgroundColor: '#0f0f1a' });
    const imgData = canvas.toDataURL('image/png');

    const pdf    = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pgW    = pdf.internal.pageSize.getWidth();
    const pgH    = pdf.internal.pageSize.getHeight();
    const ratio  = canvas.width / canvas.height;
    const imgH   = pgW / ratio;

    // Paginate if image is taller than one page
    let yPos = 0;
    while (yPos < imgH) {
      if (yPos > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, -yPos, pgW, imgH);
      yPos += pgH;
    }

    pdf.save(`${filename}.pdf`);
  } finally {
    document.body.removeChild(wrap);
  }
}
