async function fetchAdventureLog(playerName) {
    try {
        const url = `https://2004.lostcity.rs/player/adventurelog/${encodeURIComponent(playerName)}`;
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const entries = [];
        const logDivs = doc.querySelectorAll('div[style="text-align: left"]');

        logDivs.forEach(div => {
            const timestamp = div.querySelector("span")?.textContent.trim() || "";
            const content = div.textContent.split("\n")
                .map(line => line.trim())
                .filter(line => line && !line.includes(timestamp))[0] || "";

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

        if (response.redirected) return null; 

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

async function createPlayerLookupContent(panelType) {
    const container = document.createElement("div");
    container.id = "player-lookup";
    container.style.width = "100%";
    container.style.boxSizing = "border-box";
    container.style.padding = "10px";

    if (panelType === "bottom") {
        container.style.display = "grid";
        container.style.gridTemplateColumns = "20% 50% 30%"; // Left: Search, Middle: Stats, Right: Logs
        container.style.alignItems = "center";
        container.style.gap = "10px";
    }

    // Create search section
    const searchContainer = document.createElement("div");
    searchContainer.style.display = "flex";
    searchContainer.style.alignItems = "center";
    searchContainer.style.justifyContent = "center";
    
    if (panelType === "bottom") {
        searchContainer.style.flexDirection = "column";
        searchContainer.style.fontSize = "smaller"; // Reduce size
    } else {
        searchContainer.style.width = "100%";
        searchContainer.style.gap = "5px";
    }

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter player name...";
    input.style.flex = "1";
    input.style.padding = "6px";
    input.style.borderRadius = "5px";
    input.style.border = "1px solid #ccc";
    input.style.background = "#2d2d2d";
    input.style.color = "white";

    const button = document.createElement("button");
    button.textContent = "Search";
    button.style.padding = "6px";
    button.style.borderRadius = "5px";
    button.style.background = "#1e90ff";
    button.style.color = "white";
    button.style.border = "none";
    button.style.cursor = "pointer";

    searchContainer.appendChild(input);
    searchContainer.appendChild(button);

    // Create results/stats section
    const results = document.createElement("div");
    results.style.marginTop = "10px";
    results.style.padding = "10px";
    results.style.border = "1px solid #444";
    results.style.background = "#222";
    results.style.borderRadius = "5px";
    results.style.display = "none";

    // Skill grid for stats
    const skillGrid = document.createElement("div");
    skillGrid.style.display = "grid";
    skillGrid.style.gap = "5px";
    
    if (panelType === "bottom") {
        skillGrid.style.gridTemplateColumns = "repeat(auto-fit, minmax(80px, 1fr))";
    } else {
        skillGrid.style.gridTemplateColumns = "repeat(3, 1fr)";
    }

    results.appendChild(skillGrid);

    // Create logs section
    const logs = document.createElement("div");
    logs.textContent = "Logs appear here...";
    logs.style.padding = "10px";
    logs.style.border = "1px solid #444";
    logs.style.background = "#222";
    logs.style.borderRadius = "5px";
    logs.style.display = "none";

    if (panelType === "bottom") {
        logs.style.textAlign = "right";
    }

    button.addEventListener("click", async () => {
        const playerName = input.value.trim();
        if (!playerName) return;

        results.style.display = "block";
        results.innerHTML = "Loading...";
        logs.style.display = "block";

        const playerSkills = await fetchPlayerSkills(playerName);
        const adventureLog = await fetchAdventureLog(playerName);

        if (!playerSkills) {
            results.innerHTML = "Player not found.";
            logs.innerHTML = "No logs found.";
            return;
        }

        results.innerHTML = "";
        skillGrid.innerHTML = "";

        const skills = [
            "Attack", "Hitpoints", "Mining", "Strength", "Agility", "Smithing",
            "Defence", "Herblore", "Fishing", "Ranged", "Thieving", "Cooking",
            "Prayer", "Crafting", "Firemaking", "Magic", "Fletching", "Woodcutting",
            "Runecrafting"
        ];

        skills.forEach(skill => {
            const skillDiv = document.createElement("div");
            skillDiv.style.display = "flex";
            skillDiv.style.alignItems = "center";
            skillDiv.style.justifyContent = "center";

            const icon = document.createElement("img");
            const iconName = skill === "Runecrafting" ? "Runecraft" : skill;
            icon.src = `https://oldschool.runescape.wiki/images/${iconName}_icon.png`;
            icon.alt = skill;
            icon.style.width = "20px";
            icon.style.height = "20px";
            icon.style.marginRight = "5px";

            const label = document.createElement("span");
            const skillData = playerSkills[skill.toLowerCase()];
            label.textContent = skillData?.level || "1";
            label.style.color = "yellow";

            if (skillData?.xp) {
                const xp = Math.floor(skillData.xp);
                skillDiv.title = `XP: ${xp.toLocaleString()}`;
            }

            skillDiv.appendChild(icon);
            skillDiv.appendChild(label);
            skillGrid.appendChild(skillDiv);
        });

        // Populate logs
        logs.innerHTML = "";
        adventureLog.forEach(entry => {
            const logEntry = document.createElement("div");
            logEntry.textContent = `[${entry.timestamp}] ${entry.content}`;
            logs.appendChild(logEntry);
        });
    });

    if (panelType === "bottom") {
        container.appendChild(searchContainer);
        container.appendChild(results);
        container.appendChild(logs);
    } else {
        container.appendChild(searchContainer);
        container.appendChild(results);
        container.appendChild(logs);
    }

    return container;
}


if (typeof window !== "undefined") {
    window.playerLookup = function () {
        const panelType = document.getElementById("bottom-plugin-bar")?.contains(document.getElementById("plugin-content")) 
            ? "bottom" 
            : "right";

        return {
            name: "Player Lookup",
            icon: "🧍",
            createContent: () => createPlayerLookupContent(panelType)
        };
    };
}
