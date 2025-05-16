const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyFwqhyTDGmCMeBhVIj3rrhGpuGHj7zUZoDYMnvigc9tHUf5iCDLh5FVqGNKLBT--uLfA/exec';

const urlParams = new URLSearchParams(window.location.search);
const crewName = urlParams.get('crew');

document.addEventListener('DOMContentLoaded', async () => {
  if (!crewName) {
    window.location.href = '../index.html';
    return;
  }

  document.getElementById('crewTitle').textContent = `🏁 Équipage: ${crewName}`;
  document.getElementById('crewNameInput').value = crewName;

  await loadCrewDetails();
  await loadEvents();
});

async function loadCrewDetails() {
  const crewMembersList = document.getElementById('crewMembersList');
  const driverUpdateStatus = document.getElementById('driverUpdateStatus');

  try {
    driverUpdateStatus.textContent = "Chargement des membres de l'équipage...";
    
    const response = await fetch(`${WEB_APP_URL}?action=getCrewDetails&crewName=${encodeURIComponent(crewName)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === "success") {
      crewMembersList.innerHTML = '';
      
      if (data.drivers && data.drivers.length > 0) {
        const membersList = document.createElement('ul');
        membersList.className = 'members-list';
        
        data.drivers.forEach(driver => {
          const listItem = document.createElement('li');
          listItem.className = 'member-item';
          
          const driverName = document.createElement('span');
          driverName.textContent = driver;
          
          const deleteBtn = document.createElement('button');
          deleteBtn.textContent = 'Supprimer';
          deleteBtn.className = 'delete-btn';
          deleteBtn.addEventListener('click', () => removeDriver(driver));
          
          listItem.appendChild(driverName);
          listItem.appendChild(deleteBtn);
          membersList.appendChild(listItem);
        });
        
        crewMembersList.appendChild(membersList);
      } else {
        crewMembersList.innerHTML = '<p>Aucun pilote pour cet équipage</p>';
      }
      
      driverUpdateStatus.textContent = '';
    } else {
      driverUpdateStatus.textContent = `❌ Erreur: ${data.message || "Erreur inconnue"}`;
    }
  } catch (error) {
    console.error('Error loading crew details:', error);
    driverUpdateStatus.textContent = `❌ Erreur réseau: ${error.message}. Réessayez plus tard.`;
  }
}

async function loadEvents() {
  const eventsList = document.getElementById('eventsList');
  const eventUpdateStatus = document.getElementById('eventUpdateStatus');

  try {
    eventUpdateStatus.textContent = "Chargement des événements...";
    
    const response = await fetch(`${WEB_APP_URL}?action=getCrewEvents&crewName=${encodeURIComponent(crewName)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === "success") {
      eventsList.innerHTML = '';
      
      if (data.events && data.events.length > 0) {
        const eventsTable = document.createElement('table');
        eventsTable.className = 'events-table';
        
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Événement', 'Date', 'Durée', 'Actions'].forEach(text => {
          const th = document.createElement('th');
          th.textContent = text;
          headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        eventsTable.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        
        data.events.forEach(event => {
          const row = document.createElement('tr');
          
          const nameCell = document.createElement('td');
          nameCell.textContent = event.name;
          row.appendChild(nameCell);
          
          const dateCell = document.createElement('td');
          dateCell.textContent = new Date(event.date).toLocaleDateString();
          row.appendChild(dateCell);
          
          const durationCell = document.createElement('td');
          durationCell.textContent = `${event.duration} heures`;
          row.appendChild(durationCell);
          
          const actionsCell = document.createElement('td');
          
          const viewPlanBtn = document.createElement('button');
          viewPlanBtn.textContent = 'Voir le planning';
          viewPlanBtn.className = 'view-plan-btn';
          viewPlanBtn.addEventListener('click', () => viewStintPlan(event.id));
          
          const deleteBtn = document.createElement('button');
          deleteBtn.textContent = 'Supprimer';
          deleteBtn.className = 'delete-btn';
          deleteBtn.addEventListener('click', () => removeEvent(event.id));
          
          actionsCell.appendChild(viewPlanBtn);
          actionsCell.appendChild(deleteBtn);
          row.appendChild(actionsCell);
          
          tbody.appendChild(row);
        });
        
        eventsTable.appendChild(tbody);
        eventsList.appendChild(eventsTable);
      } else {
        eventsList.innerHTML = '<p>Aucun événement pour cet équipage</p>';
      }
      
      eventUpdateStatus.textContent = '';
    } else {
      eventUpdateStatus.textContent = `❌ Erreur: ${data.message || "Erreur inconnue"}`;
    }
  } catch (error) {
    console.error('Error loading events:', error);
    eventUpdateStatus.textContent = `❌ Erreur réseau: ${error.message}. Réessayez plus tard.`;
  }
}

document.getElementById('updateCrewForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newCrewName = document.getElementById('crewNameInput').value.trim();
  const crewUpdateStatus = document.getElementById('crewUpdateStatus');
  
  if (!newCrewName) {
    crewUpdateStatus.textContent = "❌ Le nom d'équipage ne peut pas être vide.";
    return;
  }
  
  crewUpdateStatus.textContent = "⏳ Mise à jour en cours...";
  
  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      redirect: "follow",
      headers: {"Content-Type": "text/plain;charset=utf-8"},
      body: JSON.stringify({
        action: 'updateCrewName',
        oldCrewName: crewName,
        newCrewName: newCrewName
      }),
      mode: "cors"
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === "success") {
      crewUpdateStatus.textContent = "✅ Nom d'équipage mis à jour.";
      window.location.href = `index.html?crew=${encodeURIComponent(newCrewName)}`;
    } else {
      crewUpdateStatus.textContent = `❌ Erreur: ${data.message || "Erreur inconnue"}`;
    }
  } catch (error) {
    console.error('Error updating crew name:', error);
    crewUpdateStatus.textContent = `❌ Erreur réseau: ${error.message}. Réessayez plus tard.`;
  }
});

