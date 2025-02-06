async function fetchPlayerData(playerName) {
    try {
        const [skills, logs] = await Promise.all([
            fetchPlayerSkills(playerName),
            fetchAdventureLog(playerName)
        ]);

        return { skills, logs };
    } catch (error) {
        console.error("❌ Error fetching player data:", error);
        return null;
    }
}

async function fetchPlayerSkills(playerName) {
    try {
        const url = `https://2004.lostcity.rs/hiscores/player/${encodeURIComponent(playerName)}`;
        const response = await fetch(url);
        if (response.redirected) return null;

        const html = await response.text();
        return parsePlayerSkills(html);
    } catch (error) {
        console.error("❌ Failed to fetch player skills:", error);
        return null;
    }
}

async function fetchAdventureLog(playerName) {
    try {
        const url = `https://2004.lostcity.rs/player/adventurelog/${encodeURIComponent(playerName)}`;
        const response = await fetch(url);
        const html = await response.text();
        return parseAdventureLog(html);
    } catch (error) {
        console.error("❌ Failed to fetch adventure log:", error);
        return [];
    }
}

function parsePlayerSkills(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const skills = {};
    doc.querySelectorAll("table tbody tr").forEach(row => {
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
}

function parseAdventureLog(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    return Array.from(doc.querySelectorAll('div[style="text-align: left"]')).map(div => {
        const timestamp = div.querySelector("span")?.textContent.trim() || "";
        const content = div.textContent.split("\n")
            .map(line => line.trim())
            .filter(line => line && !line.includes(timestamp))[0] || "";

        return timestamp && content ? { timestamp, content } : null;
    }).filter(entry => entry);
}

// ✅ Redesigned Layout (Horizontal Structure)
async function createPlayerLookupContent() {
    console.log("✅ PlayerLookup initialized for horizontal layout");

    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.gap = "20px";
    container.style.padding = "10px";

    // ✅ Search Section
    const searchSection = document.createElement("div");
    searchSection.style.width = "220px";
    searchSection.style.display = "flex";
    searchSection.style.flexDirection = "column";
    searchSection.style.gap = "10px";

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Enter player name...";
    searchInput.style.width = "100%";
    searchInput.style.padding = "8px";
    searchInput.style.borderRadius = "4px";
    searchInput.style.border = "1px solid #666";
    searchInput.style.background = "#222";
    searchInput.style.color = "white";

    const searchButton = document.createElement("button");
    searchButton.textContent = "Search";
    searchButton.style.width = "100%";
    searchButton.style.padding = "8px";
    searchButton.style.border = "none";
    searchButton.style.borderRadius = "4px";
    searchButton.style.background = "#444";
    searchButton.style.color = "white";
    searchButton.style.cursor = "pointer";
    searchButton.style.fontWeight = "bold";

    searchSection.appendChild(searchInput);
    searchSection.appendChild(searchButton);

    // ✅ Player Stats Section
    const statsContainer = document.createElement("div");
    statsContainer.style.flex = "1";
    statsContainer.style.display = "grid";
    statsContainer.style.gridTemplateColumns = "repeat(auto-fill, minmax(100px, 1fr))";
    statsContainer.style.gap = "10px";
    statsContainer.style.padding = "10px";

    // ✅ Adventure Log Section
    const logsContainer = document.createElement("div");
    logsContainer.style.width = "280px";
    logsContainer.style.overflowY = "auto";
    logsContainer.style.padding = "10px";

    searchButton.addEventListener("click", async () => {
        const playerName = searchInput.value.trim();
        if (!playerName) return;

        statsContainer.innerHTML = "Loading...";
        logsContainer.innerHTML = "Loading...";

        const playerData = await fetchPlayerData(playerName);
        if (!playerData || !playerData.skills) {
            statsContainer.innerHTML = "Player not found.";
            logsContainer.innerHTML = "";
            return;
        }

        displaySkills(playerData.skills, statsContainer);
        displayAdventureLog(playerData.logs, logsContainer);
    });

    container.appendChild(searchSection);
    container.appendChild(statsContainer);
    container.appendChild(logsContainer);

    return container;
}

// ✅ Display Player Skills
function displaySkills(playerSkills, container) {
    container.innerHTML = "";

    Object.keys(playerSkills).forEach(skill => {
        const skillData = playerSkills[skill];

        const skillDiv = document.createElement("div");
        skillDiv.style.display = "flex";
        skillDiv.style.alignItems = "center";
        skillDiv.style.background = "#222";
        skillDiv.style.borderRadius = "4px";
        skillDiv.style.padding = "5px";

        const skillIcon = document.createElement("img");
        skillIcon.src = `https://oldschool.runescape.wiki/images/${skill}_icon.png`;
        skillIcon.style.width = "20px";
        skillIcon.style.height = "20px";
        skillIcon.style.marginRight = "5px";

        const skillLabel = document.createElement("span");
        skillLabel.textContent = skillData.level;
        skillLabel.style.color = "yellow";

        skillDiv.appendChild(skillIcon);
        skillDiv.appendChild(skillLabel);
        container.appendChild(skillDiv);
    });
}

// ✅ Display Adventure Log
function displayAdventureLog(logs, container) {
    container.innerHTML = "";
    logs.slice(0, 5).forEach(log => {
        const logEntry = document.createElement("div");
        logEntry.innerHTML = `<b>${log.timestamp}</b>: ${log.content}`;
        logEntry.style.padding = "5px";
        logEntry.style.borderBottom = "1px solid #444";
        container.appendChild(logEntry);
    });
}

// ✅ Register Plugin
if (typeof window !== "undefined") {
    window.playerLookup = function () {
        return {
            name: "Player Lookup",
            icon: "🧍",
            createContent: createPlayerLookupContent
        };
    };
}
