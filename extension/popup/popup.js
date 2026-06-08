const API = "http://localhost:3001";

let currentJob = { title: "", company: "", description: "", url: "" };
let applications = [];
let lastScore = null;

function scoreColor(n) {
  if (n >= 8.5) return "#15803d";
  if (n >= 7) return "#854d0e";
  return "#b91c1c";
}

function recommendBadge(rec) {
  const map = {
    "Apply Immediately": "badge-green",
    "Strong Apply": "badge-green",
    "Selective Apply": "badge-amber",
    "Low Priority": "badge-red"
  };
  return map[rec] || "badge-gray";
}

function setLoading(btnId, text) {
  const btn = document.getElementById(btnId);
  if (btn) { btn.disabled = true; btn.textContent = text; }
}

function clearLoading(btnId, text) {
  const btn = document.getElementById(btnId);
  if (btn) { btn.disabled = false; btn.textContent = text; }
}

function showError(containerId, msg) {
  document.getElementById(containerId).innerHTML = `<div class="error-msg">⚠ ${msg}</div>`;
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {}).catch(() => {});
}

function resultWithCopy(labelText, content, id) {
  return `
    <div class="result-header">
      <span class="result-label">${labelText}</span>
      <button class="btn sm" onclick="copyText(document.getElementById('${id}').innerText)">Copy</button>
    </div>
    <div class="result" id="${id}">${content}</div>`;
}

async function checkServer() {
  try {
    const r = await fetch(`${API}/health`, { signal: AbortSignal.timeout(2000) });
    if (r.ok) {
      document.getElementById("server-dot").className = "server-dot online";
      document.getElementById("server-label").textContent = "APEX Active";
    } else {
      throw new Error();
    }
  } catch (err) {
    document.getElementById("server-dot").className = "server-dot standby";
    document.getElementById("server-label").textContent = "APEX Standby";
  }
}

document.getElementById("extract-btn").addEventListener("click", async () => {
  const btn = document.getElementById("extract-btn");
  const status = document.getElementById("extract-status");
  btn.disabled = true;
  status.textContent = "Finding tab...";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error("Unable to find the active tab.");

    status.textContent = "Requesting data from page...";

    const data = await Promise.race([
      new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { action: "getJobData" }, (response) => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message || "Message failed"));
          }
          if (!response || !response.description) {
            return reject(new Error("No job data received from page."));
          }
          resolve(response);
        });
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timed out — try closing and reopening the tab.")), 8000))
    ]);

    if (data.description.length < 300) {
      throw new Error("Not enough text found on page. Try scrolling down first.");
    }

    currentJob = {
      title: data.title || "",
      company: data.company || "",
      description: data.description,
      url: data.url || tab.url || ""
    };

    document.getElementById("jd-text").value = currentJob.description;
    document.getElementById("jd-company").value = currentJob.company;
    document.getElementById("jd-title-input").value = currentJob.title;
    document.getElementById("net-company").value = currentJob.company;
    document.getElementById("detected-title").textContent = currentJob.title || "Unknown role";
    document.getElementById("detected-company").textContent = currentJob.company || "Unknown company";
    document.getElementById("job-bar").style.display = "flex";
    document.getElementById("variant-badge").textContent = "Ready to analyze";
    status.textContent = `Done — ${currentJob.description.length.toLocaleString()} characters found`;

  } catch (e) {
    status.textContent = `Error: ${e.message}`;
  } finally {
    btn.disabled = false;
  }
});

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("panel-" + tab.dataset.tab).classList.add("active");
  });
});

