const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
let selectedCategory = "Exterior";
let referenceFile = null;
let currentImage = "";
let currentPrompt = "";
let toastTimer;

function toast(message) {
  const el = $("#toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 3000);
}
function setCategory(category) {
  selectedCategory = category;
  $$(".category-card").forEach(b => b.classList.toggle("selected", b.dataset.category === category));
  $$(".category-link").forEach(b => b.classList.toggle("active", b.dataset.category === category));
}
$$(".category-card").forEach(b => b.addEventListener("click", () => setCategory(b.dataset.category)));
$$(".category-link").forEach(b => b.addEventListener("click", () => {
  setCategory(b.dataset.category); showView("create");
  $("#prompt").focus();
  if (window.innerWidth < 760) $("#sidebar").classList.remove("open");
}));
$("#reference-image").addEventListener("change", e => {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 12 * 1024 * 1024) { toast("Please choose an image smaller than 12 MB."); e.target.value = ""; return; }
  referenceFile = file;
  $("#preview-img").src = URL.createObjectURL(file);
  $("#file-name").textContent = file.name;
  $("#file-preview").classList.remove("hidden");
});
$("#remove-file").addEventListener("click", () => {
  referenceFile = null; $("#reference-image").value = ""; $("#file-preview").classList.add("hidden");
});
function showView(name) {
  $$(".view").forEach(v => v.classList.toggle("active", v.id === `${name}-view`));
  $$(".nav-item[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === name));
  $("#crumb-current").textContent = name === "create" ? "Create design" : "My projects";
  if (name === "projects") renderProjects();
  if (window.innerWidth < 760) $("#sidebar").classList.remove("open");
}
$$(".nav-item[data-view]").forEach(b => b.addEventListener("click", () => showView(b.dataset.view)));
$("#side-start").addEventListener("click", () => showView("create"));
$("#create-first").addEventListener("click", () => showView("create"));
$("#mobile-menu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));

function buildPrompt() {
  const userPrompt = $("#prompt").value.trim();
  if (!userPrompt) return "";
  const style = $("#style").value;
  const format = $("#format").value;
  const categoryGuidance = {
    "Exterior": "Architectural exterior facade design. Show a coherent building exterior, materials, windows, doors, roofline and realistic context.",
    "Interior": "Interior architecture and interior decoration. Show coherent spatial layout, furniture, materials, lighting and realistic room proportions.",
    "Floor plan": "Create a clear professional architectural floor plan from a top-down orthographic view. Include sensible room adjacencies, doors, windows, circulation and legible room labels. Do not invent dimensions if none were supplied.",
    "Site plan": "Create a professional top-down site plan showing plot boundaries, building footprint, access, circulation, parking, landscape and outdoor zones. Do not invent legal setbacks or dimensions.",
    "Landscape": "Landscape architecture concept showing planting, paths, outdoor living, lighting and site relationships.",
    "Commercial": "Commercial architecture concept with functional circulation, customer and staff areas, appropriate lighting and materials.",
    "Other architecture": "Architectural design detail concept. Clearly communicate the described structure and its relationship to the building."
  };
  return `${categoryGuidance[selectedCategory]} Style: ${style}. Output: ${format}. User brief: ${userPrompt}. Create a polished, visually coherent architectural design concept. Prioritize realistic proportions, clear composition, thoughtful material choices and professional presentation.`;
}

$("#generate-btn").addEventListener("click", async () => {
  const prompt = buildPrompt();
  if (!prompt) { toast("Please describe the design you want first."); $("#prompt").focus(); return; }
  currentPrompt = prompt;
  const btn = $("#generate-btn"); btn.disabled = true; btn.innerHTML = '<span>✦</span> Creating…';
  $("#empty-state").classList.add("hidden"); $("#result-image").classList.add("hidden");
  $("#result-tools").classList.add("hidden"); $("#loading-state").classList.remove("hidden");
  try {
    const body = new FormData(); body.append("prompt", prompt);
    if (referenceFile) body.append("image", referenceFile);
    const response = await fetch("/.netlify/functions/design", { method: "POST", body });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Design generation failed.");
    currentImage = `data:${data.mimeType || "image/png"};base64,${data.image}`;
    $("#result-image").src = currentImage;
    $("#result-image").classList.remove("hidden");
    $("#result-tools").classList.remove("hidden");
    toast("Your design concept is ready.");
  } catch (err) {
    $("#empty-state").classList.remove("hidden");
    toast(err.message.includes("Failed to fetch") ? "AI service is not configured yet. Add your API key in Netlify." : err.message);
  } finally {
    $("#loading-state").classList.add("hidden");
    btn.disabled = false; btn.innerHTML = '<span>✦</span> Generate design <span>→</span>';
  }
});

function downloadData(dataUrl, name) {
  const a = document.createElement("a"); a.href = dataUrl; a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
$("#download-btn").addEventListener("click", () => {
  if (!currentImage) return; downloadData(currentImage, `jem-${selectedCategory.toLowerCase().replaceAll(" ","-")}-design.png`);
});
function getProjects() { try { return JSON.parse(localStorage.getItem("jem-design-projects") || "[]"); } catch { return []; } }
function setProjects(items) { localStorage.setItem("jem-design-projects", JSON.stringify(items)); $("#project-count").textContent = items.length; }
function saveCurrent() {
  if (!currentImage) return;
  const items = getProjects();
  items.unshift({ id: Date.now(), category: selectedCategory, prompt: $("#prompt").value.trim(), image: currentImage, created: new Date().toLocaleDateString() });
  setProjects(items.slice(0, 30)); toast("Project saved in this browser.");
}
$("#save-btn").addEventListener("click", saveCurrent);
$("#new-variation-btn").addEventListener("click", () => {
  $("#prompt").value = `${$("#prompt").value.trim()} Create a fresh alternative variation with a different composition while preserving the core requirements.`;
  $("#generate-btn").click();
});
function renderProjects() {
  const items = getProjects(); setProjects(items);
  $("#no-projects").classList.toggle("hidden", items.length > 0);
  $("#projects-grid").innerHTML = items.map(p => `<article class="project-card"><img src="${p.image}" alt="Saved ${escapeHtml(p.category)} design"><div class="project-meta"><b>${escapeHtml(p.category)} concept</b><p>${escapeHtml(p.prompt)}</p><div class="project-actions"><button data-open="${p.id}">Open</button><button data-download="${p.id}">Download</button><button data-delete="${p.id}">Delete</button></div></div></article>`).join("");
  $$("[data-open]").forEach(b => b.addEventListener("click", () => {
    const p = getProjects().find(x => x.id == b.dataset.open); if (!p) return;
    selectedCategory = p.category; setCategory(p.category); $("#prompt").value = p.prompt;
    currentImage = p.image; $("#result-image").src = p.image; $("#result-image").classList.remove("hidden");
    $("#empty-state").classList.add("hidden"); $("#result-tools").classList.remove("hidden"); showView("create");
  }));
  $$("[data-download]").forEach(b => b.addEventListener("click", () => {
    const p = getProjects().find(x => x.id == b.dataset.download); if (p) downloadData(p.image, `jem-design-${p.id}.png`);
  }));
  $$("[data-delete]").forEach(b => b.addEventListener("click", () => {
    setProjects(getProjects().filter(x => x.id != b.dataset.delete)); renderProjects(); toast("Project deleted.");
  }));
}
function escapeHtml(s="") { return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }
setProjects(getProjects());
