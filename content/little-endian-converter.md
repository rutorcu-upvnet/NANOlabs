---
title: "Little Endian Converter (32-bit)"
description: "Convert text files to little endian 32-bit format for RISC-V processor memory initialization"
---

# Little Endian Converter (32-bit)

This tool converts text files with hexadecimal values to 32-bit little endian format, useful for initializing memories in RISC-V processors.

## Interactive Converter

> 💡 **Tip:** Download the [example file](./example-input.txt) to test the tool

<div id="converter-container" style="max-width: 800px; margin: 2rem auto;">
  
  <div style="margin-bottom: 1.5rem;">
    <label for="file-input" style="display: block; margin-bottom: 0.5rem; font-weight: bold;">
      📂 Upload text file:
    </label>
    <input type="file" id="file-input" accept=".txt,.hex,.mem" style="padding: 0.5rem; border: 1px solid var(--gray); border-radius: 4px; width: 100%;">
  </div>

  <div style="margin-bottom: 1.5rem;">
    <label for="input-text" style="display: block; margin-bottom: 0.5rem; font-weight: bold;">
      ✏️ Or paste your text here (hexadecimal bytes):
    </label>
    <textarea id="input-text" rows="10" placeholder="Example (space-separated bytes):&#10;12 34 56 78 AB CD EF 00&#10;&#10;Or on separate lines:&#10;12&#10;34&#10;56&#10;78" style="width: 100%; padding: 0.75rem; font-family: monospace; border: 1px solid var(--gray); border-radius: 4px; background: var(--light); color: var(--dark);"></textarea>
  </div>

  <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
    <button id="convert-btn" style="flex: 1; padding: 0.75rem 1.5rem; background: var(--secondary); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
      🔄 Convert to Little Endian
    </button>
    <button id="download-btn" type="button" style="flex: 1; padding: 0.75rem 1.5rem; background: var(--tertiary); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;" disabled>
      💾 Download Result
    </button>
  </div>

  <div style="margin-bottom: 1.5rem;">
    <label for="output-text" style="display: block; margin-bottom: 0.5rem; font-weight: bold;">
      📤 Result (Little Endian 32-bit):
    </label>
    <textarea id="output-text" rows="10" readonly style="width: 100%; padding: 0.75rem; font-family: monospace; border: 1px solid var(--gray); border-radius: 4px; background: var(--lightgray); color: var(--dark);"></textarea>
  </div>

  <div id="status-message" style="padding: 0.75rem; border-radius: 4px; display: none;"></div>

</div>

