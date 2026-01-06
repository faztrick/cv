// CV Auto-Apply Extension - Popup Script

const SERVER_URL_KEY = 'cvAutoApply_serverUrl';
const CV_DATA_KEY = 'cvAutoApply_cvData';
const STATS_KEY = 'cvAutoApply_stats';
const LOG_KEY = 'cvAutoApply_log';
const OPTIONS_KEY = 'cvAutoApply_options';

let serverUrl = 'http://localhost:3000';
let cvData = null;

const QUICK_PACKS = {
  portals: [
    { label: 'Indeed UAE', url: 'https://ae.indeed.com/jobs?q=software+engineer&l=Dubai' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?location=Dubai' },
    { label: 'Bayt', url: 'https://www.bayt.com/en/uae/jobs/software-engineer-jobs/' },
    { label: 'GulfTalent', url: 'https://www.gulftalent.com/jobs/software-engineer' },
    { label: 'NaukriGulf', url: 'https://www.naukrigulf.com/software-engineer-jobs' },
    { label: 'Dubizzle Jobs', url: 'https://dubai.dubizzle.com/jobs/' },
    { label: 'Glassdoor (Dubai)', url: 'https://www.glassdoor.com/Job/dubai-software-engineer-jobs-SRCH_IL.0,5_IC2204498_KO6,23.htm' },
    { label: 'Talent.com (Dubai)', url: 'https://www.talent.com/jobs?k=software+engineer&l=Dubai' },
    { label: 'DrJobs (Dubai)', url: 'https://www.drjobs.ae/jobs/software-engineer-jobs-in-dubai' },
    { label: 'Careerjet (UAE)', url: 'https://www.careerjet.ae/search/jobs?s=software+engineer&l=Dubai' },
    { label: 'Jora (Dubai)', url: 'https://ae.jora.com/j?query=software%20engineer&l=Dubai' },
    { label: 'Google Jobs', url: 'https://www.google.com/search?q=software+engineer+jobs+Dubai' }
  ],
  directCareers: [
    { label: 'Lulu', url: 'https://careers.lulugroupinternational.com/' },
    { label: 'Spinneys', url: 'https://spinneyscareers.com/' },
    { label: 'Union Coop', url: 'https://unioncoop.ae/careers' },
    { label: 'Choithrams', url: 'https://choithrams.com/careers' },
    { label: 'Nesto', url: 'https://www.nestosouq.com/careers' },
    { label: 'West Zone', url: 'https://www.westzone.com/careers' },
    { label: 'Al-Futtaim', url: 'https://www.afuturewithus.com/' },
    { label: 'ENOC', url: 'https://careers.enoc.com/' },
    { label: 'Dubai Duty Free', url: 'https://www.dubaidutyfree.com/' },
    { label: 'Apparel Group', url: 'https://apparelgroupcareers.com/' }
  ]
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await checkServerConnection();
  await loadCVData();
  await loadStats();
  setupEventListeners();
  detectCurrentPlatform();
  loadActivityLog();
});

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
  });
});

