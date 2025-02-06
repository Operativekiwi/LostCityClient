// playerLookup.js
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
    console.log(`🛠️ Creating Player Lookup Content for panel: ${panelType}`);
    const container = document.createElement("div");
    container.id = "player-lookup";
    container.style.width = "100%";
    
    if (panelType === "bottom") {
        console.log("✅ Applying bottom panel layout (horizontal)");
        container.style.display = "flex";
        container.style.flexDirection = "row";
        container.style.height = "100%";
        
        // Left section (Search)
        const leftSection = document.createElement("div");
        leftSection.style.width = "160px";
        leftSection.style.borderRight = "1px solid #444";
        leftSection.style.padding = "10px";
        
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
        input.style.padding = "5px";
        input.style.borderRadius = "3px";
        input.style.border = "1px solid #ccc";
        input.style.background = "#2d2d2d";
        input.style.color = "white";

        const button = document.createElement("button");
        button.textContent = "Search";
        button.style.padding = "5px";
        button.style.borderRadius = "3px";
        button.style.background = "#1e90ff";
        button.style.color = "white";
        button.style.border = "none";
        button.style.cursor = "pointer";
        
        inputContainer.appendChild(input);
        inputContainer.appendChild(button);
        
        leftSection.appendChild(title);
        leftSection.appendChild(inputContainer);
        
        // Middle section (Skills)
        const middleSection = document.createElement("div");
        middleSection.style.flex = "1";
        middleSection.style.padding = "10px";
        middleSection.style.overflowY = "auto";
        middleSection.style.overflowX = "auto";

        
        const skillsContainer = document.createElement("div");
        skillsContainer.id = "skills-container";
        skillsContainer.style.display = "grid";
        skillsContainer.style.gridTemplateColumns = "repeat(auto-fill, minmax(120px, 1fr))"; // More compact grid
        skillsContainer.style.gap = "10px";
        skillsContainer.style.padding = "10px";
        
        middleSection.appendChild(skillsContainer);
        
        // Right section (Logs)
        const rightSection = document.createElement("div");
        rightSection.style.width = "220px";
        rightSection.style.borderLeft = "1px solid #444";
        rightSection.style.padding = "10px";
        rightSection.style.overflowY = "auto";
        
        const logsContainer = document.createElement("div");
        logsContainer.id = "logs-container";
        rightSection.appendChild(logsContainer);
        
        container.appendChild(leftSection);
        container.appendChild(middleSection);
        container.appendChild(rightSection);

        button.addEventListener("click", async () => {
            const playerName = input.value.trim();
            if (!playerName) return;

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

            skillsContainer.innerHTML = "";

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
                skillDiv.style.padding = "5px";
                skillDiv.style.background = "#222";
                skillDiv.style.borderRadius = "3px";

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
                skillsContainer.appendChild(skillDiv);
            });

            // Display adventure log
            logsContainer.innerHTML = "";
            const logTitle = document.createElement("h4");
            logTitle.textContent = "Adventure Log";
            logTitle.style.margin = "0 0 10px 0";
            logsContainer.appendChild(logTitle);

            adventureLog.forEach(entry => {
                const logEntry = document.createElement("div");
                logEntry.style.marginBottom = "10px";
                logEntry.style.padding = "5px";
                logEntry.style.background = "#222";
                logEntry.style.borderRadius = "3px";

                const timestamp = document.createElement("div");
                timestamp.style.fontSize = "0.8em";
                timestamp.style.color = "#999";
                timestamp.textContent = entry.timestamp;

                const content = document.createElement("div");
                content.textContent = entry.content;

                logEntry.appendChild(timestamp);
                logEntry.appendChild(content);
                logsContainer.appendChild(logEntry);
            });
        });
    } else {
        console.log("🔳 Applying right panel layout (vertical)");
        // Vertical panel layout
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

            const skillGrid = document.createElement("div");
            skillGrid.style.display = "grid";
            skillGrid.style.gridTemplateColumns = "repeat(3, 1fr)";
            skillGrid.style.gap = "5px";
            skillGrid.style.marginTop = "10px";

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

            results.appendChild(skillGrid);
        });
    }

    return container;
}

if (typeof window !== "undefined") {
    window.playerLookup = function () {
        const panelType = document.getElementById("plugin-content").parentElement.id === "bottom-plugin-bar" 
            ? "bottom" 
            : "right";

        return {
            name: "Player Lookup",
            icon: "🧍",
            createContent: () => createPlayerLookupContent(panelType)
        };
    };
}