---
title: Little Endian Converter (32-bit)
draft: false
tags:
---

Use the tool below to convert a sequence of hexadecimal bytes into 32‑bit little‑endian words. You may upload a text file or paste hexadecimal bytes directly. An example input file is available: [example-input.txt](./example-input.txt).

<div id="converter-container" style="max-width: 800px; margin: 2rem auto;">

  <div style="margin-bottom: 1rem;">
    <label for="file-input" style="display: block; margin-bottom: 0.25rem; font-weight: 600;">Upload text file</label>
    <input type="file" id="file-input" accept=".txt,.hex,.mem" style="padding: 0.5rem; border: 1px solid var(--gray); border-radius: 4px; width: 100%;">
  </div>

  <div style="margin-bottom: 1rem;">
    <label for="input-text" style="display: block; margin-bottom: 0.25rem; font-weight: 600;">Or paste hexadecimal bytes</label>
    <textarea id="input-text" rows="8" placeholder="Example (space-separated bytes): 12 34 56 78 AB CD EF 00" style="width: 100%; padding: 0.75rem; font-family: monospace; border: 1px solid var(--gray); border-radius: 4px; background: var(--light); color: var(--dark);"></textarea>
  </div>

  <div style="display:flex; gap: 0.75rem; margin-bottom: 1rem;">
    <button id="convert-btn" style="flex:1; padding: 0.6rem 1rem; background:var(--secondary); color:#fff; border-radius:4px; border:none; font-weight:600; cursor:pointer;">Convert</button>
    <button id="download-btn" type="button" style="flex:1; padding: 0.6rem 1rem; background:var(--tertiary); color:#fff; border-radius:4px; border:none; font-weight:600; cursor:pointer;" disabled>Download result</button>
  </div>

  <div style="margin-bottom: 1rem;">
    <label for="output-text" style="display:block; margin-bottom:0.25rem; font-weight:600;">Result (32‑bit little endian)</label>
    <textarea id="output-text" rows="8" readonly style="width:100%; padding:0.75rem; font-family:monospace; border:1px solid var(--gray); border-radius:4px; background:var(--lightgray); color:var(--dark);"></textarea>
  </div>

  <div id="status-message" style="padding:0.6rem; border-radius:4px; display:none;"></div>

</div>

<!-- External SPA-preserved script to avoid HTML-escaping of inline JS during Markdown rendering -->
<script src="./static/little-endian-converter.js" type="application/javascript" spa-preserve></script>

# Description

The converter groups individual bytes in sets of four (32 bits) and reverses their byte order to produce 32‑bit little‑endian words.

## Example

Input (bytes):
```
12 34 56 78 AB CD EF 00
```

Process:
- Group 1: `12 34 56 78` → reversed → `78 56 34 12` → `78563412`
- Group 2: `AB CD EF 00` → reversed → `00 EF CD AB` → `00EFCDAB`

Output (32‑bit little‑endian words):
```
78563412
00EFCDAB
```

## Accepted input formats
- Space‑separated bytes: `12 34 56 78 AB CD EF 00`
- Bytes on separate lines:
  ```
  12
  34
  56
  78
  ```
- Mixed (spaces and newlines): `12 34 56\n78 AB\nCD EF 00`
- Optional `0x` prefix: `0x12 0x34 0x56 0x78`
- Single‑digit bytes are accepted and will be padded with a leading zero (e.g. `A` → `0A`).

## Output format
- One 32‑bit word per line
- Uppercase hexadecimal
- Incomplete final word is padded with `00`

## Typical use cases
- ROM memory initialization for RISC‑V processors
- Preparing `.mem` files for simulators (Vivado, ModelSim, etc.)
- Converting instruction dumps or binary listings to little‑endian format

> [!exclamation] Keyboard shortcuts
> **Ctrl + Enter** inside the input area: perform conversion
