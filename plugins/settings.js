async function createSettingsContent() {
    console.log("✅ Creating Settings Content"); // Debugging log

    const container = document.createElement("div");
    container.id = "settings-panel";
    container.style.width = "100%";
    container.style.boxSizing = "border-box";
    container.style.padding = "10px";

    const title = document.createElement("h3");
    title.textContent = "Settings";
    title.style.textAlign = "center";
    title.style.marginBottom = "10px";
    container.appendChild(title);

    const bottomPanelLabel = document.createElement("label");
    bottomPanelLabel.style.display = "flex";
    bottomPanelLabel.style.alignItems = "center";
    bottomPanelLabel.style.justifyContent = "space-between";
    bottomPanelLabel.style.padding = "10px";
    bottomPanelLabel.style.border = "1px solid #444";
    bottomPanelLabel.style.borderRadius = "5px";
    bottomPanelLabel.style.background = "#222";

    const labelText = document.createElement("span");
    labelText.textContent = "Enable Bottom Plugin Panel";
    bottomPanelLabel.appendChild(labelText);

    const bottomPanelToggle = document.createElement("input");
    bottomPanelToggle.type = "checkbox";
    bottomPanelToggle.style.transform = "scale(1.2)";
    bottomPanelToggle.style.cursor = "pointer";

    bottomPanelLabel.appendChild(bottomPanelToggle);
    container.appendChild(bottomPanelLabel);

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save Settings";
    saveButton.style.display = "block";
    saveButton.style.margin = "20px auto";
    saveButton.style.padding = "8px";
    saveButton.style.borderRadius = "5px";
    saveButton.style.background = "#1e90ff";
    saveButton.style.color = "white";
    saveButton.style.border = "none";
    saveButton.style.cursor = "pointer";

    container.appendChild(saveButton);

    const savedSettings = JSON.parse(localStorage.getItem("pluginSettings")) || {};
    if (savedSettings.bottomPanelEnabled) {
        bottomPanelToggle.checked = true;
        window.pluginAPI.toggleBottomPanel(true);
    }

    saveButton.addEventListener("click", () => {
        const bottomPanelEnabled = bottomPanelToggle.checked;
        console.log("✅ Toggling Bottom Plugin Panel:", bottomPanelEnabled); // Debugging
    
        localStorage.setItem("pluginSettings", JSON.stringify({ bottomPanelEnabled }));
    
        if (window.pluginAPI && window.pluginAPI.toggleBottomPanel) {
            window.pluginAPI.toggleBottomPanel(bottomPanelEnabled);
        } else {
            console.error("❌ IPC event 'toggle-bottom-panel' not registered in pluginAPI.");
        }
    
        alert("Settings saved!");
    });

    return container;
}

if (typeof window !== "undefined") {
    window.settings = function () {
        console.log("✅ Settings Plugin Initialized"); // Debugging log

        return {
            name: "Settings",
            icon: "⚙️",
            createContent: createSettingsContent
        };
    };
}
