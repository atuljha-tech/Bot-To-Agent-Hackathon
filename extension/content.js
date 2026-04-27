/**
 * You² Content Script — Smart Universal Distraction Detection
 * Manifest V3 compatible. No hardcoded site lists.
 */

'use strict';

// ─── Constants ────────────────────────────────────────────────────────────────

const YOU2_PREFIX = 'you2';
const NUDGE_COOLDOWN_MS   = 5 * 60 * 1000;  // 5 min between popups
const DISTRACT_TRIGGER_MS = 2 * 60 * 1000;  // 2 min before nudge fires
const TOAST_DURATION_MS   = 4000;
const SCAN_DELAY_MS       = 1500;            // wait for page to settle

// ─── Keyword Signal Banks ─────────────────────────────────────────────────────

const SIGNALS = {
  sensitive: {
    domain: ['bank', 'banking', 'chase', 'wellsfargo', 'citibank', 'barclays', 'hsbc',
             'paypal', 'stripe', 'venmo', 'cashapp', 'zelle', 'wise', 'revolut',
             'irs', 'gov', 'hospital', 'clinic', 'health', 'insurance', 'medicare',
             'tax', 'wallet', 'crypto', 'coinbase', 'binance', 'kraken',
             'login', 'signin', 'auth', 'sso', 'passport', 'visa'],
    title:   ['sign in', 'log in', 'login', 'secure', 'account', 'password',
              'payment', 'checkout', 'billing', 'invoice', 'bank', 'tax return',
              'medical', 'health record', 'insurance claim'],
    path:    ['/login', '/signin', '/auth', '/checkout', '/payment', '/billing',
              '/account', '/secure', '/portal', '/dashboard/account'],
  },

  distracting: {
    domain: ['youtube', 'youtu.be', 'instagram', 'facebook', 'twitter', 'x.com',
             'tiktok', 'snapchat', 'reddit', 'netflix', 'twitch', 'hulu',
             'disneyplus', 'primevideo', 'spotify', 'soundcloud', 'pinterest',
             'tumblr', 'discord', 'telegram', 'whatsapp', 'messenger',
             '9gag', 'buzzfeed', 'dailymotion', 'vimeo', 'rumble',
             'roblox', 'miniclip', 'poki', 'friv', 'addictinggames',
             'twitch', 'kick.com', 'trovo'],
    title:  ['trending', 'viral', 'meme', 'funny', 'lol', 'watch now',
             'stream', 'episode', 'season', 'shorts', 'reels', 'for you',
             'explore', 'feed', 'timeline', 'stories', 'live now',
             'gaming', 'gameplay', 'let\'s play', 'walkthrough'],
    meta:   ['entertainment', 'social network', 'video sharing', 'streaming',
             'short video', 'memes', 'funny videos', 'gaming community'],
    body:   ['subscribe', 'follow us', 'like and share', 'trending now',
             'recommended for you', 'watch next', 'autoplay', 'for you page',
             'scroll for more', 'swipe up', 'going live'],
  },

  productive: {
    domain: ['github', 'gitlab', 'bitbucket', 'stackoverflow', 'stackexchange',
             'leetcode', 'hackerrank', 'codeforces', 'codechef', 'atcoder',
             'coursera', 'udemy', 'edx', 'khanacademy', 'pluralsight',
             'freecodecamp', 'theodinproject', 'codecademy', 'brilliant',
             'notion', 'obsidian', 'roamresearch', 'logseq',
             'figma', 'miro', 'lucidchart', 'excalidraw',
             'docs.google', 'sheets.google', 'slides.google',
             'linear', 'jira', 'trello', 'asana', 'clickup', 'basecamp',
             'vercel', 'netlify', 'heroku', 'aws', 'azure', 'gcp',
             'developer.mozilla', 'devdocs', 'w3schools', 'css-tricks',
             'medium', 'dev.to', 'hashnode', 'substack',
             'arxiv', 'scholar.google', 'researchgate', 'pubmed',
             'overleaf', 'wolfram', 'desmos', 'replit', 'codesandbox',
             'codepen', 'jsfiddle', 'glitch'],
    title:  ['documentation', 'tutorial', 'learn', 'course', 'lecture',
             'how to', 'guide', 'reference', 'api', 'sdk', 'framework',
             'algorithm', 'data structure', 'system design', 'interview',
             'problem', 'solution', 'exercise', 'practice', 'challenge',
             'research', 'paper', 'study', 'notes', 'project', 'build',
             'deploy', 'debug', 'review', 'pull request', 'commit'],
    meta:   ['programming', 'software development', 'coding', 'developer tools',
             'education', 'online learning', 'productivity', 'project management',
             'design tool', 'collaboration', 'documentation'],
    body:   ['function', 'const ', 'import ', 'export ', 'class ', 'interface',
             'repository', 'commit', 'branch', 'merge', 'pull request',
             'algorithm', 'complexity', 'runtime', 'compile', 'debug',
             'deadline', 'sprint', 'milestone', 'kanban', 'backlog'],
  },

  neutral: {
    domain: ['wikipedia', 'wikimedia', 'britannica', 'wolframalpha',
             'amazon', 'ebay', 'etsy', 'shopify', 'walmart', 'target',
             'nytimes', 'bbc', 'cnn', 'reuters', 'theguardian', 'techcrunch',
             'ycombinator', 'producthunt', 'indiehackers',
             'maps.google', 'openstreetmap', 'weather', 'translate.google'],
    title:  ['news', 'article', 'blog', 'review', 'opinion', 'analysis',
             'shopping', 'product', 'price', 'deal', 'sale',
             'weather', 'forecast', 'map', 'directions', 'translate'],
  },
};

