// worldSelector.js
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
                    let flagSrc = imgEl.getAttribute("src");
                    if (flagSrc && !flagSrc.startsWith("http")) {
                        flagSrc = `https://2004.lostcity.rs${flagSrc}`;
                    }
                    currentFlagSrc = flagSrc;
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

function getCurrentWorld() {
    return localStorage.getItem("currentWorld") || null;
}

function setCurrentWorld(world) {
    localStorage.setItem("currentWorld", world);
}

async function createWorldSelector(panelType) {
    const container = document.createElement("div");
    container.id = "world-selector";
    
    let worlds = await fetchWorlds();

    if (panelType === "bottom") {
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.height = "100%";
        
        // Header section
        const header = document.createElement("div");
        header.style.padding = "5px 10px";
        header.style.borderBottom = "1px solid #444";
        
        const title = document.createElement("h4");
        title.textContent = "World Selector";
        title.style.margin = "0";
        header.appendChild(title);
        
        // Worlds grid
        const worldsContainer = document.createElement("div");
        worldsContainer.style.flex = "1";
        worldsContainer.style.padding = "10px";
        worldsContainer.style.overflowY = "auto";
        
        const worldsGrid = document.createElement("div");
        worldsGrid.style.display = "grid";
        worldsGrid.style.gridTemplateRows = "repeat(3, 1fr)";
        worldsGrid.style.gridAutoFlow = "column";
        worldsGrid.style.gap = "10px";
        
        worlds.forEach(({ flagSrc, world, players }) => {
            const worldItem = document.createElement("div");
            worldItem.style.display = "flex";
            worldItem.style.alignItems = "center";
            worldItem.style.padding = "8px";
            worldItem.style.background = "#222";
            worldItem.style.borderRadius = "4px";
            worldItem.style.gap = "10px";
            
            // Flag
            if (flagSrc) {
                const flag = document.createElement("img");
                flag.src = flagSrc;
                flag.style.width = "20px";
                flag.style.height = "15px";
                worldItem.appendChild(flag);
            }
            
            // World number and status
            const worldInfo = document.createElement("div");
            worldInfo.style.flex = "1";
            
            if (getCurrentWorld() === String(world)) {
                const currentText = document.createElement("span");
                currentText.textContent = `World ${world} (Current)`;
                currentText.style.fontWeight = "bold";
                currentText.style.color = "green";
                worldInfo.appendChild(currentText);
            } else {
                const worldLink = document.createElement("a");
                worldLink.textContent = `World ${world}`;
                worldLink.href = "#";
                worldLink.style.color = "white";
                worldLink.style.textDecoration = "none";
                
                worldLink.addEventListener("click", (event) => {
                    event.preventDefault();
                    setCurrentWorld(world);
                    window.electronAPI.changeWorld(`https://w${world}-2004.lostcity.rs/rs2.cgi`);
                    createWorldSelector(panelType).then(updatedContent => {
                        container.replaceWith(updatedContent);
                    });
                });
                
                worldInfo.appendChild(worldLink);
            }
            
            // Players count
            const playersCount = document.createElement("span");
            playersCount.textContent = `${players} players`;
            playersCount.style.marginLeft = "auto";
            playersCount.style.color = "#999";
            worldItem.appendChild(worldInfo);
            worldItem.appendChild(playersCount);
            
            worldsGrid.appendChild(worldItem);
        });
        
        worldsContainer.appendChild(worldsGrid);
        container.appendChild(header);
        container.appendChild(worldsContainer);
        
    } else {
        // Vertical panel layout
        container.style.width = "100%";
        container.style.boxSizing = "border-box";
        container.style.padding = "10px";

        const title = document.createElement("h3");
        title.textContent = "Select a World";
        title.style.textAlign = "center";
        title.style.marginBottom = "10px";
        container.appendChild(title);

        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
        table.style.textAlign = "left";

        const headers = ["🏳️", "🌐", "🧍‍♂️"];
        const headerRow = document.createElement("tr");

        headers.forEach(text => {
            const th = document.createElement("th");
            th.textContent = text;
            th.style.padding = "8px";
            th.style.borderBottom = "2px solid #ccc";
            th.style.textAlign = "center";
            headerRow.appendChild(th);
        });

        table.appendChild(headerRow);

        const tableBody = document.createElement("tbody");
        worlds.forEach(({ flagSrc, world, players }) => {
            const row = document.createElement("tr");

            // Flag Cell
            const flagCell = document.createElement("td");
            flagCell.style.textAlign = "center";
            if (flagSrc) {
                const img = document.createElement("img");
                img.src = flagSrc;
                img.style.width = "20px";
                img.style.height = "15px";
                flagCell.appendChild(img);
            }
            row.appendChild(flagCell);

            // World Cell
            const worldCell = document.createElement("td");
            worldCell.style.textAlign = "center";
            worldCell.style.color = "white";

            if (getCurrentWorld() === String(world)) {
                const currentText = document.createElement("span");
                currentText.textContent = `World ${world} (Current)`;
                currentText.style.fontWeight = "bold";
                currentText.style.color = "green";
                worldCell.appendChild(currentText);
            } else {
                const worldLink = document.createElement("a");
                worldLink.textContent = `World ${world}`;
                worldLink.href = "#";
                worldLink.style.color = "white";

                worldLink.addEventListener("click", (event) => {
                    event.preventDefault();
                    setCurrentWorld(world);
                    window.electronAPI.changeWorld(`https://w${world}-2004.lostcity.rs/rs2.cgi`);
                    createWorldSelector(panelType).then(updatedContent => {
                        container.replaceWith(updatedContent);
                    });
                });

                worldCell.appendChild(worldLink);
            }

            row.appendChild(worldCell);

            // Players Count
            const playersCell = document.createElement("td");
            playersCell.style.textAlign = "center";
            playersCell.textContent = players;
            row.appendChild(playersCell);

            tableBody.appendChild(row);
        });

        table.appendChild(tableBody);
        container.appendChild(table);
    }

    return container;
}

if (typeof window !== "undefined") {
    window.worldSelector = function () {
        const panelType = document.getElementById("bottom-plugin-bar")?.contains(document.getElementById("plugin-content")) 
            ? "bottom" 
            : "right";

        return {
            name: "World Selector",
            icon: "🌍",
            createContent: () => createWorldSelector(panelType)
        };
    };
}