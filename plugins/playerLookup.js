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

    const title = document.createElement("h3");
    title.textContent = "Player Lookup";
    title.style.textAlign = "center";
    title.style.marginBottom = "10px";
    container.appendChild(title);

    const inputContainer = document.createElement("div");
    inputContainer.style.display = "flex";
    inputContainer.style.width = "100%";
    inputContainer.style.gap = "5px";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter player name...";
    input.style.flex = "1";
    input.style.padding = "8px";
    input.style.borderRadius = "5px";
    input.style.border = "1px solid #ccc";
    input.style.background = "#2d2d2d";
    input.style.color = "white";

    const button = document.createElement("button");
    button.textContent = "Search";
    button.style.padding = "8px";
    button.style.borderRadius = "5px";
    button.style.background = "#1e90ff";
    button.style.color = "white";
    button.style.border = "none";
    button.style.cursor = "pointer";

    inputContainer.appendChild(input);
    inputContainer.appendChild(button);
    container.appendChild(inputContainer);

    const results = document.createElement("div");
    results.style.marginTop = "15px";
    results.style.padding = "10px";
    results.style.border = "1px solid #444";
    results.style.background = "#222";
    results.style.borderRadius = "5px";
    results.style.display = "none";
    container.appendChild(results);

    button.addEventListener("click", async () => {
        const playerName = input.value.trim();
        if (!playerName) return;

        results.style.display = "block";
        results.innerHTML = "Loading...";

        const playerSkills = await fetchPlayerSkills(playerName);
        if (!playerSkills) {
            results.innerHTML = "Player not found.";
            return;
        }

        results.innerHTML = "";

        // Skill grid
        const skillGrid = document.createElement("div");
        skillGrid.style.display = "grid";
        skillGrid.style.gap = "5px";
        skillGrid.style.marginTop = "10px";

        // Adjust grid based on panel type
        skillGrid.style.gridTemplateColumns = panelType === "bottom" ? "repeat(auto-fit, minmax(100px, 1fr))" : "repeat(3, 1fr)";

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

        results.appendChild(skillGrid);
    });

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
