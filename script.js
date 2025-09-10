(function () {
  const state = { devices: [], telemetryOn: false, telemetryInterval: null, rules: [] };

  const $ = (sel) => document.querySelector(sel);
  const devicesTableBody = $('#devicesTable tbody');
  const telemetryLog = $('#telemetryLog');
  const activeDevicesEl = $('#activeDevices');
  const avgLatencyEl = $('#avgLatency');
  const miniChart = document.getElementById('miniChart');
  const ctx = miniChart.getContext('2d');

  // Devices
  function createDevice() {
    const id = 'dev-' + Math.random().toString(36).slice(2, 9);
    const d = { id, name: 'Sensor ' + (state.devices.length + 1), status: 'online', lastSeen: new Date(), latency: Math.round(Math.random() * 200) };
    state.devices.push(d);
    renderDevices(); updateMetrics();
  }
  function removeDevice() { state.devices.pop(); renderDevices(); updateMetrics(); }
  function renderDevices() {
    devicesTableBody.innerHTML = '';
    state.devices.forEach(d => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${d.id}</td><td>${d.name}</td><td>${d.status}</td><td>${d.lastSeen.toLocaleTimeString()}</td><td><button class='btn small' data-id='${d.id}'>Ping</button></td>`;
      devicesTableBody.appendChild(tr);
    });
  }
  function updateMetrics() {
    activeDevicesEl.textContent = state.devices.length;
    const avg = state.devices.length ? Math.round(state.devices.reduce((s, d) => s + d.latency, 0) / state.devices.length) : 0;
    avgLatencyEl.textContent = avg + ' ms';
  }

  // Telemetry
  function pushTelemetry() {
    if (!state.devices.length) return;
    const d = state.devices[Math.floor(Math.random() * state.devices.length)];
    const temp = (20 + Math.random() * 20).toFixed(2);
    const ts = new Date();
    const line = document.createElement('div');
    line.textContent = `${ts.toLocaleTimeString()} | ${d.id} | temp=${temp}°C | lat=${d.latency}ms`;
    telemetryLog.prepend(line);
    d.lastSeen = ts; d.latency = Math.max(1, Math.round(d.latency + (Math.random() * 40 - 20)));
    renderDevices(); updateMetrics(); drawMiniChart(parseFloat(temp)); checkRules(parseFloat(temp), d);
  }

  // Sparkline
  const sparkData = [];
  function drawMiniChart(v) {
    sparkData.push(v);
    if (sparkData.length > 30) sparkData.shift();
    const w = miniChart.width, h = miniChart.height;
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath(); ctx.strokeStyle = '#0066ff';
    const max = Math.max(...sparkData, 1);
    sparkData.forEach((val, i) => {
      const x = (i / (sparkData.length - 1 || 1)) * w;
      const y = h - (val / max) * h;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  // Rules
  function checkRules(value, device) {
    state.rules.forEach(rule => {
      let ok = false;
      if (rule.cond === '>' && value > rule.val) ok = true;
      if (rule.cond === '<' && value < rule.val) ok = true;
      if (rule.cond === '==' && value == rule.val) ok = true;
      if (ok) telemetryLog.prepend(document.createTextNode(`⚠ Rule ${rule.name} triggered on ${device.id}`));
    });
  }
  $('#ruleForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#ruleName').value || 'rule';
    const cond = $('#ruleCondition').value;
    const val = parseFloat($('#ruleValue').value);
    state.rules.push({ name, cond, val });
    renderRules();
  });
  function renderRules() {
    const ruleList = $('#ruleList'); ruleList.innerHTML = '';
    state.rules.forEach((r, i) => {
      const li = document.createElement('li');
      li.textContent = `${r.name} — ${r.cond} ${r.val}`;
      const b = document.createElement('button'); b.textContent = 'delete';
      b.addEventListener('click', () => { state.rules.splice(i, 1); renderRules(); });
      li.appendChild(b); ruleList.appendChild(li);
    });
  }

  // Controls
  $('#addDevice').addEventListener('click', createDevice);
  $('#removeDevice').addEventListener('click', removeDevice);
  $('#startStream').addEventListener('click', () => { if (!state.telemetryOn) { state.telemetryOn = true; state.telemetryInterval = setInterval(pushTelemetry, 1200); } });
  $('#stopStream').addEventListener('click', () => { clearInterval(state.telemetryInterval); state.telemetryOn = false; });
  $('#clearLog').addEventListener('click', () => { telemetryLog.innerHTML = ''; });

  devicesTableBody.addEventListener('click', ev => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    telemetryLog.prepend(document.createTextNode(`Pinged ${btn.dataset.id}`));
  });

  // Theme toggle
  const themeToggle = $('#themeToggle');
  function setTheme(t) {
    if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('se_theme', t);
  }
  themeToggle.addEventListener('click', () => { setTheme(localStorage.getItem('se_theme') === 'dark' ? 'light' : 'dark'); });
  setTheme(localStorage.getItem('se_theme') || 'light');

  $('#subscribeForm').addEventListener('submit', e => { e.preventDefault(); alert('Subscribed!'); });

  // Seed
  for (let i = 0; i < 3; i++) createDevice();
  drawMiniChart(0);
})();
