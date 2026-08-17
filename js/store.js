/**
 * Aven - Central Reactive Store
 * Single source of truth. All entities reference Subject by subject_id.
 */

const STORAGE_KEYS = {
  SUBJECTS: 'aven_subjects_v1',
  SESSIONS: 'aven_sessions_v1',
  GRADES: 'aven_grades_v1',
  GRADE_CONFIGS: 'aven_grade_configs_v1',
  PLANS: 'aven_plans_v1',
  USER: 'aven_user_v1',
  THEME: 'aven_theme_v1',
  SETTINGS: 'aven_settings_v1'
};

// Available Year Levels & Semesters
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

export function getPhilippineGrade(percentage) {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return { grade: '—', desc: 'No Data' };
  }
  const pct = Math.max(0, Math.min(100, Number(percentage)));
  const scale = store ? store.getGradingScale() : PHILIPPINE_GRADE_SCALE;
  for (const item of scale) {
    if (pct >= Number(item.min)) {
      return item;
    }
  }
  return { grade: '5.00', desc: 'Failed' };
}

/**
 * Color-code grade percentages by academic standing tier:
 * - 85%+ : Green (var(--success)) - Comfortably passing / Excellent to Very Good
 * - 75-84.99% : Blue/Indigo (var(--accent)) - Solid passing
 * - 60-74.99% : Amber/Orange (var(--warning)) - Near passing cutoff / At-risk
 * - < 60% : Red (var(--danger)) - Failing
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



// Event Bus for reactivity
class EventBus {
  constructor() {
    this.listeners = {};
  }
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => this.off(event, callback);
  }
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }
  emit(event, payload) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(payload));
    }
    if (this.listeners['*']) {
      this.listeners['*'].forEach(cb => cb({ event, payload }));
    }
  }
}

export const events = new EventBus();

// Generate Clean IDs
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
}

// Initial Realistic Demo Data with Interactive Study Plan
function getInitialData() {
  const subjects = [
    {
      id: 'sub_cs102',
      name: 'Data Structures & Algorithms',
      code: 'CS 102',
      year_level: '2nd Year',
      semester: '1st Semester',
      color: '#6366f1',
      instructor: 'Dr. Elena Santos',
      archived: false,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      id: 'sub_cs201',
      name: 'Computer Systems & Architecture',
      code: 'CS 201',
      year_level: '2nd Year',
      semester: '1st Semester',
      color: '#3b82f6',
      instructor: 'Prof. Marcus Chen',
      archived: false,
      created_at: new Date(Date.now() - 28 * 86400000).toISOString()
    },
    {
      id: 'sub_math120',
      name: 'Discrete Mathematics & Graph Theory',
      code: 'MATH 120',
      year_level: '2nd Year',
      semester: '1st Semester',
      color: '#10b981',
      instructor: 'Dr. Ramon Alvarez',
      archived: false,
      created_at: new Date(Date.now() - 25 * 86400000).toISOString()
    },
    {
      id: 'sub_eng105',
      name: 'Technical Writing & Ethics',
      code: 'ENG 105',
      year_level: '2nd Year',
      semester: '1st Semester',
      color: '#f97316',
      instructor: 'Prof. Clara Reyes',
      archived: false,
      created_at: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
      id: 'sub_phy101',
      name: 'Engineering Physics I',
      code: 'PHY 101',
      year_level: '1st Year',
      semester: '2nd Semester',
      color: '#a855f7',
      instructor: 'Dr. Victor Morales',
      archived: true,
      created_at: new Date(Date.now() - 120 * 86400000).toISOString()
    }
  ];

  const pastDays = (d) => {
    const dt = new Date(Date.now() - d * 86400000);
    return dt.toISOString().split('T')[0];
  };

  const sessions = [
    { id: generateId('ses'), subject_id: 'sub_cs102', duration: 90, date: pastDays(0), notes: 'Implemented Red-Black Tree rotation & AVL rebalancing', created_at: new Date().toISOString() },
    { id: generateId('ses'), subject_id: 'sub_math120', duration: 60, date: pastDays(0), notes: 'Graph coloring theorems & Eulerian paths', created_at: new Date().toISOString() },
    { id: generateId('ses'), subject_id: 'sub_cs201', duration: 120, date: pastDays(1), notes: 'RISC-V assembly pipeline hazards & forwarding logic', created_at: new Date().toISOString() },
    { id: generateId('ses'), subject_id: 'sub_cs102', duration: 75, date: pastDays(2), notes: 'Dijkstra shortest path & Prim minimum spanning tree', created_at: new Date().toISOString() },
    { id: generateId('ses'), subject_id: 'sub_math120', duration: 45, date: pastDays(3), notes: 'Combinatorics practice problem set 4', created_at: new Date().toISOString() },
    { id: generateId('ses'), subject_id: 'sub_cs201', duration: 90, date: pastDays(4), notes: 'Cache memory direct mapping vs 4-way set associative', created_at: new Date().toISOString() },
    { id: generateId('ses'), subject_id: 'sub_eng105', duration: 60, date: pastDays(5), notes: 'Drafted ACM ethics case study paper', created_at: new Date().toISOString() },
    { id: generateId('ses'), subject_id: 'sub_cs102', duration: 110, date: pastDays(6), notes: 'Dynamic programming: Knapsack and Longest Common Subsequence', created_at: new Date().toISOString() },
    { id: generateId('ses'), subject_id: 'sub_math120', duration: 80, date: pastDays(7), notes: 'Recurrence relations and Master Theorem proofs', created_at: new Date().toISOString() },
    { id: generateId('ses'), subject_id: 'sub_cs201', duration: 100, date: pastDays(8), notes: 'Virtual memory page tables and TLB miss handling', created_at: new Date().toISOString() },
    { id: generateId('ses'), subject_id: 'sub_cs102', duration: 60, date: pastDays(9), notes: 'Heap sort & Priority Queue implementations', created_at: new Date().toISOString() },
    { id: generateId('ses'), subject_id: 'sub_cs102', duration: 90, date: pastDays(12), notes: 'B-Trees and external memory index structures', created_at: new Date().toISOString() },
    { id: generateId('ses'), subject_id: 'sub_math120', duration: 50, date: pastDays(13), notes: 'Modular arithmetic & RSA encryption fundamentals', created_at: new Date().toISOString() },
    { id: generateId('ses'), subject_id: 'sub_cs201', duration: 130, date: pastDays(15), notes: 'Interrupt handling & DMA bus architecture', created_at: new Date().toISOString() },
    { id: generateId('ses'), subject_id: 'sub_eng105', duration: 45, date: pastDays(18), notes: 'IEEE formatting and citation review', created_at: new Date().toISOString() },
    { id: generateId('ses'), subject_id: 'sub_cs102', duration: 120, date: pastDays(21), notes: 'Graph traversal: BFS, DFS, and topological sort', created_at: new Date().toISOString() },
    { id: generateId('ses'), subject_id: 'sub_math120', duration: 75, date: pastDays(24), notes: 'Mathematical induction & structural induction', created_at: new Date().toISOString() }
  ];

  const grades = [
    {
      id: generateId('cat'),
      subject_id: 'sub_cs102',
      term: 'Midterm',
      category: 'Quizzes',
      weight: 20,
      entries: [
        { id: generateId('ent'), name: 'Quiz 1: Array & Linked Lists', score: 19, out_of: 20 },
        { id: generateId('ent'), name: 'Quiz 2: Stacks & Queues', score: 20, out_of: 20 },
        { id: generateId('ent'), name: 'Quiz 3: Binary Search Trees', score: 17, out_of: 20 }
      ]
    },
    {
      id: generateId('cat'),
      subject_id: 'sub_cs102',
      term: 'Midterm',
      category: 'Laboratory',
      weight: 25,
      entries: [
        { id: generateId('ent'), name: 'Lab 1: Generic Doubly Linked List', score: 48, out_of: 50 },
        { id: generateId('ent'), name: 'Lab 2: Expression Evaluator', score: 50, out_of: 50 },
        { id: generateId('ent'), name: 'Lab 3: AVL Tree Auto-balancer', score: 45, out_of: 50 }
      ]
    },
    {
      id: generateId('cat'),
      subject_id: 'sub_cs102',
      term: 'Midterm',
      category: 'Long Quizzes',
      weight: 20,
      entries: [
        { id: generateId('ent'), name: 'Long Quiz 1: Trees & Balancing', score: 88, out_of: 100 }
      ]
    },
    {
      id: generateId('cat'),
      subject_id: 'sub_cs102',
      term: 'Midterm',
      category: 'Term Exams',
      weight: 30,
      entries: [
        { id: generateId('ent'), name: 'Midterm Exam: Theory & Code', score: 92, out_of: 100 }
      ]
    },
    {
      id: generateId('cat'),
      subject_id: 'sub_cs102',
      term: 'Midterm',
      category: 'Attendance',
      weight: 5,
      entries: [
        { id: generateId('ent'), name: 'Midterm Attendance & Recitation', score: 100, out_of: 100 }
      ]
    },
    {
      id: generateId('cat'),
      subject_id: 'sub_cs102',
      term: 'Final',
      category: 'Quizzes',
      weight: 20,
      entries: [
        { id: generateId('ent'), name: 'Quiz 4: Heaps & Priority Queues', score: 18, out_of: 20 },
        { id: generateId('ent'), name: 'Quiz 5: Graph Algorithms', score: 19, out_of: 20 }
      ]
    },
    {
      id: generateId('cat'),
      subject_id: 'sub_cs102',
      term: 'Final',
      category: 'Laboratory',
      weight: 25,
      entries: [
        { id: generateId('ent'), name: 'Lab 4: Dijkstra Shortest Path Visualizer', score: 49, out_of: 50 },
        { id: generateId('ent'), name: 'Lab 5: Dynamic Programming DP-Table', score: 47, out_of: 50 }
      ]
    },
    {
      id: generateId('cat'),
      subject_id: 'sub_cs102',
      term: 'Final',
      category: 'Long Quizzes',
      weight: 20,
      entries: [
        { id: generateId('ent'), name: 'Long Quiz 2: Graphs & Dynamic Programming', score: 94, out_of: 100 }
      ]
    },
    {
      id: generateId('cat'),
      subject_id: 'sub_cs102',
      term: 'Final',
      category: 'Term Exams',
      weight: 30,
      entries: [
        { id: generateId('ent'), name: 'Final Comprehensive Exam', score: 91, out_of: 100 }
      ]
    },
    {
      id: generateId('cat'),
      subject_id: 'sub_cs102',
      term: 'Final',
      category: 'Attendance',
      weight: 5,
      entries: [
        { id: generateId('ent'), name: 'Final Attendance & Code Reviews', score: 100, out_of: 100 }
      ]
    },
    {
      id: generateId('cat'),
      subject_id: 'sub_cs201',
      term: 'Midterm',
      category: 'Quizzes',
      weight: 25,
      entries: [
        { id: generateId('ent'), name: 'Quiz 1: Logic Gates & ALU', score: 28, out_of: 30 },
        { id: generateId('ent'), name: 'Quiz 2: RISC-V Instruction Formats', score: 26, out_of: 30 }
      ]
    },
    {
      id: generateId('cat'),
      subject_id: 'sub_cs201',
      term: 'Midterm',
      category: 'Laboratory',
      weight: 35,
      entries: [
        { id: generateId('ent'), name: 'Lab 1: 4-bit Ripple Carry Adder', score: 95, out_of: 100 },
        { id: generateId('ent'), name: 'Lab 2: Single-Cycle Datapath CPU', score: 90, out_of: 100 }
      ]
    },
    {
      id: generateId('cat'),
      subject_id: 'sub_cs201',
      term: 'Midterm',
      category: 'Term Exams',
      weight: 40,
      entries: [
        { id: generateId('ent'), name: 'Midterm Examination', score: 84, out_of: 100 }
      ]
    },
    {
      id: generateId('cat'),
      subject_id: 'sub_math120',
      term: 'Midterm',
      category: 'Quizzes',
      weight: 30,
      entries: [
        { id: generateId('ent'), name: 'Quiz 1: Propositional Logic', score: 45, out_of: 50 },
        { id: generateId('ent'), name: 'Quiz 2: Set Theory & Relations', score: 48, out_of: 50 }
      ]
    },
    {
      id: generateId('cat'),
      subject_id: 'sub_math120',
      term: 'Midterm',
      category: 'Term Exams',
      weight: 70,
      entries: [
        { id: generateId('ent'), name: 'Midterm Departmental Exam', score: 90, out_of: 100 }
      ]
    },
    {
      id: generateId('cat'),
      subject_id: 'sub_eng105',
      term: 'Midterm',
      category: 'Quizzes',
      weight: 40,
      entries: [
        { id: generateId('ent'), name: 'Paper 1: Tech Memo', score: 88, out_of: 100 }
      ]
    },
    {
      id: generateId('cat'),
      subject_id: 'sub_eng105',
      term: 'Midterm',
      category: 'Term Exams',
      weight: 60,
      entries: [
        { id: generateId('ent'), name: 'Oral Defense / Ethics Analysis', score: 92, out_of: 100 }
      ]
    }
  ];

  const gradeConfigs = [
    { subject_id: 'sub_cs102', midterm_weight: 50, final_weight: 50 },
    { subject_id: 'sub_cs201', midterm_weight: 50, final_weight: 50 },
    { subject_id: 'sub_math120', midterm_weight: 50, final_weight: 50 },
    { subject_id: 'sub_eng105', midterm_weight: 50, final_weight: 50 },
    { subject_id: 'sub_phy101', midterm_weight: 50, final_weight: 50 }
  ];

  const samplePlanHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; padding: 24px; max-width: 800px; margin: 0 auto; background: #ffffff; }
    h1 { color: #4338ca; border-bottom: 2px solid #e0e7ff; padding-bottom: 8px; font-size: 22px; }
    h2 { color: #3730a3; margin-top: 24px; font-size: 17px; }
    .badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; }
    .progress-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .progress-bar-bg { background: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden; margin-top: 8px; }
    .progress-bar-fill { background: #4f46e5; height: 100%; width: 50%; transition: width 0.3s ease; }
    .timeline { border-left: 3px solid #6366f1; padding-left: 16px; margin-left: 8px; }
    .week-item { margin-bottom: 20px; position: relative; }
    .week-item::before { content: ''; position: absolute; left: -22px; top: 6px; width: 10px; height: 10px; background: #6366f1; border-radius: 50%; }
    .week-title { font-weight: 700; color: #0f172a; cursor: pointer; }
    .task-item { display: flex; align-items: center; gap: 8px; margin: 6px 0; font-size: 13.5px; }
    .task-item input[type="checkbox"] { cursor: pointer; accent-color: #4f46e5; width: 16px; height: 16px; }
    .task-item.done { text-decoration: line-through; color: #94a3b8; }
  </style>
</head>
<body>
  <h1>CS 102: Data Structures & Algorithms — Interactive Roadmap</h1>
  <p><span class="badge">Term: 1st Semester</span> <span class="badge">Interactive Progress Tracker</span></p>

  <div class="progress-box">
    <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 13px;">
      <span>Syllabus Completion</span>
      <span id="progress-text">50% Completed</span>
    </div>
    <div class="progress-bar-bg">
      <div class="progress-bar-fill" id="progress-fill"></div>
    </div>
  </div>

  <h2>Midterm Roadmap (Weeks 1 – 9)</h2>
  <div class="timeline">
    <div class="week-item">
      <div class="week-title">Week 1-2: Asymptotic Analysis & Memory Management</div>
      <div class="task-item done"><input type="checkbox" checked onchange="updateProgress()"> Big-O, Big-Omega, Big-Theta rigorous proofs</div>
      <div class="task-item done"><input type="checkbox" checked onchange="updateProgress()"> Dynamic pointers & reference semantics in C++</div>
    </div>
    <div class="week-item">
      <div class="week-title">Week 3-4: Stacks, Queues & Monotonic Patterns</div>
      <div class="task-item done"><input type="checkbox" checked onchange="updateProgress()"> Circular ring buffer queue implementation</div>
      <div class="task-item done"><input type="checkbox" checked onchange="updateProgress()"> Monotonic stack next-greater-element drill</div>
    </div>
    <div class="week-item">
      <div class="week-title">Week 5-7: Binary Search Trees & AVL Balancing</div>
      <div class="task-item"><input type="checkbox" onchange="updateProgress()"> Single & double rotation invariants</div>
      <div class="task-item"><input type="checkbox" onchange="updateProgress()"> Red-Black Tree insertion recoloring rules</div>
    </div>
  </div>

  <h2>Final Roadmap (Weeks 10 – 18)</h2>
  <div class="timeline">
    <div class="week-item">
      <div class="week-title">Week 10-12: Heaps, Priority Queues & Disjoint Sets</div>
      <div class="task-item"><input type="checkbox" onchange="updateProgress()"> Binary Heap sift-up / sift-down array representation</div>
      <div class="task-item"><input type="checkbox" onchange="updateProgress()"> Union-Find with rank & path compression</div>
    </div>
    <div class="week-item">
      <div class="week-title">Week 13-15: Graph Search & Shortest Path Paradigms</div>
      <div class="task-item"><input type="checkbox" onchange="updateProgress()"> Dijkstra & A* shortest path implementations</div>
      <div class="task-item"><input type="checkbox" onchange="updateProgress()"> Prim & Kruskal minimum spanning trees</div>
    </div>
  </div>

  <script>
    function updateProgress() {
      const allBoxes = document.querySelectorAll('input[type="checkbox"]');
      const checkedBoxes = document.querySelectorAll('input[type="checkbox"]:checked');
      const pct = Math.round((checkedBoxes.length / allBoxes.length) * 100);
      document.getElementById('progress-fill').style.width = pct + '%';
      document.getElementById('progress-text').textContent = pct + '% Completed (' + checkedBoxes.length + '/' + allBoxes.length + ' milestones)';
      allBoxes.forEach(box => {
        box.parentElement.classList.toggle('done', box.checked);
      });
    }
    updateProgress();
  </script>
</body>
</html>`;

  const plans = [
    {
      id: generateId('plan'),
      subject_id: 'sub_cs102',
      title: 'CS 102 Interactive Mastery Syllabus',
      html_content: samplePlanHtml,
      updated_at: new Date(Date.now() - 2 * 86400000).toISOString()
    }
  ];

  const user = {
    name: 'Alex Rivera',
    email: 'alex.rivera@university.edu',
    avatar: 'AR',
    avatar_color: '#4f46e5'
  };

  const settings = {
    default_midterm_weight: 50,
    default_final_weight: 50,
    default_timer_mode: 'stopwatch',
    pomodoro_work_mins: 25,
    pomodoro_break_mins: 5,
    subjects_view_mode: 'grid'
  };

  return { subjects, sessions, grades, gradeConfigs, plans, user, settings };
}

// Store Class
class Store {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.SUBJECTS)) {
      const initial = getInitialData();
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(initial.subjects));
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(initial.sessions));
      localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(initial.grades));
      localStorage.setItem(STORAGE_KEYS.GRADE_CONFIGS, JSON.stringify(initial.gradeConfigs));
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(initial.plans));
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(initial.user));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initial.settings));
    }
  }

  // --- SETTINGS ---
  getSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const defaults = {
        default_midterm_weight: 50,
        default_final_weight: 50,
        default_timer_mode: 'stopwatch',
        sound_notifications: true,
        subjects_view_mode: 'grid'
      };
      return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
    } catch (e) {
      return {
        default_midterm_weight: 50,
        default_final_weight: 50,
        default_timer_mode: 'stopwatch',
        sound_notifications: true,
        subjects_view_mode: 'grid'
      };
    }
  }

  saveSettings(partial) {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    events.emit('settings:updated', updated);
    events.emit('store:changed', { type: 'settings' });
    return updated;
  }

  getSubjectsViewMode() {
    return this.getSettings().subjects_view_mode || 'grid';
  }

  setSubjectsViewMode(mode) {
    this.saveSettings({ subjects_view_mode: mode });
  }

  // --- GRADING SCALE CUSTOMIZATION ---
  getGradingScale() {
    try {
      const raw = localStorage.getItem('aven_grading_scale_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(PHILIPPINE_GRADE_SCALE));
  }

  saveGradingScale(scale) {
    localStorage.setItem('aven_grading_scale_v1', JSON.stringify(scale));
    events.emit('scale:updated', scale);
    events.emit('store:changed', { type: 'scale' });
    return scale;
  }

  resetGradingScale() {
    localStorage.removeItem('aven_grading_scale_v1');
    events.emit('scale:updated', PHILIPPINE_GRADE_SCALE);
    events.emit('store:changed', { type: 'scale' });
    return JSON.parse(JSON.stringify(PHILIPPINE_GRADE_SCALE));
  }

  // --- STORAGE USAGE CALCULATION ---
  getStorageUsage() {
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || '';
        totalBytes += (key.length + val.length) * 2;
      }
    }
    if (totalBytes < 1024) return `${totalBytes} B`;
    const kb = (totalBytes / 1024).toFixed(1);
    if (Number(kb) < 1024) return `${kb} KB`;
    return `${(Number(kb) / 1024).toFixed(2)} MB`;
  }


  // --- DATA BACKUP, EXPORT, IMPORT, CLEAR ---
  exportAllDataJSON() {
    const data = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      subjects: this.getSubjects(true),
      sessions: this.getSessions(),
      grades: this.getGrades(),
      grade_configs: this.getGradeConfigs(),
      plans: this.getStudyPlans(),
      user: this.getUserProfile(),
      settings: this.getSettings()
    };
    return JSON.stringify(data, null, 2);
  }

  importAllDataJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (!Array.isArray(data.subjects)) {
        throw new Error('Invalid backup format: subjects missing');
      }
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(data.subjects || []));
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(data.sessions || []));
      localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(data.grades || []));
      localStorage.setItem(STORAGE_KEYS.GRADE_CONFIGS, JSON.stringify(data.grade_configs || []));
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(data.plans || []));
      if (data.user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
      if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));

      events.emit('store:imported');
      events.emit('store:changed', { type: 'import' });
      return { success: true, count: data.subjects.length };
    } catch (err) {
      console.error('Import failed', err);
      return { success: false, error: err.message };
    }
  }

  clearAllData() {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.GRADE_CONFIGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify([]));
    events.emit('store:cleared');
    events.emit('store:changed', { type: 'clear' });
  }

  // --- SUBJECTS CRUD ---
  getSubjects(includeArchived = true) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
      const list = raw ? JSON.parse(raw) : [];
      if (includeArchived) return list;
      return list.filter(s => !s.archived);
    } catch (e) {
      console.error('Error getting subjects', e);
      return [];
    }
  }

  getSubjectById(id) {
    const subjects = this.getSubjects(true);
    return subjects.find(s => s.id === id) || null;
  }

  saveSubject(subjectData) {
    const subjects = this.getSubjects(true);
    let subject;
    if (subjectData.id) {
      const idx = subjects.findIndex(s => s.id === subjectData.id);
      if (idx !== -1) {
        subjects[idx] = { ...subjects[idx], ...subjectData };
        subject = subjects[idx];
      }
    } else {
      const settings = this.getSettings();
      subject = {
        id: generateId('sub'),
        name: subjectData.name.trim(),
        code: subjectData.code ? subjectData.code.trim() : '',
        year_level: subjectData.year_level || '1st Year',
        semester: subjectData.semester || '1st Semester',
        color: subjectData.color || DEFAULT_COLOR_SWATCHES[0],
        instructor: subjectData.instructor ? subjectData.instructor.trim() : '',
        archived: false,
        created_at: new Date().toISOString()
      };
      subjects.unshift(subject);

      this.saveSubjectGradeConfig(subject.id, settings.default_midterm_weight, settings.default_final_weight);
    }
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    events.emit('subject:saved', subject);
    events.emit('store:changed', { type: 'subject' });
    return subject;
  }

  archiveSubject(id, reason = 'Semester ended', note = '') {
    const subjects = this.getSubjects(true);
    const item = subjects.find(s => s.id === id);
    if (item) {
      item.archived = true;
      item.archive_reason = (reason === 'Other' && note.trim()) ? `Other: ${note.trim()}` : (reason || 'Semester ended');
      item.archived_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
      events.emit('subject:archived', item);
      events.emit('store:changed', { type: 'subject' });
    }
    return item;
  }

  unarchiveSubject(id) {
    const subjects = this.getSubjects(true);
    const item = subjects.find(s => s.id === id);
    if (item) {
      item.archived = false;
      item.archive_reason = null;
      item.archived_at = null;
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
      events.emit('subject:archived', item);
      events.emit('store:changed', { type: 'subject' });
    }
    return item;
  }

  bulkArchiveSubjects(subjectIds, reason = 'Semester ended') {
    const subjects = this.getSubjects(true);
    let count = 0;
    const now = new Date().toISOString();

    subjectIds.forEach(id => {
      const item = subjects.find(s => s.id === id);
      if (item && !item.archived) {
        item.archived = true;
        item.archive_reason = reason;
        item.archived_at = now;
        count++;
      }
    });

    if (count > 0) {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
      events.emit('subjects:bulk_archived', { count, subjectIds });
      events.emit('store:changed', { type: 'subject' });
    }
    return count;
  }

  toggleArchiveSubject(id, reason = 'Semester ended') {
    const subjects = this.getSubjects(true);
    const item = subjects.find(s => s.id === id);
    if (item) {
      if (item.archived) {
        return this.unarchiveSubject(id);
      } else {
        return this.archiveSubject(id, reason);
      }
    }
    return item;
  }


  deleteSubject(subjectId) {
    let subjects = this.getSubjects(true).filter(s => s.id !== subjectId);
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));

    let sessions = this.getSessions().filter(s => s.subject_id !== subjectId);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));

    let grades = this.getGrades().filter(g => g.subject_id !== subjectId);
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));

    let gradeConfigs = this.getGradeConfigs().filter(c => c.subject_id !== subjectId);
    localStorage.setItem(STORAGE_KEYS.GRADE_CONFIGS, JSON.stringify(gradeConfigs));

    let plans = this.getStudyPlans().filter(p => p.subject_id !== subjectId);
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));

    events.emit('subject:deleted', subjectId);
    events.emit('store:changed', { type: 'cascade_delete', subjectId });
  }

  getCascadeStats(subjectId) {
    const sessions = this.getSessions().filter(s => s.subject_id === subjectId);
    const grades = this.getGrades().filter(g => g.subject_id === subjectId);
    let totalGradeEntries = 0;
    grades.forEach(g => {
      totalGradeEntries += (g.entries || []).length;
    });
    const plan = this.getStudyPlanBySubject(subjectId);
    return {
      sessionCount: sessions.length,
      gradeCategoriesCount: grades.length,
      gradeEntriesCount: totalGradeEntries,
      hasPlan: !!plan
    };
  }

  // --- STUDY SESSIONS ---
  getSessions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error getting sessions', e);
      return [];
    }
  }

  saveSession(sessionData) {
    const sessions = this.getSessions();
    const session = {
      id: sessionData.id || generateId('ses'),
      subject_id: sessionData.subject_id,
      duration: Math.max(1, parseInt(sessionData.duration, 10) || 0),
      date: sessionData.date || new Date().toISOString().split('T')[0],
      notes: sessionData.notes ? sessionData.notes.trim() : '',
      created_at: sessionData.created_at || new Date().toISOString()
    };

    if (sessionData.id) {
      const idx = sessions.findIndex(s => s.id === sessionData.id);
      if (idx !== -1) sessions[idx] = session;
    } else {
      sessions.unshift(session);
    }

    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    events.emit('session:saved', session);
    events.emit('store:changed', { type: 'session' });
    return session;
  }

  deleteSession(sessionId) {
    let sessions = this.getSessions().filter(s => s.id !== sessionId);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    events.emit('session:deleted', sessionId);
    events.emit('store:changed', { type: 'session' });
  }

  getSubjectTotalStudyMinutes(subjectId) {
    const sessions = this.getSessions().filter(s => s.subject_id === subjectId);
    return sessions.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  }

  getWeeklyStudyHours() {
    const sessions = this.getSessions();
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    const minutes = sessions.reduce((acc, s) => {
      const sDate = new Date(s.date + 'T00:00:00');
      if (sDate >= startOfWeek) {
        return acc + (s.duration || 0);
      }
      return acc;
    }, 0);

    return (minutes / 60).toFixed(1);
  }

  getStreakStats() {
    const sessions = this.getSessions();
    if (sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalHours: 0, totalSessions: 0 };
    }

    const dateMap = {};
    sessions.forEach(s => {
      dateMap[s.date] = (dateMap[s.date] || 0) + (s.duration || 0);
    });

    const uniqueDates = Object.keys(dateMap).sort().reverse();
    if (uniqueDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalHours: 0, totalSessions: 0 };
    }

    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date(Date.now() - 86400000);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    let currentStreak = 0;
    let checkDate = new Date();
    if (!dateMap[today]) {
      if (dateMap[yesterday]) {
        checkDate = yesterdayDate;
      } else {
        checkDate = null;
      }
    }

    if (checkDate) {
      let iter = new Date(checkDate);
      while (true) {
        const dStr = iter.toISOString().split('T')[0];
        if (dateMap[dStr] && dateMap[dStr] > 0) {
          currentStreak++;
          iter.setDate(iter.getDate() - 1);
        } else {
          break;
        }
      }
    }

    const sortedDatesAsc = Object.keys(dateMap).sort();
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    sortedDatesAsc.forEach(dStr => {
      const curr = new Date(dStr + 'T00:00:00');
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((curr - prevDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays === 0) {
        } else {
          tempStreak = 1;
        }
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      prevDate = curr;
    });

    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalHours,
      totalSessions: sessions.length
    };
  }

  getLeetCodeCalendarMatrix(weeksCount = 52) {
    // Legacy shim — delegates to current year view
    return this.getYearCalendarMatrix(new Date().getFullYear());
  }

  getYearCalendarMatrix(year) {
    const sessions = this.getSessions();
    const dateMap = {};
    const subjectsMap = {};

    sessions.forEach(s => {
      dateMap[s.date] = (dateMap[s.date] || 0) + (s.duration || 0);
      if (!subjectsMap[s.date]) subjectsMap[s.date] = [];
      const sub = this.getSubjectById(s.subject_id);
      subjectsMap[s.date].push({
        subjectName: sub ? sub.name : 'Unknown Subject',
        subjectCode: sub ? sub.code : '',
        color: sub ? sub.color : '#6366f1',
        duration: s.duration
      });
    });

    const today = new Date();
    const MONTH_NAMES = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const months = [];

    for (let m = 0; m < 12; m++) {
      const firstDay = new Date(year, m, 1);
      const lastDayNum = new Date(year, m + 1, 0).getDate();
      // Sunday=0 offset so week columns start on Sunday
      const startOffset = firstDay.getDay();

      const weeks = [];
      let currentWeek = new Array(startOffset).fill(null);

      for (let day = 1; day <= lastDayNum; day++) {
        const d = new Date(year, m, day);
        const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const minutes = dateMap[dateStr] || 0;
        const isFuture = d > today;

        let level = 0;
        if (!isFuture && minutes > 0) {
          if (minutes <= 30) level = 1;
          else if (minutes <= 60) level = 2;
          else if (minutes <= 120) level = 3;
          else level = 4;
        }

        currentWeek.push({ date: dateStr, dayOfWeek: d.getDay(), minutes, level, isFuture, subjects: subjectsMap[dateStr] || [] });

        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      }

      // Pad last partial week
      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) currentWeek.push(null);
        weeks.push(currentWeek);
      }

      // Count total sessions for this year (for the stats line)
      months.push({ name: MONTH_NAMES[m], monthIndex: m, weeks });
    }

    // Total sessions / hours for display
    const yearSessions = sessions.filter(s => s.date && s.date.startsWith(String(year)));
    const totalMins = yearSessions.reduce((a, s) => a + (s.duration || 0), 0);

    return {
      months,
      year,
      totalSessions: yearSessions.length,
      totalHours: (totalMins / 60).toFixed(1)
    };
  }


  // --- GRADES ---
  getGrades() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GRADES);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error getting grades', e);
      return [];
    }
  }

  getGradeConfigs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GRADE_CONFIGS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error getting grade configs', e);
      return [];
    }
  }

  getSubjectGradeConfig(subjectId) {
    const configs = this.getGradeConfigs();
    const config = configs.find(c => c.subject_id === subjectId);
    const settings = this.getSettings();
    return config || {
      subject_id: subjectId,
      midterm_weight: settings.default_midterm_weight,
      final_weight: settings.default_final_weight
    };
  }

  saveSubjectGradeConfig(subjectId, midtermWeight, finalWeight) {
    let configs = this.getGradeConfigs();
    const idx = configs.findIndex(c => c.subject_id === subjectId);
    const newConfig = {
      subject_id: subjectId,
      midterm_weight: Number(midtermWeight) || 50,
      final_weight: Number(finalWeight) || 50
    };
    if (idx !== -1) {
      configs[idx] = newConfig;
    } else {
      configs.push(newConfig);
    }
    localStorage.setItem(STORAGE_KEYS.GRADE_CONFIGS, JSON.stringify(configs));
    events.emit('grade_config:saved', newConfig);
    events.emit('store:changed', { type: 'grade' });
  }

  getSubjectGradeCategories(subjectId, term = null) {
    const grades = this.getGrades();
    return grades.filter(g => {
      if (g.subject_id !== subjectId) return false;
      if (term && g.term !== term) return false;
      return true;
    });
  }

  saveGradeCategory(categoryData) {
    const grades = this.getGrades();
    const category = {
      id: categoryData.id || generateId('cat'),
      subject_id: categoryData.subject_id,
      term: categoryData.term || 'Midterm',
      category: categoryData.category || 'Quizzes',
      weight: Math.max(0, Number(categoryData.weight) || 0),
      entries: categoryData.entries || []
    };

    if (categoryData.id) {
      const idx = grades.findIndex(g => g.id === categoryData.id);
      if (idx !== -1) grades[idx] = category;
    } else {
      grades.push(category);
    }

    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
    events.emit('grade_category:saved', category);
    events.emit('store:changed', { type: 'grade' });
    return category;
  }

  deleteGradeCategory(categoryId) {
    let grades = this.getGrades().filter(g => g.id !== categoryId);
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
    events.emit('grade_category:deleted', categoryId);
    events.emit('store:changed', { type: 'grade' });
  }

  saveGradeEntry(categoryId, entryData) {
    const grades = this.getGrades();
    const cat = grades.find(g => g.id === categoryId);
    if (!cat) return null;

    if (!cat.entries) cat.entries = [];

    const entry = {
      id: entryData.id || generateId('ent'),
      name: entryData.name ? entryData.name.trim() : 'Assessment',
      score: Math.max(0, Number(entryData.score) || 0),
      out_of: Math.max(1, Number(entryData.out_of) || 100)
    };

    if (entryData.id) {
      const idx = cat.entries.findIndex(e => e.id === entryData.id);
      if (idx !== -1) cat.entries[idx] = entry;
      else cat.entries.push(entry);
    } else {
      cat.entries.push(entry);
    }

    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
    events.emit('grade_entry:saved', { categoryId, entry });
    events.emit('store:changed', { type: 'grade' });
    return entry;
  }

  updateGradeEntry(categoryId, entryId, updates) {
    const grades = this.getGrades();
    const cat = grades.find(g => g.id === categoryId);
    if (!cat || !cat.entries) return null;
    const entry = cat.entries.find(e => e.id === entryId);
    if (!entry) return null;

    if (updates.name !== undefined) {
      const trimmed = String(updates.name).trim();
      if (trimmed) entry.name = trimmed;
    }
    if (updates.score !== undefined) {
      const num = Number(updates.score);
      if (!isNaN(num) && num >= 0) entry.score = num;
    }
    if (updates.out_of !== undefined) {
      const num = Number(updates.out_of);
      if (!isNaN(num) && num > 0) entry.out_of = num;
    }

    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
    events.emit('grade_entry:saved', { categoryId, entry });
    events.emit('store:changed', { type: 'grade' });
    return entry;
  }

  deleteGradeEntry(categoryId, entryId) {
    const grades = this.getGrades();
    const cat = grades.find(g => g.id === categoryId);
    if (cat && cat.entries) {
      cat.entries = cat.entries.filter(e => e.id !== entryId);
      localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
      events.emit('grade_entry:deleted', { categoryId, entryId });
      events.emit('store:changed', { type: 'grade' });
    }
  }


  calculateTermGrade(subjectId, term) {
    const categories = this.getSubjectGradeCategories(subjectId, term);
    if (categories.length === 0) {
      return { percentage: null, totalWeight: 0, weightedEarned: 0, categorySummaries: [] };
    }

    let totalWeight = 0;
    let weightedEarned = 0;
    const categorySummaries = [];

    categories.forEach(cat => {
      totalWeight += (cat.weight || 0);
      const entries = cat.entries || [];
      const totalScore = entries.reduce((acc, e) => acc + Number(e.score || 0), 0);
      const totalOutOf = entries.reduce((acc, e) => acc + Number(e.out_of || 0), 0);
      
      const rawPct = totalOutOf > 0 ? (totalScore / totalOutOf) * 100 : null;
      const catWeightedPts = rawPct !== null ? (rawPct * (cat.weight / 100)) : null;

      if (catWeightedPts !== null) {
        weightedEarned += catWeightedPts;
      }

      categorySummaries.push({
        id: cat.id,
        category: cat.category,
        weight: cat.weight,
        totalScore,
        totalOutOf,
        percentage: rawPct,
        weightedPoints: catWeightedPts,
        entriesCount: entries.length
      });
    });

    let termPercentage = null;
    if (totalWeight > 0) {
      termPercentage = Math.round(weightedEarned * 100) / 100;
    }

    return {
      percentage: termPercentage,
      totalWeight,
      weightedEarned,
      categorySummaries,
      philGrade: getPhilippineGrade(termPercentage)
    };
  }

  calculateSubjectGrade(subjectId) {
    const config = this.getSubjectGradeConfig(subjectId);
    const midterm = this.calculateTermGrade(subjectId, 'Midterm');
    const final = this.calculateTermGrade(subjectId, 'Final');

    const mWeight = config.midterm_weight / 100;
    const fWeight = config.final_weight / 100;

    let overallPct = null;

    if (midterm.percentage !== null && final.percentage !== null) {
      overallPct = (midterm.percentage * mWeight) + (final.percentage * fWeight);
    } else if (midterm.percentage !== null) {
      overallPct = midterm.percentage;
    } else if (final.percentage !== null) {
      overallPct = final.percentage;
    }

    if (overallPct !== null) {
      overallPct = Math.round(overallPct * 100) / 100;
    }

    const philGrade = getPhilippineGrade(overallPct);

    return {
      subjectId,
      midterm,
      final,
      config,
      overallPercentage: overallPct,
      philGrade,
      summaryLine: overallPct !== null ? `${overallPct.toFixed(1)}% · ${philGrade.grade}` : 'No Grades'
    };
  }

  calculateOverallAcademicStanding() {
    const activeSubjects = this.getSubjects(false);
    if (activeSubjects.length === 0) {
      return { gpa: '—', avgPct: '—', totalSubjects: 0, gradedSubjects: 0 };
    }

    let sumGradePoints = 0;
    let sumPct = 0;
    let gradedCount = 0;

    activeSubjects.forEach(s => {
      const stats = this.calculateSubjectGrade(s.id);
      if (stats.overallPercentage !== null && stats.philGrade.grade !== '—') {
        sumGradePoints += Number(stats.philGrade.grade);
        sumPct += stats.overallPercentage;
        gradedCount++;
      }
    });

    const gpa = gradedCount > 0 ? (sumGradePoints / gradedCount).toFixed(2) : '—';
    const rawAvgPct = gradedCount > 0 ? (sumPct / gradedCount) : null;
    const avgPct = gradedCount > 0 ? (sumPct / gradedCount).toFixed(1) + '%' : '—';

    return {
      gpa,
      avgPct,
      rawAvgPct,
      totalSubjects: activeSubjects.length,
      gradedSubjects: gradedCount
    };

  }

  // --- STUDY PLANS ---
  getStudyPlans() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PLANS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error getting study plans', e);
      return [];
    }
  }

  getStudyPlanBySubject(subjectId) {
    const plans = this.getStudyPlans();
    return plans.find(p => p.subject_id === subjectId) || null;
  }

  saveStudyPlan(subjectId, title, htmlContent) {
    let plans = this.getStudyPlans();
    const existingIdx = plans.findIndex(p => p.subject_id === subjectId);

    const plan = {
      id: existingIdx !== -1 ? plans[existingIdx].id : generateId('plan'),
      subject_id: subjectId,
      title: title ? title.trim() : 'Study Plan',
      html_content: htmlContent || '',
      updated_at: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      plans[existingIdx] = plan;
    } else {
      plans.unshift(plan);
    }

    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
    events.emit('plan:saved', plan);
    events.emit('store:changed', { type: 'plan' });
    return plan;
  }

  deleteStudyPlan(subjectId) {
    let plans = this.getStudyPlans().filter(p => p.subject_id !== subjectId);
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
    events.emit('plan:deleted', subjectId);
    events.emit('store:changed', { type: 'plan' });
  }

  // --- USER PROFILE (Single Object Architecture) ---
  getUserProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      const defaults = {
        name: 'Alex Rivera',
        email: 'alex.rivera@university.edu',
        year_level: '2nd Year',
        institution: 'State University',
        program: 'BS Computer Science',
        avatar: 'AR',
        avatar_color: '#6366f1'
      };
      return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
    } catch (e) {
      return {
        name: 'Alex Rivera',
        email: 'alex.rivera@university.edu',
        year_level: '2nd Year',
        institution: 'State University',
        program: 'BS Computer Science',
        avatar: 'AR',
        avatar_color: '#6366f1'
      };
    }
  }

  saveUserProfile(profileData) {
    const current = this.getUserProfile();
    const name = profileData.name !== undefined ? profileData.name.trim() : current.name;
    const email = profileData.email !== undefined ? profileData.email.trim() : current.email;
    const year_level = profileData.year_level !== undefined ? profileData.year_level : current.year_level;
    const institution = profileData.institution !== undefined ? profileData.institution.trim() : current.institution;
    const program = profileData.program !== undefined ? profileData.program.trim() : current.program;
    const avatar_color = profileData.avatar_color !== undefined ? profileData.avatar_color : current.avatar_color;
    
    // Compute initials from name
    const initials = name.split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AR';

    const updatedProfile = {
      ...current,
      ...profileData,
      name,
      email,
      year_level,
      institution,
      program,
      avatar_color,
      avatar: initials
    };

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedProfile));
    events.emit('user:updated', updatedProfile);
    events.emit('store:changed', { type: 'user' });
    return updatedProfile;
  }


  // --- THEME ---
  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  }

  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
    events.emit('theme:changed', theme);
  }
}

export const store = new Store();
