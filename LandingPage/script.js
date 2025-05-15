const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyFwqhyTDGmCMeBhVIj3rrhGpuGHj7zUZoDYMnvigc9tHUf5iCDLh5FVqGNKLBT--uLfA/exec'
const CREW_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT3I2JQkKIW1UtSNh9IHTN10j8Gx0IGxT8hULU-od8Odq2RWazxvTVe3kNBti6GiftZMhkdjybfkb5m/pub?output=csv'

async function fetchCrewList() {
  try {
    const response = await fetch(CREW_SHEET_CSV_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const csvText = await response.text();
    const lines = csvText.split('\n').slice(1); 
    const crewNames = lines.map(line => line.trim()).filter(line => !!line);
    return crewNames;
  } catch (error) {
    console.error('Error fetching crew list:', error);
    document.getElementById("statusMsg").textContent = "❌ Erreur de chargement des équipages.";
    return [];
  }
}

async function populateCrewOptions() {
  const select = document.getElementById("crewSelect");
  const statusMsg = document.getElementById("statusMsg");

  try {
    statusMsg.textContent = "Chargement des équipages...";
    const crews = await fetchCrewList();
    
    if (crews.length === 0) {
      statusMsg.textContent = "Aucun équipage trouvé. Crée en un nouveau !";
    } else {
      crews.forEach(crew => {
        const option = document.createElement("option");
        option.value = crew;
        option.textContent = crew;
        select.appendChild(option);
      });
      statusMsg.textContent = "";
    }
  } catch (error) {
    console.error('Error populating crew options:', error);
    statusMsg.textContent = "❌ Erreur de chargement des équipages.";
  }
}

document.getElementById("crewSelectForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const crew = document.getElementById("crewSelect").value;
  if (crew) {
    window.location.href = `../PlannerPage/index.html?crew=${encodeURIComponent(crew)}`;
  }
});

document.getElementById("newCrewForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const newCrew = document.getElementById("newCrewName").value.trim();
  const statusMsg = document.getElementById("statusMsg");

  if (!newCrew) {
    statusMsg.textContent = "❌ Veuillez entrer un nom d'équipage.";
    return;
  }

  statusMsg.textContent = "⏳ Création en cours...";

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ crewName: newCrew }),
      mode: "cors"
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "success") {
      statusMsg.textContent = `✅ Équipage "${newCrew}" créé. Tu peux maintenant le choisir depuis la liste déroulante.`;
      const option = document.createElement("option");
      option.value = newCrew;
      option.textContent = newCrew;
      document.getElementById("crewSelect").appendChild(option);
      document.getElementById("crewSelect").value = newCrew;
      document.getElementById("newCrewName").value = "";
    } else if (data.status === "exists") {
      statusMsg.textContent = "⚠️ Cet équipage existe déjà.";
    } else {
      statusMsg.textContent = `❌ Erreur: ${data.message || "Erreur inconnue"}`;
    }
  } catch (error) {
    statusMsg.textContent = "❌ Erreur réseau: ${error.message}. Réessayez plus tard.";
  }
});

populateCrewOptions();
