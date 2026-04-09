import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportCSV(data, filename, headers) {
  const rows = data.map(row => headers.map(h => `"${(row[h.key] ?? '').toString().replace(/"/g, '""')}"`).join(','));
  const csv = [headers.map(h => h.label).join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function exportSociCSV(soci) {
  exportCSV(soci, 'soci.csv', [
    { key: 'nome', label: 'Nome' },
    { key: 'ruolo', label: 'Ruolo' },
    { key: 'email', label: 'Email' },
    { key: 'iscrizione', label: 'Data Iscrizione' },
  ]);
}

export function exportTasksCSV(tasks) {
  exportCSV(tasks, 'tasks.csv', [
    { key: 'titolo', label: 'Titolo' },
    { key: 'descrizione', label: 'Descrizione' },
    { key: 'priorita', label: 'Priorità' },
    { key: 'stato', label: 'Stato' },
    { key: 'assegnatario', label: 'Assegnatario' },
    { key: 'scadenza', label: 'Scadenza' },
  ]);
}

export function exportSociPDF(soci) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.setTextColor(59, 130, 246);
  doc.text('Anagrafica Soci - Forum dei Giovani', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generato il ${new Date().toLocaleDateString('it-IT')} · ${soci.length} soci`, 14, 28);
  autoTable(doc, {
    startY: 34,
    head: [['Nome', 'Ruolo', 'Email', 'Iscrizione']],
    body: soci.map(s => [s.nome, s.ruolo, s.email || '—', s.iscrizione]),
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });
  doc.save('soci.pdf');
}

export function exportTasksPDF(tasks) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.setTextColor(59, 130, 246);
  doc.text('Task & Progetti - Forum dei Giovani', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generato il ${new Date().toLocaleDateString('it-IT')} · ${tasks.length} task`, 14, 28);
  autoTable(doc, {
    startY: 34,
    head: [['Titolo', 'Priorità', 'Stato', 'Assegnatario', 'Scadenza']],
    body: tasks.map(t => [t.titolo, t.priorita, t.stato, t.assegnatario || '—', t.scadenza || '—']),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });
  doc.save('tasks.pdf');
}
