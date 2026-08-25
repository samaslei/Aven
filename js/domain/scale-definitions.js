/**
 * Aven - Grading Scale & Standing Definitions
 * Core constants and default Philippine 1.00 - 5.00 grading scale.
 */

export const YEAR_LEVELS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
  '6th Year',
  '7th Year'
];

export const SEMESTERS = [
  '1st Semester',
  '2nd Semester',
  'Summer'
];

export const DEFAULT_COLOR_SWATCHES = [
  '#6366f1', // Electric Indigo
  '#3b82f6', // Cobalt Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald Green
  '#84cc16', // Lime
  '#eab308', // Amber / Gold
  '#f97316', // Bright Orange
  '#ef4444', // Crimson Red
  '#ec4899', // Pink
  '#a855f7'  // Purple
];

export const GRADE_CATEGORIES = [
  'Quizzes',
  'Long Quizzes',
  'Term Exams',
  'Laboratory',
  'Attendance',
  'Other'
];

// Philippine 1.00 - 5.00 Grading Scale (with 60% = 3.00 Passing Cutoff)
export const PHILIPPINE_GRADE_SCALE = [
  { min: 97.00, grade: '1.00', desc: 'Excellent' },
  { min: 94.00, grade: '1.25', desc: 'Superior' },
  { min: 91.00, grade: '1.50', desc: 'Very Good' },
  { min: 88.00, grade: '1.75', desc: 'Good' },
  { min: 85.00, grade: '2.00', desc: 'Satisfactory' },
  { min: 82.00, grade: '2.25', desc: 'Fair' },
  { min: 79.00, grade: '2.50', desc: 'Pass' },
  { min: 76.00, grade: '2.75', desc: 'Pass' },
  { min: 60.00, grade: '3.00', desc: 'Passing' },
  { min: 0.00,  grade: '5.00', desc: 'Failed' }
];