document.getElementById("analyze-btn").addEventListener("click", async () => {
  const jobText = document.getElementById("jd-text").value.trim() || currentJob.description;
  const company = document.getElementById("jd-company").value.trim() || currentJob.company;
  if (!jobText || jobText.length < 50) {
    showError("analyze-result", "Please extract or paste a job description first.");
    return;
  }

  setLoading("analyze-btn", "Analyzing...");
  document.getElementById("analyze-result").innerHTML = '<div class="thinking">Scoring this role against your profile...</div>';

  try {
    const r = await fetch(`${API}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobText, company, url: currentJob.url })
    });
    const json = await r.json();
    if (!json.success) throw new Error(json.error || "API error");

    const d = json.data;
    lastScore = d;
    const overall = parseFloat(d.overall) || 0;

    document.getElementById("detected-title").textContent = d.role_title || currentJob.title;
    document.getElementById("detected-company").textContent = d.company || company;
    document.getElementById("variant-badge").textContent = d.resume_variant;
    document.getElementById("variant-badge").className = "badge badge-blue";
    document.getElementById("job-bar").style.display = "flex";

    document.getElementById("analyze-result").innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;margin-top:10px;flex-wrap:wrap;">
        <span class="badge ${recommendBadge(d.recommendation)}">${d.recommendation}</span>
        <span class="badge badge-blue">${d.resume_variant}</span>
        <span style="font-size:18px;font-weight:600;color:${scoreColor(overall)}">${overall.toFixed(1)}/10</span>
      </div>
      <div class="score-grid">
        <div class="score-card"><div class="score-num" style="color:${scoreColor(d.product_fit)}">${d.product_fit}</div><div class="score-lbl">Product</div></div>
        <div class="score-card"><div class="score-num" style="color:${scoreColor(d.ai_fit)}">${d.ai_fit}</div><div class="score-lbl">AI</div></div>
        <div class="score-card"><div class="score-num" style="color:${scoreColor(d.leadership_fit)}">${d.leadership_fit}</div><div class="score-lbl">Leadership</div></div>
        <div class="score-card"><div class="score-num" style="color:${scoreColor(d.growth_fit)}">${d.growth_fit}</div><div class="score-lbl">Growth</div></div>
        <div class="score-card"><div class="score-num" style="color:${scoreColor(d.compensation_fit)}">${d.compensation_fit}</div><div class="score-lbl">Comp</div></div>
      </div>
      <div class="summary-box">${d.summary || ""}</div>
      <div class="strengths-gaps">
        <div class="sg-box">
          <div class="sg-title green-title">Your strengths</div>
          ${(d.avichal_strengths || []).map(s => `<div class="sg-item">✓ ${s}</div>`).join("")}
        </div>
        <div class="sg-box">
          <div class="sg-title amber-title">Watch-outs</div>
          ${(d.gaps || []).map(g => `<div class="sg-item">△ ${g}</div>`).join("")}
        </div>
      </div>
      <div style="font-size:10px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:.03em;margin:6px 0 4px;">Key requirements</div>
      <div class="chips">${(d.key_requirements || []).map(r => `<span class="chip">${r}</span>`).join("")}</div>
      <div class="actions">
        <button class="btn sm" onclick="goToTab('resume')">→ Resume</button>
        <button class="btn sm" onclick="goToTab('cover')">→ Cover letter</button>
        <button class="btn sm" onclick="saveCurrentJob()">+ Save to tracker</button>
      </div>`;

  } catch (e) {
    showError("analyze-result", e.message.includes("Failed to fetch") ? "Backend not running. Run: npm run dev" : e.message);
  }

  clearLoading("analyze-btn", "Analyze & Score ↗");
});

document.getElementById("resume-btn").addEventListener("click", async () => {
  const jobText = document.getElementById("jd-text").value.trim() || currentJob.description;
  if (!jobText) { showError("resume-result", "Extract or paste a job description first."); return; }

  setLoading("resume-btn", "Generating...");
  document.getElementById("resume-result").innerHTML = '<div class="thinking">Tailoring your resume bullets...</div>';

  try {
    const r = await fetch(`${API}/resume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobText,
        company: currentJob.company,
        variant: document.getElementById("resume-variant").value,
        focus: document.getElementById("resume-focus").value.trim()
      })
    });
    const json = await r.json();
    if (!json.success) throw new Error(json.error);
    const id = "resume-out-" + Date.now();
    document.getElementById("resume-result").innerHTML = resultWithCopy("Tailored resume bullets", json.content, id);
  } catch (e) {
    showError("resume-result", e.message.includes("Failed to fetch") ? "Backend not running." : e.message);
  }

  clearLoading("resume-btn", "Generate Resume Bullets ↗");
});

document.getElementById("cover-btn").addEventListener("click", async () => {
  const jobText = document.getElementById("jd-text").value.trim() || currentJob.description;
  if (!jobText) { showError("cover-result", "Extract or paste a job description first."); return; }

  setLoading("cover-btn", "Writing...");
  document.getElementById("cover-result").innerHTML = '<div class="thinking">Crafting your cover letter...</div>';

  try {
    const r = await fetch(`${API}/cover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobText,
        company: currentJob.company,
        angle: document.getElementById("cover-angle").value.trim()
      })
    });
    const json = await r.json();
    if (!json.success) throw new Error(json.error);
    const id = "cover-out-" + Date.now();
    document.getElementById("cover-result").innerHTML = resultWithCopy("Cover letter", json.content, id);
  } catch (e) {
    showError("cover-result", e.message.includes("Failed to fetch") ? "Backend not running." : e.message);
  }

  clearLoading("cover-btn", "Generate Cover Letter ↗");
});