// ─── State ────────────────────────────────────────────────────────────────────

let pageAnalysis    = null;   // result of analyzePage()
let trackingTimer   = null;   // setTimeout handle for nudge
let lastNudgeTime   = 0;      // timestamp of last popup shown
let isPageVisible   = !document.hidden;
let accumulatedMs   = 0;      // total active ms on this page
let lastActiveTs    = Date.now();

// ─── Utility ──────────────────────────────────────────────────────────────────

function getDomain() {
  return window.location.hostname.replace(/^www\./, '').toLowerCase();
}

function getPath() {
  return window.location.pathname.toLowerCase();
}

function getTitle() {
  return (document.title || '').toLowerCase();
}

function getMetaContent(name) {
  const el = document.querySelector(
    `meta[name="${name}"], meta[property="${name}"], meta[property="og:${name}"]`
  );
  return (el?.getAttribute('content') || '').toLowerCase();
}

function getBodySample() {
  // Sample visible text — first 3000 chars of body text, no scripts/styles
  try {
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll('script,style,noscript,svg').forEach(el => el.remove());
    return (clone.innerText || clone.textContent || '').slice(0, 3000).toLowerCase();
  } catch {
    return '';
  }
}

function scoreKeywords(text, keywords) {
  if (!text) return 0;
  let hits = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) hits++;
  }
  return Math.min(100, Math.round((hits / Math.max(keywords.length, 1)) * 100 * 3));
}

// ─── Core Analysis ────────────────────────────────────────────────────────────

/**
 * Scans the current page and returns a classification object.
 * Never throws — always returns a safe fallback.
 */
function analyzePage() {
  try {
    const domain      = getDomain();
    const path        = getPath();
    const title       = getTitle();
    const metaDesc    = getMetaContent('description');
    const metaKw      = getMetaContent('keywords');
    const ogType      = getMetaContent('type');
    const bodySample  = getBodySample();
    const combined    = `${domain} ${path} ${title} ${metaDesc} ${metaKw} ${ogType}`;

    // ── Sensitive check (highest priority — bail immediately) ──────────────
    const sensitiveDomainHit = SIGNALS.sensitive.domain.some(k => domain.includes(k));
    const sensitiveTitleHit  = SIGNALS.sensitive.title.some(k => title.includes(k));
    const sensitivePathHit   = SIGNALS.sensitive.path.some(k => path.startsWith(k));
    const sensitiveScore     = (sensitiveDomainHit ? 60 : 0)
                             + (sensitiveTitleHit  ? 25 : 0)
                             + (sensitivePathHit   ? 15 : 0);

    if (sensitiveScore >= 60) {
      return { category: 'sensitive', sensitiveScore, productiveScore: 0, distractScore: 0, domain, title };
    }

    // ── Productive score ───────────────────────────────────────────────────
    const prodDomain = SIGNALS.productive.domain.some(k => domain.includes(k)) ? 50 : 0;
    const prodTitle  = scoreKeywords(title, SIGNALS.productive.title);
    const prodMeta   = scoreKeywords(metaDesc + ' ' + metaKw, SIGNALS.productive.meta);
    const prodBody   = scoreKeywords(bodySample, SIGNALS.productive.body);
    const productiveScore = Math.min(100, Math.round(
      prodDomain * 0.5 + prodTitle * 0.25 + prodMeta * 0.15 + prodBody * 0.10
    ));

    // ── Distraction score ──────────────────────────────────────────────────
    const distDomain = SIGNALS.distracting.domain.some(k => domain.includes(k)) ? 50 : 0;
    const distTitle  = scoreKeywords(title, SIGNALS.distracting.title);
    const distMeta   = scoreKeywords(metaDesc + ' ' + metaKw, SIGNALS.distracting.meta);
    const distBody   = scoreKeywords(bodySample, SIGNALS.distracting.body);
    const distractScore = Math.min(100, Math.round(
      distDomain * 0.5 + distTitle * 0.25 + distMeta * 0.15 + distBody * 0.10
    ));

    // ── Neutral score ──────────────────────────────────────────────────────
    const neutDomain = SIGNALS.neutral.domain.some(k => domain.includes(k)) ? 40 : 0;
    const neutTitle  = scoreKeywords(title, SIGNALS.neutral.title);
    const neutralScore = Math.min(100, Math.round(neutDomain * 0.6 + neutTitle * 0.4));

    // ── Final classification ───────────────────────────────────────────────
    let category = 'neutral';
    const max = Math.max(productiveScore, distractScore, neutralScore);

    if (distractScore >= 30 && distractScore === max)  category = 'distracting';
    else if (productiveScore >= 25 && productiveScore === max) category = 'productive';
    else if (neutralScore >= 20 && neutralScore === max)       category = 'neutral';
    else if (distractScore >= 20)  category = 'distracting';
    else if (productiveScore >= 15) category = 'productive';

    return {
      category,
      productiveScore,
      distractScore,
      neutralScore,
      sensitiveScore,
      domain,
      title: document.title.slice(0, 60),
    };
  } catch (err) {
    return { category: 'neutral', productiveScore: 0, distractScore: 0, neutralScore: 0, sensitiveScore: 0, domain: getDomain(), title: '' };
  }
}

