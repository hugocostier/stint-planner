const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyFwqhyTDGmCMeBhVIj3rrhGpuGHj7zUZoDYMnvigc9tHUf5iCDLh5FVqGNKLBT--uLfA/exec';

let eventData = {};
let driversList = [];
let currentEditingStintIndex = null;

function getURLParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    crew: params.get('crew') || 'Équipage inconnu',
    eventId: params.get('eventId') || ''
  };
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  
  if (isNaN(date.getTime())) return '';
  
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return '';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  return `${hours}h${mins < 10 ? '0' + mins : mins}`;
}

function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  
  const [startHours, startMins] = startTime.split(':').map(Number);
  const [endHours, endMins] = endTime.split(':').map(Number);
  
  let durationMins = (endHours * 60 + endMins) - (startHours * 60 + startMins);
  
  if (durationMins < 0) {
    durationMins += 24 * 60;
  }
  
  return durationMins;
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

function displayMessage(message, isError = false) {
  const messageElement = document.createElement('div');
  messageElement.className = isError ? 'error-message' : 'success-message';
  messageElement.textContent = message;
  
  const existingMessage = document.querySelector('.success-message, .error-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const statusElement = document.getElementById('statusMsg');
  if (statusElement) {
    statusElement.innerHTML = '';
    statusElement.appendChild(messageElement);
  } else {
    const header = document.querySelector('h1');
    header.insertAdjacentElement('afterend', messageElement);
  }
  
  setTimeout(() => {
    messageElement.remove();
  }, 3000);
}

async function initPage() {
  const params = getURLParams();
  
  try {
    await fetchDrivers(params.crew);
    await fetchEventDetails(params.crew, params.eventId);
    await fetchStints(params.crew, eventData.name);
    setupEventListeners();
  } catch (error) {
    console.error('Initialization error:', error);
    displayMessage('Erreur lors de l\'initialisation de la page', true);
  }
}

async function fetchDrivers(crew) {
  showLoading(true);
  
  try {
    const response = await fetch(`${WEB_APP_URL}?action=getCrewDetails&crewName=${encodeURIComponent(crew)}`);
    
    if (!response.ok) {
      throw new Error('Erreur réseau lors de la récupération des pilotes');
    }
    
    const data = await response.json();
    
    if (data.status === 'success') {
      driversList = data.drivers;
      populateDriverSelector();
    } else {
      throw new Error(data.message || 'Erreur lors de la récupération des pilotes');
    }
  } catch (error) {
    console.error('Error fetching drivers:', error);
    displayMessage('Erreur lors du chargement des pilotes', true);
  } finally {
    showLoading(false);
  }
}

async function fetchEventDetails(crew, eventId) {
  showLoading(true);
  
  try {
    const response = await fetch(`${WEB_APP_URL}?action=getEvent&crewName=${encodeURIComponent(crew)}&eventId=${encodeURIComponent(eventId)}`);
    
    if (!response.ok) {
      throw new Error('Erreur réseau lors de la récupération des détails de l\'événement');
    }
    
    const data = await response.json();
    
    if (data.status === 'success') {
      eventData = data.event;
      displayEventDetails();
    } else {
      throw new Error(data.message || 'Erreur lors de la récupération des détails de l\'événement');
    }
  } catch (error) {
    console.error('Error fetching event details:', error);
    displayMessage('Erreur lors du chargement des détails de l\'événement', true);
  } finally {
    showLoading(false);
  }
}

async function fetchStints(crew, eventName) {
  showLoading(true);
  
  try {
    const response = await fetch(`${WEB_APP_URL}?action=getPlanning&crewName=${encodeURIComponent(crew)}&eventName=${encodeURIComponent(eventName)}`);
    
    if (!response.ok) {
      throw new Error('Erreur réseau lors de la récupération du planning');
    }
    
    const data = await response.json();
    
    if (data.status === 'success') {
      populateStintsTable(data.planning);
      calculateTotals();
    } else {
      populateStintsTable([]);
    }
  } catch (error) {
    console.error('Error fetching stints:', error);
    populateStintsTable([]);
  } finally {
    showLoading(false);
  }
}

function displayEventDetails() {
  document.getElementById('pageTitle').textContent = eventData.name || 'Détails de l\'événement';
  document.getElementById('eventName').value = eventData.name || '';
  
  const eventDate = new Date(eventData.date);
  if (!isNaN(eventDate.getTime())) {
    const formattedDate = eventDate.toISOString().substring(0, 16);
    document.getElementById('eventDate').value = formattedDate;
  }
  
  document.getElementById('eventDuration').value = eventData.duration || '';
}

function populateDriverSelector() {
  const driverSelector = document.getElementById('stintDriver');
  driverSelector.innerHTML = '';
  
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = '-- Sélectionner un pilote --';
  driverSelector.appendChild(emptyOption);
  
  driversList.forEach(driver => {
    const option = document.createElement('option');
    option.value = driver;
    option.textContent = driver;
    driverSelector.appendChild(option);
  });
}

function populateStintsTable(stints) {
  const tableBody = document.querySelector('#stintsTable tbody');
  tableBody.innerHTML = '';
  
  stints.forEach((stint, index) => {
    const row = createStintRow(stint, index + 1);
    tableBody.appendChild(row);
  });
}

function createStintRow(stint, rowNumber) {
  const row = document.createElement('tr');
  
  if (stint.driver) {
    const pilotClass = stint.driver.toLowerCase().replace(/\s+/g, '');
    row.classList.add(pilotClass);
  }
  
  const numberCell = document.createElement('td');
  numberCell.textContent = rowNumber;
  row.appendChild(numberCell);
  
  const timeCell = document.createElement('td');
  timeCell.textContent = `${stint.start || '--'} - ${stint.end || '--'}`;
  row.appendChild(timeCell);
  
  const driverCell = document.createElement('td');
  driverCell.textContent = stint.driver || '--';
  row.appendChild(driverCell);
  
  const durationCell = document.createElement('td');
  durationCell.textContent = stint.duration || '--';
  row.appendChild(durationCell);
  
  const commentCell = document.createElement('td');
  commentCell.textContent = stint.comment || '';
  row.appendChild(commentCell);
  
  const actionsCell = document.createElement('td');
  actionsCell.className = 'actions';
  
  const editButton = document.createElement('button');
  editButton.textContent = '✏️';
  editButton.className = 'edit-row';
  editButton.addEventListener('click', () => editStint(row, rowNumber - 1));
  
  const deleteButton = document.createElement('button');
  deleteButton.textContent = '🗑️';
  deleteButton.className = 'delete-row';
  deleteButton.addEventListener('click', () => deleteStint(row, rowNumber - 1));
  
  actionsCell.appendChild(editButton);
  actionsCell.appendChild(deleteButton);
  row.appendChild(actionsCell);
  
  return row;
}

function calculateTotals() {
  const rows = document.querySelectorAll('#stintsTable tbody tr');
  const totalsTable = document.querySelector('#totalsTable tbody');
  
  while (totalsTable.children.length > 1) {
    totalsTable.removeChild(totalsTable.firstChild);
  }
  
  const pilots = {};
  let totalDuration = 0;
  let totalRelays = 0;
  
  rows.forEach(row => {
    const pilotName = row.querySelector('td:nth-child(3)').textContent;
    
    if (pilotName && pilotName !== '--') {
      const durationText = row.querySelector('td:nth-child(4)').textContent;
      let duration = 0;
      
      const durationMatch = durationText.match(/(\d+)h(\d+)?/);
      if (durationMatch) {
        const hours = parseInt(durationMatch[1]) || 0;
        const minutes = parseInt(durationMatch[2] || '0') || 0;
        duration = hours * 60 + minutes;
      }
      
      if (!pilots[pilotName]) {
        pilots[pilotName] = { duration: 0, relays: 0 };
      }
      
      pilots[pilotName].duration += duration;
      pilots[pilotName].relays += 1;
      
      totalDuration += duration;
      totalRelays += 1;
    }
  });
  
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
  });
  
  const totalRow = totalsTable.querySelector('.total-row');
  if (totalRow) {
    totalRow.querySelector('td:nth-child(2)').textContent = formatDuration(totalDuration);
    totalRow.querySelector('td:nth-child(3)').textContent = totalRelays;
  }
}

