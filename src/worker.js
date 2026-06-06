/**
 * @fileoverview JPL Subscription Processor - Edge Computing Node
 * @author AmirHosseinJPL
 * @version 1.1.0
 * @license MIT
 * @description
 * A unified serverless application (Frontend Client + Edge API) designed for 
 * Cloudflare Workers. It processes, filters, pings, and dynamically hosts 
 * proxy configuration links.
 * @environment Cloudflare Workers
 * @requires {KVNamespace} JPL_KV - Key-Value storage binding for state management.
 */

// ============================================================================
// 1. CLIENT-SIDE INTERFACE (FRONTEND)
// ============================================================================

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>JPL — Subscription Processor</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>
<style>
:root {
  --bg:#000;--bg2:#16181c;--bg3:#202327;--surface:#16181c;--surface2:#1e2026;
  --border:#2f3336;--border2:#3e4144;--text:#e7e9ea;--muted:#71767b;
  --accent:#1d9bf0;--accent2:#1a8cd8;--accent3:#8ecdf8;
  --green:#00ba7c;--red:#f4212e;--yellow:#ffd400;
  --mono:'JetBrains Mono',monospace;--display:'Inter',sans-serif;
  --radius:16px;--radius2:999px;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:16px;scroll-behavior:smooth}
body{font-family:var(--display);background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden}
#galaxy-canvas{position:fixed;top:0;left:0;width:100%;height:100%;z-index:1;pointer-events:none}
.app-wrapper{position:relative;z-index:2;max-width:600px;margin:0 auto;padding:24px 16px 40px}

.site-header{text-align:center;margin-bottom:16px;padding-top:20px;background:rgba(22,24,28,0.3);border:1px solid var(--border);border-radius:var(--radius);padding-bottom:20px;backdrop-filter:blur(8px)}
.site-title{font-size:1.8rem;font-weight:700;margin-bottom:6px;color:var(--text)}
.site-subtitle{color:var(--muted);font-size:14px}

.platform-id-container{text-align:center;margin-bottom:32px;}
.logo-badge{display:inline-flex;align-items:center;gap:10px;background:rgba(22,24,28,.8);border:1px solid var(--border);border-radius:var(--radius2);padding:8px 18px;font-size:13px;font-family:var(--mono);font-weight:500;backdrop-filter:blur(8px)}
.logo-dot{width:8px;height:8px;background:var(--green);border-radius:50%;box-shadow:0 0 8px var(--green);animation:pulse-dot 1.5s infinite ease-in-out}
@keyframes pulse-dot{0%,100%{transform:scale(.9);opacity:.6;box-shadow:0 0 4px var(--green)}50%{transform:scale(1.1);opacity:1;box-shadow:0 0 12px var(--green)}}

