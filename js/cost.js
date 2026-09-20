// ==WdUserScript== (or ==UserScript==)
// ==UserScript==
// @name         Multi-Tab Inventory Excel Exporter
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Fetches inbound, outbound, and transshipment data, filters by time window, and exports to a single Excel file with multiple tabs.
// @match        https://www.company.com/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Create a floating UI Control Panel on any of the pages
    function createUI() {
        if (document.getElementById('inv-exporter-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'inv-exporter-panel';
        panel.innerHTML = `
            <div style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: #fff; padding: 15px; border: 2px solid #ccc; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); font-family: Arial, sans-serif;">
                <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">Multi-Tab Inventory Exporter</h3>
                <label style="font-size: 12px;">Days:</label><br>
                <input type="number" id="inv-days" value="2" style="width: 60px; margin-bottom: 5px;"><br>
                <label style="font-size: 12px;">Hours:</label><br>
                <input type="number" id="inv-hours" value="23" style="width: 60px; margin-bottom: 5px;"><br>
                <label style="font-size: 12px;">Minutes:</label><br>
                <input type="number" id="inv-mins" value="3" style="width: 60px; margin-bottom: 10px;"><br>
                <button id="inv-export-btn" style="background: #217346; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">Download Multi-Tab Excel</button>
            </div>
        `;
        document.body.appendChild(panel);
        document.getElementById('inv-export-btn').addEventListener('click', fetchAndExportAll);
    }

    // Calculate maximum age in milliseconds based on user input
    function getTimeWindowMs() {
        const days = parseInt(document.getElementById('inv-days').value) || 0;
        const hours = parseInt(document.getElementById('inv-hours').value) || 0;
        const mins = parseInt(document.getElementById('inv-mins').value) || 0;
        return (days * 86400000) + (hours * 3600000) + (mins * 60000);
    }

    // Parse HTML text into filtered array of rows
    function parseHTMLTable(htmlText, maxAgeMs) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        
        // **NOTE: Update 'table tr' if your site uses a different structure**
        const rows = doc.querySelectorAll('table tr');
        if (rows.length === 0) return [];

        const now = new Date().getTime();
        let filteredData = [];

        rows.forEach((row, index) => {
            const cols = row.querySelectorAll('th, td');
            if (cols.length === 0) return;

            let rowData = Array.from(cols).map(col => col.innerText.trim());

            // Always keep the header row
            if (index === 0) {
                filteredData.push(rowData);
                return;
            }

            // **NOTE: Change index '0' to whichever column index holds your Timestamp**
            const timeString = cols[0].innerText.trim();
            const rowTime = new Date(timeString).getTime();

            if (!isNaN(rowTime)) {
                const ageMs = now - rowTime;
                if (ageMs >= 0 && ageMs <= maxAgeMs) {
                    filteredData.push(rowData);
                }
            }
        });

        return filteredData;
    }

    // Fetch all 3 links in the background, process, and build 1 Excel file with 3 tabs
    async function fetchAndExportAll() {
        const maxAgeMs = getTimeWindowMs();
        const urls = {
            'Inbound': 'https://www.company.com/inbound',
            'Outbound': 'https://www.company.com/outbound',
            'Transshipment': 'https://www.company.com/transshipment'
        };

        const wb = XLSX.utils.book_new();
        let successCount = 0;

        for (const [sheetName, url] of Object.entries(urls)) {
            try {
                const response = await fetch(url, { credentials: 'include' });
                const htmlText = await response.text();
                const sheetData = parseHTMLTable(htmlText, maxAgeMs);

                // Create a worksheet even if only headers exist, to keep tab structure intact
                const ws = XLSX.utils.aoa_to_sheet(sheetData.length > 0 ? sheetData, [["No Data Within Timeframe"]]);
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
                successCount++;
            } catch (err) {
                console.error(`Failed to fetch ${sheetName}:`, err);
            }
        }

        if (successCount > 0) {
            XLSX.writeFile(wb, 'Complete_Inventory_Report.xlsx');
        } else {
            alert('Failed to fetch data from the endpoints. Check console for details.');
        }
    }

    window.addEventListener('load', createUI);
})();
