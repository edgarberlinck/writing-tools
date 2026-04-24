import { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Chapter, Section, Project } from '../db/types';

interface Props {
  project: Project;
  chapter: Chapter | null;
  section: Section | null;
  locale: string;
}

export default function ExportButton({ project, chapter, section, locale }: Props) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!chapter) return;
    setExporting(true);
    try {
      const target = section || chapter;
      const langContent = target.languages.find((l) => l.locale === locale);
      const html = langContent?.content || '<p>No content</p>';
      const title = section
        ? `${chapter.title} - ${section.title}`
        : chapter.title;

      const container = document.createElement('div');
      container.innerHTML = `<h1 style="font-family:Georgia;margin-bottom:16px">${title}</h1>${html}`;
      container.style.cssText = `
        position:fixed; top:-9999px; left:-9999px;
        width:595px; padding:40px;
        font-family:${project.config.fonts.body.family};
        font-size:${project.config.fonts.body.size}px;
        line-height:${project.config.lineSpacing};
        background:#fff; color:#000;
      `;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, { scale: 2, useCORS: true });
      document.body.removeChild(container);

      const pageSize = project.config.pageSize.toLowerCase();
      const format = pageSize === 'letter' ? 'letter' : (pageSize as 'a4' | 'a5');
      const pdf = new jsPDF({ format, unit: 'mm' });
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${title}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={!chapter || exporting}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
    >
      <FiDownload className="w-4 h-4" />
      {exporting ? 'Exporting...' : 'Export PDF'}
    </button>
  );
}
