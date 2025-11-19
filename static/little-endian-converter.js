(function() {
  const fileInput = document.getElementById('file-input');
  const inputText = document.getElementById('input-text');
  const outputText = document.getElementById('output-text');
  const convertBtn = document.getElementById('convert-btn');
  const downloadBtn = document.getElementById('download-btn');
  const statusMessage = document.getElementById('status-message');

  let convertedData = '';

  function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.style.display = 'block';
    statusMessage.style.background = type === 'error' ? '#fff0f0' : type === 'success' ? '#f0fff0' : '#f0f8ff';
    statusMessage.style.color = type === 'error' ? '#900' : type === 'success' ? '#060' : '#036';
    if (type !== 'error') {
      setTimeout(() => { statusMessage.style.display = 'none'; }, 3000);
    }
  }

  function convert() {
    const input = inputText.value.trim();
    if (!input) {
      showStatus('Please enter hexadecimal bytes or upload a file.', 'error');
      return;
    }

    try {
      const bytes = input
        .replace(/0x/gi, '')
        .replace(/[^0-9A-Fa-f]/g, ' ')
        .split(/\s+/)
        .filter(b => b.length > 0)
        .map(b => {
          if (b.length === 1) return '0' + b;
          if (b.length === 2) return b;
          throw new Error(`Invalid byte: ${b} (must be 1 or 2 hex digits)`);
        });

      if (bytes.length === 0) throw new Error('No valid hexadecimal bytes found.');

      const results = [];
      for (let i = 0; i < bytes.length; i += 4) {
        const group = bytes.slice(i, i + 4);
        while (group.length < 4) group.push('00');
        const littleEndian = group.reverse().join('').toUpperCase();
        results.push(littleEndian);
      }

      convertedData = results.join('\n');
      outputText.value = convertedData;
      downloadBtn.disabled = false;
      showStatus(`Conversion completed: ${bytes.length} bytes → ${results.length} 32-bit words.`, 'success');

    } catch (err) {
      showStatus(err.message || 'Conversion error.', 'error');
      outputText.value = '';
      downloadBtn.disabled = true;
    }
  }

  fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      inputText.value = ev.target.result;
      showStatus(`File "${file.name}" loaded.`, 'success');
    };
    reader.onerror = function() { showStatus('Error reading file.', 'error'); };
    reader.readAsText(file);
  });

  convertBtn.addEventListener('click', convert);

  downloadBtn.addEventListener('click', function() {
    if (!convertedData) return;
    const blob = new Blob([convertedData], { type: 'text/plain' });
    let url = null;
    try { url = URL.createObjectURL(blob); } catch (e) { url = null; }
    const a = document.createElement('a'); a.style.display='none'; a.download = 'little_endian_output.txt'; a.rel='noopener'; document.body.appendChild(a);

    function cleanup(u) { try { document.body.removeChild(a); } catch(e){} if(u && u.startsWith('blob:')) try{ URL.revokeObjectURL(u); } catch(e){} showStatus('File downloaded.', 'success'); }

    if (url) {
      a.href = url;
      try { a.click(); setTimeout(() => cleanup(url), 150); return; } catch(e) {}
    }

    try { const dataUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent(convertedData); a.href = dataUrl; a.click(); setTimeout(() => cleanup(dataUrl), 150); } catch (err) { cleanup(null); showStatus('Error generating download.', 'error'); }
  });

  inputText.addEventListener('keydown', function(e) { if (e.ctrlKey && e.key === 'Enter') convert(); });
})();
