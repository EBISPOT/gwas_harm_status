const apiUrl = 'http://127.0.0.1:8000/all_studies';
let totalItems = 0;
let currentPage = 1;
let pageSize = 10;
let dataTable;
let columns = [];
let filter_columns = [];
let activeFilters = [];
const defaultVisibleColumns = [
  'Study',
  'PMID',
  'Genotyping_type',
  'Effect_size_type',
  'Raw_N_variants',
  'Harm_status',
  'Harm_drop_rate',
  'Liftover_drop_rate'
];

window.onload = async function() {
  await fetchStatsAndColumns();
};

async function fetchStatsAndColumns() {
  try {
    const response = await fetch('http://127.0.0.1:8000/all_studies?page=1&size=1');
    const data = await response.json();

    // Display total
    document.getElementById('total-count').innerText = `${data.total.toLocaleString()} summary statistic data`;

    // Extract columns from the first item
    if (data.items && data.items.length > 0) {
      filter_columns = Object.keys(data.items[0]);
      populateColumnOptions();
    }
  } catch (e) {
    console.error("Error fetching stats or columns", e);
    document.getElementById('total-count').innerText = `Error loading total`;
  }
}

function populateColumnOptions() {
  document.querySelectorAll('.column-select').forEach(select => {
    const currentValue = select.value;
    select.innerHTML = '<option selected disabled>- Column -</option>' +
      filter_columns.map(col =>
        `<option value="${col}" ${col === currentValue ? 'selected' : ''}>${col}</option>`
      ).join('');
  });
}

function addFilter() {
  if (filter_columns.length === 0) {
    alert("Filter columns not yet loaded. Please wait.");
    return;
  }

  const container = document.getElementById('filter-container');
  const group = document.createElement('div');
  group.className = 'filter-group';
  group.innerHTML = `
    <select class="form-select column-select">
        <option selected disabled>- Column -</option>
        ${filter_columns.map(col => `<option value="${col}">${col}</option>`).join('')}
    </select>
    <select class="form-select operator-select">
        <option>=</option>
        <option>></option>
        <option><</option>
        <option>!=</option>
        <option>>=</option>
        <option><=</option>
        <option>contains</option>
    </select>
    <input type="text" class="form-control value-input" placeholder="Value">
    <button class="btn btn-danger" onclick="removeFilter(this)">−</button>
  `;
  container.appendChild(group);
  populateColumnOptions();
}

function removeFilter(button) {
  button.parentElement.remove();
}

$(document).ready(function () {
  fetchDataAndInit();
});

async function fetchDataAndInit() {
  try {
    const response = await axios.get(`${apiUrl}?page=1&size=${pageSize}`);
    const result = response.data;

    if (!result || !Array.isArray(result.items) || result.items.length === 0) {
      throw new Error("Invalid response or empty data");
    }

    columns = Object.keys(result.items[0]).map(col => ({
      title: col,
      data: col,
      visible: defaultVisibleColumns.includes(col) // ✅ only show if in your list
    }));

    if ($.fn.DataTable.isDataTable('#results-table')) {
      dataTable.destroy();
      $('#results-table').empty(); // optional: clear any leftover table DOM
    }

    initializeTable(columns);
  } catch (err) {
    console.error("Error during initial fetch", err);
    $('#error-message').text("Failed to load initial data: " + err.message);
  }
}

function initializeTable(columnDefs) {
  dataTable = $('#results-table').DataTable({
  serverSide: true,
  processing: true,
  stateSave: true,
  ajax: async function (data, callback) {
    const page = Math.floor(data.start / data.length) + 1;
    const size = data.length;

    try {
      const response = await axios.get(`${apiUrl}?page=${page}&size=${size}`);
      const result = response.data;

      callback({
        data: result.items || [],
        recordsTotal: result.total || 0,
        recordsFiltered: result.total || 0
      });
    } catch (err) {
      console.error("Error loading page", err);
      callback({
        data: [],
        recordsTotal: 0,
        recordsFiltered: 0
      });
    }
  },
  columns: columnDefs,
  scrollX: true,
  pageLength: pageSize,
  lengthMenu: [[10, 50, 100], [10, 50, 100]],
  lengthChange: true,
  dom: "<'custom-toolbar d-flex justify-content-between align-items-center'" +
       "B" +                              // Buttons on the left
       "<'toolbar-right d-flex align-items-center'lf>" + // Length menu + Search on the right
     ">" +
     "rt" +
     "<'bottom-controls d-flex justify-content-between'i p>",
  language: {
    lengthMenu: 'Rows per page: _MENU_'
  },
  buttons: [
    'colvis' // column visibility toggle
  ]
});
}

// Collect all filters
function applyFilter(page = 1) {
  // Get all filter groups
  const filterGroups = document.querySelectorAll('.filter-group');
  const queryParams = [];
  
  // Process each filter group
  filterGroups.forEach(group => {
    const column = group.querySelector('.column-select').value;
    const operator = group.querySelector('.operator-select').value;
    const value = group.querySelector('.value-input').value.trim();
    
    // Skip if any field is empty or not selected
    if (!column || column === '- Column -' || !value) {
      return;
    }
    
    // Build query parameter based on operator
    let queryParam;
    if (operator === 'contains') {
      queryParam = `${column}~${value}`; // Using ~ for contains operation
    } else {
      queryParam = `${column}${operator}${value}`;
    }
    
    queryParams.push(queryParam);
  });
  
  // Store active filters globally
  activeFilters = queryParams;
  
  // Reset to page 1 when applying new filters
  currentPage = 1;
  
  // Reload the table with new filters
  if (dataTable) {
    dataTable.ajax.reload();
  } else {
    // If table doesn't exist yet, initialize it
    fetchDataAndInit();
  }
}