// Setup event listeners
function setupEventListeners() {
  // Auto-Fill buttons
  document.getElementById('btnAutoFill').addEventListener('click', () => executeAction('autoFill'));
  document.getElementById('btnAutoFillSubmit').addEventListener('click', () => executeAction('autoFillSubmit'));
  document.getElementById('btnHighlightFields').addEventListener('click', () => executeAction('highlight'));

  // Apply buttons
  document.getElementById('btnApplyNow').addEventListener('click', () => executeAction('apply'));
  document.getElementById('btnSaveJob').addEventListener('click', () => executeAction('saveJob'));
  document.getElementById('btnAddToTracker').addEventListener('click', () => executeAction('addToTracker'));

  // Settings buttons
  document.getElementById('btnTestConnection').addEventListener('click', checkServerConnection);
  document.getElementById('btnSyncCV').addEventListener('click', loadCVData);
  document.getElementById('btnExportLog').addEventListener('click', exportLog);
  document.getElementById('btnClearData').addEventListener('click', clearAllData);

  // Follow-ups
  const btnLoadFollowupsAll = document.getElementById('btnLoadFollowupsAll');
  if (btnLoadFollowupsAll) {
    btnLoadFollowupsAll.addEventListener('click', () => loadFollowups());
  }
  const btnLoadFollowupsIndeed = document.getElementById('btnLoadFollowupsIndeed');
  if (btnLoadFollowupsIndeed) {
    btnLoadFollowupsIndeed.addEventListener('click', () => loadFollowups('Indeed'));
  }
  const btnBackfillIndeed = document.getElementById('btnBackfillIndeed');
  if (btnBackfillIndeed) {
    btnBackfillIndeed.addEventListener('click', () => backfillFollowups('Indeed'));
  }

  // Server URL change
  document.getElementById('serverUrl').addEventListener('change', async (e) => {
    serverUrl = e.target.value;
    await chrome.storage.local.set({ [SERVER_URL_KEY]: serverUrl });
    checkServerConnection();
  });

  // Options checkboxes
  ['optAutoResume', 'optAutoCover', 'optSkipApplied', 'optNotify'].forEach(id => {
    document.getElementById(id).addEventListener('change', saveOptions);
  });

  // Quick links
  document.querySelectorAll('.quick-link[data-url]').forEach(link => {
    link.addEventListener('click', () => {
      const url = link.dataset.url;
      if (!url) {
        addLog('Quick link missing URL', 'error');
        return;
      }
      chrome.tabs.create({ url });
      addLog(`Opened: ${link.textContent || url}`);
    });
  });

  // One-click packs
  const btnOpenPortalsPack = document.getElementById('btnOpenPortalsPack');
  if (btnOpenPortalsPack) {
    btnOpenPortalsPack.addEventListener('click', () => openQuickPack('portals'));
  }
  const btnOpenDirectPack = document.getElementById('btnOpenDirectPack');
  if (btnOpenDirectPack) {
    btnOpenDirectPack.addEventListener('click', () => openQuickPack('directCareers'));
  }
}

