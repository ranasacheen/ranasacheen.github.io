// ==UserScript==
// @name         Price Updater Pro
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Fetch prices from GrabbOO and Amazon
// @author       You
// @match        *://www.maincalculator.com/*
// @grant        GM_xmlhttpRequest
// @connect      grabboo.com
// @connect      amazon.com
// ==/UserScript==

(function() {
    'use strict';

    // 1. Create and Add the Button
    const btn = document.createElement('button');
    btn.innerHTML = "🚀 Sync Amazon Prices";
    btn.style.cssText = "position:fixed; top:20px; right:20px; z-index:9999; padding:10px; cursor:pointer;";
    document.body.appendChild(btn);

    // Helper function to handle cross-origin requests
    function fetchExternal(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                onload: (res) => resolve(new DOMParser().parseFromString(res.responseText, "text/html")),
                onerror: (err) => reject(err)
            });
        });
    }

    btn.onclick = async () => {
        btn.disabled = true;
        btn.innerText = "Processing...";

        const tables = document.querySelectorAll('table');

        for (let table of tables) {
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            let tableSum = 0;

            for (let row of rows) {
                const cells = row.querySelectorAll('td');
                if (cells.length < 4) continue; // Skip total row

                const linkElement = cells[0].querySelector('a');
                let price = parseFloat(cells[1].innerText);
                const quantity = parseInt(cells[2].innerText) || 0;

                if (price === 0 || isNaN(price)) {
                    try {
                        // Step A: Visit GrabbOO via the link in the table
                        const grabDoc = await fetchExternal(linkElement.href);
                        // REPLACE '.ansci-id-selector' with the actual class/ID on grabbOO
                        const b0Code = grabDoc.querySelector('.ansci-id-selector')?.innerText.trim();

                        if (b0Code) {
                            // Step B: Visit Amazon
                            const amzDoc = await fetchExternal(`https://www.amazon.com/gb/dp/${b0Code}`);
                            const priceText = amzDoc.querySelector('.a-price-whole')?.innerText;
                            
                            if (priceText) {
                                price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
                                cells[1].innerText = price;
                            }
                        }
                    } catch (e) { console.error("Update failed for row", e); }
                }

                // Step C: Update Math
                const rowTotal = price * quantity;
                cells[3].innerText = rowTotal;
                tableSum += rowTotal;
            }

            // Step D: Update the Sum Footer
            const footer = table.querySelector('td[colspan="4"]');
            if (footer) footer.innerText = tableSum;
        }

        btn.disabled = false;
        btn.innerText = "🚀 Sync Amazon Prices";
        alert("Update Complete!");
    };
})();