function editStint(row, stintIndex) {
  currentEditingStintIndex = stintIndex;
  
  const cells = row.querySelectorAll('td');
  const timeRange = cells[1].textContent.split(' - ');
  const driver = cells[2].textContent;
  const comment = cells[4].textContent;
  
  document.getElementById('stintDriver').value = driver === '--' ? '' : driver;
  document.getElementById('stintStart').value = timeRange[0] === '--' ? '' : timeRange[0];
  document.getElementById('stintEnd').value = timeRange[1] === '--' ? '' : timeRange[1];
  document.getElementById('stintComment').value = comment;
  
  document.getElementById('cancelEditBtn').style.display = 'inline-block';
  document.getElementById('addStintBtn').textContent = 'Mettre à jour';
}

function deleteStint(row, stintIndex) {
  if (confirm('Es-tu sûr de vouloir supprimer ce stint ?')) {
    const params = getURLParams();
    
    const requestBody = {
      action: 'deleteStints',
      crewName: params.crew,
      eventName: eventData.name,
      rows: [stintIndex + 2]
    };
    
    showLoading(true);
    
    fetch(WEB_APP_URL, {
      redirect: "follow", 
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8"',
      },
      body: JSON.stringify(requestBody),
      mode: "cors",
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data.status === 'success') {
        row.remove();
        resetStintForm();
        calculateTotals();
        displayMessage('Stint supprimé !');
      } else {
        throw new Error(data.message || 'Erreur lors de la suppression');
      }
    })
    .catch(error => {
      console.error('Error deleting stint:', error);
      displayMessage('Erreur lors de la suppression du stint', true);
    })
    .finally(() => {
      showLoading(false);
    });
  }
}

