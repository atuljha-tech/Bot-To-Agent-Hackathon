'use strict';

const API = 'http://localhost:5000/api';
const APP = 'http://localhost:3000';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUserId() {
  return new Promise(resolve =>
    chrome.storage.local.get(['userId'], r => resolve(r.userId || null))
  );
}

function fmtTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m < 60 ? `${m}m ${s}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

// ─── Category styling ─────────────────────────────────────────────────────────

const CAT_CONFIG = {
  productive:  { label: '✅ Productive',  cls: 'cat-productive'  },
  distracting: { label: '⚠️ Distracting', cls: 'cat-distracting' },
  neutral:     { label: '○ Neutral',      cls: 'cat-neutral'     },
  sensitive:   { label: '🔒 Sensitive',   cls: 'cat-sensitive'   },
};

function applyCategory(category, scores) {
  const badge = document.getElementById('categoryBadge');
  const cfg   = CAT_CONFIG[category] || { label: '— Unknown', cls: 'cat-unknown' };

  badge.textContent = cfg.label;
  badge.className   = `category-badge ${cfg.cls}`;

  // Score bars
  const prod = scores?.productive ?? 0;
  const dist = scores?.distract   ?? 0;
  const neut = scores?.neutral    ?? 0;

  document.getElementById('prodBar').style.width = `${prod}%`;
  document.getElementById('distBar').style.width = `${dist}%`;
  document.getElementById('neutBar').style.width = `${neut}%`;
  document.getElementById('prodNum').textContent = `${prod}%`;
  document.getElementById('distNum').textContent = `${dist}%`;
  document.getElementById('neutNum').textContent = `${neut}%`;

  // Sensitive banner
  const banner = document.getElementById('sensitive-warning');
  const card   = document.getElementById('site-card');
  if (category === 'sensitive') {
    banner.classList.remove('hidden');
    card.style.opacity = '0.4';
  } else {
    banner.classList.add('hidden');
    card.style.opacity = '1';
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {

  const setupSection     = document.getElementById('setup-section');
  const connectedSection = document.getElementById('connected-section');
  const userIdInput      = document.getElementById('userIdInput');
  const connectBtn       = document.getElementById('connectBtn');
  const loadingState     = document.getElementById('loading-state');
  const userMetrics      = document.getElementById('user-metrics');
  const scoreEl          = document.getElementById('scoreEl');
  const goalsEl          = document.getElementById('goalsEl');
  const siteNameEl       = document.getElementById('siteNameEl');
  const sessionTimerEl   = document.getElementById('sessionTimer');

  // ── Check stored connection ──────────────────────────────────────────────
  const userId = await getUserId();
  if (userId) {
    showConnected();
    fetchUserData(userId);
  } else {
    showSetup();
  }

  // ── Get current tab info ─────────────────────────────────────────────────
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url?.startsWith('http')) {
      const hostname = new URL(tab.url).hostname.replace(/^www\./, '');
      siteNameEl.textContent = hostname;

      // Ask content script for its analysis
      chrome.tabs.sendMessage(tab.id, { action: 'getPageAnalysis' }, (resp) => {
        if (chrome.runtime.lastError || !resp) {
          // Content script not ready — ask background for cached category
          chrome.runtime.sendMessage({ action: 'getCurrentActivity' }, (bgResp) => {
            if (bgResp) {
              applyCategory(bgResp.category || 'neutral', null);
              updateTimer(bgResp.elapsed || 0);
            }
          });
          return;
        }
        const { analysis, activeSeconds } = resp;
        if (analysis) {
          applyCategory(analysis.category, {
            productive: analysis.productiveScore,
            distract:   analysis.distractScore,
            neutral:    analysis.neutralScore,
          });
        }
        updateTimer(activeSeconds || 0);
      });
    } else {
      siteNameEl.textContent = 'Non-web page';
      applyCategory('neutral', null);
    }
  } catch (e) {
    siteNameEl.textContent = 'Unknown';
  }

  // ── Live session timer ───────────────────────────────────────────────────
  let timerBase = 0;
  let timerInterval = null;

  function updateTimer(initialSeconds) {
    timerBase = initialSeconds;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timerBase++;
      sessionTimerEl.textContent = fmtTime(timerBase);
    }, 1000);
    sessionTimerEl.textContent = fmtTime(timerBase);
  }

  // ── Fetch user data ──────────────────────────────────────────────────────
  async function fetchUserData(id) {
    loadingState.classList.remove('hidden');
    userMetrics.classList.add('hidden');
    try {
      const res  = await fetch(`${API}/get-user/${id}`);
      const data = await res.json();
      if (!data.success) throw new Error('not found');

      const score = data.user.productivityScore ?? 0;
      scoreEl.textContent = `${score}/100`;
      scoreEl.style.color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
      goalsEl.textContent = data.user.goals?.length ?? 0;

      loadingState.classList.add('hidden');
      userMetrics.classList.remove('hidden');
    } catch {
      loadingState.innerHTML = '<span style="color:#f87171;">⚠️ Could not reach server</span>';
    }
  }

  // ── Connect ──────────────────────────────────────────────────────────────
  connectBtn.addEventListener('click', async () => {
    const id = userIdInput.value.trim();
    if (!id) { userIdInput.focus(); return; }

    connectBtn.innerHTML = '<span class="spinner"></span>Connecting…';
    connectBtn.disabled  = true;

    try {
      const res  = await fetch(`${API}/get-user/${id}`);
      const data = await res.json();
      if (!data.success) throw new Error('User not found');

      await chrome.runtime.sendMessage({ action: 'setUserId', userId: id });
      showConnected();
      fetchUserData(id);
    } catch {
      connectBtn.innerHTML = 'Connect Account';
      connectBtn.disabled  = false;
      userIdInput.style.borderColor = '#ef4444';
      userIdInput.style.boxShadow   = '0 0 0 3px rgba(239,68,68,0.15)';
      setTimeout(() => {
        userIdInput.style.borderColor = '';
        userIdInput.style.boxShadow   = '';
      }, 2000);
    }
  });

  // Allow Enter key in input
  userIdInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') connectBtn.click();
  });

  // ── Navigation buttons ───────────────────────────────────────────────────
  document.getElementById('openChatBtn').addEventListener('click', () =>
    chrome.tabs.create({ url: `${APP}/chat` })
  );
  document.getElementById('openDashboardBtn').addEventListener('click', () =>
    chrome.tabs.create({ url: `${APP}/dashboard` })
  );
  document.getElementById('openInsightsBtn').addEventListener('click', () =>
    chrome.tabs.create({ url: `${APP}/insights` })
  );

  // ── Disconnect ───────────────────────────────────────────────────────────
  document.getElementById('disconnectBtn').addEventListener('click', async () => {
    await chrome.storage.local.remove('userId');
    clearInterval(timerInterval);
    showSetup();
  });

  // ── Helpers ──────────────────────────────────────────────────────────────
  function showSetup() {
    setupSection.classList.remove('hidden');
    connectedSection.classList.add('hidden');
  }

  function showConnected() {
    setupSection.classList.add('hidden');
    connectedSection.classList.remove('hidden');
  }
});
