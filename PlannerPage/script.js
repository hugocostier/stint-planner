const SHEET_ID = '1vOylK67Ux0BtKpeuC61hAYKkIFZYnvB6m8idcDS4c4Y'
const API_KEY = 'AIzaSyC3REgIGz8Uep0TOwNYR9a0IDpllKig-F4'

function getCrewFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('crew') || 'Équipage inconnu';
}

function updatePageTitle() {
  const crew = getCrewFromURL();
  const title = document.getElementById('crewTitle');
  if (title) {
    title.textContent = `Planning 24H de Spa LSX - ${crew}`;
  }
}

function initPage() {
  updatePageTitle();
  const crew = getCrewFromURL();
  fetchCrewData(crew);
  setupEventListeners();
}

function fetchCrewData(crew) {
  showLoading(true);
  
  // Build the API URL for the Google Sheets API
  const range = encodeURIComponent(`${crew}!A:E`); // Assuming each crew has its own sheet
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`;
  
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data.values && data.values.length > 0) {
        populateTable(data.values);
        calculateTotals();
      } else {
        displayError("Aucune donnée trouvé pour cet équipage.");
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      displayError("Erreur lors du chargements des données. Veuillez réessayer plus tard.");
    })
    .finally(() => {
      showLoading(false);
    });
}

function showLoading(isLoading) {
  let loadingElement = document.getElementById('loadingIndicator');
  
  if (!loadingElement && isLoading) {
    loadingElement = document.createElement('div');
    loadingElement.id = 'loadingIndicator';
    loadingElement.className = 'loading';
    loadingElement.textContent = 'Chargement...';
    document.body.appendChild(loadingElement);
  } else if (loadingElement && !isLoading) {
    loadingElement.remove();
  }
}

function displayError(message) {
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  
  const existingError = document.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
  
  const header = document.querySelector('h1');
  header.insertAdjacentElement('afterend', errorElement);
  
  setTimeout(() => {
    errorElement.remove();
  }, 5000);
}

function populateTable(data) {
  const tableBody = document.querySelector('table tbody');
  tableBody.innerHTML = ''; 
  
  for (let i = 1; i < data.length; i++) {
    const rowData = data[i];
    const row = document.createElement('tr');
    
    if (rowData[2]) {
      const pilotClass = rowData[2].toLowerCase().replace(/\s+/g, '');
      row.classList.add(pilotClass);
    }
    
    for (let j = 0; j < 5; j++) {
      const cell = document.createElement('td');
      
      const input = document.createElement('input');
      input.type = 'text';
      input.value = rowData[j] || '';
      input.dataset.originalValue = rowData[j] || '';
      input.addEventListener('blur', () => handleCellEdit(row, j, input.value));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          input.blur();
        } else if (e.key === 'Escape') {
          input.value = input.dataset.originalValue;
          input.blur();
        }
      });
      
      cell.appendChild(input);
      row.appendChild(cell);
    }
    
    const actionsCell = document.createElement('td');
    actionsCell.className = 'actions';
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '🗑️';
    deleteButton.className = 'delete-row';
    deleteButton.addEventListener('click', () => deleteRow(row));
    
    actionsCell.appendChild(deleteButton);
    row.appendChild(actionsCell);
    
    tableBody.appendChild(row);
  }
}

function calculateTotals() {
  const mainTable = document.querySelector('table:first-of-type');
  const totalsTable = document.querySelector('table:nth-of-type(2) tbody');
  
  if (!mainTable || !totalsTable) return;
  
  while (totalsTable.children.length > 1) {
    totalsTable.removeChild(totalsTable.firstChild);
  }
  
  const rows = mainTable.querySelectorAll('tbody tr');
  const pilots = {};
  
  rows.forEach(row => {
    const pilotName = row.querySelector('td:nth-child(3) input').value.trim();
    if (pilotName) {
      const durationText = row.querySelector('td:nth-child(4) input').value.trim();
      const duration = parseDuration(durationText);
      
      if (!pilots[pilotName]) {
        pilots[pilotName] = { duration: 0, relays: 0 };
      }
      
      pilots[pilotName].duration += duration;
      pilots[pilotName].relays += 1;
    }
  });
  
  let totalDuration = 0;
  let totalRelays = 0;
  
  Object.entries(pilots).forEach(([pilot, data]) => {
    const row = document.createElement('tr');
    row.className = pilot.toLowerCase().replace(/\s+/g, '');
    
    const nameCell = document.createElement('td');
    nameCell.textContent = pilot;
    
    const durationCell = document.createElement('td');
    durationCell.textContent = formatDuration(data.duration);
    
    const relaysCell = document.createElement('td');
    relaysCell.textContent = data.relays;
    
    row.appendChild(nameCell);
    row.appendChild(durationCell);
    row.appendChild(relaysCell);
    
    totalsTable.insertBefore(row, totalsTable.lastElementChild);
    
    totalDuration += data.duration;
    totalRelays += data.relays;
  });
  
  const totalRow = totalsTable.querySelector('.total-row');
  if (totalRow) {
    totalRow.querySelector('td:nth-child(2)').textContent = formatDuration(totalDuration);
    totalRow.querySelector('td:nth-child(3)').textContent = totalRelays;
  }
}

function parseDuration(durationStr) {
  const match = durationStr.match(/(\d+)h(\d+)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2] || '0') || 0;
  
  return hours * 60 + minutes;
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins < 10 ? '0' + mins : mins}`;
}