document.getElementById("network-btn").addEventListener("click", async () => {
  setLoading("network-btn", "Writing...");
  document.getElementById("network-result").innerHTML = '<div class="thinking">Writing your outreach...</div>';

  try {
    const r = await fetch(`${API}/network`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetRole: document.getElementById("net-role").value.trim(),
        company: document.getElementById("net-company").value.trim() || currentJob.company,
        context: document.getElementById("net-context").value.trim(),
        goal: document.getElementById("net-goal").value
      })
    });
    const json = await r.json();
    if (!json.success) throw new Error(json.error);
    const id = "network-out-" + Date.now();
    document.getElementById("network-result").innerHTML = resultWithCopy("Outreach messages", json.content, id);
  } catch (e) {
    showError("network-result", e.message.includes("Failed to fetch") ? "Backend not running." : e.message);
  }

  clearLoading("network-btn", "Write Outreach Message ↗");
});

function saveCurrentJob() {
  const title = lastScore?.role_title || currentJob.title || "Unknown role";
  const company = lastScore?.company || currentJob.company || "Unknown company";
  const score = lastScore?.overall || null;
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  applications.unshift({ title, company, score, status: "Applied", date: today, url: currentJob.url });
  saveTracker();
  goToTab("tracker");
}

document.getElementById("save-current-btn").addEventListener("click", saveCurrentJob);

function loadTracker() {
  chrome.storage.local.get("applications", (data) => {
    applications = data.applications || [];
    renderTracker();
  });
}

function saveTracker() {
  chrome.storage.local.set({ applications });
  renderTracker();
}

function renderTracker() {
  const list = document.getElementById("tracker-list");
  document.getElementById("tracker-count").textContent = applications.length + " application" + (applications.length === 1 ? "" : "s");
  if (!applications.length) {
    list.innerHTML = '<div class="tracker-empty">No applications yet.<br>Analyze a job and save it here.</div>';
    return;
  }
  list.innerHTML = applications.map((a, i) => `
    <div class="tracker-item">
      <div>
        <div style="font-weight:600;font-size:12px;">${a.company}</div>
        <div style="font-size:11px;color:#666;">${a.title} · ${a.date}</div>
      </div>
      <select class="status-select" onchange="updateStatus(${i}, this.value)">
        ${["Applied","Interview","Offer","Rejected"].map(s => `<option ${a.status === s ? "selected" : ""}>${s}</option>`).join("")}
      </select>
      <button class="btn sm" onclick="removeApp(${i})">✕</button>
    </div>`).join("");
}

function updateStatus(i, val) { applications[i].status = val; saveTracker(); }
function removeApp(i) { applications.splice(i, 1); saveTracker(); }

function goToTab(name) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === "panel-" + name));
}

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    goToTab(tab.dataset.tab);
    if (tab.dataset.tab === "autofill") {
      const coverField = document.getElementById("autofill-cover");
      const coverResult = document.getElementById("cover-result");
      if (coverField && coverResult && !coverField.value.trim() && coverResult.innerText.trim().length > 100) {
        coverField.value = coverResult.innerText.trim();
      }
    }
  });
});

document.getElementById("autofill-btn").addEventListener("click", async () => {
  const btn = document.getElementById("autofill-btn");
  const status = document.getElementById("autofill-status");
  const detail = document.getElementById("autofill-detail");
  btn.disabled = true;
  status.textContent = "Running autofill...";
  detail.innerHTML = "";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error("Unable to find the active tab.");

    const coverLetter = document.getElementById("autofill-cover").value.trim();
    const whyText = document.getElementById("autofill-why").value.trim();

    const result = await Promise.race([
      new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { action: "runAutofill", coverLetter, whyText }, (response) => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message || "Message failed"));
          }
          resolve(response);
        });
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timed out waiting for autofill response.")), 10000))
    ]);

    if (!result || typeof result.filled !== "number") {
      throw new Error("No autofill result returned from the page.");
    }

    const filledText = `✓ Filled ${result.filled} field${result.filled === 1 ? "" : "s"}`;
    const skippedText = result.skipped > 0 ? ` · ${result.skipped} need manual input` : "";
    status.innerHTML = `<span style=\"color:#15803d;\">${filledText}</span><span style=\"color:#b45309;\">${skippedText}</span>`;

    const filledItems = result.filledFields?.map(item => `<div>✓ ${item}</div>`).join("") || "";
    const skippedItems = result.skippedFields?.map(item => `<div>△ ${item}</div>`).join("") || "";
    detail.innerHTML = `<div class="filled">${filledItems || "No fields filled."}</div><div class="skipped">${skippedItems || "No fields skipped."}</div>`;
  } catch (e) {
    status.innerHTML = `<span style=\"color:#b91c1c;\">${e.message}</span>`;
  } finally {
    btn.disabled = false;
  }
});

checkServer();
loadTracker();