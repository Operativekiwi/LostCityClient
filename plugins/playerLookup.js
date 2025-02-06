// ✅ Player Lookup Plugin - Fully Refactored for Bottom Panel

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

// ✅ Create Bottom Panel Layout
async function createPlayerLookupContent() {
    console.log("✅ PlayerLookup designed for bottom panel");

    // Create main container
    const container = document.createElement("div");
    container.id = "player-lookup";
    container.style.display = "flex";
    container.style.flexDirection = "row";
    container.style.width = "100%";
    container.style.height = "100%";

    // Create sections
    const leftSection = createSearchSection();
    const middleSection = createSkillsSection();
    const rightSection = createLogsSection();

    // Append sections
    container.appendChild(leftSection);
    container.appendChild(middleSection);
    container.appendChild(rightSection);

    return container;
}

// ✅ Define the missing style functions
function styleInput(input) {
    input.style.width = "100%";
    input.style.padding = "8px";
    input.style.border = "1px solid #666";
    input.style.borderRadius = "4px";
    input.style.background = "#222";
    input.style.color = "white";
}

function styleButton(button) {
    button.style.width = "100%";
    button.style.padding = "8px";
    button.style.border = "none";
    button.style.borderRadius = "4px";
    button.style.background = "#444";
    button.style.color = "white";
    button.style.cursor = "pointer";
    button.style.fontWeight = "bold";
}



// ✅ Left Panel - Search Section
function createSearchSection() {
    const section = document.createElement("div");
    section.style.width = "160px";
    section.style.borderRight = "1px solid #444";
    section.style.padding = "10px";

    const title = document.createElement("h4");
    title.textContent = "Player Lookup";
    title.style.margin = "0 0 10px 0";

    const inputContainer = document.createElement("div");
    inputContainer.style.display = "flex";
    inputContainer.style.flexDirection = "column";
    inputContainer.style.gap = "5px";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter player name...";
    styleInput(input);

    const button = document.createElement("button");
    button.textContent = "Search";
    styleButton(button);

    inputContainer.appendChild(input);
    inputContainer.appendChild(button);

    section.appendChild(title);
    section.appendChild(inputContainer);

    button.addEventListener("click", async () => {
        const playerName = input.value.trim();
        if (!playerName) return;
        await updatePlayerLookup(playerName);
    });

    return section;
}

// ✅ Middle Panel - Skills Display
function createSkillsSection() {
    const section = document.createElement("div");
    section.style.flex = "1";
    section.style.padding = "10px";
    section.style.overflowY = "auto";
    section.style.overflowX = "auto";

    const skillsContainer = document.createElement("div");
    skillsContainer.id = "skills-container";
    skillsContainer.style.display = "grid";
    skillsContainer.style.gridTemplateColumns = "repeat(auto-fill, minmax(120px, 1fr))";
    skillsContainer.style.gap = "10px";
    skillsContainer.style.padding = "10px";

    section.appendChild(skillsContainer);
    return section;
}

// ✅ Right Panel - Adventure Log
function createLogsSection() {
    const section = document.createElement("div");
    section.style.width = "220px";
    section.style.borderLeft = "1px solid #444";
    section.style.padding = "10px";
    section.style.overflowY = "auto";

    const logsContainer = document.createElement("div");
    logsContainer.id = "logs-container";

    section.appendChild(logsContainer);
    return section;
}

// ✅ Update Player Data
async function updatePlayerLookup(playerName) {
    const skillsContainer = document.getElementById("skills-container");
    const logsContainer = document.getElementById("logs-container");

    skillsContainer.innerHTML = "Loading skills...";
    logsContainer.innerHTML = "Loading logs...";

    const [playerSkills, adventureLog] = await Promise.all([
        fetchPlayerSkills(playerName),
        fetchAdventureLog(playerName)
    ]);

    if (!playerSkills) {
        skillsContainer.innerHTML = "Player not found.";
        logsContainer.innerHTML = "";
        return;
    }

    displaySkills(playerSkills, skillsContainer);
    displayAdventureLog(adventureLog, logsContainer);
}

// ✅ Display Player Skills
function displaySkills(playerSkills, container) {
    container.innerHTML = "";

    const skills = [
        "Attack", "Hitpoints", "Mining", "Strength", "Agility", "Smithing",
        "Defence", "Herblore", "Fishing", "Ranged", "Thieving", "Cooking",
        "Prayer", "Crafting", "Firemaking", "Magic", "Fletching", "Woodcutting",
        "Runecrafting"
    ];

    skills.forEach(skill => {
        const skillData = playerSkills[skill.toLowerCase()];
        if (!skillData) return;

        const skillDiv = document.createElement("div");
        skillDiv.style.display = "flex";
        skillDiv.style.alignItems = "center";
        skillDiv.style.padding = "5px";
        skillDiv.style.background = "#222";
        skillDiv.style.borderRadius = "3px";

        const icon = document.createElement("img");
        icon.src = `https://oldschool.runescape.wiki/images/${skill}_icon.png`;
        icon.alt = skill;
        icon.style.width = "20px";
        icon.style.height = "20px";
        icon.style.marginRight = "5px";

        const label = document.createElement("span");
        label.textContent = skillData.level;
        label.style.color = "yellow";

        skillDiv.appendChild(icon);
        skillDiv.appendChild(label);
        container.appendChild(skillDiv);
    });
}

// ✅ Display Adventure Log
function displayAdventureLog(logs, container) {
    container.innerHTML = "";

    logs.forEach(entry => {
        const logEntry = document.createElement("div");
        logEntry.style.marginBottom = "10px";
        logEntry.style.padding = "5px";
        logEntry.style.background = "#222";
        logEntry.style.borderRadius = "3px";

        logEntry.innerHTML = `<div style="color: #999; font-size: 0.8em;">${entry.timestamp}</div>
                              <div>${entry.content}</div>`;

        container.appendChild(logEntry);
    });
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