// ─── Timer (active-tab only) ──────────────────────────────────────────────────

function startActiveTimer() {
  lastActiveTs = Date.now();
}

function pauseActiveTimer() {
  if (lastActiveTs) {
    accumulatedMs += Date.now() - lastActiveTs;
    lastActiveTs = null;
  }
}

function getActiveSeconds() {
  const extra = lastActiveTs ? Date.now() - lastActiveTs : 0;
  return Math.floor((accumulatedMs + extra) / 1000);
}

document.addEventListener('visibilitychange', () => {
  isPageVisible = !document.hidden;
  if (isPageVisible) {
    startActiveTimer();
  } else {
    pauseActiveTimer();
    clearTimeout(trackingTimer);
  }
});

// ─── UI: Nudge Popup ──────────────────────────────────────────────────────────

function showNudge(analysis) {
  if (document.getElementById(`${YOU2_PREFIX}-nudge`)) return; // already showing
  const now = Date.now();
  if (now - lastNudgeTime < NUDGE_COOLDOWN_MS) return;
  lastNudgeTime = now;

  const domain = analysis?.domain || getDomain();

  // Inject keyframes once
  if (!document.getElementById(`${YOU2_PREFIX}-styles`)) {
    const style = document.createElement('style');
    style.id = `${YOU2_PREFIX}-styles`;
    style.textContent = `
      @keyframes you2-slide-in {
        from { transform: translateX(calc(100% + 24px)); opacity: 0; }
        to   { transform: translateX(0); opacity: 1; }
      }
      @keyframes you2-slide-out {
        from { transform: translateX(0); opacity: 1; }
        to   { transform: translateX(calc(100% + 24px)); opacity: 0; }
      }
      @keyframes you2-pulse-ring {
        0%   { transform: scale(1);   opacity: 0.6; }
        100% { transform: scale(1.8); opacity: 0; }
      }
      #${YOU2_PREFIX}-nudge * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important; }
      #${YOU2_PREFIX}-nudge button:hover { opacity: 0.85; transform: translateY(-1px); }
      #${YOU2_PREFIX}-nudge button:active { transform: translateY(0); }
    `;
    document.head.appendChild(style);
  }

  const nudge = document.createElement('div');
  nudge.id = `${YOU2_PREFIX}-nudge`;
  nudge.setAttribute('role', 'dialog');
  nudge.setAttribute('aria-label', 'You² Focus Nudge');

  Object.assign(nudge.style, {
    position:     'fixed',
    bottom:       '24px',
    right:        '24px',
    width:        '340px',
    background:   'linear-gradient(145deg, rgba(15,18,28,0.97) 0%, rgba(22,28,45,0.97) 100%)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border:       '1px solid rgba(139,92,246,0.35)',
    borderRadius: '20px',
    boxShadow:    '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
    zIndex:       '2147483647',
    overflow:     'hidden',
    animation:    'you2-slide-in 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards',
    color:        '#f8fafc',
  });

  nudge.innerHTML = `
    <!-- Top accent bar -->
    <div style="height:3px;background:linear-gradient(90deg,#8b5cf6,#06b6d4,#10b981);"></div>

    <div style="padding:18px 20px 20px;">

      <!-- Header row -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <!-- Pulsing orb -->
          <div style="position:relative;width:36px;height:36px;flex-shrink:0;">
            <div style="position:absolute;inset:0;border-radius:50%;background:rgba(239,68,68,0.2);animation:you2-pulse-ring 1.4s ease-out infinite;"></div>
            <div style="position:relative;width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#ef4444,#f97316);display:flex;align-items:center;justify-content:center;font-size:16px;">🧠</div>
          </div>
          <div>
            <div style="font-size:13px;font-weight:800;letter-spacing:-0.01em;color:#f8fafc;">Your Twin Noticed</div>
            <div style="font-size:11px;color:rgba(248,250,252,0.5);margin-top:1px;">You may be drifting</div>
          </div>
        </div>
        <button id="${YOU2_PREFIX}-close" style="
          background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);
          color:rgba(255,255,255,0.6);width:26px;height:26px;border-radius:8px;
          cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;
          transition:all 0.15s;flex-shrink:0;
        " aria-label="Dismiss">✕</button>
      </div>

      <!-- Message -->
      <div style="
        background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);
        border-radius:12px;padding:12px 14px;margin-bottom:14px;
      ">
        <p style="font-size:13px;line-height:1.55;color:rgba(248,250,252,0.9);margin:0;">
          You've been on <strong style="color:#f87171;">${domain}</strong> for over 2 minutes.
          Return to your mission?
        </p>
      </div>

      <!-- Score bar -->
      <div style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,0.4);margin-bottom:5px;">
          <span>Distraction level</span>
          <span style="color:#f87171;font-weight:700;">${analysis?.distractScore ?? 60}%</span>
        </div>
        <div style="height:4px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${analysis?.distractScore ?? 60}%;background:linear-gradient(90deg,#f59e0b,#ef4444);border-radius:4px;transition:width 1s ease;"></div>
        </div>
      </div>

      <!-- Action buttons -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
        <button id="${YOU2_PREFIX}-stay" style="
          background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);
          color:rgba(255,255,255,0.7);padding:10px 8px;border-radius:12px;
          cursor:pointer;font-size:12px;font-weight:600;transition:all 0.15s;
        ">Stay Here</button>
        <button id="${YOU2_PREFIX}-focus" style="
          background:linear-gradient(135deg,#8b5cf6,#6366f1);border:none;
          color:white;padding:10px 8px;border-radius:12px;
          cursor:pointer;font-size:12px;font-weight:700;transition:all 0.15s;
          box-shadow:0 4px 14px rgba(139,92,246,0.4);
        ">⚡ Focus Mode</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button id="${YOU2_PREFIX}-leetcode" style="
          background:rgba(234,179,8,0.1);border:1px solid rgba(234,179,8,0.25);
          color:#fbbf24;padding:9px 8px;border-radius:12px;
          cursor:pointer;font-size:11px;font-weight:600;transition:all 0.15s;
        ">Open LeetCode</button>
        <button id="${YOU2_PREFIX}-dashboard" style="
          background:rgba(6,182,212,0.1);border:1px solid rgba(6,182,212,0.25);
          color:#22d3ee;padding:9px 8px;border-radius:12px;
          cursor:pointer;font-size:11px;font-weight:600;transition:all 0.15s;
        ">Open Dashboard</button>
      </div>

      <!-- Footer -->
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:10px;color:rgba(255,255,255,0.25);">You² Digital Twin</span>
        <span style="font-size:10px;color:rgba(255,255,255,0.25);">Active time: ${Math.floor(getActiveSeconds() / 60)}m ${getActiveSeconds() % 60}s</span>
      </div>
    </div>
  `;

  document.body.appendChild(nudge);

  // Wire up buttons
  const dismiss = () => {
    nudge.style.animation = 'you2-slide-out 0.3s ease forwards';
    setTimeout(() => nudge.remove(), 300);
  };

  document.getElementById(`${YOU2_PREFIX}-close`).onclick     = dismiss;
  document.getElementById(`${YOU2_PREFIX}-stay`).onclick      = dismiss;
  document.getElementById(`${YOU2_PREFIX}-focus`).onclick     = () => { dismiss(); window.location.href = 'http://localhost:3000/dashboard'; };
  document.getElementById(`${YOU2_PREFIX}-leetcode`).onclick  = () => { dismiss(); window.open('https://leetcode.com', '_blank'); };
  document.getElementById(`${YOU2_PREFIX}-dashboard`).onclick = () => { dismiss(); window.open('http://localhost:3000/dashboard', '_blank'); };

  // Auto-dismiss after 20s
  setTimeout(dismiss, 20000);
}

