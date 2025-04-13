const apiBase = 'https://harm-status-api.onrender.com';
let dataTable;
let defaultVisibleColumns = [
  'Study', 'PMID', 'Genotyping_type', 'Effect_size_type',
  'Raw_N_variants', 'Harm_status', 'Harm_drop_rate', 'Liftover_drop_rate'
];
let filterColumns = [];

window.onload = () => initApp();

async function initApp() {
  try {
    const metadata = await fetchMetadataAndInitialData(1);  // just one row
    document.getElementById('total-count').innerText = `Currently, the GWAS Catalog contains ${metadata.total.toLocaleString()} summary statistics datasets`;

    filterColumns = Object.keys(metadata.items[0]);
    populateColumnOptions();
    initializeTable(filterColumns);
  } catch (e) {
    console.error("Initialisation failed", e);
    document.getElementById('total-count').innerText = `Error loading data`;
  }
}

async function fetchMetadataAndInitialData(size = 1) {
  const res = await fetch(`${apiBase}/all_studies?page=1&size=${size}`);
  return await res.json();
}

function populateColumnOptions() {
  document.querySelectorAll('.column-select').forEach(select => {
    const prevValue = select.value;
    select.innerHTML = '<option selected disabled>- Column -</option>' +
      filterColumns.map(col =>
        `<option value="${col}" ${col === prevValue ? 'selected' : ''}>${col}</option>`
      ).join('');
  });
}

function getFilterQueryParams() {
  return Array.from(document.querySelectorAll('.filter-group')).map(group => {
    const col = group.querySelector('.column-select')?.value;
    const op = group.querySelector('.operator-select')?.value;
    const val = group.querySelector('.value-input')?.value.trim();
    if (!col || !val || col === '- Column -') return null;
    return op === 'contains' ? `${col}~${val}` : `${col}${op}${val}`;
  }).filter(Boolean);
}

function addFilter() {
  if (filterColumns.length === 0) {
    alert("Filter columns not yet loaded. Please wait.");
    return;
  }

  const group = document.createElement('div');
  group.className = 'filter-group mb-2 d-flex gap-2 align-items-center';
  group.innerHTML = `
    <select class="form-select column-select" style="min-width: 150px">
      <option selected disabled>- Column -</option>
      ${filterColumns.map(col => `<option value="${col}">${col}</option>`).join('')}
    </select>
    <select class="form-select operator-select" style="width: 90px">
      <option>=</option><option>!=</option><option>></option><option><</option>
      <option>>=</option><option><=</option><option>contains</option>
    </select>
    <input type="text" class="form-control value-input" placeholder="Value" style="min-width: 120px">
    <button class="btn btn-danger" onclick="removeFilter(this)">−</button>
  `;
  document.getElementById('filter-container').appendChild(group);
  populateColumnOptions();
}

function removeFilter(btn) {
  btn.closest('.filter-group').remove();
}

function clearFilters() {
  const container = document.getElementById('filter-container');
  container.innerHTML = '';
  addFilter();
  dataTable?.ajax.reload();
}

function applyFilter() {
  dataTable?.ajax.reload();
}

function initializeTable(columnNames) {
  const columnDefs = columnNames.map(col => ({
    title: col,
    data: col,
    visible: defaultVisibleColumns.includes(col)
  }));

  dataTable = $('#results-table').DataTable({
    serverSide: true,
    processing: true,
    stateSave: true,
    scrollX: true,
    pageLength: 10,
    lengthMenu: [[10, 50, 100], [10, 50, 100]],
    dom: "<'custom-toolbar d-flex justify-content-between align-items-center'B<'toolbar-right d-flex align-items-center'lf>>rt<'bottom-controls d-flex justify-content-between'i p>",
    language: {
      lengthMenu: 'Rows per page: _MENU_'
    },
    buttons: ['colvis'],
    columns: columnDefs,
    ajax: async (data, callback) => {
      const page = Math.floor(data.start / data.length) + 1;
      const size = data.length;
      const filters = getFilterQueryParams();
      const url = filters.length > 0
        ? `${apiBase}/query?page=${page}&size=${size}&filter=${filters.join(';')}`: `${apiBase}/all_studies?page=${page}&size=${size}`;

      try {
        const res = await axios.get(url);
        const result = res.data;

        callback({
          data: result.items || [],
          recordsTotal: result.total || 0,
          recordsFiltered: result.total || 0
        });
      } catch (e) {
        console.error("AJAX fetch failed", e);
        $('#error-message').text("Failed to load data: " + e.message);
        callback({ data: [], recordsTotal: 0, recordsFiltered: 0 });
      }
    }
  });
}
