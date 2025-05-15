const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyFwqhyTDGmCMeBhVIj3rrhGpuGHj7zUZoDYMnvigc9tHUf5iCDLh5FVqGNKLBT--uLfA/exec'
const CREW_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT3I2JQkKIW1UtSNh9IHTN10j8Gx0IGxT8hULU-od8Odq2RWazxvTVe3kNBti6GiftZMhkdjybfkb5m/pub?output=csv'

async function fetchCrewList() {
  const response = await fetch(CREW_SHEET_CSV_URL);
  const csvText = await response.text();
  const lines = csvText.split('\n').slice(1); 
  const crewNames = lines.map(line => line.trim()).filter(line => !!line);
  return crewNames;
}

async function populateCrewOptions() {
  const select = document.getElementById("crewSelect");
  const crews = await fetchCrewList();
  crews.forEach(crew => {
    const option = document.createElement("option");
    option.value = crew;
    option.textContent = crew;
    select.appendChild(option);
  });
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

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ crewName: newCrew }),
    });
    const data = await response.json();

    if (data.status === "success") {
      statusMsg.textContent = `✅ Équipage "${newCrew}" créé. Tu peux maintenant le choisir depuis la liste déroulante.`;
      const option = document.createElement("option");
      option.value = newCrew;
      option.textContent = newCrew;
      document.getElementById("crewSelect").appendChild(option);
      document.getElementById("newCrewName").value = "";
    } else if (data.status === "exists") {
      statusMsg.textContent = "⚠️ Cet équipage existe déjà.";
    } else {
      statusMsg.textContent = `❌ Erreur: ${data.message}`;
    }
  } catch (error) {
    statusMsg.textContent = "❌ Erreur réseau, réessayez plus tard.";
  }
});

populateCrewOptions();
