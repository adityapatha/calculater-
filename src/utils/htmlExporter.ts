// Generator that bundles the Cash Calculator into a single self-contained offline HTML file
import { AppSettings, DenominationCount } from '../types';

export function generateSingleFileHtml(
  settings: AppSettings,
  currentCounts: DenominationCount
): string {
  const countsJson = JSON.stringify(currentCounts);
  const settingsJson = JSON.stringify(settings);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Cash Calculator & Daily Expenses (Offline)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #090d16;
      color: #f8fafc;
      padding: 16px;
      min-height: 100vh;
    }
    .container { max-width: 760px; margin: 0 auto; }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 16px;
      border-bottom: 1px solid #1e293b;
      margin-bottom: 20px;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon {
      width: 40px; height: 40px; border-radius: 12px;
      background: linear-gradient(135deg, #10b981, #06b6d4);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: bold; color: white;
    }
    .title { font-size: 18px; font-weight: 800; color: #fff; }
    .subtitle { font-size: 12px; color: #94a3b8; }
    .summary-card {
      background: linear-gradient(135deg, #0f172a, #0b1329);
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
    }
    .total-title { font-size: 12px; text-transform: uppercase; color: #34d399; font-weight: 700; letter-spacing: 0.5px; }
    .grand-total { font-size: 38px; font-weight: 900; font-family: monospace; color: #ffffff; margin: 6px 0; }
    .amount-words { font-size: 13px; color: #6ee7b7; font-style: italic; margin-bottom: 16px; line-height: 1.4; }
    .stats-row { display: flex; gap: 10px; margin-bottom: 16px; }
    .stat-badge {
      flex: 1; background: #1e293b; border: 1px solid #334155;
      border-radius: 12px; padding: 10px; text-align: center;
    }
    .stat-badge .lbl { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 600; }
    .stat-badge .val { font-size: 18px; font-weight: 800; font-family: monospace; color: #fff; margin-top: 2px; }
    .btn-row { display: flex; gap: 8px; flex-wrap: wrap; }
    button {
      cursor: pointer; border: none; outline: none; border-radius: 10px;
      font-weight: 600; font-size: 12px; padding: 8px 14px;
      transition: all 0.15s ease;
    }
    .btn-primary { background: #10b981; color: white; }
    .btn-primary:hover { background: #059669; }
    .btn-secondary { background: #1e293b; color: #cbd5e1; border: 1px solid #334155; }
    .btn-secondary:hover { background: #334155; }
    .btn-voice { background: linear-gradient(135deg, #10b981, #06b6d4); color: white; font-weight: 700; }
    .btn-danger { background: #450a0a; color: #fca5a5; border: 1px solid #7f1d1d; }
    .btn-danger:hover { background: #7f1d1d; }
    .rows { display: flex; flex-direction: column; gap: 10px; }
    .row {
      display: flex; align-items: center; justify-content: space-between;
      background: #0f172a; border: 1px solid #1e293b;
      border-radius: 14px; padding: 12px 16px;
    }
    .denom-badge {
      font-family: monospace; font-weight: 800; font-size: 15px;
      padding: 6px 12px; border-radius: 8px; min-width: 80px; text-align: center;
    }
    .stepper { display: flex; align-items: center; gap: 6px; }
    .step-btn {
      width: 34px; height: 34px; border-radius: 8px;
      background: #1e293b; color: #cbd5e1; font-weight: bold; font-size: 14px;
      display: flex; align-items: center; justify-content: center; border: 1px solid #334155;
    }
    .step-btn:hover { background: #334155; color: white; }
    .count-input {
      width: 80px; height: 34px; border-radius: 8px;
      background: #020617; border: 1px solid #334155; color: #34d399;
      font-family: monospace; font-weight: 700; font-size: 16px; text-align: center;
    }
    .subtotal { font-family: monospace; font-weight: 800; font-size: 16px; color: #fff; min-width: 110px; text-align: right; }
    
    /* Voice Modal */
    .modal {
      display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85);
      align-items: center; justify-content: center; z-index: 100; padding: 16px;
    }
    .modal-content {
      background: #0f172a; border: 1px solid #334155; border-radius: 20px;
      max-width: 480px; width: 100%; padding: 24px; color: #fff;
    }
    .mic-circle {
      width: 64px; height: 64px; border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #06b6d4);
      margin: 16px auto; display: flex; align-items: center; justify-content: center;
      font-size: 26px; cursor: pointer; box-shadow: 0 0 25px rgba(16,185,129,0.4);
    }
    .mic-circle.listening {
      background: #ef4444; animation: pulse 1s infinite alternate;
    }
    @keyframes pulse { from { transform: scale(1); } to { transform: scale(1.1); } }
    .voice-text {
      width: 100%; background: #020617; border: 1px solid #334155;
      border-radius: 12px; color: #fff; padding: 10px; font-size: 14px; margin: 10px 0;
    }
    @media print {
      body { background: white !important; color: black !important; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header no-print">
      <div class="brand">
        <div class="brand-icon">₹</div>
        <div>
          <div class="title">${settings.businessName || 'Cash Calculator Pro'}</div>
          <div class="subtitle">Offline Single-File App • ${settings.cashierName || 'Counter'}</div>
        </div>
      </div>
      <div>
        <button class="btn-voice" onclick="openVoiceModal()">🎤 Voice Count</button>
      </div>
    </div>

    <!-- Summary Card -->
    <div class="summary-card">
      <div class="total-title">Total Physical Cash</div>
      <div class="grand-total" id="grandTotal">₹ 0</div>
      <div class="amount-words" id="amountWords">Zero Only</div>

      <div class="stats-row">
        <div class="stat-badge">
          <div class="lbl">Notes</div>
          <div class="val" id="totalNotes">0</div>
        </div>
        <div class="stat-badge">
          <div class="lbl">Coins</div>
          <div class="val" id="totalCoins">0</div>
        </div>
        <div class="stat-badge">
          <div class="lbl">Total Pieces</div>
          <div class="val" id="totalPieces">0</div>
        </div>
      </div>

      <div class="btn-row no-print">
        <button class="btn-primary" onclick="copySummary()">📋 Copy Summary</button>
        <button class="btn-secondary" onclick="window.print()">🖨️ Print Receipt</button>
        <button class="btn-danger" onclick="resetAll()">🔄 Reset All</button>
      </div>
    </div>

    <!-- Denominations Table -->
    <div class="rows" id="denomRows"></div>
  </div>

  <!-- Voice Modal -->
  <div class="modal" id="voiceModal">
    <div class="modal-content">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h3 style="font-size:16px;">🎤 Voice-Typing Cash Counter</h3>
        <button class="btn-secondary" onclick="closeVoiceModal()">✕</button>
      </div>
      <div class="mic-circle" id="micButton" onclick="toggleListening()">🎤</div>
      <p style="text-align:center; font-size:12px; color:#94a3b8;" id="micStatus">Tap mic and say: "200 notes of 500 and 52 notes of 100"</p>
      
      <textarea id="voiceInput" rows="2" class="voice-text" placeholder="Or type/paste speech here..."></textarea>
      
      <div style="display:flex; gap:8px; margin-top:12px;">
        <button class="btn-primary" style="flex:1;" onclick="applyVoiceText()">Apply to Counter</button>
        <button class="btn-secondary" onclick="closeVoiceModal()">Cancel</button>
      </div>
    </div>
  </div>

  <script>
    const DENOMINATIONS = [
      { val: 2000, label: "₹ 2000", type: "note", color: "#db2777" },
      { val: 500, label: "₹ 500", type: "note", color: "#65a30d" },
      { val: 200, label: "₹ 200", type: "note", color: "#ea580c" },
      { val: 100, label: "₹ 100", type: "note", color: "#0284c7" },
      { val: 50, label: "₹ 50", type: "note", color: "#06b6d4" },
      { val: 20, label: "₹ 20", type: "note", color: "#eab308" },
      { val: 10, label: "₹ 10", type: "note", color: "#b45309" },
      { val: 5, label: "₹ 5", type: "coin", color: "#059669" },
      { val: 2, label: "₹ 2", type: "coin", color: "#94a3b8" },
      { val: 1, label: "₹ 1", type: "coin", color: "#d97706" }
    ];

    let counts = ${countsJson};

    function renderRows() {
      const container = document.getElementById('denomRows');
      container.innerHTML = '';
      DENOMINATIONS.forEach(d => {
        const count = counts[d.val] || 0;
        const subtotal = d.val * count;
        
        const row = document.createElement('div');
        row.className = 'row';
        row.innerHTML = \`
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="denom-badge" style="background:\${d.color}25; color:\${d.color}; border:1.5px solid \${d.color}66;">\${d.label}</div>
            <span style="font-size:11px; color:#64748b; text-transform:uppercase;">\${d.type}</span>
          </div>
          <div class="stepper no-print">
            <button class="step-btn" onclick="adjustCount(\${d.val}, -5)">-5</button>
            <button class="step-btn" onclick="adjustCount(\${d.val}, -1)">-</button>
            <input type="number" class="count-input" value="\${count === 0 ? '' : count}" placeholder="0" onchange="setCount(\${d.val}, this.value)" />
            <button class="step-btn" onclick="adjustCount(\${d.val}, 1)">+</button>
            <button class="step-btn" onclick="adjustCount(\${d.val}, 5)">+5</button>
            \${d.type === 'note' ? \`<button class="step-btn" style="width:auto; padding:0 8px; font-size:11px;" onclick="adjustCount(\${d.val}, 100)">+100</button>\` : ''}
          </div>
          <div class="subtotal">₹ \${subtotal.toLocaleString('en-IN')}</div>
        \`;
        container.appendChild(row);
      });
      calculateTotals();
    }

    function setCount(val, countStr) {
      const num = Math.max(0, parseInt(countStr, 10) || 0);
      counts[val] = num;
      renderRows();
      saveCounts();
    }

    function adjustCount(val, delta) {
      const cur = counts[val] || 0;
      counts[val] = Math.max(0, cur + delta);
      renderRows();
      saveCounts();
    }

    function resetAll() {
      if (confirm("Reset all counts to 0?")) {
        counts = {};
        renderRows();
        saveCounts();
      }
    }

    function calculateTotals() {
      let total = 0, notes = 0, coins = 0;
      DENOMINATIONS.forEach(d => {
        const c = counts[d.val] || 0;
        total += d.val * c;
        if (d.type === 'note') notes += c; else coins += c;
      });

      document.getElementById('grandTotal').innerText = '₹ ' + total.toLocaleString('en-IN');
      document.getElementById('totalNotes').innerText = notes;
      document.getElementById('totalCoins').innerText = coins;
      document.getElementById('totalPieces').innerText = notes + coins;
      document.getElementById('amountWords').innerText = numberToWordsIndian(total);
    }

    function numberToWordsIndian(num) {
      if (num === 0) return 'Zero Only';
      const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      function convertBelowThousand(n) {
        let str = '';
        if (n >= 100) { str += a[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
        if (n >= 20) { str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + a[n % 10] : '') + ' '; }
        else if (n > 0) { str += a[n] + ' '; }
        return str.trim();
      }
      let cr = Math.floor(num / 10000000); num %= 10000000;
      let lk = Math.floor(num / 100000); num %= 100000;
      let th = Math.floor(num / 1000); num %= 1000;
      let res = '';
      if (cr > 0) res += convertBelowThousand(cr) + ' Crore ';
      if (lk > 0) res += convertBelowThousand(lk) + ' Lakh ';
      if (th > 0) res += convertBelowThousand(th) + ' Thousand ';
      if (num > 0) res += convertBelowThousand(num) + ' ';
      return (res.trim() ? res.trim() + ' Only' : 'Zero Only');
    }

    function saveCounts() {
      try { localStorage.setItem('offline_cash_calc_counts', JSON.stringify(counts)); } catch(e){}
    }

    function copySummary() {
      let txt = "*CASH SUMMARY*\\n--------------------\\n";
      DENOMINATIONS.forEach(d => {
        const c = counts[d.val] || 0;
        if (c > 0) txt += \`\${d.label.padEnd(8)} x \${c} = ₹ \${(d.val * c).toLocaleString('en-IN')}\\n\`;
      });
      txt += "--------------------\\n";
      txt += document.getElementById('grandTotal').innerText + "\\n" + document.getElementById('amountWords').innerText;
      navigator.clipboard.writeText(txt);
      alert("Summary copied to clipboard!");
    }

    // Voice recognition
    let recognition = null;
    let isListening = false;
    function openVoiceModal() {
      document.getElementById('voiceModal').style.display = 'flex';
      startVoice();
    }
    function closeVoiceModal() {
      document.getElementById('voiceModal').style.display = 'none';
      stopVoice();
    }
    function startVoice() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        document.getElementById('micStatus').innerText = "Speech API not supported in this browser. Please type below.";
        return;
      }
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';
      recognition.onstart = () => {
        isListening = true;
        document.getElementById('micButton').classList.add('listening');
        document.getElementById('micStatus').innerText = "Listening... say '200 notes of 500 and 52 notes of 100'";
      };
      recognition.onresult = (e) => {
        let t = '';
        for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + ' ';
        document.getElementById('voiceInput').value = t.trim();
      };
      recognition.onerror = () => stopVoice();
      recognition.onend = () => stopVoice();
      try { recognition.start(); } catch(e){}
    }
    function stopVoice() {
      if (recognition) { try { recognition.stop(); } catch(e){} }
      isListening = false;
      document.getElementById('micButton').classList.remove('listening');
      document.getElementById('micStatus').innerText = "Tap mic to speak";
    }
    function toggleListening() {
      if (isListening) stopVoice(); else startVoice();
    }
    function applyVoiceText() {
      const text = document.getElementById('voiceInput').value.toLowerCase();
      // Parse patterns like "200 notes of 500" or "500 ke 40"
      const parts = text.split(/,|and|aur/);
      parts.forEach(p => {
        const m1 = p.match(/(\\d+)\\s*(?:notes?|coins?|pcs?)?\\s*(?:of|ke|ka)?\\s*(\\d+)/);
        if (m1) {
          const num1 = parseInt(m1[1], 10);
          const num2 = parseInt(m1[2], 10);
          if (DENOMINATIONS.some(d => d.val === num2)) {
            counts[num2] = num1;
          } else if (DENOMINATIONS.some(d => d.val === num1)) {
            counts[num1] = num2;
          }
        }
      });
      renderRows();
      saveCounts();
      closeVoiceModal();
    }

    // Load saved
    try {
      const saved = localStorage.getItem('offline_cash_calc_counts');
      if (saved) counts = JSON.parse(saved);
    } catch(e){}

    renderRows();
  </script>
</body>
</html>`;
}

export function downloadStandaloneHtml(settings: AppSettings, currentCounts: DenominationCount) {
  const htmlContent = generateSingleFileHtml(settings, currentCounts);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Cash_Calculator_${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
