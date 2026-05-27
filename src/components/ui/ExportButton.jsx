import React from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportCSV, exportPDF } from '@/lib/exportData';
import { toast } from 'sonner';

/**
 * rows     – array of data objects
 * columns  – [{ label, key }] or [{ label, getValue: (row) => string }]
 * filename – base filename without extension
 * title    – human-readable title shown at the top of the PDF
 */
export default function ExportButton({ rows, columns, filename, title, disabled }) {
  const handleCSV = () => {
    if (!rows?.length) { toast.error('No data to export.'); return; }
    exportCSV(rows, columns, filename);
    toast.success(`Exported ${rows.length} row${rows.length !== 1 ? 's' : ''} as CSV`);
  };

  const handlePDF = async () => {
    if (!rows?.length) { toast.error('No data to export.'); return; }
    const id = toast.loading('Building PDF…');
    try {
      await exportPDF(rows, columns, filename, title);
      toast.success('PDF exported!', { id });
    } catch (err) {
      toast.error('PDF failed: ' + err.message, { id });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || !rows?.length}
          className="rounded-xl gap-1.5 border-border text-xs h-7 px-2.5"
        >
          <Download className="w-3 h-3" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border text-xs">
        <DropdownMenuItem onClick={handleCSV} className="flex items-center gap-2 cursor-pointer">
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePDF} className="flex items-center gap-2 cursor-pointer">
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