function handleCellEdit(row, columnIndex, newValue) {
  if (columnIndex === 2) { 
    ['james', 'kingz', 'morpheus', 'blitz'].forEach(cls => {
      row.classList.remove(cls);
    });
    
    const pilotClass = newValue.toLowerCase().replace(/\s+/g, '');
    row.classList.add(pilotClass);
  }
  
  calculateTotals();
  saveChanges();
}

function deleteRow(row) {
  if (confirm('Es-tu sur des vouloir supprimer ce stint ?')) {
    row.remove();
    calculateTotals();
    saveChanges();
  }
}

function addNewRow() {
  const tableBody = document.querySelector('table tbody');
  const existingRows = tableBody.querySelectorAll('tr');
  const newRowNumber = existingRows.length + 1;
  
  const newRow = document.createElement('tr');
  
  for (let j = 0; j < 5; j++) {
    const cell = document.createElement('td');
    
    const input = document.createElement('input');
    input.type = 'text';
    
    if (j === 0) {
      input.value = newRowNumber.toString();
    } else {
      input.value = '';
    }
    
    input.dataset.originalValue = input.value;
    input.addEventListener('blur', () => handleCellEdit(newRow, j, input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        input.blur();
      } else if (e.key === 'Escape') {
        input.value = input.dataset.originalValue;
        input.blur();
      }
    });
    
    cell.appendChild(input);
    newRow.appendChild(cell);
  }
  
  const actionsCell = document.createElement('td');
  actionsCell.className = 'actions';
  
  const deleteButton = document.createElement('button');
  deleteButton.textContent = '🗑️';
  deleteButton.className = 'delete-row';
  deleteButton.addEventListener('click', () => deleteRow(newRow));
  
  actionsCell.appendChild(deleteButton);
  newRow.appendChild(actionsCell);
  
  tableBody.appendChild(newRow);
}

function saveChanges() {
  const crew = getCrewFromURL();
  const tableRows = document.querySelectorAll('table:first-of-type tbody tr');
  const data = [];
  
  data.push(['Relais', 'Horaire', 'Pilote', 'Durée', 'Commentaire']);
  
  tableRows.forEach(row => {
    const rowData = [];
    const inputs = row.querySelectorAll('td input');
    
    inputs.forEach(input => {
      rowData.push(input.value);
    });
    
    data.push(rowData);
  });
  
  showLoading(true);
  
  // Call the Google Sheets API to update the sheet
  const range = encodeURIComponent(`${crew}!A1:E${data.length}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED&key=${API_KEY}`;
  
  fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: data
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    displayMessage("Changement effectués !");
  })
  .catch(error => {
    console.error('Error saving data:', error);
    displayError("Erreur lors de la sauvegarde. Réessayez plus tard");
  })
  .finally(() => {
    showLoading(false);
  });
}

function displayMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'success-message';
  messageElement.textContent = message;
  
  const existingMessage = document.querySelector('.success-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const header = document.querySelector('h1');
  header.insertAdjacentElement('afterend', messageElement);
  
  setTimeout(() => {
    messageElement.remove();
  }, 3000);
}

function setupEventListeners() {
  const addButton = document.createElement('button');
  addButton.id = 'addStintButton';
  addButton.textContent = 'Ajouter stint supplémentaire';
  addButton.addEventListener('click', addNewRow);
  
  const saveButton = document.createElement('button');
  saveButton.id = 'saveChangesButton';
  saveButton.textContent = 'Enregistrer les changements';
  saveButton.addEventListener('click', saveChanges);
  
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'button-container';
  buttonContainer.appendChild(addButton);
  buttonContainer.appendChild(saveButton);
  
  const tables = document.querySelectorAll('table');
  const lastTable = tables[tables.length - 1];
  lastTable.insertAdjacentElement('afterend', buttonContainer);
}

document.addEventListener('DOMContentLoaded', initPage);