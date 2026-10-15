// ==UserScript==
// @name         Amazon Tote Price Calculator (Flexible IDs)
// @namespace    [http://tampermonkey.net/](http://tampermonkey.net/)
// @version      1.3
// @description  Calculates total price from inventory section table with flexible product ID extraction
// @match        [https://fcresearch-na.aka.amazon.com/](https://fcresearch-na.aka.amazon.com/)*
// @match        [https://www.amazon.ca/](https://www.amazon.ca/)*
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
            width: 320px;
        }
        #tote-price-calc-ui h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #ff9900;
        }
        #tote-price-calc-ui input {
            width: 100%;
            padding: 8px;
            margin-bottom: 8px;
            box-sizing: border-box;
            border: 1px solid #ccc;
            border-radius: 4px;
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
        }
        #tote-price-calc-ui button:hover {
            background: #fa8900;
        }
        #tote-calc-results {
            margin-top: 10px;
            font-size: 12px;
            max-height: 180px;
            overflow-y: auto;
            background: #131a22;
            padding: 8px;
            border-radius: 4px;
        }
    `);

    // Create UI Panel
    const uiContainer = document.createElement('div');
    uiContainer.id = 'tote-price-calc-ui';
    uiContainer.innerHTML = `
        <h3>Tote Price Calculator</h3>
        <input type="text" id="tote-input" placeholder="Enter Container ID (e.g. tsx0076888)" />
        <button id="calc-btn">Calculate Total Price</button>
        <div id="tote-calc-results">Status: Ready</div>
    `;
    document.body.appendChild(uiContainer);

    document.getElementById('calc-btn').addEventListener('click', async () => {
        const containerId = document.getElementById('tote-input').value.trim();
        const resultsDiv = document.getElementById('tote-calc-results');

        if (!containerId) {
            resultsDiv.innerHTML = 'Error: Please enter a container ID.';
            return;
        }

        resultsDiv.innerHTML = 'Fetching container details...';

        const containerUrl = `[https://fcresearch-na.aka.amazon.com/yhm1/results/$](https://fcresearch-na.aka.amazon.com/yhm1/results/$){containerId}`;

        GM_xmlhttpRequest({
            method: 'GET',
            url: containerUrl,
            onload: async function(response) {
                if (response.status !== 200) {
                    resultsDiv.innerHTML = `Error: Failed to load container page (Status ${response.status})`;
                    return;
                }

                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, 'text/html');

                // Find the inventory table
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
                    resultsDiv.innerHTML = 'Error: Could not find inventory table on container page.';
                    return;
                }

                // Extract product identifiers flexibly from the table rows
                const rows = targetTable.querySelectorAll('tr');
                const productIds = new Set();

                rows.forEach((row) => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length > 0) {
                        const firstCellText = cells[0].textContent.trim();
                        
                        if (firstCellText && !firstCellText.toLowerCase().includes('action') && firstCellText.length >= 4) {
                            productIds.add(firstCellText);
                        }
                    }
                });

                const uniqueProducts = Array.from(productIds);
                if (uniqueProducts.length === 0) {
                    resultsDiv.innerHTML = 'No product IDs found in the inventory table rows.';
                    return;
                }

                resultsDiv.innerHTML = `Found ${uniqueProducts.length} items. Fetching prices...`;

                let totalPrice = 0;
                let processedCount = 0;

                for (const prodId of uniqueProducts) {
                    try {
                        const price = await getProductPrice(prodId);
                        totalPrice += price;
                        processedCount++;
                        resultsDiv.innerHTML = `Processed ${processedCount}/${uniqueProducts.length}<br>Total so far: $${totalPrice.toFixed(2)}`;
                    } catch (err) {
                        console.error(`Error fetching price for ${prodId}:`, err);
                    }
                }

                resultsDiv.innerHTML += `<br><strong>Final Total: $${totalPrice.toFixed(2)}</strong>`;
            },
            onerror: function() {
                resultsDiv.innerHTML = 'Error: Network request failed.';
            }
        });
    });

    async function getProductPrice(prodId) {
        const internalUrl = `[https://fcresearch-na.aka.amazon.com/yhm1/results/product?s=$](https://fcresearch-na.aka.amazon.com/yhm1/results/product?s=$){prodId}`;
        let price = await fetchAndExtractInternalPrice(internalUrl);
        
        if (!price || price === 0) {
            const externalUrl = `[https://www.amazon.ca/gp/product/$](https://www.amazon.ca/gp/product/$){prodId}`;
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