async function loadFollowups(source) {
  const listEl = document.getElementById('followupsList');
  if (!listEl) return;

  const connected = await checkServerConnection();
  if (!connected) {
    listEl.textContent = 'Panel is disconnected. Start the panel server (port 3000) and try again.';
    addLog('Cannot load follow-ups: panel disconnected', 'error');
    return;
  }

  try {
    const qs = source ? `?source=${encodeURIComponent(source)}` : '';
    const res = await fetch(`${serverUrl}/api/companies/followups${qs}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) {
      throw new Error(`Followups request failed (${res.status})`);
    }
    const followups = await res.json();
    renderFollowups(followups, source);
    addLog(`Loaded follow-ups${source ? ` (${source})` : ''}: ${followups.length}`);
  } catch (err) {
    listEl.textContent = `Failed to load follow-ups: ${err.message}`;
    addLog(`Failed to load follow-ups: ${err.message}`, 'error');
  }
}

function renderFollowups(followups, source) {
  const listEl = document.getElementById('followupsList');
  if (!listEl) return;

  if (!Array.isArray(followups) || followups.length === 0) {
    listEl.textContent = source ? `No follow-ups due for ${source}.` : 'No follow-ups due.';
    return;
  }

  listEl.innerHTML = followups.map(c => {
    const title = escapeHtml(c?.jobTitle || 'Job');
    const name = escapeHtml(c?.name || 'Company');
    const due = escapeHtml(c?.followUpDate || '-');
    const openUrl = c?.jobUrl || c?.careersUrl || '';
    const hasEmail = Boolean(c?.email);

    return `
      <div style="display:flex; justify-content:space-between; gap:8px; padding:8px; border-radius:8px; background:#ffffff; border:1px solid #e2e8f0; margin-bottom:8px;">
        <div style="min-width:0;">
          <div style="font-weight:600; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${name}</div>
          <div style="color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</div>
          <div style="color:#f59e0b; font-size:10px; margin-top:2px;">Due: ${due}</div>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
          <button class="quick-link" data-followup-open="${escapeAttr(openUrl)}" data-followup-id="${escapeAttr(String(c?.id || ''))}">Open</button>
          ${hasEmail ? `<button class="quick-link" data-followup-email="${escapeAttr(String(c?.id || ''))}">Email</button>` : ''}
          <button class="quick-link" data-followup-done="${escapeAttr(String(c?.id || ''))}">Done</button>
        </div>
      </div>
    `;
  }).join('');

  // Bind buttons after render
  listEl.querySelectorAll('[data-followup-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-followup-open');
      if (!url) {
        addLog('No URL for this follow-up (jobUrl/careersUrl missing)', 'warning');
        return;
      }
      chrome.tabs.create({ url });
      addLog('Opened follow-up target');
    });
  });

  listEl.querySelectorAll('[data-followup-email]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-followup-email');
      if (!id) return;
      await openOutlookFollowUp(id);
    });
  });

  listEl.querySelectorAll('[data-followup-done]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-followup-done');
      if (!id) return;
      await markFollowUpSent(id);
      // Refresh list after marking
      await loadFollowups(source);
    });
  });
}

async function markFollowUpSent(id) {
  try {
    const res = await fetch(`${serverUrl}/api/companies/${encodeURIComponent(id)}/followup`, { method: 'POST' });
    if (!res.ok) {
      throw new Error(`Mark follow-up failed (${res.status})`);
    }
    addLog(`Marked follow-up sent: ${id}`);
  } catch (err) {
    addLog(`Failed to mark follow-up: ${err.message}`, 'error');
  }
}

async function backfillFollowups(source) {
  const listEl = document.getElementById('followupsList');
  if (!listEl) return;
  try {
    const connected = await checkServerConnection();
    if (!connected) {
      addLog('Cannot backfill: panel disconnected', 'error');
      return;
    }

    const res = await fetch(`${serverUrl}/api/companies/backfill-followups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source })
    });
    if (!res.ok) {
      throw new Error(`Backfill failed (${res.status})`);
    }
    const result = await res.json();
    addLog(`Backfill done${source ? ` (${source})` : ''}: updated ${result.updated || 0}`);
    await loadFollowups(source);
  } catch (err) {
    addLog(`Backfill failed: ${err.message}`, 'error');
    listEl.textContent = `Backfill failed: ${err.message}`;
  }
}

