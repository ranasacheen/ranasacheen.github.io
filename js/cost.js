// 1. Create the UI
const ui = document.createElement('div');
ui.innerHTML = `
    <div id="myScanner" style="position:fixed; top:10px; right:10px; z-index:9999; background:white; border:2px solid #e47911; padding:15px; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.3); width:280px; font-family: Arial;">
        <h3 style="margin-top:0; font-size:14px; color:#e47911;">Amazon.ca Price Grabber</h3>
        <textarea id="asinList" placeholder="Enter Canadian ASINs (one per line)" style="width:100%; height:80px; font-size:12px;"></textarea>
        <button id="startScan" style="width:100%; background:#f0c14b; border:1px solid #a88734; padding:8px; margin-top:10px; cursor:pointer; font-weight:bold;">Grab CAD Prices</button>
        <div id="resultsLog" style="margin-top:10px; max-height:200px; overflow-y:auto; font-size:11px; border-top:1px solid #eee; padding-top:5px;"></div>
    </div>
`;
document.body.appendChild(ui);

// 2. The Logic
document.getElementById('startScan').addEventListener('click', async () => {
    const textarea = document.getElementById('asinList');
    const log = document.getElementById('resultsLog');
    const asins = textarea.value.split('\n').map(a => a.trim()).filter(a => a);

    log.innerHTML = "<em>Connecting to Amazon.ca...</em>";

    for (const asin of asins) {
        log.innerHTML += `<div>🔍 Checking ${asin}...</div>`;
        
        try {
            // CHANGED: URL now points to .ca
            const response = await fetch(`https://www.amazon.ca/dp/${asin}`, { cache: "no-cache" });
            const text = await response.text();
            
            if (text.includes("api-services-support@amazon.com") || text.includes("robot-check")) {
                log.innerHTML += `<div style="color:orange;">⚠️ Amazon.ca blocked the request. Solve a CAPTCHA on the site, then wait 5 mins.</div>`;
                break; 
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");

            // Canada specific selectors
            const selectors = [
                '.a-price .a-offscreen', 
                '#price_inside_buybox',
                '#corePrice_feature_div .a-offscreen',
                '#kindle-price',
                'span[data-a-color="price"]'
            ];
            
            let price = null;
            for (let s of selectors) {
                let el = doc.querySelector(s);
                if (el && el.innerText.trim()) {
                    price = el.innerText.trim();
                    break;
                }
            }

            if (price) {
                // Formatting to ensure it looks like $XX.XX
                log.innerHTML += `<div style="color:green;">✅ <strong>${asin}:</strong> ${price}</div>`;
            } else {
                log.innerHTML += `<div style="color:red;">❌ ${asin}: Out of stock or Hidden.</div>`;
            }
        } catch (e) {
            log.innerHTML += `<div style="color:red;">❌ ${asin}: Connection Error.</div>`;
        }

        // Wait 3 seconds per item to avoid being banned
        await new Promise(r => setTimeout(r, 3000));
    }
    log.innerHTML += "<div><strong>Finished.</strong></div>";
});


//for the totes multiple Ansci with quantity


// 1. Create the UI (Added a Total display)
const ui = document.createElement('div');
ui.innerHTML = `
    <div id="myScanner" style="position:fixed; top:10px; right:10px; z-index:9999; background:white; border:2px solid #e47911; padding:15px; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.3); width:300px; font-family: Arial;">
        <h3 style="margin-top:0; font-size:14px; color:#e47911;">Amazon.ca Tote Calculator</h3>
        <p style="font-size:10px; color: #666;">Format: ASIN, Quantity (One per line)</p>
        <textarea id="asinList" placeholder="B012345678, 2" style="width:100%; height:80px; font-size:12px;"></textarea>
        <button id="startScan" style="width:100%; background:#f0c14b; border:1px solid #a88734; padding:8px; margin-top:10px; cursor:pointer; font-weight:bold;">Calculate Tote Total</button>
        <div id="resultsLog" style="margin-top:10px; max-height:150px; overflow-y:auto; font-size:11px; border-top:1px solid #eee; padding-top:5px;"></div>
        <div id="toteTotal" style="margin-top:10px; font-size:16px; font-weight:bold; color:#111; border-top:2px solid #e47911; padding-top:10px;">Total: $0.00</div>
    </div>
`;
document.body.appendChild(ui);

// 2. The Logic
document.getElementById('startScan').addEventListener('click', async () => {
    const textarea = document.getElementById('asinList');
    const log = document.getElementById('resultsLog');
    const totalDisplay = document.getElementById('toteTotal');
    
    // Split lines and parse ASIN + Quantity
    const lines = textarea.value.split('\n').filter(line => line.trim());
    
    let grandTotal = 0;
    log.innerHTML = "<em>Starting Tote Calculation...</em>";

    for (const line of lines) {
        // Support both "ASIN, Qty" and "ASIN Qty"
        let [asin, qty] = line.split(/[ ,]+/).map(item => item.trim());
        qty = parseInt(qty) || 1; // Default to 1 if no quantity provided

        log.innerHTML += `<div>🔍 Fetching ${asin} (Qty: ${qty})...</div>`;
        
        try {
            const response = await fetch(`https://www.amazon.ca/dp/${asin}`, { cache: "no-cache" });
            const text = await response.text();
            
            if (text.includes("robot-check")) {
                log.innerHTML += `<div style="color:orange;">⚠️ Blocked. Solve CAPTCHA on Amazon.ca</div>`;
                break; 
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");
            const selectors = ['.a-price .a-offscreen', '#price_inside_buybox', '#corePrice_feature_div .a-offscreen'];
            
            let priceString = null;
            for (let s of selectors) {
                let el = doc.querySelector(s);
                if (el && el.innerText.trim()) {
                    priceString = el.innerText.trim();
                    break;
                }
            }

            if (priceString) {
                // Convert "$12.34" to numeric 12.34
                const numericPrice = parseFloat(priceString.replace(/[^0-9.-]+/g, ""));
                const lineTotal = numericPrice * qty;
                grandTotal += lineTotal;

                log.innerHTML += `<div style="color:green;">✅ ${asin}: ${priceString} x ${qty} = $${lineTotal.toFixed(2)}</div>`;
                // Update the running total display
                totalDisplay.innerHTML = `Total: $${grandTotal.toFixed(2)}`;
            } else {
                log.innerHTML += `<div style="color:red;">❌ ${asin}: Price not found.</div>`;
            }
        } catch (e) {
            log.innerHTML += `<div style="color:red;">❌ ${asin}: Error.</div>`;
        }

        await new Promise(r => setTimeout(r, 2500)); // Delay to prevent bans
    }
    log.innerHTML += "<div><strong>Calculation Finished.</strong></div>";
});


//for fc
// 1. DATA SOURCE

const myToolData = {
    "products": [
        {"id": "A1", "asin": "B08N5Z6HGT"}, 
        {"id": "A2", "asin": "B07PFFMP9P"}
    ]
};

// 2. THE UI
const ui = document.createElement('div');
ui.innerHTML = `
    <div id="priceScanner" style="position:fixed; top:20px; right:20px; z-index:10000; background:#fff; border:2px solid #232f3e; padding:15px; border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,0.2); width:320px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3 style="margin:0; font-size:15px; color:#e47911;">🇨🇦 Amazon.ca Price Grabber</h3>
            <span id="closeScanner" style="cursor:pointer; font-weight:bold; color:#999;">✕</span>
        </div>
        <div id="progressBox" style="font-size:12px; margin-bottom:10px; color:#555;">Ready to scan ${myToolData.products.length} items.</div>
        <button id="runScan" style="width:100%; background:#ffd814; border:1px solid #fcd200; border-radius:8px; padding:10px; cursor:pointer; font-weight:bold; transition: 0.2s;">Start Scan</button>
        <div id="log" style="margin-top:12px; max-height:220px; overflow-y:auto; font-size:11px; border-top:1px solid #eee; padding-top:8px;"></div>
    </div>
`;
document.body.appendChild(ui);
document.getElementById('closeScanner').onclick = () => ui.remove();

// 3. THE LOGIC
document.getElementById('runScan').addEventListener('click', async () => {
    const log = document.getElementById('log');
    const progress = document.getElementById('progressBox');
    const btn = document.getElementById('runScan');
    
    btn.disabled = true;
    btn.style.opacity = "0.5";
    log.innerHTML = "";
    
    for (let i = 0; i < myToolData.products.length; i++) {
        const item = myToolData.products[i];
        const asin = item.asin;
        
        progress.innerText = `Scanning item ${i + 1} of ${myToolData.products.length}...`;
        log.innerHTML += `<div style="margin-bottom:4px;">🔍 Checking <strong>${asin}</strong>...</div>`;
        log.scrollTop = log.scrollHeight;

        try {
            // Fetching Amazon.ca product page
            const response = await fetch(`https://www.amazon.ca/dp/${asin}?psc=1&_=${Date.now()}`);
            const html = await response.text();

            if (html.includes("robot-check") || html.includes("api-services-support")) {
                log.innerHTML += `<div style="color:orange; border-left:3px solid orange; padding-left:5px;">⚠️ CAPTCHA detected. Please solve a CAPTCHA on Amazon.ca and restart.</div>`;
                break;
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            // Updated 2026 CSS Selectors
            const selectors = [
                '#corePriceDisplay_desktop_feature_div .a-offscreen',
                '#corePrice_feature_div .a-offscreen',
                '.a-price .a-offscreen',
                '#price_inside_buybox',
                '#kindle-price',
                'span[data-a-color="price"]'
            ];

            let price = "N/A";
            for (let s of selectors) {
                const el = doc.querySelector(s);
                if (el && el.innerText.trim()) {
                    price = el.innerText.trim();
                    break;
                }
            }

            if (price !== "N/A") {
                log.innerHTML += `<div style="color:#2e7d32;">✅ Price: <strong>${price}</strong></div>`;
                item.price_cad = price; // Save price back to your object
            } else {
                log.innerHTML += `<div style="color:#d32f2f;">❌ Out of stock or hidden.</div>`;
            }

        } catch (error) {
            log.innerHTML += `<div style="color:red;">⚠️ Error fetching ${asin}</div>`;
        }

        // --- BOT PROTECTION BYPASS ---
        // Randomized delay between 2.5 and 5 seconds
        const jitter = Math.floor(Math.random() * 2500) + 2500;
        await new Promise(r => setTimeout(r, jitter));
    }

    progress.innerText = "Scan Complete!";
    btn.disabled = false;
    btn.style.opacity = "1";
    console.log("Updated Data with CAD Prices:", myToolData);
});



//for fc with text area
// 1. THE UI
const ui = document.createElement('div');
ui.innerHTML = `
    <div id="priceScanner" style="position:fixed; top:20px; right:20px; z-index:10000; background:#fff; border:2px solid #232f3e; padding:15px; border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,0.2); width:320px; font-family: sans-serif;">
        <h3 style="margin:0 0 10px 0; font-size:14px; color:#e47911;">🇨🇦 Amazon.ca Bulk Scanner</h3>
        
        <textarea id="bulkAsins" style="width:100%; height:80px; font-size:12px; border:1px solid #ccc; border-radius:4px; padding:5px;" placeholder="Enter ASINs (one per line)"></textarea>
        
        <button id="runScan" style="width:100%; background:#ffd814; border:1px solid #fcd200; border-radius:8px; padding:10px; cursor:pointer; font-weight:bold; margin-top:10px;">Start Calculation</button>
        
        <div id="log" style="margin-top:12px; max-height:150px; overflow-y:auto; font-size:11px; border-top:1px solid #eee; padding-top:8px;"></div>
    </div>
`;
document.body.appendChild(ui);

// 2. THE LOGIC
document.getElementById('runScan').addEventListener('click', async () => {
    const textArea = document.getElementById('bulkAsins');
    const log = document.getElementById('log');
    
    // This is the JSON object where we will store the results
    const productResults = {
        scanDate: new Date().toLocaleString(),
        items: []
    };

    const asins = textArea.value.split('\n').map(a => a.trim()).filter(a => a.length > 5);
    log.innerHTML = `<em>Scanning ${asins.length} items...</em>`;

    for (const asin of asins) {
        log.innerHTML += `<div>🔍 Checking ${asin}...</div>`;
        
        try {
            const response = await fetch(`https://www.amazon.ca/dp/${asin}`);
            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, "text/html");

            // Selectors for 2026 Amazon.ca layout
            const priceEl = doc.querySelector('#corePriceDisplay_desktop_feature_div .a-offscreen') || 
                          doc.querySelector('.a-price .a-offscreen');

            if (priceEl) {
                const priceText = priceEl.innerText.trim();
                
                // Pushing data into our JSON object
                productResults.items.push({
                    asin: asin,
                    price: priceText,
                    numericValue: parseFloat(priceText.replace(/[^0-9.]/g, ''))
                });

                log.innerHTML += `<div style="color:green;">✅ Saved: ${priceText}</div>`;
            } else {
                log.innerHTML += `<div style="color:red;">❌ Price not found for ${asin}</div>`;
            }
        } catch (e) {
            log.innerHTML += `<div style="color:red;">⚠️ Connection Error</div>`;
        }

        // Wait 3 seconds to avoid blocking
        await new Promise(r => setTimeout(r, 3000));
    }

    // FINAL OUTPUT: Print the JSON object to the console
    console.log("FINAL JSON OBJECT:", productResults);
    log.innerHTML += `<hr><strong>Finished! Check Console (F12) for the JSON data.</strong>`;
});

async function calculateTotal() {
    // 1. Get all unique IDs from the inventory table
    const table = document.getElementById('table-inventory');
    if (!table) return console.error("Table not found!");

    // Adjust the selector inside querySelectorAll to target the specific cell with the ID
    const idElements = Array.from(table.querySelectorAll('td')); 
    const ids = [...new Set(idElements.map(el => el.innerText.trim()).filter(text => text.startsWith('B0')))];

    console.log(`Found ${ids.length} unique products. Fetching prices...`);

    let totalPrice = 0;
    const results = [];

    // 2. Loop through IDs and fetch prices
    for (const id of ids) {
        try {
            const url = `https://www.amazon.ca/gp/product/${id}?th=1`;
            const response = await fetch(url);
            const html = await response.text();
            
            // Parse the HTML string
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const priceElement = doc.querySelector('.a-price-whole');

            if (priceElement) {
                const price = parseFloat(priceElement.innerText.replace(/[^0-9.]/g, ''));
                results.push({ id, price });
                totalPrice += price;
                console.log(`ID: ${id} | Price: $${price}`);
            } else {
                console.warn(`Could not find price for ${id}`);
            }
        } catch (err) {
            console.error(`Error fetching ${id}:`, err);
        }
    }

    console.table(results);
    console.log(`%c Total Price for tsXOj202c8j: $${totalPrice.toFixed(2)} `, 'background: #222; color: #bada55; font-size: 20px');
}

calculateTotal();
// ------

// ==UserScript==
// @name         Amazon Price Calculator
// @grant        GM_xmlhttpRequest
// @connect      amazon.ca
// ==/UserScript==

// Helper function to make GM_xmlhttpRequest behave like fetch
const gmFetch = (url) => {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            onload: (response) => resolve(response.responseText),
            onerror: (error) => reject(error)
        });
    });
};

async function calculateTotal() {
    const table = document.getElementById('table-inventory');
    if (!table) return console.error("Table not found!");

    const idElements = Array.from(table.querySelectorAll('td')); 
    const ids = [...new Set(idElements.map(el => el.innerText.trim()).filter(text => text.startsWith('B0')))];

    console.log(`Found ${ids.length} unique products. Fetching prices...`);

    let totalPrice = 0;
    const results = [];

    for (const id of ids) {
        try {
            const url = `https://www.amazon.ca/gp/product/${id}?th=1`;
            
            // Replaced fetch with our GM wrapper
            const html = await gmFetch(url);
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const priceElement = doc.querySelector('.a-price-whole');

            if (priceElement) {
                const price = parseFloat(priceElement.innerText.replace(/[^0-9.]/g, ''));
                results.push({ id, price });
                totalPrice += price;
                console.log(`ID: ${id} | Price: $${price}`);
            } else {
                console.warn(`Could not find price for ${id}`);
            }
        } catch (err) {
            console.error(`Error fetching ${id}:`, err);
        }
    }

    console.table(results);
    console.log(`%c Total Price for tsXOj202c8j: $${totalPrice.toFixed(2)} `, 'background: #222; color: #bada55; font-size: 20px');
}

calculateTotal();