document.getElementById('addDriverForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const driverName = document.getElementById('newDriverName').value.trim();
  const driverUpdateStatus = document.getElementById('driverUpdateStatus');
  
  if (!driverName) {
    driverUpdateStatus.textContent = "❌ Le nom du pilote ne peut pas être vide.";
    return;
  }
  
  driverUpdateStatus.textContent = "⏳ Ajout en cours...";
  
  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      redirect: "follow",
      headers: {"Content-Type": "text/plain;charset=utf-8"},
      body: JSON.stringify({
        action: 'addDriver',
        crewName: crewName,
        driverName: driverName
      }),
      mode: "cors"
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === "success") {
      driverUpdateStatus.textContent = "✅ Pilote ajouté.";
      document.getElementById('newDriverName').value = '';
      await loadCrewDetails();
    } else {
      driverUpdateStatus.textContent = `❌ Erreur: ${data.message || "Erreur inconnue"}`;
    }
  } catch (error) {
    console.error('Error adding driver:', error);
    driverUpdateStatus.textContent = `❌ Erreur réseau: ${error.message}. Réessayez plus tard.`;
  }
});

async function removeDriver(driverName) {
  const driverUpdateStatus = document.getElementById('driverUpdateStatus');
  
  if (!confirm(`Êtes-vous sûr de vouloir supprimer ${driverName} de l'équipage ?`)) {
    return;
  }
  
  driverUpdateStatus.textContent = "⏳ Suppression en cours...";
  
  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      redirect: "follow",
      headers: {"Content-Type": "text/plain;charset=utf-8"},
      body: JSON.stringify({
        action: 'removeDriver',
        crewName: crewName,
        driverName: driverName
      }),
      mode: "cors"
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === "success") {
      driverUpdateStatus.textContent = "✅ Pilote supprimé.";
      await loadCrewDetails();
    } else {
      driverUpdateStatus.textContent = `❌ Erreur: ${data.message || "Erreur inconnue"}`;
    }
  } catch (error) {
    console.error('Error removing driver:', error);
    driverUpdateStatus.textContent = `❌ Erreur réseau: ${error.message}. Réessayez plus tard.`;
  }
}

document.getElementById('addEventForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const eventName = document.getElementById('eventName').value.trim();
  const eventDate = document.getElementById('eventDate').value;
  const eventDuration = document.getElementById('eventDuration').value;
  const eventUpdateStatus = document.getElementById('eventUpdateStatus');
  
  if (!eventName || !eventDate || !eventDuration) {
    eventUpdateStatus.textContent = "❌ Tous les champs sont requis.";
    return;
  }
  
  eventUpdateStatus.textContent = "⏳ Création en cours...";
  
  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      redirect: "follow",
      headers: {"Content-Type": "text/plain;charset=utf-8"},
      body: JSON.stringify({
        action: 'createEvent',
        crewName: crewName,
        eventName: eventName,
        eventDate: eventDate,
        eventDuration: eventDuration
      }),
      mode: "cors"
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === "success") {
      eventUpdateStatus.textContent = "✅ Événement créé.";
      document.getElementById('eventName').value = '';
      document.getElementById('eventDate').value = '';
      document.getElementById('eventDuration').value = '1';
      await loadEvents();
    } else {
      eventUpdateStatus.textContent = `❌ Erreur: ${data.message || "Erreur inconnue"}`;
    }
  } catch (error) {
    console.error('Error creating event:', error);
    eventUpdateStatus.textContent = `❌ Erreur réseau: ${error.message}. Réessayez plus tard.`;
  }
});

async function removeEvent(eventId) {
  const eventUpdateStatus = document.getElementById('eventUpdateStatus');
  
  if (!confirm(`Êtes-vous sûr de vouloir supprimer cet événement ?`)) {
    return;
  }
  
  eventUpdateStatus.textContent = "⏳ Suppression en cours...";
  
  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      redirect: "follow",
      headers: {"Content-Type": "text/plain;charset=utf-8"},
      body: JSON.stringify({
        action: 'removeEvent',
        crewName: crewName,
        eventId: eventId
      }),
      mode: "cors"
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === "success") {
      eventUpdateStatus.textContent = "✅ Événement supprimé.";
      await loadEvents();
    } else {
      eventUpdateStatus.textContent = `❌ Erreur: ${data.message || "Erreur inconnue"}`;
    }
  } catch (error) {
    console.error('Error removing event:', error);
    eventUpdateStatus.textContent = `❌ Erreur réseau: ${error.message}. Réessayez plus tard.`;
  }
}

function viewStintPlanner(eventId) {
  window.location.href = `../Planner/index.html?crew=${encodeURIComponent(crewName)}&event=${encodeURIComponent(eventId)}`;
}