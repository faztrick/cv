// CV Auto-Apply Extension - Popup Script

const SERVER_URL_KEY = 'cvAutoApply_serverUrl';
const CV_DATA_KEY = 'cvAutoApply_cvData';
const STATS_KEY = 'cvAutoApply_stats';
const LOG_KEY = 'cvAutoApply_log';
const OPTIONS_KEY = 'cvAutoApply_options';

let serverUrl = 'http://localhost:3000';
let cvData = null;

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
  document.querySelectorAll('.quick-link').forEach(link => {
    link.addEventListener('click', () => {
      chrome.tabs.create({ url: link.dataset.url });
    });
  });
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

  document.getElementById('currentPlatform').textContent = platform;

  // Try to get job info if on a job page
  if (platform !== 'Unknown') {
    chrome.tabs.sendMessage(tab.id, { action: 'getJobInfo' }, (response) => {
      if (response && response.job) {
        displayJobInfo(response.job);
      }
    });
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
    await fetch(`${serverUrl}/api/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: job.company,
        jobTitle: job.title,
        type: 'Job Board',
        status: 'Applied',
        source: job.platform,
        jobUrl: job.url,
        location: job.location,
        appliedDate: new Date().toISOString()
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
