const apiUrl = 'http://127.0.0.1:8000/all_studies';
let totalItems = 0;
let currentPage = 1;
let pageSize = 10;
const columns = ["Study","PMID","First_author","Publication_date","Genotyping_type","Raw_file_type",
"Effect_size_type","Raw_N_variants","Raw_genome_build","Raw_coordinate_system","Harm_status",
"Latest_harm_start_date","Harm_account","Harm_runninglog","Harm_exitcode","Harm_failstep",
"Harm_failed_reason","Harm_drop_rate","Liftover_drop_rate"];

const operatorOptions = ['=', '!=', '>', '<', '>=', '<=', 'contains'];

async function fetchStats() {
  try {
    // Replace with your actual endpoint
    const response = await fetch('http://127.0.0.1:8000/all_studies');
    const data = await response.json();
    document.getElementById('total-count').innerText = `${data.total.toLocaleString()} summary statistic data`;
  } catch (e) {
    document.getElementById('total-count').innerText = `Error loading total`;
  }
}

function createFilterRow() {
  const row = document.createElement('div');
  row.className = 'filter-row';

  const colSelect = document.createElement('select');
  columnOptions.forEach(opt => {
    const o = document.createElement('option');
    o.value = o.text = opt;
    colSelect.appendChild(o);
  });

  const opSelect = document.createElement('select');
  operatorOptions.forEach(opt => {
    const o = document.createElement('option');
    o.value = o.text = opt;
    opSelect.appendChild(o);
  });

  const valInput = document.createElement('input');
  valInput.type = 'text';

  row.appendChild(colSelect);
  row.appendChild(opSelect);
  row.appendChild(valInput);

  return row;
}

function addFilterRow() {
  const filtersDiv = document.getElementById('filters');
  filtersDiv.appendChild(createFilterRow());
}

function applyFilters() {
  const rows = document.querySelectorAll('.filter-row');
  const filters = Array.from(rows).map(row => {
    const [col, op, val] = row.querySelectorAll('select, input');
    return {
      column: col.value,
      operator: op.value,
      value: val.value
    };
  });
  console.log('Filters to apply:', filters);
  // Send `filters` to API if needed
}

// Init
fetchStats();
addFilterRow();