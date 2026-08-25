/**
 * Aven - Reusable Dropdown & Select Builders
 */

/**
 * Builds HTML <option> elements for a list of subjects.
 * @param {Array<{ id: string, name: string, code?: string }>} subjects 
 * @param {string} selectedId 
 * @param {boolean} includeGeneralOption 
 * @returns {string}
 */
export function renderSubjectSelectOptions(subjects = [], selectedId = '', includeGeneralOption = true) {
  let html = '';
  if (includeGeneralOption) {
    html += '<option value="">🌐 General Study</option>';
  }
  subjects.forEach(s => {
    const codePrefix = s.code ? `[${s.code}] ` : '';
    const isSelected = s.id === selectedId ? 'selected' : '';
    html += `<option value="${s.id}" ${isSelected}>${codePrefix}${s.name}</option>`;
  });
  return html;
}