async function openOutlookFollowUp(id) {
  try {
    const res = await fetch(`${serverUrl}/api/outlook/compose/${encodeURIComponent(id)}?type=followup`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) {
      throw new Error(`Outlook compose failed (${res.status})`);
    }
    const data = await res.json();
    if (data?.url) {
      chrome.tabs.create({ url: data.url });
      addLog('Opened Outlook follow-up compose');
    } else {
      addLog('Outlook compose URL missing', 'error');
    }
  } catch (err) {
    addLog(`Failed to open Outlook compose: ${err.message}`, 'error');
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  // Attribute-safe encoding for inline HTML attributes.
  return escapeHtml(str).replace(/\r?\n/g, ' ');
}

async function openQuickPack(packName) {
  const pack = QUICK_PACKS[packName];
  if (!pack || !Array.isArray(pack) || pack.length === 0) {
    addLog(`Pack not found: ${packName}`, 'error');
    return;
  }

  addLog(`Opening pack: ${packName} (${pack.length} tabs)`, 'warning');
  for (const item of pack) {
    if (!item?.url) continue;
    chrome.tabs.create({ url: item.url });
  }
}

// Load settings from storage
async function loadSettings() {
  const result = await chrome.storage.local.get([SERVER_URL_KEY, OPTIONS_KEY]);

  if (result[SERVER_URL_KEY]) {
    serverUrl = result[SERVER_URL_KEY];
    document.getElementById('serverUrl').value = serverUrl;
  }

  if (result[OPTIONS_KEY]) {
    const opts = result[OPTIONS_KEY];
    if (opts.autoResume !== undefined) document.getElementById('optAutoResume').checked = opts.autoResume;
    if (opts.autoCover !== undefined) document.getElementById('optAutoCover').checked = opts.autoCover;
    if (opts.skipApplied !== undefined) document.getElementById('optSkipApplied').checked = opts.skipApplied;
    if (opts.notify !== undefined) document.getElementById('optNotify').checked = opts.notify;
  }
}

// Save options
async function saveOptions() {
  const options = {
    autoResume: document.getElementById('optAutoResume').checked,
    autoCover: document.getElementById('optAutoCover').checked,
    skipApplied: document.getElementById('optSkipApplied').checked,
    notify: document.getElementById('optNotify').checked
  };
  await chrome.storage.local.set({ [OPTIONS_KEY]: options });
  addLog('Settings saved');
}

// Check server connection
async function checkServerConnection() {
  const statusDot = document.getElementById('serverStatus');
  const statusText = document.getElementById('serverStatusText');

  try {
    const response = await fetch(`${serverUrl}/api/cv`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      statusDot.classList.remove('disconnected');
      statusDot.classList.add('connected');
      statusText.textContent = 'Connected';
      return true;
    }
  } catch (err) {
    console.error('Server connection error:', err);
  }

  statusDot.classList.remove('connected');
  statusDot.classList.add('disconnected');
  statusText.textContent = 'Disconnected';
  return false;
}

// Load CV data from server
async function loadCVData() {
  try {
    const response = await fetch(`${serverUrl}/api/cv`);
    if (response.ok) {
      cvData = await response.json();
      await chrome.storage.local.set({ [CV_DATA_KEY]: cvData });
      displayCVPreview();
      addLog('CV data synced');
    }
  } catch (err) {
    // Try loading from storage
    const result = await chrome.storage.local.get([CV_DATA_KEY]);
    if (result[CV_DATA_KEY]) {
      cvData = result[CV_DATA_KEY];
      displayCVPreview();
    }
  }
}

// Display CV preview
function displayCVPreview() {
  const preview = document.getElementById('cvPreview');
  if (cvData && cvData.personalInfo) {
    preview.innerHTML = `
      <strong>${cvData.personalInfo.name || 'N/A'}</strong><br>
      ${cvData.personalInfo.title || ''}<br>
      📧 ${cvData.personalInfo.email || ''}<br>
      📱 ${cvData.personalInfo.phone || ''}
    `;
  } else {
    preview.textContent = 'No CV data available. Click "Sync CV" in Settings.';
  }
}

// Load stats
async function loadStats() {
  const result = await chrome.storage.local.get([STATS_KEY]);
  const stats = result[STATS_KEY] || { applied: 0, viewed: 0, saved: 0 };

  document.getElementById('statApplied').textContent = stats.applied;
  document.getElementById('statViewed').textContent = stats.viewed;
  document.getElementById('statSaved').textContent = stats.saved;
}

// Update stats
async function updateStats(type) {
  const result = await chrome.storage.local.get([STATS_KEY]);
  const stats = result[STATS_KEY] || { applied: 0, viewed: 0, saved: 0 };

  if (stats[type] !== undefined) {
    stats[type]++;
  }

  await chrome.storage.local.set({ [STATS_KEY]: stats });
  loadStats();
}

// Detect current platform
async function detectCurrentPlatform() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || '';

  let platform = 'Unknown';
  if (url.includes('indeed.com')) platform = 'Indeed';
  else if (url.includes('linkedin.com')) platform = 'LinkedIn';
  else if (url.includes('bayt.com')) platform = 'Bayt';
  else if (url.includes('gulftalent.com')) platform = 'GulfTalent';
  else if (url.includes('naukrigulf.com')) platform = 'NaukriGulf';
  else if (url.includes('dubizzle.com')) platform = 'Dubizzle';
  else if (url.includes('myworkdayjobs.com') || url.includes('workday.com')) platform = 'Workday (ATS)';
  else if (url.includes('taleo.net')) platform = 'Taleo (ATS)';
  else if (url.includes('oraclecloud.com')) platform = 'Oracle HCM (ATS)';

  document.getElementById('currentPlatform').textContent = platform;

  // Try to get job info from the content script whenever possible.
  // (On pages where the content script isn't injected, this will simply no-op.)
  try {
    chrome.tabs.sendMessage(tab.id, { action: 'getJobInfo' }, (response) => {
      if (chrome.runtime.lastError) {
        // No listener on this page
        return;
      }
      if (response && response.job) {
        displayJobInfo(response.job);
      }
    });
  } catch {
    // ignore
  }
}