// ─── UI: Positive Toast ───────────────────────────────────────────────────────

function showPositiveToast(analysis) {
  if (document.getElementById(`${YOU2_PREFIX}-toast`)) return;

  if (!document.getElementById(`${YOU2_PREFIX}-styles`)) {
    const style = document.createElement('style');
    style.id = `${YOU2_PREFIX}-styles`;
    style.textContent = `
      @keyframes you2-toast-in  { from { transform:translateY(20px);opacity:0; } to { transform:translateY(0);opacity:1; } }
      @keyframes you2-toast-out { from { transform:translateY(0);opacity:1; } to { transform:translateY(20px);opacity:0; } }
    `;
    document.head.appendChild(style);
  }

  const toast = document.createElement('div');
  toast.id = `${YOU2_PREFIX}-toast`;
  Object.assign(toast.style, {
    position:     'fixed',
    bottom:       '24px',
    right:        '24px',
    background:   'linear-gradient(135deg,rgba(16,185,129,0.95),rgba(6,182,212,0.95))',
    backdropFilter: 'blur(12px)',
    color:        'white',
    padding:      '12px 18px',
    borderRadius: '14px',
    boxShadow:    '0 8px 32px rgba(16,185,129,0.35)',
    zIndex:       '2147483647',
    fontSize:     '13px',
    fontWeight:   '600',
    fontFamily:   '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    display:      'flex',
    alignItems:   'center',
    gap:          '8px',
    animation:    'you2-toast-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
    maxWidth:     '300px',
    lineHeight:   '1.4',
  });

  toast.innerHTML = `
    <span style="font-size:18px;flex-shrink:0;">✅</span>
    <span>Great choice. This aligns with your goals.</span>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'you2-toast-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, TOAST_DURATION_MS);
}

// ─── Tracking Logic ───────────────────────────────────────────────────────────

function startTracking(analysis) {
  clearTimeout(trackingTimer);

  if (analysis.category === 'sensitive') return; // never track sensitive pages

  if (analysis.category === 'distracting') {
    trackingTimer = setTimeout(() => {
      if (!document.hidden && document.getElementById(`${YOU2_PREFIX}-nudge`) === null) {
        showNudge(analysis);
      }
    }, DISTRACT_TRIGGER_MS);
  }

  if (analysis.category === 'productive') {
    // Show a brief positive toast after 5s of being on a productive page
    setTimeout(() => {
      if (!document.hidden) showPositiveToast(analysis);
    }, 5000);
  }
}

// ─── Sensitive Guard ──────────────────────────────────────────────────────────

function isSensitiveSite(analysis) {
  return analysis?.category === 'sensitive';
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  // Don't run in iframes
  if (window.self !== window.top) return;

  // Don't run on extension pages or chrome:// URLs
  const proto = window.location.protocol;
  if (proto === 'chrome-extension:' || proto === 'chrome:' || proto === 'about:') return;

  startActiveTimer();

  // Wait for page to settle before scanning
  setTimeout(() => {
    pageAnalysis = analyzePage();

    if (isSensitiveSite(pageAnalysis)) {
      // Hard stop — do nothing on sensitive pages
      return;
    }

    // Report to background for activity logging
    chrome.runtime.sendMessage({
      action:   'pageClassified',
      category: pageAnalysis.category,
      scores: {
        productive: pageAnalysis.productiveScore,
        distract:   pageAnalysis.distractScore,
        neutral:    pageAnalysis.neutralScore,
      },
      domain: pageAnalysis.domain,
      title:  pageAnalysis.title,
    }).catch(() => {}); // ignore if background not ready

    startTracking(pageAnalysis);
  }, SCAN_DELAY_MS);
}

// ─── Message listener (from background / popup) ───────────────────────────────

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'showNudge') {
    showNudge(pageAnalysis);
    sendResponse({ success: true });
    return true;
  }
  if (request.action === 'getPageAnalysis') {
    sendResponse({ analysis: pageAnalysis, activeSeconds: getActiveSeconds() });
    return true;
  }
  if (request.action === 'ping') {
    sendResponse({ alive: true });
    return true;
  }
});

// ─── Run ──────────────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
