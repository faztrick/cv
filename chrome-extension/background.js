// CV Auto-Apply Extension - Background Service Worker

const NOTIFICATION_ID = 'cv-autoapply-notification';

// Extension installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('CV Auto-Apply Assistant installed');

  // Create context menu
  chrome.contextMenus.create({
    id: 'cv-autoapply-fill',
    title: 'Auto-Fill with CV Data',
    contexts: ['page', 'editable']
  });

  chrome.contextMenus.create({
    id: 'cv-autoapply-highlight',
    title: 'Highlight Form Fields',
    contexts: ['page']
  });

  chrome.contextMenus.create({
    id: 'cv-autoapply-save',
    title: 'Save This Job',
    contexts: ['page']
  });
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  const cvData = await getCVData();

  switch (info.menuItemId) {
    case 'cv-autoapply-fill':
      chrome.tabs.sendMessage(tab.id, { action: 'autoFill', cvData });
      break;
    case 'cv-autoapply-highlight':
      chrome.tabs.sendMessage(tab.id, { action: 'highlight' });
      break;
    case 'cv-autoapply-save':
      chrome.tabs.sendMessage(tab.id, { action: 'saveJob' });
      break;
  }
});

// Get CV data from storage
async function getCVData() {
  const result = await chrome.storage.session.get(['cvAutoApply_cvData']);
  return result.cvAutoApply_cvData;
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'easyApplyDetected' || message.type === 'indeedApplyDetected') {
    showNotification(
      'Quick Apply Available!',
      `${message.job.title} at ${message.job.company}`,
      sender.tab?.id
    );
  }

  if (message.type === 'applicationSubmitted') {
    // Track application
    trackApplication(message.job);
  }

  return true;
});

// Show notification
async function showNotification(title, message, tabId) {
  const options = await chrome.storage.local.get(['cvAutoApply_options']);
  if (options.cvAutoApply_options?.notify === false) return;

  chrome.notifications.create(NOTIFICATION_ID, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message,
    buttons: [
      { title: 'Auto-Fill' },
      { title: 'Dismiss' }
    ],
    requireInteraction: true
  });

  // Store tab ID for button click
  await chrome.storage.local.set({ lastNotificationTabId: tabId });
}

// Notification button click
chrome.notifications.onButtonClicked.addListener(async (notifId, btnIdx) => {
  if (notifId !== NOTIFICATION_ID) return;

  if (btnIdx === 0) { // Auto-Fill
    const result = {
      ...(await chrome.storage.local.get(['lastNotificationTabId'])),
      ...(await chrome.storage.session.get(['cvAutoApply_cvData']))
    };
    if (result.lastNotificationTabId) {
      chrome.tabs.sendMessage(result.lastNotificationTabId, {
        action: 'autoFill',
        cvData: result.cvAutoApply_cvData
      });
    }
  }

  chrome.notifications.clear(notifId);
});

// Track application to server
async function trackApplication(job) {
  try {
    const serverUrl = (await chrome.storage.local.get(['cvAutoApply_serverUrl'])).cvAutoApply_serverUrl || 'http://localhost:3000';

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
  } catch (err) {
    console.error('Failed to track application:', err);
  }
}

// Keyboard shortcut commands
chrome.commands?.onCommand?.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  const cvData = await getCVData();

  switch (command) {
    case 'auto-fill':
      chrome.tabs.sendMessage(tab.id, { action: 'autoFill', cvData });
      break;
    case 'quick-apply':
      chrome.tabs.sendMessage(tab.id, { action: 'autoFill', cvData });
      break;
  }
});

// Tab update listener - detect job pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;

  const jobSites = [
    'indeed.com',
    'linkedin.com/jobs',
    'bayt.com',
    'gulftalent.com',
    'naukrigulf.com',
    'dubizzle.com',
    'myworkdayjobs.com',
    'workday.com',
    'taleo.net',
    'oraclecloud.com'
  ];
  const isJobSite = jobSites.some(site => tab.url?.includes(site));

  if (isJobSite) {
    // Update badge to show extension is active
    chrome.action.setBadgeText({ text: '✓', tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981', tabId });
  } else {
    chrome.action.setBadgeText({ text: '', tabId });
  }
});
