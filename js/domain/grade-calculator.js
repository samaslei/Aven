/**
 * Aven - Pure Grade Calculator
 * Pure domain logic for category averages, weighted grades, GPA conversion,
 * and Philippine grading scale standing classifications. Zero DOM dependencies.
 */

import { PHILIPPINE_GRADE_SCALE } from './scale-definitions.js';

/**
 * Maps a percentage (0-100) to the corresponding Philippine 1.00-5.00 grade.
 * @param {number|string|null} percentage 
 * @param {Array} [scale] Optional custom scale override
 * @returns {{ grade: string, desc: string, min?: number }}
 */
export function getPhilippineGrade(percentage, scale = null) {
  if (percentage === null || percentage === undefined || percentage === '' || isNaN(percentage)) {
    return { grade: '—', desc: 'No Data' };
  }
  const pct = Math.max(0, Math.min(100, Number(percentage)));
  const activeScale = scale && scale.length > 0 ? scale : PHILIPPINE_GRADE_SCALE;
  
  for (const item of activeScale) {
    if (pct >= Number(item.min)) {
      return item;
    }
  }
  return { grade: '5.00', desc: 'Failed' };
}

/**
 * Returns standing tier classification and theme-adaptive CSS tokens.
 * @param {number|string|null} percentage 
 * @returns {{ tier: string, colorVar: string, cssClass: string, status: string }}
 */
export function getGradeStandingTier(percentage) {
  if (percentage === null || percentage === undefined || percentage === '' || isNaN(Number(percentage))) {
    return {
      tier: 'none',
      colorVar: 'var(--text-muted)',
      cssClass: 'standing-muted',
      status: 'No Data'
    };
  }
  const pct = Number(percentage);
  if (pct >= 85) {
    return {
      tier: 'excellent',
      colorVar: 'var(--success)',
      cssClass: 'standing-excellent',
      status: 'Excellent'
    };
  }
  if (pct >= 75) {
    return {
      tier: 'solid',
      colorVar: 'var(--accent)',
      cssClass: 'standing-solid',
      status: 'Good'
    };
  }
  if (pct >= 60) {
    return {
      tier: 'warning',
      colorVar: 'var(--warning)',
      cssClass: 'standing-warning',
      status: 'At Risk'
    };
  }
  return {
    tier: 'danger',
    colorVar: 'var(--danger)',
    cssClass: 'standing-danger',
    status: 'Failing'
  };
}

export function getStandingColor(percentage) {
  return getGradeStandingTier(percentage).colorVar;
}

export function getStandingClass(percentage) {
  if (percentage === null || percentage === undefined || isNaN(percentage) || percentage === '—') return 'grade-none';
  const val = parseFloat(percentage);
  if (isNaN(val)) return 'grade-none';
  if (val >= 75) return 'grade-pass';
  if (val >= 60) return 'grade-warn';
  return 'grade-danger';
}

/**
 * Calculates raw score and percentage for a list of grade entries.
 * @param {Array<{ score: number, out_of: number }>} entries 
 * @returns {{ totalScore: number, totalOutOf: number, percentage: number|null }}
 */
export function calculateCategoryStats(entries = []) {
  const totalScore = entries.reduce((acc, e) => acc + Number(e.score || 0), 0);
  const totalOutOf = entries.reduce((acc, e) => acc + Number(e.out_of || 0), 0);
  const percentage = totalOutOf > 0 ? (totalScore / totalOutOf) * 100 : null;
  return { totalScore, totalOutOf, percentage };
}

/**
 * Calculates weighted term grade from categories.
 * @param {Array<{ id: string, category: string, weight: number, entries: Array }>} categories 
 * @param {Array} [scale] Optional grading scale
 */
export function calculateTermGradeBreakdown(categories = [], scale = null) {
  if (categories.length === 0) {
    return { percentage: null, totalWeight: 0, weightedEarned: 0, categorySummaries: [], philGrade: { grade: '—', desc: 'No Data' } };
  }

  let totalWeight = 0;
  let weightedEarned = 0;
  const categorySummaries = [];

  categories.forEach(cat => {
    const weight = Number(cat.weight || 0);
    totalWeight += weight;
    const { totalScore, totalOutOf, percentage: rawPct } = calculateCategoryStats(cat.entries || []);
    const catWeightedPts = rawPct !== null ? (rawPct * (weight / 100)) : null;

    if (catWeightedPts !== null) {
      weightedEarned += catWeightedPts;
    }

    categorySummaries.push({
      id: cat.id,
      category: cat.category,
      weight,
      totalScore,
      totalOutOf,
      percentage: rawPct,
      weightedPoints: catWeightedPts,
      entriesCount: (cat.entries || []).length
    });
  });

  // Check if any category is a Term Exam / Major Exam category
  // Common user namings: 'Term Exams', 'Midterm Exam', 'Final Exam', 'Exam', 'Major Exam', 'Periodical Exam', etc.
  const isExamCategory = (name) => /exam|periodical|major\s*test|defense/i.test(name || '');
  const examCategories = categories.filter(c => isExamCategory(c.category));
  const hasExamCategory = examCategories.length > 0;
  const hasExamEntry = examCategories.some(c => (c.entries || []).length > 0);

  let termPercentage = null;
  let isPendingExam = false;

  if (hasExamCategory && !hasExamEntry) {
    // Exam category is configured but no exam has been entered yet:
    // Do not calculate a premature partial standing.
    isPendingExam = true;
    termPercentage = null;
  } else if (totalWeight > 0) {
    termPercentage = Math.round(weightedEarned * 100) / 100;
  }

  return {
    percentage: termPercentage,
    totalWeight,
    weightedEarned,
    isPendingExam,
    categorySummaries,
    philGrade: isPendingExam ? { grade: '—', desc: 'Awaiting Term Exam' } : getPhilippineGrade(termPercentage, scale)
  };
}

/**
 * Calculates subject overall grade from Midterm and Final term results and weights.
 * @param {Object} midtermResult 
 * @param {Object} finalResult 
 * @param {{ midterm_weight: number, final_weight: number }} config 
 * @param {Array} [scale]
 */
export function calculateSubjectGradeBreakdown(midtermResult, finalResult, config, scale = null) {
  const mWeight = (Number(config?.midterm_weight) || 50) / 100;
  const fWeight = (Number(config?.final_weight) || 50) / 100;

  let overallPct = null;

  if (midtermResult.percentage !== null && finalResult.percentage !== null) {
    overallPct = (midtermResult.percentage * mWeight) + (finalResult.percentage * fWeight);
  } else if (midtermResult.percentage !== null) {
    overallPct = midtermResult.percentage;
  } else if (finalResult.percentage !== null) {
    overallPct = finalResult.percentage;
  }

  if (overallPct !== null) {
    overallPct = Math.round(overallPct * 100) / 100;
  }

  const philGrade = getPhilippineGrade(overallPct, scale);

  return {
    overallPercentage: overallPct,
    philGrade,
    summaryLine: overallPct !== null ? `${overallPct.toFixed(1)}% · ${philGrade.grade}` : 'No Grades'
  };
}
