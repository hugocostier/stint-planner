function getCrewFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('crew') || 'Unknown Crew';
}

function updatePageTitle() {
  const crew = getCrewFromURL();
  const title = document.getElementById('crewTitle');
  if (title) {
    title.textContent = `Planning 24H de Spa LSX - ${crew}`;
  }
}

updatePageTitle();

// Future: fetch data for crew from Google Sheets
// fetchDataForCrew(crew);
