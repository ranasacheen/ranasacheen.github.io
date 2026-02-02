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


//for the totes

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