// Display job info
function displayJobInfo(job) {
  const jobDiv = document.getElementById('currentJob');
  jobDiv.innerHTML = `
    <strong>${job.title || 'Unknown Title'}</strong><br>
    🏢 ${job.company || 'Unknown Company'}<br>
    📍 ${job.location || 'Unknown Location'}<br>
    ${job.salary ? `💰 ${job.salary}` : ''}
  `;
}

// Execute action on current tab
async function executeAction(action) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    addLog('No active tab', 'error');
    return;
  }

  const options = {
    autoResume: document.getElementById('optAutoResume').checked,
    autoCover: document.getElementById('optAutoCover').checked
  };

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      action,
      cvData,
      options
    });

    if (response?.success) {
      addLog(`${action} completed: ${response.message || 'Success'}`);

      if (action === 'apply' || action === 'autoFillSubmit') {
        updateStats('applied');
      } else if (action === 'saveJob') {
        updateStats('saved');
      }

      // Send to server for tracking
      if (response.job && (action === 'apply' || action === 'addToTracker')) {
        trackApplication(response.job);
      }
    } else {
      addLog(`${action} failed: ${response?.error || 'Unknown error'}`, 'error');
    }
  } catch (err) {
    addLog(`Error: ${err.message}`, 'error');
  }
}

// Track application to server
async function trackApplication(job) {
  try {
    const appliedDate = new Date().toISOString();
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 7);

    const platform = String(job?.platform || '').toLowerCase();
    const isAts = ['workday', 'taleo', 'oraclehcm'].includes(platform);

    await fetch(`${serverUrl}/api/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: job.company,
        jobTitle: job.title,
        type: isAts ? 'Direct / ATS' : 'Job Board',
        status: 'Applied',
        source: job.platform,
        jobUrl: job.url,
        location: job.location,
        appliedDate,
        followUpDate: followUpDate.toISOString().split('T')[0]
      })
    });
    addLog(`Tracked: ${job.company}`);
  } catch (err) {
    console.error('Track error:', err);
  }
}

// Activity log functions
function addLog(message, type = 'info') {
  const logContainer = document.getElementById('activityLog');
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logContainer.insertBefore(entry, logContainer.firstChild);

  // Keep only last 50 entries
  while (logContainer.children.length > 50) {
    logContainer.removeChild(logContainer.lastChild);
  }

  // Save to storage
  saveLog();
}

async function saveLog() {
  const logContainer = document.getElementById('activityLog');
  const entries = Array.from(logContainer.children).map(e => ({
    text: e.textContent,
    type: e.classList.contains('error') ? 'error' : e.classList.contains('warning') ? 'warning' : 'info'
  }));
  await chrome.storage.local.set({ [LOG_KEY]: entries });
}

async function loadActivityLog() {
  const result = await chrome.storage.local.get([LOG_KEY]);
  if (result[LOG_KEY]) {
    const logContainer = document.getElementById('activityLog');
    logContainer.innerHTML = '';
    result[LOG_KEY].forEach(entry => {
      const div = document.createElement('div');
      div.className = `log-entry ${entry.type}`;
      div.textContent = entry.text;
      logContainer.appendChild(div);
    });
  }
}

function exportLog() {
  const logContainer = document.getElementById('activityLog');
  const text = Array.from(logContainer.children).map(e => e.textContent).join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  chrome.downloads.download({
    url: url,
    filename: `cv-autoapply-log-${new Date().toISOString().split('T')[0]}.txt`
  });

  addLog('Log exported');
}

async function clearAllData() {
  if (confirm('Clear all extension data?')) {
    await chrome.storage.local.clear();
    addLog('All data cleared');
    location.reload();
  }
}