function addOrUpdateStint() {
  const driver = document.getElementById('stintDriver').value;
  const startTime = document.getElementById('stintStart').value;
  const endTime = document.getElementById('stintEnd').value;
  const comment = document.getElementById('stintComment').value;
  
  if (!driver || !startTime || !endTime) {
    displayMessage('Veuillez remplir tous les champs obligatoires', true);
    return;
  }
  
  const durationMinutes = calculateDuration(startTime, endTime);
  const duration = formatDuration(durationMinutes);
  
  const params = getURLParams();
  
  let requestBody;
  
  if (currentEditingStintIndex !== null) {
    requestBody = {
      action: 'editStints',
      crewName: params.crew,
      eventName: eventData.name,
      stints: [{
        row: currentEditingStintIndex + 2,
        driver: driver,
        startTime: startTime,
        endTime: endTime,
        duration: duration,
        notes: comment
      }]
    };
  } else {
    requestBody = {
      action: 'addStints',
      crewName: params.crew,
      eventName: eventData.name,
      stints: [{
        driver: driver,
        startTime: startTime,
        endTime: endTime,
        duration: duration,
        notes: comment
      }]
    };
  }
  
  showLoading(true);
  
  fetch(WEB_APP_URL, {
    redirect: "follow", 
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8"',
    },
    body: JSON.stringify(requestBody),
    mode: "cors",
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    if (data.status === 'success') {
      fetchStints(params.crew, eventData.name);
      resetStintForm();
      displayMessage(currentEditingStintIndex !== null ? 'Stint mis à jour !' : 'Nouveau stint ajouté !');
    } else {
      throw new Error(data.message || 'Erreur lors de l\'enregistrement');
    }
  })
  .catch(error => {
    console.error('Error saving stint:', error);
    displayMessage('Erreur lors de l\'enregistrement du stint', true);
  })
  .finally(() => {
    showLoading(false);
  });
}

function resetStintForm() {
  document.getElementById('stintDriver').value = '';
  document.getElementById('stintStart').value = '';
  document.getElementById('stintEnd').value = '';
  document.getElementById('stintComment').value = '';
  
  document.getElementById('cancelEditBtn').style.display = 'none';
  document.getElementById('addStintBtn').textContent = 'Ajouter ce stint';
  
  currentEditingStintIndex = null;
}

function saveEventChanges() {
  const params = getURLParams();
  
  const newName = document.getElementById('eventName').value;
  const newDate = document.getElementById('eventDate').value;
  const newDuration = document.getElementById('eventDuration').value;
  
  if (!newName || !newDate || !newDuration) {
    displayMessage('Veuillez remplir tous les champs obligatoires', true);
    return;
  }
  
  const requestBody = {
    action: 'editEvent',
    crewName: params.crew,
    eventName: params.event,
    newName: newName,
    newDate: newDate,
    newDuration: parseFloat(newDuration)
  };
  
  showLoading(true);
  
  fetch(WEB_APP_URL, {
    redirect: "follow", 
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8"',
    },
    body: JSON.stringify(requestBody),
    mode: "cors",
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    if (data.status === 'success') {
      eventData.name = newName;
      eventData.date = newDate;
      eventData.duration = parseFloat(newDuration);
      
      displayMessage('Détails de l\'événement mis à jour !');
    } else {
      throw new Error(data.message || 'Erreur lors de la mise à jour');
    }
  })
  .catch(error => {
    console.error('Error updating event:', error);
    displayMessage('Erreur lors de la mise à jour de l\'événement', true);
  })
  .finally(() => {
    showLoading(false);
  });
}

function deleteEvent() {
  if (confirm('Es-tu sûr de vouloir supprimer cet événement ? Cette action est irréversible.')) {
    const params = getURLParams();
    
    const requestBody = {
      action: 'deleteEvent',
      crewName: params.crew,
      eventName: params.event
    };
    
    showLoading(true);
    
    fetch(WEB_APP_URL, {
      redirect: "follow", 
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8"',
      },
      body: JSON.stringify(requestBody), 
      mode: "cors",
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data.status === 'success') {
        window.location.href = `../Crew/index.html?crew=${encodeURIComponent(params.crew)}`;
      } else {
        throw new Error(data.message || 'Erreur lors de la suppression');
      }
    })
    .catch(error => {
      console.error('Error deleting event:', error);
      displayMessage('Erreur lors de la suppression de l\'événement', true);
    })
    .finally(() => {
      showLoading(false);
    });
  }
}

function setupEventListeners() {
  document.getElementById('addStintBtn').addEventListener('click', addOrUpdateStint);
  document.getElementById('cancelEditBtn').addEventListener('click', resetStintForm);
  document.getElementById('saveEventBtn').addEventListener('click', saveEventChanges);
  document.getElementById('deleteEventBtn').addEventListener('click', deleteEvent);
  document.getElementById('stintStart').addEventListener('change', updateStintDuration);
  document.getElementById('stintEnd').addEventListener('change', updateStintDuration);
}

function updateStintDuration() {
  const startTime = document.getElementById('stintStart').value;
  const endTime = document.getElementById('stintEnd').value;
  
  if (startTime && endTime) {
    const durationMinutes = calculateDuration(startTime, endTime);
    console.log(`Durée calculée: ${formatDuration(durationMinutes)}`);
  }
}

document.addEventListener('DOMContentLoaded', initPage);