.steps-bar{display:flex;margin-bottom:24px;background:rgba(0,0,0,.6);border:1px solid var(--border);border-radius:var(--radius);padding:4px;backdrop-filter:blur(8px)}
.step-item{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 8px;border-radius:12px;font-size:14px;font-weight:600;color:var(--muted);transition:all .2s;user-select:none}
.step-item.active{background:var(--bg2);color:var(--accent)}
.step-item.done{color:var(--green)}
.step-num{width:20px;height:20px;border-radius:50%;background:var(--border2);display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0}
.step-item.active .step-num{background:var(--accent);color:#fff}
.step-item.done .step-num{background:var(--green);color:var(--bg)}
.step-label{font-size:13px}
@media(max-width:480px){.step-label{display:none}}
.card{background:rgba(22,24,28,.4);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:16px;backdrop-filter:blur(12px)}
.card-title{font-size:16px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px}
label{display:block;font-size:13px;font-weight:600;margin-bottom:8px}
textarea,input[type="url"],input[type="text"],select{width:100%;background:rgba(22,24,28,.8);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:var(--display);font-size:15px;padding:12px 14px;transition:border-color .2s,background .2s;resize:vertical;appearance:none;outline:none}
textarea:focus,input[type="url"]:focus,input[type="text"]:focus,select:focus{border-color:var(--accent);background:var(--bg)}
textarea{min-height:110px;line-height:1.5}
select{cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2371767b'%3E%3Cpath d='M7 10l5 5 5-5H7z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;background-size:18px;padding-right:36px}
select option{background:var(--bg2)}
.input-hint{font-size:13px;color:var(--muted);margin-top:6px}
.tab-group{display:flex;border-bottom:1px solid var(--border);margin-bottom:16px}
.tab-btn{flex:1;padding:14px 12px;border:none;background:transparent;color:var(--muted);font-family:var(--display);font-size:15px;font-weight:600;cursor:pointer;transition:all .2s;position:relative}
.tab-btn:hover{background:rgba(255,255,255,.03)}
.tab-btn.active{color:var(--text)}
.tab-btn.active::after{content:'';position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:40px;height:4px;background:var(--accent);border-radius:var(--radius2)}
.tab-pane{display:none}
.tab-pane.active{display:block}
.proto-group{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
.proto-pill{display:flex;align-items:center;gap:6px;padding:8px 16px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius2);font-size:14px;font-weight:500;cursor:pointer;transition:all .2s;user-select:none}
.proto-pill input{display:none}
.proto-pill:hover{background:rgba(255,255,255,.03)}
.proto-pill.checked{background:var(--text);color:var(--bg);border-color:var(--text);font-weight:600}
.preset-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;margin-bottom:16px}
.preset-btn{padding:8px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius2);color:var(--text);font-family:var(--display);font-size:13px;font-weight:500;cursor:pointer;transition:all .2s;text-align:center}
.preset-btn:hover{background:var(--bg3);border-color:var(--muted)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 20px;border:none;border-radius:var(--radius2);font-family:var(--display);font-weight:700;font-size:15px;cursor:pointer;transition:background .2s,transform .1s;text-decoration:none}
.btn-primary{background:var(--accent);color:#fff;width:100%;padding:14px}
.btn-primary:hover{background:var(--accent2)}
.btn-primary:active{transform:scale(.98)}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-ghost{background:transparent;border:1px solid var(--border);color:var(--text)}
.btn-ghost:hover{background:rgba(255,255,255,.03)}
.btn-sm{padding:6px 16px;font-size:13px}
.btn-green{background:var(--text);color:var(--bg)}
.btn-green:hover{opacity:.9}
.spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}
#result-section{display:none;animation:fade-up .3s cubic-bezier(.16,1,.3,1)}
@keyframes fade-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.result-card{background:rgba(22,24,28,.6);border:1px solid var(--border);border-radius:var(--radius);padding:20px;backdrop-filter:blur(12px)}
.result-header{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.result-icon{width:40px;height:40px;background:var(--bg2);border:1px solid var(--border);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.result-title{font-size:18px;font-weight:800}
.result-meta{font-size:13px;color:var(--muted);margin-top:2px}
.stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:20px}
.stat-box{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center}
.stat-num{font-size:1.5rem;font-weight:800;line-height:1.2;margin-bottom:2px}
.stat-label{font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em}
.sub-link-label{font-size:13px;font-weight:700;margin-bottom:8px}
.sub-link-box{background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:12px;font-family:var(--mono);font-size:13px;word-break:break-all;color:var(--accent3);margin-bottom:16px;line-height:1.5}
.action-row{display:flex;gap:8px;flex-wrap:wrap}
.toggle-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0}
.toggle-label{font-size:13px;display:flex;flex-direction:column;gap:3px}
.toggle-hint{font-size:12px;color:var(--muted)}
.toggle{width:42px;height:24px;background:var(--bg2);border:1px solid var(--border2);border-radius:999px;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0}
.toggle.on{background:var(--accent);border-color:var(--accent)}
.toggle::after{content:'';position:absolute;left:3px;top:3px;width:16px;height:16px;background:var(--muted);border-radius:50%;transition:all .2s}
.toggle.on::after{left:21px;background:#fff}
.divider{border:none;border-top:1px solid var(--border);margin:10px 0}
.collapsible-header{display:flex;align-items:center;justify-content:space-between;cursor:pointer;padding-bottom:4px;user-select:none}
.collapsible-arrow{font-size:12px;color:var(--muted);transition:transform .2s}
.collapsible-header.open .collapsible-arrow{transform:rotate(180deg)}
.collapsible-body{overflow:hidden;transition:max-height .3s ease,opacity .3s ease}
.collapsible-body.collapsed{max-height:0!important;opacity:0}
#toast{position:fixed;bottom:32px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--surface2);border:1px solid var(--border2);border-radius:999px;padding:10px 20px;font-size:13px;z-index:1000;opacity:0;transition:all .3s;pointer-events:none;white-space:nowrap}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
#toast.success{border-color:#00ba7c66;color:var(--green)}
#toast.error{border-color:#f4212e66;color:var(--red)}
.footer-wrapper{text-align:center;margin-top:24px}
.author-link{display:inline-flex;align-items:center;font-size:14px;color:var(--muted);text-decoration:none;font-weight:500;transition:color .2s}
.author-link:hover{color:#fff}
.twitter-icon-svg{width:15px;height:15px;fill:currentColor;vertical-align:middle;margin-right:6px}
.footer-divider{margin:16px auto;max-width:250px;border:none;border-top:1px solid var(--border)}
.bottom-footer{font-size:13px;color:var(--muted)}
.bottom-footer a{color:var(--muted);text-decoration:none;font-weight:500}
.bottom-footer a:hover{color:#fff}

.ping-progress{height:4px;background:var(--border);border-radius:2px;margin-top:8px;margin-bottom:16px;overflow:hidden}
.ping-progress-bar{height:100%;background:var(--accent);width:0%;transition:width .3s ease}
.ping-list{display:flex;flex-direction:column;gap:0;border:1px solid var(--border);border-radius:var(--radius);max-height:300px;overflow-y:auto;background:rgba(0,0,0,.3)}
.ping-item{display:flex;align-items:center;gap:12px;padding:11px 16px;border-bottom:1px solid var(--border);font-size:13px;transition:background .15s}
.ping-item:last-child{border-bottom:none}
.ping-host{font-family:var(--mono);color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ping-name{color:var(--muted);font-size:12px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:0}
.ping-ms{font-family:var(--mono);font-size:13px;font-weight:600;flex-shrink:0;min-width:60px;text-align:right}
.ping-ms.fast{color:var(--green)}
.ping-ms.medium{color:var(--yellow)}
.ping-ms.slow{color:var(--red)}
.ping-ms.pending{color:var(--muted)}
.ping-ms.timeout{color:var(--red);opacity:.6}
.ping-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;background:var(--border2);transition:background .3s}
.ping-dot.fast{background:var(--green);box-shadow:0 0 6px var(--green)}
.ping-dot.medium{background:var(--yellow);box-shadow:0 0 6px var(--yellow)}
.ping-dot.slow{background:var(--red);box-shadow:0 0 6px var(--red)}
.ping-dot.running{background:var(--accent);animation:ping-pulse .8s ease-in-out infinite}
@keyframes ping-pulse{0%,100%{transform:scale(1);box-shadow:0 0 4px var(--accent)}50%{transform:scale(1.4);box-shadow:0 0 10px var(--accent)}}
</style>
</head>
<body>
<canvas id="galaxy-canvas"></canvas>
<div class="app-wrapper">

  <header class="site-header">
    <h1 class="site-title">JPL</h1>
    <p class="site-subtitle">Convert · Filter · Rename · Host</p>
  </header>

  <div class="platform-id-container">
    <div class="logo-badge">
      <span class="logo-dot"></span>
      Platform ID: JPL-CORE
    </div>
  </div>

  <div class="steps-bar" id="steps-bar">
    <div class="step-item active" id="step1-el"><div class="step-num">1</div><span class="step-label">Input</span></div>
    <div class="step-item" id="step2-el"><div class="step-num">2</div><span class="step-label">Options</span></div>
    <div class="step-item" id="step3-el"><div class="step-num">3</div><span class="step-label">Result</span></div>
  </div>

  <div id="step1-content">
    <div class="card">
      <div class="card-title">📥 Input Source</div>
      <div class="tab-group">
        <button class="tab-btn active" id="tab-btn-sub" onclick="switchTab('sub')">🔗 Sub Link</button>
        <button class="tab-btn" id="tab-btn-raw" onclick="switchTab('raw')">📋 Raw Configs</button>
      </div>
      <div class="tab-pane active" id="tab-sub">
        <label>Subscription URL</label>
        <input type="url" id="sub-url" placeholder="https://example.com/sub/yourtoken" autocomplete="off" spellcheck="false"/>
        <p class="input-hint">↳ Your subscription link (base64 or plain text)</p>
      </div>
      <div class="tab-pane" id="tab-raw">
        <label>Paste Configs (one per line)</label>
        <textarea id="raw-configs" placeholder="vless://...&#10;vmess://...&#10;trojan://..."></textarea>
      </div>
    </div>

    <div class="card">
      <div class="collapsible-header open" onclick="toggleCollapse(this,'ip-section')">
        <div class="card-title" style="margin-bottom:0">🌐 IP Replacement <span style="color:var(--muted);font-size:13px;font-weight:400">(optional)</span></div>
        <span class="collapsible-arrow">▼</span>
      </div>
      <div class="collapsible-body" id="ip-section" style="max-height:600px">
        <br>
        <label>CDN / IP Presets</label>
        <div class="preset-grid">
          <button class="preset-btn" onclick="loadPreset('cloudflare')">☁️ Cloudflare</button>
          <button class="preset-btn" onclick="loadPreset('gcore')">⚡ Gcore</button>
          <button class="preset-btn" onclick="loadPreset('fastly')">🚀 Fastly</button>
          <button class="preset-btn" onclick="clearIPs()">🗑️ Clear</button>
        </div>
        <label>Custom IPs / CIDR Ranges</label>
        <textarea id="custom-ips" placeholder="1.1.1.1&#10;104.16.0.0/24" style="min-height:90px"></textarea>
        <p class="input-hint">↳ One IP or CIDR per line · Leave empty to keep the original IP</p>
      </div>
    </div>

    <button class="btn btn-primary" onclick="goToStep2()">Continue to Settings ←</button>
  </div>

  <div id="step2-content" style="display:none">

    <div class="card">
      <div class="card-title">🔒 Protocol Filter</div>
      <p class="input-hint" style="margin-bottom:12px">
        Select which protocols to keep.<br>
        <span style="color:var(--accent3)">If nothing is selected, all will be kept.</span>
      </p>
      <div class="proto-group" id="proto-group">
        <label class="proto-pill"><input type="checkbox" value="vless"> VLESS</label>
        <label class="proto-pill"><input type="checkbox" value="vmess"> VMESS</label>
        <label class="proto-pill"><input type="checkbox" value="trojan"> Trojan</label>
        <label class="proto-pill"><input type="checkbox" value="ss"> Shadowsocks</label>
        <label class="proto-pill"><input type="checkbox" value="hysteria2"> Hysteria2</label>
      </div>
    </div>

    <div class="card">
      <div class="card-title">⚙️ Options</div>

      <div class="toggle-row">
        <div class="toggle-label">
          Rename Configs
          <span class="toggle-hint">Custom prefix for config names</span>
        </div>
        <div class="toggle" id="toggle-rename" onclick="toggleRename()"></div>
      </div>
      <div id="rename-options" style="display:none;padding:8px 0">
        <input type="text" id="rename-prefix" placeholder="e.g., Raven or JPL" value="JPL"/>
      </div>

      <hr class="divider">

      <div class="toggle-row">
        <div class="toggle-label">
          Ping Test
          <span class="toggle-hint">Test all IPs and keep only those under 700ms</span>
        </div>
        <div class="toggle" id="toggle-ping" onclick="togglePing()"></div>
      </div>

      <hr class="divider">

      <div class="toggle-row">
        <div class="toggle-label">
          Link Expiry
          <span class="toggle-hint">Subscription link expiry duration on the server</span>
        </div>
        <select id="ttl-select" style="width:140px">
          <option value="3600">1 hour</option>
          <option value="21600">6 hours</option>
          <option value="86400" selected>24 hours</option>
          <option value="172800">48 hours</option>
          <option value="259200">72 hours</option>
        </select>
      </div>
    </div>

    <div id="generation-progress" style="display:none; margin-bottom:16px;">
       <div style="font-size:13px; font-weight:600; display:flex; justify-content:space-between; margin-bottom:6px;">
          <span style="color:var(--accent3)">Testing Latency (under 700ms)...</span>
          <span id="ping-test-status">0 / 0</span>
       </div>
       <div class="ping-progress">
          <div class="ping-progress-bar" id="gen-ping-bar"></div>
       </div>
       <div id="ping-section" style="display:none;">
          <div class="ping-list" id="ping-list"></div>
       </div>
    </div>

    <div style="display:flex;gap:12px">
      <button class="btn btn-ghost" onclick="goToStep1()" style="flex:0 0 100px">← Back</button>
      <button class="btn btn-primary" id="generate-btn" onclick="generate()">⚡ Generate</button>
    </div>
  </div>

  <div id="result-section">
    <div class="result-card">
      <div class="result-header">
        <div class="result-icon">✨</div>
        <div>
          <div class="result-title">Subscription Ready</div>
          <div class="result-meta" id="result-meta">–</div>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-box"><div class="stat-num" id="stat-total" style="color:var(--green)">0</div><div class="stat-label">Configs</div></div>
        <div class="stat-box"><div class="stat-num" id="stat-original">0</div><div class="stat-label">Tested</div></div>
        <div class="stat-box"><div class="stat-num" id="stat-expires">–</div><div class="stat-label">Expires</div></div>
      </div>

      <div class="sub-link-label">🔗 Subscription Link</div>
      <div class="sub-link-box" id="sub-link-box">–</div>

      <div class="sub-link-label" style="margin-top:16px">📋 Raw Configs Output</div>
      <textarea id="raw-output-box" class="sub-link-box" readonly style="width:100%;min-height:120px;color:var(--text);resize:vertical" onclick="this.select()"></textarea>

      <div class="action-row" style="margin-top:16px">
        <button class="btn btn-green btn-sm" onclick="copySubLink()">📋 Copy Sub Link</button>
        <button class="btn btn-ghost btn-sm" onclick="copyRaw()">📋 Copy Raw</button>
        <button class="btn btn-ghost btn-sm" onclick="resetAll()" style="margin-left:auto">↺ New</button>
      </div>
    </div>
  </div>

  <div class="footer-wrapper">
    <a href="https://x.com/amirhosseinssl" target="_blank" class="author-link">
      <svg class="twitter-icon-svg" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      AmirHosseinJPL
    </a>
    <hr class="footer-divider">
    <div class="bottom-footer">
      <p>JPL — Open Source Subscription Processor</p>
      <p style="margin-top:6px">
        <a href="https://github.com/AmirHosseinJPL" target="_blank">GitHub</a>
        &nbsp;·&nbsp;Powered by Cloudflare Workers
      </p>
    </div>
  </div>

</div>
<div id="toast"></div>

<script>
// --- Environment Configuration ---
const WORKER_URL = '';

// --- State Management ---
let currentTab = 'sub';
let options = { rename: false, ping: false };

// --- Canvas Initialization ---
(function(){
  const canvas = document.getElementById('galaxy-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, stars;
  function resize(){
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    stars = [];
    for(let i=0;i<150;i++) stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.2+.3,alpha:Math.random()*.7+.2,speedX:(Math.random()-.5)*.15,speedY:(Math.random()-.5)*.15,twinkleSpeed:Math.random()*.03+.01,twinklePhase:Math.random()*Math.PI*2});
  }
  function draw(){
    ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
    for(let i=0;i<stars.length;i++){
      let s=stars[i];s.x+=s.speedX;s.y+=s.speedY;
      if(s.x<0)s.x=W;if(s.x>W)s.x=0;if(s.y<0)s.y=H;if(s.y>H)s.y=0;
      s.twinklePhase+=s.twinkleSpeed;
      const a=s.alpha*(.4+.6*Math.abs(Math.sin(s.twinklePhase)));
      ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,'+a+')';ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize',resize);resize();draw();
})();

// --- UI Interaction Handlers ---
function switchTab(tab){
  currentTab=tab;
  document.querySelectorAll('.tab-btn').forEach(function(b,i){
    b.classList.toggle('active',(tab==='sub'&&i===0)||(tab==='raw'&&i===1));
  });
  document.getElementById('tab-sub').classList.toggle('active',tab==='sub');
  document.getElementById('tab-raw').classList.toggle('active',tab==='raw');
}

function toggleRename(){
  options.rename=!options.rename;
  document.getElementById('toggle-rename').classList.toggle('on',options.rename);
  document.getElementById('rename-options').style.display=options.rename?'block':'none';
}

function togglePing(){
  options.ping=!options.ping;
  document.getElementById('toggle-ping').classList.toggle('on',options.ping);
  document.getElementById('generate-btn').textContent = options.ping ? '⚡ Test & Generate' : '⚡ Generate';
}

function toggleCollapse(header,targetId){
  header.classList.toggle('open');
  const body=document.getElementById(targetId);
  const isOpen = header.classList.contains('open');
  body.classList.toggle('collapsed',!isOpen);
  if(isOpen) {
    body.style.maxHeight = body.scrollHeight + 'px';
  } else {
    body.style.maxHeight = '0';
  }
}

function setStep(n){
  for(let i=1;i<=3;i++){
    const el=document.getElementById('step'+i+'-el');
    el.classList.remove('active','done');
    if(i<n) el.classList.add('done');
    if(i===n) el.classList.add('active');
  }
}

document.querySelectorAll('.proto-pill input').forEach(function(input){
  input.addEventListener('change', function(){
    this.parentNode.classList.toggle('checked', this.checked);
  });
});

function getSelectedProtocols(){
  return [...document.querySelectorAll('.proto-pill input:checked')].map(function(cb){return cb.value;});
}

const PRESETS={
  cloudflare:['103.21.244.0/22','103.22.200.0/22','104.16.0.0/13','104.24.0.0/14','108.162.192.0/18','162.158.0.0/15','172.64.0.0/13','173.245.48.0/20','188.114.96.0/20','190.93.240.0/20','197.234.240.0/22','198.41.128.0/17'],
  gcore:['92.38.176.0/21','185.254.120.0/22','5.188.206.0/23'],
  fastly:['23.235.32.0/20','43.249.72.0/22','151.101.0.0/16','157.52.192.0/18'],
};
function loadPreset(name){
  const ips=PRESETS[name];if(!ips)return;
  const ta=document.getElementById('custom-ips');
  const nl=String.fromCharCode(10);
  ta.value=ta.value.trim()?(ta.value.trim()+nl+ips.join(nl)):ips.join(nl);
  showToast('Loaded '+ips.length+' '+name+' ranges ✓','success');
}
function clearIPs(){document.getElementById('custom-ips').value='';}

function goToStep2(){
  const subUrl=document.getElementById('sub-url').value.trim();
  const raw=document.getElementById('raw-configs').value.trim();
  if(currentTab==='sub'&&!subUrl){showToast('Please enter a subscription link','error');return;}
  if(currentTab==='raw'&&!raw){showToast('Please paste the configs','error');return;}
  document.getElementById('step1-content').style.display='none';
  document.getElementById('step2-content').style.display='block';
  setStep(2);window.scrollTo({top:0,behavior:'smooth'});
}
function goToStep1(){
  document.getElementById('step2-content').style.display='none';
  document.getElementById('step1-content').style.display='block';
  setStep(1);
}

// --- Core Processing Logic ---
async function pingOne(host, port, timeoutMs) {
  if (!host) return null;
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(function() { controller.abort(); }, timeoutMs);
  try {
    await fetch('https://' + host + ':' + port, { mode: 'no-cors', signal: controller.signal, cache: 'no-store' });
    clearTimeout(timer); 
    return Math.round(performance.now() - start);
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') return null; 
    const elapsed = Math.round(performance.now() - start);
    return elapsed < timeoutMs ? elapsed : null;
  }
}

async function generate() {
  const btn=document.getElementById('generate-btn');
  const subUrl=document.getElementById('sub-url').value.trim();
  const rawConfigs=document.getElementById('raw-configs').value.trim();
  const customIPsRaw=document.getElementById('custom-ips').value.trim();
  
  let customIPs = [];
  if (customIPsRaw) {
    const lines = customIPsRaw.split(String.fromCharCode(10));
    for(let i=0; i<lines.length; i++) {
       if(lines[i].trim()) customIPs.push(lines[i].trim());
    }
  }
  
  const protocols=getSelectedProtocols();

  btn.disabled=true;
  btn.innerHTML='<div class="spinner"></div> Processing...';

  try {
    const prepPayload={customIPs,protocols};
    if(currentTab==='sub') prepPayload.subUrl=subUrl;
    else prepPayload.rawConfigs=rawConfigs;

    const resPrep=await fetch(WORKER_URL+'/api/prepare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(prepPayload)});
    const prepData=await resPrep.json();
    if(!resPrep.ok) throw new Error(prepData.error||'Preparation failed');
    if(!prepData.configs||prepData.configs.length===0) throw new Error('No valid configs found');

    const configs = prepData.configs;
    let validConfigs = [];

    if (options.ping) {
      btn.innerHTML='<div class="spinner"></div> Testing Latency...';
      document.getElementById('generation-progress').style.display='block';
      document.getElementById('ping-section').style.display='block';

      const concurrency = 10;
      const MAX_PING = 700;

      let listHtml = '';
      for(let i=0; i<configs.length; i++) {
        let displayName = configs[i].name || 'Unknown';
        listHtml += '<div class="ping-item" id="ping-row-'+i+'">' +
                    '<div class="ping-dot pending" id="ping-dot-'+i+'"></div>' +
                    '<div class="ping-host">'+configs[i].host+':'+configs[i].port+'</div>' +
                    '<div class="ping-name">'+displayName+'</div>' +
                    '<div class="ping-ms pending" id="ping-ms-'+i+'">–</div></div>';
      }
      document.getElementById('ping-list').innerHTML = listHtml;

      for (let i = 0; i < configs.length; i += concurrency) {
        const chunk = configs.slice(i, i + concurrency);

        for(let j=0; j<chunk.length; j++) {
          let gIdx = i+j;
          document.getElementById('ping-dot-'+gIdx).className = 'ping-dot running';
          document.getElementById('ping-ms-'+gIdx).className = 'ping-ms pending';
          document.getElementById('ping-ms-'+gIdx).textContent = '...';
          let row = document.getElementById('ping-row-'+gIdx);
          if(row && j===0) row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        const promises = chunk.map(async function(c, j) {
          let gIdx = i+j;
          let ms = await pingOne(c.host, c.port, 2500);

          let st = (ms === null) ? 'timeout' : (ms < 400 ? 'fast' : (ms <= MAX_PING ? 'medium' : 'slow'));
          let elDot = document.getElementById('ping-dot-'+gIdx);
          if(elDot) elDot.className = 'ping-dot ' + st;
          let elMs = document.getElementById('ping-ms-'+gIdx);
          if(elMs) {
            elMs.className = 'ping-ms ' + st;
            elMs.textContent = (ms === null) ? 'timeout' : (ms + ' ms');
          }

          return (ms !== null && ms < MAX_PING) ? c.raw : null;
        });

        const results = await Promise.all(promises);
        for(let j=0; j<results.length; j++) {
          if(results[j] !== null) validConfigs.push(results[j]);
        }

        let progress = Math.min(i + concurrency, configs.length);
        document.getElementById('ping-test-status').textContent = progress + ' / ' + configs.length;
        document.getElementById('gen-ping-bar').style.width = ((progress / configs.length) * 100) + '%';
      }

      await new Promise(r => setTimeout(r, 800));
      document.getElementById('generation-progress').style.display='none';

      if (validConfigs.length === 0) throw new Error('All configs timed out or exceeded the 700ms limit.');
    } else {
      validConfigs = configs.map(function(c) { return c.raw; });
    }

    btn.innerHTML='<div class="spinner"></div> Saving on server...';
    const renamePrefix=options.rename?(document.getElementById('rename-prefix').value.trim()||'JPL'):'';
    const ttl=parseInt(document.getElementById('ttl-select').value);

    const resCreate=await fetch(WORKER_URL+'/api/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({finalConfigs:validConfigs,renamePrefix,ttl,originalCount:configs.length})});
    const createData=await resCreate.json();
    if(!resCreate.ok) throw new Error(createData.error||'Failed to save');

    showResult(createData);setStep(3);
  } catch(err){
    showToast(err.message,'error');
    document.getElementById('generation-progress').style.display='none';
  } finally {
    btn.disabled=false;btn.innerHTML=options.ping?'⚡ Test & Generate':'⚡ Generate';
  }
}

function showResult(data){
  document.getElementById('step2-content').style.display='none';
  document.getElementById('result-section').style.display='block';
  document.getElementById('sub-link-box').textContent = data.subLink || '–';
  document.getElementById('raw-output-box').value = data.rawConfigs || '';
  document.getElementById('stat-total').textContent = data.count || 0;
  document.getElementById('stat-original').textContent = data.originalCount || 0;
  const expiresIn = data.expiresIn || 0;
  const expH=Math.round(expiresIn/3600);
  const timeText=expH>=24?Math.round(expH/24)+'d':expH+'h';
  document.getElementById('stat-expires').textContent=timeText;
  document.getElementById('result-meta').textContent='ID: '+(data.id || '–')+' · expires in '+timeText;
  window.scrollTo({top:0,behavior:'smooth'});
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showToast('Copied ✓', 'success');
  } catch (e) {
    showToast('Copy failed — please copy manually', 'error');
  }
  document.body.removeChild(textarea);
}

function copySubLink(){
  const text = document.getElementById('sub-link-box').textContent;
  if(navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(function(){ showToast('Link copied ✓','success'); })
      .catch(function(){ fallbackCopy(text); });
  } else {
    fallbackCopy(text);
  }
}

function copyRaw(){
  const text = document.getElementById('raw-output-box').value;
  if(navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(function(){ showToast('Configs copied ✓','success'); })
      .catch(function(){ fallbackCopy(text); });
  } else {
    fallbackCopy(text);
  }
}

function resetAll(){
  document.getElementById('result-section').style.display='none';
  document.getElementById('step1-content').style.display='block';
  ['sub-url','raw-configs','custom-ips'].forEach(function(id){document.getElementById(id).value='';});
  document.getElementById('generation-progress').style.display = 'none';
  document.getElementById('ping-list').innerHTML = '';
  if(options.rename) toggleRename();
  if(options.ping) togglePing();
  document.getElementById('rename-prefix').value='JPL';
  document.querySelectorAll('.proto-pill input').forEach(function(cb){
    cb.checked=false;
    cb.parentNode.classList.remove('checked');
  });
  setStep(1);window.scrollTo({top:0,behavior:'smooth'});
}

let toastTimer;
function showToast(msg,type){
  const t=document.getElementById('toast');
  t.textContent=msg;t.className='show '+(type||'');
  clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.className='';},3500);
}
<\/script>
</body>
</html>`;

// ============================================================================
// 2. EDGE API CONTROLLERS (BACKEND)
// ============================================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      // 1. Serve HTML Frontend
      if (request.method === "GET" && (path === '/' || path === '/index.html')) {
        return new Response(HTML_CONTENT, { 
          headers: { ...CORS_HEADERS, 'Content-Type': 'text/html; charset=utf-8' } 
        });
      }

      // 2. API Routes
      if (request.method === "POST" && path === "/api/prepare") {
        return await handlePrepare(request);
      }
      if (request.method === "POST" && path === "/api/create") {
        return await handleCreate(request, env, url.origin);
      }
      if (request.method === "GET" && path.startsWith("/sub/")) {
        return await handleSub(request, env, path);
      }
      
      return new Response("JPL Backend is active 🚀", { headers: CORS_HEADERS });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }
  }
};

/**
 * Expands an array of IPs and/or CIDR ranges into a flat list of individual IPs.
 * CIDR ranges are capped at 256 hosts (/24 or wider) to prevent memory exhaustion.
 */
function expandIPs(entries) {
  const result = [];
  for (const entry of entries) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    if (!trimmed.includes('/')) {
      result.push(trimmed);
      continue;
    }

    // CIDR expansion
    const [baseAddr, prefixStr] = trimmed.split('/');
    const prefix = parseInt(prefixStr, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) {
      result.push(baseAddr); // fallback: treat as plain IP
      continue;
    }

    const hostBits = 32 - prefix;
    // Cap at /24 (256 hosts) to be safe; larger ranges only use first 256 hosts
    const count = Math.min(Math.pow(2, hostBits), 256);

    const parts = baseAddr.split('.').map(Number);
    const baseInt = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
    const networkInt = (baseInt & (0xFFFFFFFF << hostBits)) >>> 0;

    for (let i = 0; i < count; i++) {
      const ipInt = (networkInt + i) >>> 0;
      const ip = [
        (ipInt >>> 24) & 0xFF,
        (ipInt >>> 16) & 0xFF,
        (ipInt >>> 8)  & 0xFF,
         ipInt         & 0xFF,
      ].join('.');
      result.push(ip);
    }
  }
  return result;
}

async function handlePrepare(request) {
  const data = await request.json();
  let rawText = "";

  if (data.subUrl) {
    const res = await fetch(data.subUrl, { headers: { "User-Agent": "v2ray" } });
    if (!res.ok) throw new Error("Fetch failed");
    rawText = await res.text();
    try {
      if (!rawText.includes("://")) rawText = atob(rawText);
    } catch (e) {}
  } else if (data.rawConfigs) {
    rawText = data.rawConfigs;
  }

  const expandedIPs = (data.customIPs && data.customIPs.length > 0)
    ? expandIPs(data.customIPs)
    : [];

  let configs = rawText.split('\n').filter(line => line.trim() !== '');
  let parsedConfigs = [];

  for (let raw of configs) {
    raw = raw.trim();
    if (!raw.includes("://")) continue;

    const protocol = raw.split("://")[0].toLowerCase();
    
    if (data.protocols && data.protocols.length > 0) {
       if (!data.protocols.includes(protocol)) continue;
    }

    let host = "", port = "443", name = "Unknown";
    
    try {
       if (protocol === 'vmess') {
         const vmessData = JSON.parse(atob(raw.replace('vmess://', '')));
         host = vmessData.add || vmessData.sni || vmessData.host;
         port = vmessData.port || "443";
         name = decodeURIComponent(vmessData.ps || "vmess");
       } else {
         const urlObj = new URL(raw);
         host = urlObj.hostname;
         port = urlObj.port || "443";
         name = decodeURIComponent(urlObj.hash.replace('#', '')) || protocol;
       }
    } catch (e) {
       host = "error-parsing";
    }

    if (expandedIPs.length > 0) {
      for (const ip of expandedIPs) {
        let patchedRaw = raw;
        if (protocol === 'vmess') {
          try {
            let vmessData = JSON.parse(atob(raw.replace('vmess://', '')));
            vmessData.add = ip;
            patchedRaw = 'vmess://' + btoa(JSON.stringify(vmessData));
          } catch (e) {}
        } else {
          try {
            const urlObj = new URL(raw);
            urlObj.hostname = ip;
            patchedRaw = urlObj.toString();
          } catch (e) {}
        }
        parsedConfigs.push({ name, host: ip, port, raw: patchedRaw });
      }
    } else {
      parsedConfigs.push({ name, host, port, raw });
    }
  }

  return new Response(JSON.stringify({ configs: parsedConfigs }), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });
}

async function handleCreate(request, env, origin) {
  const data = await request.json();
  let finalRaw = "";
  
  for (let i = 0; i < data.finalConfigs.length; i++) {
    let raw = data.finalConfigs[i];
    
    if (data.renamePrefix) {
       const prefix = data.renamePrefix + " " + (i + 1);
       if (raw.startsWith('vmess://')) {
         try {
           let vmessData = JSON.parse(atob(raw.replace('vmess://', '')));
           vmessData.ps = prefix;
           raw = 'vmess://' + btoa(JSON.stringify(vmessData));
         } catch(e){}
       } else {
         try {
           const urlObj = new URL(raw);
           urlObj.hash = encodeURIComponent(prefix);
           raw = urlObj.toString();
         } catch(e){}
       }
    }
    finalRaw += raw + "\n";
  }

  const id = Math.random().toString(36).substring(2, 10);
  const subLink = origin + "/sub/" + id;
  const ttl = data.ttl || 86400;
  const base64Configs = btoa(finalRaw);

  if (!env.JPL_KV) {
      throw new Error("KV namespace 'JPL_KV' is missing");
  }

  await env.JPL_KV.put(id, base64Configs, { expirationTtl: ttl });

  return new Response(JSON.stringify({
    id,
    subLink,
    rawConfigs: finalRaw,
    count: data.finalConfigs.length,
    originalCount: data.originalCount,
    expiresIn: ttl
  }), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });
}

async function handleSub(request, env, pathname) {
  const id = pathname.split("/sub/")[1];
  if (!id) return new Response("Invalid ID", { status: 400, headers: CORS_HEADERS });

  if (!env.JPL_KV) return new Response("KV not configured", { status: 500, headers: CORS_HEADERS });

  const data = await env.JPL_KV.get(id);
  if (!data) return new Response("Not found or expired", { status: 404, headers: CORS_HEADERS });

  return new Response(data, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}
