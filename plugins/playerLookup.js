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

async function createPlayerLookupContent() {
    const container = document.createElement("div");
    container.id = "player-lookup";

    const title = document.createElement("h3");
    title.textContent = "Player Lookup";
    container.appendChild(title);

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter player name...";
    input.style.width = "100%";
    input.style.marginBottom = "10px";
    container.appendChild(input);

    const button = document.createElement("button");
    button.textContent = "Search";
    button.style.width = "100%";
    button.style.marginBottom = "10px";
    container.appendChild(button);

    const results = document.createElement("div");
    results.style.padding = "10px";
    results.style.border = "1px solid #ccc";
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
        skillGrid.style.gridTemplateColumns = "repeat(3, 1fr)";
        skillGrid.style.gap = "10px";
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

        // Adventure Log
        const logTitle = document.createElement("h4");
        logTitle.textContent = "Recent Adventure Log";
        logTitle.style.marginTop = "20px";
        results.appendChild(logTitle);

        const logEntries = await fetchAdventureLog(playerName);
        if (logEntries.length > 0) {
            const logContainer = document.createElement("div");
            logContainer.style.marginTop = "10px";
            logEntries.slice(0, 3).forEach(entry => {
                const entryDiv = document.createElement("div");
                entryDiv.style.marginBottom = "10px";

                const timestamp = document.createElement("div");
                timestamp.style.color = "#888";
                timestamp.textContent = entry.timestamp;

                const content = document.createElement("div");
                content.textContent = entry.content;

                entryDiv.appendChild(timestamp);
                entryDiv.appendChild(content);
                logContainer.appendChild(entryDiv);
            });

            results.appendChild(logContainer);
        } else {
            const noLogs = document.createElement("div");
            noLogs.textContent = "No recent logs found.";
            results.appendChild(noLogs);
        }

        const logLink = document.createElement("a");
        logLink.href = `https://2004.lostcity.rs/player/adventurelog/${encodeURIComponent(playerName)}`;
        logLink.target = "_blank";
        logLink.textContent = "View Full Adventure Log";
        logLink.style.display = "block";
        logLink.style.marginTop = "10px";
        results.appendChild(logLink);
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
