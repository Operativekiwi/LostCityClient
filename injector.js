(async function () {
    console.log("Injecting Plugin Sidebar...");
  
    // Create Sidebar
    const sidebar = document.createElement("div");
    sidebar.id = "plugin-sidebar";
    sidebar.style.position = "fixed";
    sidebar.style.top = "10px";
    sidebar.style.right = "10px";
    sidebar.style.width = "250px";
    sidebar.style.height = "600px";
    sidebar.style.backgroundColor = "#1b1b1b";
    sidebar.style.color = "#fff";
    sidebar.style.border = "2px solid #4d4d4d";
    sidebar.style.borderRadius = "8px";
    sidebar.style.overflow = "hidden";
    sidebar.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.2)";
    sidebar.style.display = "flex";
    sidebar.style.flexDirection = "column";
    sidebar.style.alignItems = "center";
  
    // Create Plugin List
    const pluginContainer = document.createElement("div");
    pluginContainer.style.flex = "1";
    pluginContainer.style.padding = "10px";
    pluginContainer.style.overflowY = "auto";
  
    sidebar.appendChild(pluginContainer);
    document.body.appendChild(sidebar);
  
    // Load Plugins
    const plugins = await window.pluginAPI.getPlugins();
    plugins.forEach((plugin) => {
      const btn = document.createElement("button");
      btn.textContent = plugin.icon || "🔌";
      btn.title = plugin.name;
      btn.style.margin = "10px";
      btn.style.background = "none";
      btn.style.border = "none";
      btn.style.color = "#fff";
      btn.style.cursor = "pointer";
      btn.style.fontSize = "20px";
      btn.style.width = "40px";
      btn.style.height = "40px";
  
      btn.addEventListener("click", async () => {
        const content = await plugin.createContent();
        pluginContainer.innerHTML = "";
        pluginContainer.appendChild(content);
      });
  
      sidebar.appendChild(btn);
    });
  
  })();
  