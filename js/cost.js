// ==UserScript==
// @name         Peculiar-Copy
// @namespace    http://tampermonkey.net/
// @version      2026-10-06
// @description  try to take over the world!
// @author       You
// @match        https://peculiar-inventory-na.aka.corp.amazon.com/YHM1/report/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Key names for local storage
    const STORAGE_KEY = 'container_report_stop_value';
    const AUTO_KEY = 'container_report_auto_mode';
    const SHIFT_KEY = 'container_report_shift_end';

    // 1. Create a floating UI container
    const panel = document.createElement('div');
    panel.style.position = 'fixed';
    panel.style.top = '70px';
    panel.style.right = '20%';
    panel.style.zIndex = '99999';
    panel.style.backgroundColor = '#ffffff';
    panel.style.border = '2px solid #007bff';
    panel.style.borderRadius = '6px';
    panel.style.padding = '10px';
    panel.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    panel.style.display = 'flex';
    panel.style.gap = '8px';
    panel.style.alignItems = 'center';
    panel.style.fontFamily = 'Arial, sans-serif';

    // 2. Create Dynamic Shift End Time Picker
    const shiftLabel = document.createElement('label');
    shiftLabel.style.display = 'flex';
    shiftLabel.style.alignItems = 'center';
    shiftLabel.style.gap = '3px';
    shiftLabel.style.fontSize = '12px';
    shiftLabel.style.fontWeight = 'bold';
    shiftLabel.style.color = '#333';

    const shiftInput = document.createElement('input');
    shiftInput.type = 'time';
    shiftInput.style.padding = '4px';
    shiftInput.style.border = '1px solid #ccc';
    shiftInput.style.borderRadius = '4px';
    shiftInput.style.fontSize = '12px';

    const savedShift = localStorage.getItem(SHIFT_KEY);
    shiftInput.value = savedShift !== null ? savedShift : '18:30'; // Default 6:30 PM

    shiftLabel.appendChild(document.createTextNode('Shift: '));
    shiftLabel.appendChild(shiftInput);

    // 3. Create Main Input Field (Stop value)
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Stop value';
    input.style.width = '110px';
    input.style.padding = '6px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '4px';
    input.style.fontSize = '12px';

    // 4. Create Auto Checkbox & Label
    const autoContainer = document.createElement('label');
    autoContainer.style.display = 'flex';
    autoContainer.style.alignItems = 'center';
    autoContainer.style.gap = '4px';
    autoContainer.style.fontSize = '12px';
    autoContainer.style.cursor = 'pointer';
    autoContainer.style.fontWeight = 'bold';
    autoContainer.style.color = '#333';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    
    const savedAutoMode = localStorage.getItem(AUTO_KEY);
    checkbox.checked = savedAutoMode !== null ? savedAutoMode === 'true' : true;

    autoContainer.appendChild(checkbox);
    autoContainer.appendChild(document.createTextNode('Auto'));

    // 5. Create Copy Button
    const btn = document.createElement('button');
    btn.innerText = 'Copy to Excel';
    btn.style.padding = '6px 12px';
    btn.style.backgroundColor = '#007bff';
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.borderRadius = '4px';
    btn.style.cursor = 'pointer';
    btn.style.fontWeight = 'bold';
    btn.style.fontSize = '12px';

    // Helper: Convert time string to total minutes
    function parseToMinutes(text) {
        const clean = text.toLowerCase().trim();
        const dMatch = clean.match(/(\d+)\s*d/);
        const hMatch = clean.match(/(\d+)\s*h/);
        const mMatch = clean.match(/(\d+)\s*m/);

        const days = dMatch ? parseInt(dMatch[1], 10) : 0;
        const hours = hMatch ? parseInt(hMatch[1], 10) : 0;
        const minutes = mMatch ? parseInt(mMatch[1], 10) : 0;

        if (!dMatch && !hMatch && !mMatch) return null;
        return (days * 1440) + (hours * 60) + minutes;
    }

    // Helper: Format minutes into duration string
    function formatMinutesToDuration(totalMinutes) {
        if (totalMinutes <= 0) return '0m';
        const days = Math.floor(totalMinutes / 1440);
        const hours = Math.floor((totalMinutes % 1440) / 60);
        const minutes = totalMinutes % 60;

        let parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
        return parts.join(' ');
    }

    // Helper: Parse span timestamp text into a Date object
    function parseSpanTimestamp(text) {
        let clean = text.replace(/p\.m\./gi, 'PM').replace(/a\.m\./gi, 'AM').replace(/,/g, '');
        let parsedDate = new Date(clean);
        return isNaN(parsedDate.getTime()) ? null : parsedDate;
    }

    // Calculate Auto value using 2 days default + dynamic shift end time
    function calculateAutoValue() {
        localStorage.setItem(SHIFT_KEY, shiftInput.value);

        const spans = document.querySelectorAll('span');
        let timestampSpan = null;

        for (let span of spans) {
            const text = span.innerText.trim();
            if (
                /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(text) &&
                /\d{1,2}:\d{2}/.test(text)
            ) {
                timestampSpan = span;
                break;
            }
        }

        let shiftRemainingMins = 0;
        if (timestampSpan) {
            const reportDate = parseSpanTimestamp(timestampSpan.innerText);
            if (reportDate) {
                const endOfShift = new Date(reportDate);
                
                const [shiftHours, shiftMins] = shiftInput.value.split(':').map(Number);
                endOfShift.setHours(
                    !isNaN(shiftHours) ? shiftHours : 18, 
                    !isNaN(shiftMins) ? shiftMins : 30, 
                    0, 
                    0
                );

                const diffMs = endOfShift - reportDate;
                if (diffMs > 0) {
                    shiftRemainingMins = Math.floor(diffMs / 60000);
                }
            }
        }

        // Hardcoded default base days = 2 (2 days * 1440 minutes = 2880 mins)
        const baseDaysMinutes = 2 * 1440;
        const totalMins = baseDaysMinutes + shiftRemainingMins;
        const formattedDuration = formatMinutesToDuration(totalMins);

        input.value = formattedDuration;
        localStorage.setItem(STORAGE_KEY, formattedDuration);
    }

    // Update input state based on Auto mode checkbox
    function handleModeChange() {
        if (checkbox.checked) {
            input.readOnly = true;
            input.style.backgroundColor = '#f1f3f5';
            shiftInput.disabled = false;
            calculateAutoValue();
        } else {
            input.readOnly = false;
            input.style.backgroundColor = '#ffffff';
            shiftInput.disabled = true;
            const savedValue = localStorage.getItem(STORAGE_KEY);
            if (savedValue) input.value = savedValue;
        }
        localStorage.setItem(AUTO_KEY, checkbox.checked);
    }

    // Listeners
    checkbox.addEventListener('change', handleModeChange);
    shiftInput.addEventListener('input', () => {
        if (checkbox.checked) calculateAutoValue();
    });

    // Initial load setup
    handleModeChange();

    // Observe DOM mutations so values update automatically if the <span> loads later
    const observer = new MutationObserver(() => {
        if (checkbox.checked) {
            calculateAutoValue();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });

    // 6. Extraction Logic
    btn.addEventListener('click', () => {
        const table = document.getElementById('containers－record-report');
        if (!table) {
            alert('Table with ID "containers－record-report" not found!');
            return;
        }

        const rows = Array.from(table.querySelectorAll('tbody tr'));
        if (rows.length === 0) {
            alert('No table body (tbody) rows found inside the table!');
            return;
        }

        const rawInput = input.value.trim();
        localStorage.setItem(STORAGE_KEY, rawInput);
        const targetMinutes = parseToMinutes(rawInput);

        let extractedData = [];
        let stopIndex = rows.length - 1;
        let exactMatchFound = false;

        if (targetMinutes !== null) {
            let smallestDifference = Infinity;
            let bestMatchIndex = 0;

            for (let i = 0; i < rows.length; i++) {
                let cells = rows[i].querySelectorAll('td, th');
                let rowMinutes = null;

                for (let cell of cells) {
                    let cellText = cell.innerText.trim();
                    if (cellText.includes('m') || cellText.includes('h') || cellText.includes('d')) {
                        let parsed = parseToMinutes(cellText);
                        if (parsed !== null) {
                            rowMinutes = parsed;
                            break;
                        }
                    }
                }

                if (rowMinutes !== null) {
                    let difference = Math.abs(rowMinutes - targetMinutes);
                    if (difference === 0) {
                        exactMatchFound = true;
                        bestMatchIndex = i;
                        smallestDifference = 0;
                    } else if (!exactMatchFound && difference < smallestDifference) {
                        smallestDifference = difference;
                        bestMatchIndex = i;
                    }
                }
            }

            stopIndex = bestMatchIndex;
            let bestRowCells = rows[bestMatchIndex].querySelectorAll('td, th');
            let bestRowTimeStr = "";

            for (let cell of bestRowCells) {
                let txt = cell.innerText.trim();
                if (txt.includes('m') || txt.includes('h') || txt.includes('d')) {
                    bestRowTimeStr = txt.toLowerCase();
                    break;
                }
            }

            if (bestRowTimeStr !== "") {
                for (let j = bestMatchIndex + 1; j < rows.length; j++) {
                    let nextCells = rows[j].querySelectorAll('td, th');
                    let match = false;
                    for (let cell of nextCells) {
                        if (cell.innerText.trim().toLowerCase() === bestRowTimeStr) {
                            match = true;
                            break;
                        }
                    }
                    if (match) {
                        stopIndex = j;
                    } else {
                        break;
                    }
                }
            }
        }

        for (let i = 0; i <= stopIndex; i++) {
            if (!rows[i]) continue;
            let cells = rows[i].querySelectorAll('td, th');
            let rowData = [];

            for (let c = 1; c < cells.length && rowData.length < 5; c++) {
                let cell = cells[c];
                let link = cell.querySelector('a');

                if (link && link.href) {
                    let cellText = cell.innerText.trim();
                    rowData.push(cellText);
                } else {
                    rowData.push(cell.innerText.trim());
                }
            }

            if (rowData.length > 0) {
                extractedData.push(rowData.join('\t'));
            }
        }

        if (extractedData.length === 0) {
            alert('No data rows found to copy!');
            return;
        }

        const finalOutput = extractedData.join('\n');

        navigator.clipboard.writeText(finalOutput)
            .then(() => {
                alert(`Copied ${extractedData.length} row(s) up to target cutoff (${rawInput}).`);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                alert('Clipboard error. Click inside the page first.');
            });
    });

    panel.appendChild(shiftLabel);
    panel.appendChild(input);
    panel.appendChild(autoContainer);
    panel.appendChild(btn);
    document.body.appendChild(panel);
})();
