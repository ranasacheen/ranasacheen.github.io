// ==UserScript==
// @name         Amazon Multi-Tote Price Calculator (with Quantity Support)
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Calculates total prices for multiple totes, multiplying item price by its quantity
// @match        https://fcresearch-na.aka.amazon.com/*
// @match        https://www.amazon.ca/*
// @connect      fcresearch-na.aka.amazon.com
// @connect      amazon.ca
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Inject UI Styling
    GM_addStyle(`
        #tote-price-calc-ui {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            background: #232f3e;
            color: #fff;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-family: Arial, sans-serif;
            width: 340px;
        }
        #tote-price-calc-ui h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #ff9900;
        }
        #tote-price-calc-ui textarea {
            width: 100%;
            height: 80px;
            padding: 8px;
            margin-bottom: 8px;
            box-sizing: border-box;
            border: 1px solid #ccc;
            border-radius: 4px;
            resize: vertical;
            font-family: monospace;
            font-size: 12px;
        }
        #tote-price-calc-ui button {
            width: 100%;
            padding: 8px;
            background: #ff9900;
            border: none;
            color: #111;
            font-weight: bold;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 5px;
        }
        #tote-price-calc-ui button:hover {
            background: #fa8900;
        }
        .secondary-btn {
            background: #37475a !important;
            color: #fff !important;
        }
        .secondary-btn:hover {
            background: #485c73 !important;
        }
        #tote-calc-results {
            margin-top: 10px;
            font-size: 12px;
            max-height: 200px;
            overflow-y: auto;
            background: #131a22;
            padding: 8px;
            border-radius: 4px;
            line-height: 1.4;
        }
    `);

    let lastBatchData = [];

    // Create UI Panel
    const uiContainer = document.createElement('div');
    uiContainer.id = 'tote-price-calc-ui';
    uiContainer.innerHTML = `
        <h3>Multi-Tote Price Calculator</h3>
        <textarea id="tote-input" placeholder="Enter Container IDs (one per line)&#10;tsx0076888&#10;tsx0076889"></textarea>
        <button id="calc-btn">Calculate All Totes</button>
        <div id="tote-calc-results">Status: Ready</div>
        <div id="action-container"></div>
    `;
    document.body.appendChild(uiContainer);

    document.getElementById('calc-btn').addEventListener('click', async () => {
        const rawInput = document.getElementById('tote-input').value.trim();
        const resultsDiv = document.getElementById('tote-calc-results');
        const actionContainer = document.getElementById('action-container');
        
        actionContainer.innerHTML = '';
        lastBatchData = [];

        if (!rawInput) {
            resultsDiv.innerHTML = 'Error: Please enter at least one container ID.';
            return;
        }

        const containerIds = rawInput.split('\n')
            .map(id => id.trim())
            .filter(id => id.length > 0);

        if (containerIds.length === 0) {
            resultsDiv.innerHTML = 'Error: No valid container IDs found.';
            return;
        }

        resultsDiv.innerHTML = `Starting batch process for ${containerIds.length} tote(s)...`;

        let grandTotal = 0;
        let summaryHTML = '';
        let completedTotes = 0;

        for (const containerId of containerIds) {
            resultsDiv.innerHTML = `Processing Tote (${completedTotes + 1}/${containerIds.length}): <strong>${containerId}</strong>...`;

            try {
                const toteResult = await processSingleTote(containerId);
                grandTotal += toteResult.total;
                summaryHTML += `<div>• <b>${containerId}</b>: ${toteResult.totalUnits} units (${toteResult.uniqueCount} SKUs) | $${toteResult.total.toFixed(2)}</div>`;
                
                lastBatchData.push({
                    toteId: containerId,
                    totalUnits: toteResult.totalUnits,
                    uniqueSkus: toteResult.uniqueCount,
                    total: toteResult.total.toFixed(2)
                });
            } catch (err) {
                summaryHTML += `<div>• <span style="color: #ff6b6b;"><b>${containerId}</b>: Failed</span></div>`;
                lastBatchData.push({
                    toteId: containerId,
                    totalUnits: 0,
                    uniqueSkus: 0,
                    total: "0.00"
                });
            }

            completedTotes++;
        }

        resultsDiv.innerHTML = `
            <b>Batch Complete!</b><br><br>
            ${summaryHTML}
            <hr style="border: 0; border-top: 1px solid #444; margin: 8px 0;">
            <strong>Grand Total: $${grandTotal.toFixed(2)}</strong>
        `;

        if (lastBatchData.length > 0) {
            const copyBtn = document.createElement('button');
            copyBtn.className = 'secondary-btn';
            copyBtn.innerText = '📋 Copy Data for Excel';
            copyBtn.onclick = () => {
                let tsvContent = "Tote ID\tTotal Units\tUnique SKUs\tTotal Price\n";
                lastBatchData.forEach(row => {
                    tsvContent += `${row.toteId}\t${row.totalUnits}\t${row.uniqueSkus}\t${row.total}\n`;
                });

                navigator.clipboard.writeText(tsvContent).then(() => {
                    copyBtn.innerText = '✅ Copied to Clipboard!';
                    setTimeout(() => { copyBtn.innerText = '📋 Copy Data for Excel'; }, 2000);
                });
            };
            actionContainer.appendChild(copyBtn);
        }
    });

    function processSingleTote(containerId) {
        return new Promise((resolve, reject) => {
            const containerUrl = `https://fcresearch-na.aka.amazon.com/yhm1/results/${containerId}`;

            GM_xmlhttpRequest({
                method: 'GET',
                url: containerUrl,
                onload: async function(response) {
                    if (response.status !== 200) {
                        reject(new Error(`HTTP ${response.status}`));
                        return;
                    }

                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.responseText, 'text/html');

                    const tables = doc.querySelectorAll('table');
                    let targetTable = null;

                    for (let t of tables) {
                        const textContent = t.textContent.toLowerCase();
                        if (textContent.includes('inventory') || t.id.toLowerCase().includes('inventory') || t.className.toLowerCase().includes('inventory')) {
                            targetTable = t;
                            break;
                        }
                    }

                    if (!targetTable && tables.length > 0) {
                        targetTable = tables[0];
                    }

                    if (!targetTable) {
                        reject(new Error('Table not found'));
                        return;
                    }

                    // Scan header to find the Quantity column index
                    let qtyColumnIndex = -1;
                    const headerCells = targetTable.querySelectorAll('th');
                    headerCells.forEach((th, idx) => {
                        const title = th.textContent.toLowerCase();
                        if (title.includes('qty') || title.includes('quantity') || title.includes('count')) {
                            qtyColumnIndex = idx;
                        }
                    });

                    // Collect Product IDs and accumulate their quantities
                    const productMap = {}; // { ASIN: totalQty }
                    const rows = targetTable.querySelectorAll('tr');

                    rows.forEach((row) => {
                        const cells = row.querySelectorAll('td');
                        if (cells.length > 0) {
                            const prodId = cells[0].textContent.trim();

                            if (prodId && !prodId.toLowerCase().includes('action') && prodId.length >= 4) {
                                // Extract quantity if column was found, default to 1
                                let qty = 1;
                                if (qtyColumnIndex !== -1 && cells[qtyColumnIndex]) {
                                    const parsedQty = parseInt(cells[qtyColumnIndex].textContent.replace(/[^0-9]/g, ''), 10);
                                    if (!isNaN(parsedQty) && parsedQty > 0) {
                                        qty = parsedQty;
                                    }
                                }

                                // Add or accumulate quantity for duplicate items
                                productMap[prodId] = (productMap[prodId] || 0) + qty;
                            }
                        }
                    });

                    const entries = Object.entries(productMap);
                    if (entries.length === 0) {
                        resolve({ total: 0, totalUnits: 0, uniqueCount: 0 });
                        return;
                    }

                    let toteTotal = 0;
                    let totalUnits = 0;

                    for (const [prodId, qty] of entries) {
                        try {
                            const unitPrice = await getProductPrice(prodId);
                            toteTotal += (unitPrice * qty);
                            totalUnits += qty;
                        } catch (e) {}
                    }

                    resolve({ 
                        total: toteTotal, 
                        totalUnits: totalUnits, 
                        uniqueCount: entries.length 
                    });
                },
                onerror: function() {
                    reject(new Error('Network error'));
                }
            });
        });
    }

    async function getProductPrice(prodId) {
        const internalUrl = `https://fcresearch-na.aka.amazon.com/yhm1/results/product?s=${prodId}`;
        let price = await fetchAndExtractInternalPrice(internalUrl);
        
        if (!price || price === 0) {
            const externalUrl = `https://www.amazon.ca/gp/product/${prodId}`;
            price = await fetchAndExtractAmazonCaPrice(externalUrl);
        }

        return price || 0;
    }

    function fetchAndExtractInternalPrice(url) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: function(response) {
                    if (response.status !== 200) {
                        resolve(0);
                        return;
                    }
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.responseText, 'text/html');
                    
                    const bodyText = doc.body.textContent;
                    const priceMatch = bodyText.match(/(?:List Price|Price)[:\s]*CAD\s*([0-9]+\.[0-9]{2})/i) || 
                                       bodyText.match(/CAD\s*([0-9]+\.[0-9]{2})/i);

                    if (priceMatch && priceMatch[1]) {
                        resolve(parseFloat(priceMatch[1]));
                    } else {
                        resolve(0);
                    }
                },
                onerror: function() {
                    resolve(0);
                }
            });
        });
    }

    function fetchAndExtractAmazonCaPrice(url) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: function(response) {
                    if (response.status !== 200) {
                        resolve(0);
                        return;
                    }
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.responseText, 'text/html');
                    
                    const priceSpan = doc.querySelector('.a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice');
                    if (priceSpan) {
                        const val = parseFloat(priceSpan.textContent.replace(/[^0-9.]/g, ''));
                        resolve(isNaN(val) ? 0 : val);
                    } else {
                        resolve(0);
                    }
                },
                onerror: function() {
                    resolve(0);
                }
            });
        });
    }
})();
