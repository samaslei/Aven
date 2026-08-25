import fs from 'fs';

let subjectsJs = fs.readFileSync('js/subjects.js', 'utf-8');

// 1. Remove the entire Subject Color Accent form-group in modal markup
const oldColorGroup = `            <!-- Row 4: Color Swatches -->
            <div class="form-group">
              <label class="form-label">Subject Color Accent</label>
              <div class="color-swatches" id="color-swatches-container">
                \${DEFAULT_COLOR_SWATCHES.map((hex, i) => \`
                  <div class="color-swatch-opt \${i === 0 ? 'active' : ''}" data-color="\${hex}" style="background-color: \${hex};"></div>
                \`).join('')}
              </div>
              <input type="hidden" id="sub-form-color" value="\${DEFAULT_COLOR_SWATCHES[0]}">
            </div>`;

const newColorGroup = `            <input type="hidden" id="sub-form-color" value="\${DEFAULT_COLOR_SWATCHES[0]}">`;

subjectsJs = subjectsJs.replace(oldColorGroup, newColorGroup);

// 2. Remove swatch class toggles in openCreateModal and openEditModal
const oldOpenCreate = `  const openCreateModal = () => {
    form.reset();
    container.querySelector('#sub-form-id').value = '';
    container.querySelector('#subject-modal-title').textContent = 'New Subject';
    container.querySelector('#sub-form-color').value = DEFAULT_COLOR_SWATCHES[0];
    
    container.querySelectorAll('.color-swatch-opt').forEach((sw, i) => {
      sw.classList.toggle('active', i === 0);
    });

    createModal.classList.add('open');
  };`;

const newOpenCreate = `  const openCreateModal = () => {
    form.reset();
    container.querySelector('#sub-form-id').value = '';
    container.querySelector('#subject-modal-title').textContent = 'New Subject';
    container.querySelector('#sub-form-color').value = DEFAULT_COLOR_SWATCHES[0];
    createModal.classList.add('open');
  };`;

subjectsJs = subjectsJs.replace(oldOpenCreate, newOpenCreate);

const oldOpenEdit = `    container.querySelector('#sub-form-color').value = sub.color || DEFAULT_COLOR_SWATCHES[0];

    container.querySelectorAll('.color-swatch-opt').forEach(sw => {
      sw.classList.toggle('active', sw.dataset.color === sub.color);
    });

    createModal.classList.add('open');`;

const newOpenEdit = `    container.querySelector('#sub-form-color').value = sub.color || DEFAULT_COLOR_SWATCHES[0];
    createModal.classList.add('open');`;

subjectsJs = subjectsJs.replace(oldOpenEdit, newOpenEdit);

// 3. Remove swatch click listeners in attachSubjectsEvents
const oldSwatchListeners = `  // Color Swatches Selection
  container.querySelectorAll('.color-swatch-opt').forEach(swatch => {
    swatch.addEventListener('click', () => {
      container.querySelectorAll('.color-swatch-opt').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      container.querySelector('#sub-form-color').value = swatch.dataset.color;
    });
  });`;

subjectsJs = subjectsJs.replace(oldSwatchListeners, '');

fs.writeFileSync('js/subjects.js', subjectsJs, 'utf-8');
console.log('Successfully removed Subject Color Accent picker from New/Edit Subject modal!');
