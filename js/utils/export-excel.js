/**
 * Aven - Export Grades to Excel (.xlsx) Module
 * Generates formatted, multi-section academic grade reports with SheetJS.
 */
import { store } from '../core/store.js';
import { getTodayISO } from './date-utils.js';

/**
 * Ensures SheetJS (XLSX) library is loaded in the window.
 */
async function ensureXlsxLoaded() {
  if (window.XLSX) return window.XLSX;

  return new Promise((resolve, reject) => {
    // Check if script element already exists
    const existing = document.querySelector('script[src*="xlsx"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.XLSX));
      existing.addEventListener('error', () => reject(new Error('Failed to load SheetJS from CDN')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.async = true;
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => reject(new Error('Failed to load SheetJS library. Please check your internet connection.'));
    document.head.appendChild(script);
  });
}

/**
 * Format date as YYYY-MM-DD for filenames
 */
function getFileDateString() {
  return getTodayISO();
}

/**
 * Sanitizes a string for Excel sheet name (max 31 chars, no invalid characters)
 */
function sanitizeSheetName(name, fallback = 'Sheet') {
  if (!name) return fallback;
  const sanitized = name.replace(/[\\/*?:\[\]]/g, '').trim().substring(0, 31);
  return sanitized || fallback;
}

/**
 * Builds data rows for a single subject grade sheet.
 */
function buildSubjectWorksheetData(subject) {
  const stats = store.calculateSubjectGrade(subject.id);
  const config = stats.config || { midterm_weight: 50, final_weight: 50 };
  const midterm = stats.midterm || {};
  const final = stats.final || {};
  const overallPct = stats.overallPercentage;
  const philGrade = stats.philGrade || { grade: '—', desc: '' };

  const rows = [];

  // 1. Report Header Block
  rows.push(['AVEN ACADEMIC OPERATING SYSTEM — GRADE REPORT']);
  rows.push(['Subject Name:', subject.name || '—', '', 'Subject Code:', subject.code || '—', 'Units:', subject.units || 0]);
  rows.push(['Academic Level:', `${subject.year_level || '—'} · ${subject.semester || '—'}`, '', 'Instructor:', subject.instructor || '—', 'Export Date:', new Date().toLocaleDateString()]);
  rows.push([]);

  // Helper to build term section rows
  const buildTermSection = (termName, termData, termWeightSplit) => {
    rows.push([`=== ${termName.toUpperCase()} TERM BREAKDOWN ===`, '', '', '', '', `Term Weight Split: ${termWeightSplit}%`]);
    rows.push(['Assessment Item', 'Category', 'Weight', 'Score', 'Total / Out Of', 'Percentage', 'Weighted Pts']);

    const categories = store.getSubjectGradeCategories(subject.id, termName);
    if (categories.length === 0) {
      rows.push(['(No grade categories configured for this term)', '', '', '', '', '', '']);
    } else {
      categories.forEach(cat => {
        const entries = cat.entries || [];
        const totalScore = entries.reduce((acc, e) => acc + Number(e.score || 0), 0);
        const totalOutOf = entries.reduce((acc, e) => acc + Number(e.out_of || 0), 0);
        const catPct = totalOutOf > 0 ? (totalScore / totalOutOf) * 100 : null;
        const catWeightedPts = catPct !== null ? (catPct * (cat.weight / 100)) : null;

        if (entries.length === 0) {
          rows.push([`(Empty Category — No entries)`, cat.category, `${cat.weight}%`, '—', '—', '—', '—']);
        } else {
          entries.forEach(ent => {
            const entScore = Number(ent.score || 0);
            const entOutOf = Number(ent.out_of || 0);
            const entPct = entOutOf > 0 ? ((entScore / entOutOf) * 100).toFixed(1) + '%' : '—';
            rows.push([ent.name || 'Assessment Item', cat.category, `${cat.weight}%`, entScore, entOutOf, entPct, '']);
          });
        }

        // Category Subtotal Row
        rows.push([
          `SUBTOTAL: ${cat.category.toUpperCase()}`,
          cat.category,
          `${cat.weight}%`,
          entries.length > 0 ? totalScore : '—',
          entries.length > 0 ? totalOutOf : '—',
          catPct !== null ? catPct.toFixed(1) + '%' : '—',
          catWeightedPts !== null ? catWeightedPts.toFixed(2) + ' pts' : '—'
        ]);
      });
    }

    // Term Summary Box Row
    rows.push([
      `${termName.toUpperCase()} STANDING:`,
      '',
      `Configured Weight: ${termData.totalWeight || 0}%`,
      '',
      `Earned Points: ${(termData.weightedEarned || 0).toFixed(2)} / ${termData.totalWeight || 0} pts`,
      `Term Average: ${termData.percentage !== null ? termData.percentage.toFixed(1) + '%' : 'No Grades'}`,
      `Phil Grade: ${termData.philGrade && termData.philGrade.grade !== '—' ? `${termData.philGrade.grade} (${termData.philGrade.desc})` : '—'}`
    ]);
    rows.push([]);
  };

  // 2. Midterm Section
  buildTermSection('Midterm', midterm, config.midterm_weight);

  // 3. Final Section
  buildTermSection('Final', final, config.final_weight);

  // 4. Overall Composite Summary Block
  rows.push(['=== OVERALL COMPOSITE STANDING ===']);
  rows.push(['Term Weighting Formula:', `Midterm (${config.midterm_weight}%) + Final (${config.final_weight}%)`]);
  rows.push(['Composite Weighted Average:', overallPct !== null ? `${overallPct.toFixed(2)}%` : 'No Grades Recorded']);
  rows.push(['Philippine Grade Point Equivalent:', philGrade.grade !== '—' ? `${philGrade.grade} — ${philGrade.desc}` : '—']);
  
  let standingStatus = 'NO GRADES';
  if (overallPct !== null) {
    standingStatus = overallPct >= 75 ? 'PASSED (Meets passing standard of 75.0% / 3.00)' : 'BELOW PASSING (< 75.0% / 5.00)';
  }
  rows.push(['Academic Standing Status:', standingStatus]);
  rows.push([]);

  return rows;
}

/**
 * Applies column widths and styling to an XLSX worksheet.
 */
function formatWorksheet(ws, XLSX) {
  // Set optimized column widths
  ws['!cols'] = [
    { wch: 34 }, // A: Assessment Item
    { wch: 24 }, // B: Category
    { wch: 14 }, // C: Weight
    { wch: 12 }, // D: Score
    { wch: 16 }, // E: Total / Out Of
    { wch: 16 }, // F: Percentage
    { wch: 22 }, // G: Weighted Points
    { wch: 20 }  // H: Notes/Status
  ];
}

/**
 * Exports single subject grades to Excel (.xlsx)
 */
export async function exportSubjectGradesToExcel(subjectId) {
  const subject = store.getSubjectById(subjectId);
  if (!subject) {
    throw new Error('Subject not found');
  }

  const XLSX = await ensureXlsxLoaded();
  const wb = XLSX.utils.book_new();

  const rows = buildSubjectWorksheetData(subject);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  formatWorksheet(ws, XLSX);

  const sheetName = sanitizeSheetName(subject.code || subject.name, 'Grades');
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const safeCode = (subject.code || subject.name || 'Subject').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Aven_Grades_${safeCode}_${getFileDateString()}.xlsx`;

  XLSX.writeFile(wb, filename);
  return filename;
}

/**
 * Exports all active subjects grades to a single multi-sheet Excel (.xlsx) workbook.
 */
export async function exportAllSubjectsGradesToExcel() {
  const activeSubjects = store.getSubjects(false);
  if (activeSubjects.length === 0) {
    throw new Error('No active subjects to export');
  }

  const XLSX = await ensureXlsxLoaded();
  const wb = XLSX.utils.book_new();

  // 1. Overview Summary Sheet
  const summaryRows = [
    ['AVEN ACADEMIC OPERATING SYSTEM — ALL SUBJECTS GRADE REPORT'],
    ['Generated Date:', new Date().toLocaleDateString(), '', 'Total Active Subjects:', activeSubjects.length],
    [],
    ['Subject Code', 'Subject Name', 'Units', 'Midterm %', 'Midterm Grade', 'Final %', 'Final Grade', 'Composite %', 'Phil Grade Point', 'Academic Status']
  ];

  let totalUnits = 0;
  let sumGradePoints = 0;
  let gradedUnits = 0;

  activeSubjects.forEach(sub => {
    const stats = store.calculateSubjectGrade(sub.id);
    const midterm = stats.midterm || {};
    const final = stats.final || {};
    const overallPct = stats.overallPercentage;
    const philGrade = stats.philGrade || { grade: '—', desc: '' };
    const units = Number(sub.units) || 0;

    totalUnits += units;
    if (philGrade.grade !== '—' && !isNaN(Number(philGrade.grade))) {
      sumGradePoints += Number(philGrade.grade) * units;
      gradedUnits += units;
    }

    let status = 'No Grades';
    if (overallPct !== null) {
      status = overallPct >= 75 ? 'Passed' : 'Below Passing';
    }

    summaryRows.push([
      sub.code || '—',
      sub.name || '—',
      units,
      midterm.percentage !== null ? `${midterm.percentage.toFixed(1)}%` : '—',
      midterm.philGrade && midterm.philGrade.grade !== '—' ? midterm.philGrade.grade : '—',
      final.percentage !== null ? `${final.percentage.toFixed(1)}%` : '—',
      final.philGrade && final.philGrade.grade !== '—' ? final.philGrade.grade : '—',
      overallPct !== null ? `${overallPct.toFixed(1)}%` : '—',
      philGrade.grade !== '—' ? `${philGrade.grade} (${philGrade.desc})` : '—',
      status
    ]);
  });

  const gpa = gradedUnits > 0 ? (sumGradePoints / gradedUnits).toFixed(2) : '—';

  summaryRows.push([]);
  summaryRows.push([
    'OVERALL GPA / GENERAL AVERAGE:',
    gpa,
    `Total Units: ${totalUnits} (${gradedUnits} graded)`,
    '',
    '',
    '',
    '',
    '',
    gpa !== '—' ? `GPA: ${gpa}` : '—',
    gpa !== '—' && Number(gpa) <= 3.0 ? 'Good Academic Standing' : ''
  ]);

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  summaryWs['!cols'] = [
    { wch: 16 }, // Subject Code
    { wch: 32 }, // Subject Name
    { wch: 10 }, // Units
    { wch: 14 }, // Midterm %
    { wch: 14 }, // Midterm Grade
    { wch: 14 }, // Final %
    { wch: 14 }, // Final Grade
    { wch: 14 }, // Composite %
    { wch: 22 }, // Phil Grade Point
    { wch: 18 }  // Status
  ];

  XLSX.utils.book_append_sheet(wb, summaryWs, 'Overview & Standings');

  // 2. Individual Subject Sheets
  const usedSheetNames = new Set(['Overview & Standings']);

  activeSubjects.forEach((sub, idx) => {
    let sheetName = sanitizeSheetName(sub.code || sub.name, `Subject ${idx + 1}`);
    let counter = 1;
    while (usedSheetNames.has(sheetName)) {
      sheetName = sanitizeSheetName(`${sub.code || 'Sub'}_${counter++}`, `Sub_${idx + 1}`);
    }
    usedSheetNames.add(sheetName);

    const subRows = buildSubjectWorksheetData(sub);
    const subWs = XLSX.utils.aoa_to_sheet(subRows);
    formatWorksheet(subWs, XLSX);
    XLSX.utils.book_append_sheet(wb, subWs, sheetName);
  });

  const filename = `Aven_Grades_All_${getFileDateString()}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}
