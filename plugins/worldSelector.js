async function fetchWorlds() {
    try {
      const response = await fetch("https://2004.lostcity.rs/serverlist?hires.x=101&hires.y=41&method=0");
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
  
      const worlds = [];
      const regionTables = doc.querySelectorAll("table > tbody > tr > td > table");
  
      regionTables.forEach((regionTable) => {
        const rows = regionTable.querySelectorAll("tr");
  
        let currentFlagSrc = null;
        rows.forEach((row) => {
          const imgEl = row.querySelector("img");
          const link = row.querySelector("a");
  
          if (imgEl && !link) {
            currentFlagSrc = imgEl.getAttribute("src");
            return;
          }
  
          if (link) {
            const match = link.href.match(/world=(\d+)/);
            if (!match) return;
  
            const worldNumber = parseInt(match[1], 10);
            const playerCell = row.querySelector("td:last-child");
            let players = 0;
            if (playerCell) {
              const playersMatch = playerCell.textContent.trim().match(/(\d+)\s*players/);
              if (playersMatch) {
                players = parseInt(playersMatch[1], 10);
              }
            }
  
            worlds.push({
              flagSrc: currentFlagSrc || "",
              world: worldNumber,
              players,
            });
          }
        });
      });
  
      return worlds;
    } catch (error) {
      console.error("Failed to fetch world list:", error);
      return [];
    }
  }
  
  async function createWorldSelector() {
    const container = document.createElement("div");
    container.id = "world-selector";
  
    const title = document.createElement("h3");
    title.textContent = "Select a World";
    container.appendChild(title);
  
    let worlds = await fetchWorlds();
  
    const table = document.createElement("table");
    table.style.width = "100%";
  
    const tableBody = document.createElement("tbody");
    worlds.forEach(({ flagSrc, world, players }) => {
      const row = document.createElement("tr");
  
      const flagCell = document.createElement("td");
      if (flagSrc) {
        const img = document.createElement("img");
        img.src = flagSrc;
        img.style.width = "20px";
        flagCell.appendChild(img);
      }
      row.appendChild(flagCell);
  
      const worldCell = document.createElement("td");
      const worldLink = document.createElement("a");
      worldLink.textContent = `World ${world}`;
      worldLink.href = "#";
      worldLink.addEventListener("click", () => {
        window.location.href = `https://w${world}-2004.lostcity.rs/rs2.cgi`;
      });
      worldCell.appendChild(worldLink);
      row.appendChild(worldCell);
  
      const playersCell = document.createElement("td");
      playersCell.textContent = players;
      row.appendChild(playersCell);
  
      tableBody.appendChild(row);
    });
  
    table.appendChild(tableBody);
    container.appendChild(table);
  
    return container;
  }
  
  export default function () {
    return {
      name: "World Selector",
      icon: "🌍",
      async createContent() {
        return await createWorldSelector();
      },
      async init() {
        console.log("World Selector Initialized");
      },
      destroy() {
        console.log("World Selector Destroyed");
      },
    };
  }
  