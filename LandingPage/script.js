// Simulated list of crews - eventually this should come from Google Sheets
let crews = ["JamesTeam", "BlitZForce", "NightRacers"];

function populateCrewOptions() {
  const select = document.getElementById("crewSelect");
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

document.getElementById("newCrewForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const newCrew = document.getElementById("newCrewName").value.trim();
  const statusMsg = document.getElementById("statusMsg");

  if (newCrew && !crews.includes(newCrew)) {
    crews.push(newCrew);
    statusMsg.textContent = `✅ Crew "${newCrew}" created. You can now select it from the dropdown.`;

    const option = document.createElement("option");
    option.value = newCrew;
    option.textContent = newCrew;
    document.getElementById("crewSelect").appendChild(option);

    document.getElementById("newCrewName").value = "";
  } else {
    statusMsg.textContent = "❌ Invalid or duplicate crew name.";
  }
});

populateCrewOptions();
