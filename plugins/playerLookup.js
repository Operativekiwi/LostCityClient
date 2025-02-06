async function fetchAdventureLog(playerName) {
    try {
      const url = `https://2004.lostcity.rs/player/adventurelog/${encodeURIComponent(playerName)}`;
      const response = await fetch(url);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const entries = [];
      const logDivs = doc.querySelectorAll('div[style="text-align: left"]');
      
      logDivs.forEach(div => {
        const timestamp = div.querySelector('span')?.textContent.trim() || '';
        const content = div.textContent.split('\n').map(line => line.trim()).filter(line => line && !line.includes(timestamp))[0] || '';
        if (timestamp && content) {
          entries.push({ timestamp, content });
        }
      });
  
      return entries;
    } catch (error) {
      console.error("Failed to fetch adventure log:", error);
      return [];
    }
  }
  
  async function fetchPlayerSkills(playerName) {
    try {
      const url = `https://2004.lostcity.rs/hiscores/player/${encodeURIComponent(playerName)}`;
      const response = await fetch(url);
  
      if (response.redirected) {
        return null; 
      }
  
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
  
      const skillRows = doc.querySelectorAll("table tbody tr");
      const skills = {};
  
      skillRows.forEach(row => {
        const cells = row.querySelectorAll("td");
        if (cells.length === 6) {
          const skillName = cells[2]?.textContent.trim();
          const level = parseInt(cells[4]?.textContent.trim(), 10);
          const xp = parseInt(cells[5]?.textContent.trim().replace(/,/g, ""), 10);
          if (skillName && !isNaN(level) && !isNaN(xp)) {
            skills[skillName.toLowerCase()] = { level, xp };
          }
        }
      });
  
      return skills;
    } catch (error) {
      console.error("Failed to fetch player skills:", error);
      return null;
    }
  }
  
  async function createPlayerLookupContent() {
    const container = document.createElement("div");
    container.id = "player-lookup";
  
    const title = document.createElement("h3");
    title.textContent = "Player Lookup";
    container.appendChild(title);
  
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter player name...";
    container.appendChild(input);
  
    const button = document.createElement("button");
    button.textContent = "Search";
    container.appendChild(button);
  
    const results = document.createElement("div");
    results.style.marginTop = "10px";
    container.appendChild(results);
  
    button.addEventListener("click", async () => {
      const playerName = input.value.trim();
      if (!playerName) return;
  
      results.innerHTML = "Loading...";
      const playerSkills = await fetchPlayerSkills(playerName);
      if (!playerSkills) {
        results.innerHTML = "Player not found.";
        return;
      }
  
      results.innerHTML = "";
      Object.entries(playerSkills).forEach(([skill, { level }]) => {
        const skillDiv = document.createElement("div");
        skillDiv.textContent = `${skill.toUpperCase()}: Level ${level}`;
        results.appendChild(skillDiv);
      });
    });
  
    return container;
  }
  
  if (typeof window !== "undefined") {
    window.playerLookup = function () {
      return {
        name: "Player Lookup",
        icon: "🧍",
        createContent: createPlayerLookupContent
      };
    };
  }
  