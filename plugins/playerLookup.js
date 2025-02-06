const { contextBridge, ipcRenderer } = require("electron");

async function fetchAdventureLog(playerName) {
  try {
    const response = await ipcRenderer.invoke("fetch-adventure-log", playerName);
    return response || [];
  } catch (error) {
    console.error("Failed to fetch adventure log:", error);
    return [];
  }
}

async function fetchPlayerSkills(playerName) {
  try {
    const response = await ipcRenderer.invoke("fetch-player-skills", playerName);
    return response || null;
  } catch (error) {
    console.error("Failed to fetch player skills:", error);
    return null;
  }
}

function createPlayerLookupContent() {
  const container = document.createElement("div");
  container.id = "tab-player-lookup";

  const title = document.createElement("h3");
  title.textContent = "Player Lookup";
  container.appendChild(title);

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Enter player name...";
  searchInput.style.width = "100%";
  searchInput.style.marginBottom = "10px";
  container.appendChild(searchInput);

  const searchButton = document.createElement("button");
  searchButton.textContent = "Search";
  searchButton.style.width = "100%";
  searchButton.style.marginBottom = "20px";
  container.appendChild(searchButton);

  const resultContainer = document.createElement("div");
  resultContainer.style.padding = "10px";
  resultContainer.style.border = "1px solid #ccc";
  resultContainer.style.marginTop = "10px";
  resultContainer.style.display = "none";
  container.appendChild(resultContainer);

  searchButton.addEventListener("click", async () => {
    const playerName = searchInput.value.trim();
    if (!playerName) return;

    resultContainer.style.display = "block";
    resultContainer.innerHTML = "Loading...";

    const playerSkills = await fetchPlayerSkills(playerName);

    if (!playerSkills) {
      resultContainer.innerHTML = "Player not found.";
      return;
    }

    resultContainer.innerHTML = `<h4>${playerName}'s Skills</h4>`;

    const skillsList = document.createElement("ul");
    Object.entries(playerSkills).forEach(([skill, { level, xp }]) => {
      const listItem = document.createElement("li");
      listItem.textContent = `${skill.charAt(0).toUpperCase() + skill.slice(1)}: Level ${level} - XP: ${xp}`;
      skillsList.appendChild(listItem);
    });

    resultContainer.appendChild(skillsList);
  });

  return container;
}

if (typeof window !== "undefined") {
  window.playerLookup = function () {
    return {
      name: "Player Lookup",
      icon: "🧍",
      createContent: createPlayerLookupContent,
    };
  };
}

module.exports = { fetchPlayerSkills };