<script>
(function() {
  const fileInput = document.getElementById('file-input');
  const inputText = document.getElementById('input-text');
  const outputText = document.getElementById('output-text');
  const convertBtn = document.getElementById('convert-btn');
  const downloadBtn = document.getElementById('download-btn');
  const statusMessage = document.getElementById('status-message');

  let convertedData = '';

  // Función para mostrar mensajes de estado
  function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.style.display = 'block';
    statusMessage.style.background = type === 'error' ? '#fee' : type === 'success' ? '#efe' : '#eef';
    statusMessage.style.color = type === 'error' ? '#c00' : type === 'success' ? '#0a0' : '#00a';
    
    if (type !== 'error') {
      setTimeout(() => {
        statusMessage.style.display = 'none';
      }, 3000);
    }
  }

  // Función principal de conversión
  function convert() {
    const input = inputText.value.trim();
    
    if (!input) {
      showStatus('❌ Please enter hexadecimal bytes or upload a file', 'error');
      return;
    }

    try {
      // Extraer todos los bytes (valores hexadecimales de 2 dígitos)
      // Puede estar separado por espacios, saltos de línea, comas, etc.
      const bytes = input
        .replace(/0x/gi, '')  // Eliminar prefijos 0x
        .replace(/[^0-9A-Fa-f]/g, ' ')  // Reemplazar no-hex por espacios
        .split(/\s+/)  // Dividir por espacios
        .filter(b => b.length > 0)  // Filtrar vacíos
        .map(b => {
          // Asegurar que cada byte tenga 2 dígitos
          if (b.length === 1) return '0' + b;
          if (b.length === 2) return b;
          throw new Error(`Invalid byte: ${b} (must be 1 or 2 hex digits)`);
        });
      
      if (bytes.length === 0) {
        throw new Error('No valid hexadecimal bytes found');
      }
      
      // Agrupar de 4 en 4 bytes (32 bits)
      const results = [];
      for (let i = 0; i < bytes.length; i += 4) {
        const group = bytes.slice(i, i + 4);
        
        // Si el grupo tiene menos de 4 bytes, rellenar con 00
        while (group.length < 4) {
          group.push('00');
        }
        
        // Invertir el orden (little endian)
        // [12, 34, 56, 78] -> [78, 56, 34, 12] -> "78563412"
        const littleEndian = group.reverse().join('').toUpperCase();
        results.push(littleEndian);
      }
      
      convertedData = results.join('\n');
      outputText.value = convertedData;
      downloadBtn.disabled = false;
      
      const totalBytes = bytes.length;
      const totalWords = results.length;
      showStatus(`✅ Conversion completed: ${totalBytes} bytes → ${totalWords} 32-bit words`, 'success');
      
    } catch (error) {
      showStatus(`❌ ${error.message}`, 'error');
      outputText.value = '';
      downloadBtn.disabled = true;
    }
  }

  // Manejar carga de archivo
  fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
      inputText.value = event.target.result;
      showStatus(`📂 File "${file.name}" loaded successfully`, 'success');
    };
    reader.onerror = function() {
      showStatus('❌ Error reading file', 'error');
    };
    reader.readAsText(file);
  });

  // Botón de conversión
  convertBtn.addEventListener('click', convert);

  // Botón de descarga
  downloadBtn.addEventListener('click', function() {
    if (!convertedData) return;

    const blob = new Blob([convertedData], { type: 'text/plain' });
    let url = null;
    try {
      url = URL.createObjectURL(blob);
    } catch (e) {
      url = null;
    }

    const a = document.createElement('a');
    a.style.display = 'none';
    a.download = 'little_endian_output.txt';
    a.rel = 'noopener';
    document.body.appendChild(a);

    function cleanup(u) {
      try { document.body.removeChild(a); } catch (e) {}
      if (u && u.startsWith('blob:')) try { URL.revokeObjectURL(u); } catch (e) {}
      showStatus('💾 File downloaded', 'success');
    }

    if (url) {
      a.href = url;
      try {
        a.click();
        setTimeout(() => cleanup(url), 150);
        return;
      } catch (e) {
        // fallthrough to data: fallback
      }
    }

    // Fallback: data: URL (safer when blob/object URL is blocked or in some hosting contexts)
    try {
      const dataUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent(convertedData);
      a.href = dataUrl;
      a.click();
      setTimeout(() => cleanup(dataUrl), 150);
    } catch (err) {
      cleanup(null);
      showStatus('❌ Error generating download', 'error');
    }
  });

  // Permitir conversión con Enter en el textarea
  inputText.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
      convert();
    }
  });
})();
</script>

<style>
#converter-container button:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  transition: all 0.2s;
}

#converter-container button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

#converter-container textarea:focus,
#converter-container input:focus {
  outline: 2px solid var(--secondary);
  outline-offset: 2px;
}
</style>

## How It Works

The tool groups individual bytes in sets of 4 and reverses their order for **Little Endian** (32-bit) format:

### Example:
- **Input (individual bytes):**
  ```
  12 34 56 78 AB CD EF 00
  ```
  
- **Process:**
  - Group 1: `12 34 56 78` → reverse → `78 56 34 12` → **`78563412`**
  - Group 2: `AB CD EF 00` → reverse → `00 EF CD AB` → **`00EFCDAB`**

- **Output (32-bit Little Endian words):**
  ```
  78563412
  00EFCDAB
  ```

### Accepted Input Format:
- **Space-separated bytes:** `12 34 56 78 AB CD EF 00`
- **Bytes on separate lines:**
  ```
  12
  34
  56
  78
  ```
- **Mixed:** `12 34 56\n78 AB\nCD EF 00`
- **With 0x prefix (optional):** `0x12 0x34 0x56 0x78`
- **Single-digit bytes:** padded with 0 (e.g., `A` → `0A`)

### Output Format:
- One line per 4 bytes (32-bit word)
- Uppercase hexadecimal format
- Remaining bytes are padded with `00`

### Use Cases:
- ROM memory initialization for RISC-V processors
- Preparing `.mem` files for simulators (Vivado, ModelSim, etc.)
- Converting compiled instruction files to little endian format
- Processing memory dumps

## Keyboard Shortcuts
- **Ctrl + Enter** in the input area: automatically convert

---

*Tool developed for NANOlabs practices*
