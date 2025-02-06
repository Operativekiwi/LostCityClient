// ✅ World Selector Plugin - Fully Refactored for Side Panel

async function fetchWorlds() {
    try {
        const response = await fetch("https://2004.lostcity.rs/serverlist?hires.x=101&hires.y=41&method=0");
        const html = await response.text();
        return parseWorlds(html);
    } catch (error) {
        console.error("❌ Failed to fetch world list:", error);
        return [];
    }
}

function parseWorlds(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const worlds = [];
    let currentFlagSrc = null;

    doc.querySelectorAll("table > tbody > tr > td > table").forEach(regionTable => {
        regionTable.querySelectorAll("tr").forEach(row => {
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
                const players = playerCell ? parseInt(playerCell.textContent.trim().match(/(\d+)/)?.[1] || "0", 10) : 0;

                worlds.push({ flagSrc: currentFlagSrc || "", world: worldNumber, players });
            }
        });
    });

    return worlds;
}

function getCurrentWorld() {
    return localStorage.getItem("currentWorld") || null;
}

function setCurrentWorld(world) {
    localStorage.setItem("currentWorld", world);
}

// ✅ Create World Selector for Side Panel Only
async function createWorldSelector() {
    console.log("✅ World Selector initialized for side panel only.");

    const container = document.createElement("div");
    container.id = "world-selector";
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
    const worlds = await fetchWorlds();

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
            worldLink.style.textDecoration = "none";

            worldLink.addEventListener("click", (event) => {
                event.preventDefault();
                setCurrentWorld(world);
                window.electronAPI.changeWorld(`https://w${world}-2004.lostcity.rs/rs2.cgi`);
                createWorldSelector().then(updatedContent => {
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

    return container;
}

// ✅ Register Plugin as Side Panel Only
if (typeof window !== "undefined") {
    window.worldSelector = function () {
        return {
            name: "World Selector",
            icon: "🌍",
            createContent: createWorldSelector
        };
    };
}
