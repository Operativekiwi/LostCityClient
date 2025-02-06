async function createSettingsContent() {
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

    const placeholderText = document.createElement("p");
    placeholderText.textContent = "Settings options will be added here.";
    placeholderText.style.textAlign = "center";
    placeholderText.style.color = "#bbb";
    container.appendChild(placeholderText);

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

    saveButton.addEventListener("click", () => {
        alert("Settings saved! (Placeholder functionality)");
    });

    container.appendChild(saveButton);

    return container;
}

if (typeof window !== "undefined") {
    window.settings = function () {
        return {
            name: "Settings",
            icon: "⚙️",
            createContent: createSettingsContent
        };
    };
}
