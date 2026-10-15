// ==UserScript==
// @name         FCResearch Cost Calculation + paX
// @version      2026-09-09 (Fast Mode + paX + Receive History)
// @description  View container price, Child Container Hierarchy, and Receive History in FCResearch.(Augus-Sachin FC tools)
// @author       YHM1-IB (castyaug)
// @match        ://fcresearch-na.aka.amazon.com/
// @match        ://qi-fcresearch-na.corp.amazon.com/
// @match        ://qifcr.na.aftx.amazonoperations.app/
// @match        https://fcresearch-na.aka.amazon.com/*
// @require      https://cdn.jsdelivr.net/combine/npm/jquery,npm/lodash/lodash.min.js,npm/moment
// @connect      amazon.com
// @connect      amazon.ca
// @grant        GM_xmlhttpRequest
// @grant        GM.openInTab
// @grant        GM.notification
// @grant        GM.registerMenuCommand
// @grant        GM.info
// @grant        GM.addStyle
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.deleteValue
// @grant        GM.getResourceText
// ==/UserScript==

const site = "YHM1";

function call_all_wrap(func, wrapper, elements, post_pair, post_map, options) {
    options = options || {};
    post_map = (post_map && typeof post_map === "object") ? post_map : null;

    var prefix = wrapper[0];
    var suffix = wrapper[1];

    var elems;
    if (elements == null) elems = [];
    else if (Array.isArray(elements)) elems = elements;
    else if (typeof elements === "string") elems = [elements];
    else if (typeof elements.length === "number") elems = Array.prototype.slice.call(elements);
    else elems = [elements];

    var has_pair = Array.isArray(post_pair) && post_pair.length === 2;
    var base_pair_payload = has_pair ? (function () {
        var o = {};
        o[post_pair[0]] = post_pair[1];
        return o;
    })() : null;

    var has_map_arrays = false;
    var run_count = 0;
    if (post_map) {
        for (var k in post_map) {
            if (!Object.prototype.hasOwnProperty.call(post_map, k)) continue;
            var v = post_map[k];
            if (Array.isArray(v)) {
                has_map_arrays = true;
                if (v.length > run_count) run_count = v.length;
            }
        }
    }
    if (!has_map_arrays) run_count = Math.max(elems.length, 1);

    function data_for_index(i) {
        var data = null;
        if (post_map) {
            data = {};
            for (var k in post_map) {
                if (!Object.prototype.hasOwnProperty.call(post_map, k)) continue;
                var v = post_map[k];
                if (Array.isArray(v)) {
                    if (i < v.length && typeof v[i] !== "undefined") data[k] = v[i];
                } else {
                    data[k] = v;
                }
            }
            if (Object.keys(data).length === 0) data = null;
        }

        if (!data && base_pair_payload) {
            data = {};
            for (var kk in base_pair_payload) {
                if (Object.prototype.hasOwnProperty.call(base_pair_payload, kk)) {
                    data[kk] = base_pair_payload[kk];
                }
            }
        }
        return data;
    }

    function url_for_index(i) {
        var s;
        if (has_map_arrays) {
            if (i < elems.length) s = elems[i];
            else s = elems.length ? elems[0] : "";
        } else {
            s = (i < elems.length) ? elems[i] : "";
        }
        return String(prefix) + String(s) + String(suffix);
    }

    var tasks = new Array(run_count);
    for (var i = 0; i < run_count; i++) {
        (function (idx) {
            var url = url_for_index(idx);
            var data = data_for_index(idx);
            var opts;

            if (data) {
                opts = {};
                for (var key in options) {
                    if (Object.prototype.hasOwnProperty.call(options, key)) opts[key] = options[key];
                }
                opts.data = data;
            } else if (options && Object.keys(options).length) {
                opts = options;
            }
            tasks[idx] = opts ? func(url, opts) : func(url);
        })(i);
    }
    return Promise.all(tasks);
}

async function resolve_request(
    url,
    {
        method = "GET",
        headers = { Accept: "application/json" },
        data = null,
        response_type = "json",
        timeout = 30000,
        user,
        password,
        binary = false,
        anonymous = false,
        override_mime_type,
    } = {}
) {
    const normalize_header_name = (name) =>
        Object.keys(headers || {}).find(h => h.toLowerCase() === name.toLowerCase()) || name;

    headers = headers || { Accept: "application/json" };
    const has_payload = data !== null && data !== undefined;
    let req_method = method ? String(method).toUpperCase() : "GET";
    if (has_payload && req_method === "GET") req_method = "POST";

    let body = data;
    if (has_payload) {
        const ct_key = normalize_header_name("Content-Type");
        const content_type = headers[ct_key];

        if (
            typeof data === "object" &&
            !(data instanceof FormData) &&
            !(data instanceof Blob) &&
            !(data instanceof ArrayBuffer)
        ) {
            if (content_type && /application\/json/i.test(content_type)) {
                body = JSON.stringify(data);
            } else {
                body = new URLSearchParams(data).toString();
                if (!content_type) {
                    headers[ct_key] = "application/x-www-form-urlencoded;charset=UTF-8";
                }
            }
        }
    }

    return await new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: req_method,
            url,
            headers,
            data: has_payload ? body : undefined,
            responseType: response_type,
            timeout,
            user,
            password,
            binary,
            anonymous,
            overrideMimeType: override_mime_type,
            onload: (r) => {
                try {
                    const out =
                        response_type === "json"
                            ? (r.response ?? JSON.parse(r.responseText))
                            : response_type
                            ? r.response
                            : r.responseText;
                    resolve(out);
                } catch (e) {
                    reject(e);
                }
            },
            onerror: (e) => reject(e),
            ontimeout: () => reject(new Error("Request timed out")),
        });
    });
}

function resolve_element(t) {
    if (typeof t === "string") return document.querySelector(t);
    if (t instanceof Element) return t;
    return null;
}

function on_child_of(parent_target, callback, { once = true, check_existing = true } = {}) {
    let parent = resolve_element(parent_target);
    let parent_observer = null;
    let child_observer = null;

    const disconnect_all = () => {
        if (child_observer) {
            child_observer.disconnect();
            child_observer = null;
        }
        if (parent_observer) {
            parent_observer.disconnect();
            parent_observer = null;
        }
    };

    const start_child_observer = () => {
        if (check_existing && parent && parent.firstElementChild) {
            callback(parent, parent.firstElementChild);
            if (once) {
                disconnect_all();
                return;
            }
        }
        if (!parent) return;

        child_observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const n of m.addedNodes) {
                    if (n.nodeType === 1) {
                        callback(parent, n);
                        if (once) {
                            disconnect_all();
                            return;
                        }
                    }
                }
            }
        });
        child_observer.observe(parent, { childList: true });
    };

    if (parent) {
        start_child_observer();
    } else {
        parent_observer = new MutationObserver(() => {
            parent = resolve_element(parent_target);
            if (parent) {
                start_child_observer();
                if (parent_observer) {
                    parent_observer.disconnect();
                    parent_observer = null;
                }
            }
        });
        parent_observer.observe(document.documentElement, { childList: true, subtree: true });
    }
    return disconnect_all;
}

function get_specific_descendant(root, steps) {
    let node = root;
    for (const step of steps) {
        if (!node) return null;
        node = step === "first" ? node.firstElementChild : node.lastElementChild;
    }
    return node || null;
}

// -------------------------------------------------------------------------
// Original Inventory Table Logic
// -------------------------------------------------------------------------
function run_when_ready() {

    let head = get_specific_descendant(
            resolve_element('div[data-section-type="inventory"]'),
            ["first", "last", "first", "first", "first", "first", "first", "first"]);

    let body = get_specific_descendant(
            resolve_element('div[data-section-type="inventory"]'),
            ["first", "last", "first", "first", "first", "last", "first", "last"]);

    if (!body || !head) return;

    const asins = extractTdValues(body, 1);
    const quantities = extractTdValues(body, 5).map(Number);

    let pages = call_all_wrap(
        resolve_request,
        ["https://fcresearch-na.aka.amazon.com/" + site + "/results/product?s=", ""],
        asins, null, null, { response_type: "document" }
    );

    let alts = call_all_wrap(
        resolve_request,
        ["https://www.amazon.ca/gp/product/", ""],
        asins, null, null, { response_type: "document" }
    );

    (async () => {
        const toArray = async v => {
            v = await v;
            if (Array.isArray(v)) return v;
            if (v && typeof v.length === "number") return Array.from(v);
            return [];
        };

        const [p, a] = await Promise.all([toArray(pages), toArray(alts)]);
        const n = Math.min(p.length, a.length);

        const sum = arr => arr.reduce((total, x) => total + Number(x), 0);

        let prices = await Promise.all(Array.from({ length: n }, (_, i) => round(extract_price(p[i], a[i]))));
        let totals = multiply_indexwise([quantities, prices]);
        const total = format_dollar(sum(totals));

        prices = prices.map((v, i) => format_dollar(v));
        totals = totals.map((v, i) => format_dollar(v));

        insert_td_with_anchor(body, 6, prices, ["td", "span"]);
        insert_td_with_anchor(body, 7, totals, ["td", "span"]);
        insert_td_with_anchor(head, 6, ["Unit Price"], ["th", "div"]);
        insert_td_with_anchor(head, 7, ["Total Cost (" + total + ")"], ["th", "div"]);
        head.firstElementChild.id = "head";
        const valuedd = parseFloat(total.replace('$', '').replaceAll(',', '').trim());

        if (valuedd >= 500) {
            const navbrr = document.querySelector(".aui-nav-row");
            if (navbrr) {
                navbrr.style.backgroundImage = "linear-gradient(to right, #f00,#7d1e1e)";
                const priceCopyBtn = document.createElement('button');
                priceCopyBtn.innerText = `Copy (${valuedd})`;
                priceCopyBtn.style.backgroundColor = '#0052CC';
                priceCopyBtn.style.color = '#FFFFFF';
                priceCopyBtn.style.border = 'none';
                priceCopyBtn.style.borderRadius = '3px';
                priceCopyBtn.style.padding = '4px 10px';
                priceCopyBtn.style.fontSize = '12px';
                priceCopyBtn.style.fontWeight = '500';
                priceCopyBtn.style.cursor = 'pointer';
                priceCopyBtn.style.marginLeft = '10px';
                priceCopyBtn.style.transition = 'background-color 0.15s ease';

                priceCopyBtn.addEventListener('click', (event) => {
                    event.stopPropagation();
                    const excelFormat = `${valuedd}`;

                    navigator.clipboard.writeText(excelFormat)
                        .then(() => {
                            priceCopyBtn.innerText = "Copied!";
                            setTimeout(() => priceCopyBtn.innerText = `Copy (${valuedd})`, 1500);
                        })
                        .catch(err => console.error("Copy failed", err));
                });

                navbrr.appendChild(priceCopyBtn);
            }
        }
    })();
}

// -------------------------------------------------------------------------
// Hierarchy Table Logic (Optimized Fast Mode)
// -------------------------------------------------------------------------
async function run_hierarchy_calc(table) {
    const tbody = table.querySelector('tbody');
    if (!tbody || tbody.rows.length === 0 || tbody.textContent.includes("No matching records")) return;

    const scannableLinks = Array.from(tbody.rows).map(tr => {
        const a = tr.cells[0]?.querySelector('a');
        return a ? a.href : null;
    });

    const quantities = extractTdValues(tbody, 2).map(val => Number(val) || 0);
    const n = tbody.rows.length;

    let total_quantity = 0;
    const wrapper = table.closest('.dataTables_wrapper') || table.parentElement;
    const allHeaders = wrapper.querySelectorAll('th');

    for (let th of allHeaders) {
        const match = th.textContent.match(/Quantity\s*\(\s*([\d,]+)\s*\)/i);
        if (match) {
            total_quantity = parseInt(match[1].replace(/,/g, ''), 10);
            break;
        }
    }

    if (!total_quantity) total_quantity = quantities.reduce((a, b) => a + b, 0);

    const placeholders = Array(n).fill("Loading...");
    insert_custom_td(tbody, 1, placeholders, false);
    insert_th_all(table, 1, "ASIN");

    insert_custom_td(tbody, 4, placeholders, false);
    insert_th_all(table, 4, "Unit Price");

    insert_custom_td(tbody, 5, placeholders, false);
    insert_th_all(table, 5, "Total Cost");

    let asin = "N/A";
    const sampleSize = Math.min(3, scannableLinks.length);
    for (let i = 0; i < sampleSize; i++) {
        const temp_asin = await fetch_live_asin(scannableLinks[i]);
        if (temp_asin !== "N/A" && temp_asin !== "ERROR") {
            asin = temp_asin;
            break;
        }
    }

    const formatted_asin = (asin !== "N/A") ? `<a href="/${site}/results?s=${asin}" target="_blank">${asin}</a>` : "N/A";
    const asin_array = Array(n).fill(formatted_asin);
    update_custom_td(tbody, 1, asin_array, true);

    if (asin === "N/A") {
        update_th_text(table, 1, "ASIN (Not Found)");
        return;
    }

    let p_doc = await resolve_request("https://fcresearch-na.aka.amazon.com/" + site + "/results/product?s=" + asin, { response_type: "document" });
    let a_doc = await resolve_request("https://www.amazon.ca/gp/product/" + asin, { response_type: "document" });
    let unit_price = round(extract_price(p_doc, a_doc));

    const formatted_price = format_dollar(unit_price);
    const price_array = Array(n).fill(formatted_price);
    const totals_array = quantities.map(q => format_dollar(q * unit_price));

    const grand_total = total_quantity * unit_price;
    const formatted_grand_total = format_dollar(grand_total);

    update_custom_td(tbody, 4, price_array, false);
    update_custom_td(tbody, 5, totals_array, false);
    update_th_text(table, 5, `Total Cost (${total_quantity} * ${formatted_price} = ${formatted_grand_total})`);
}

// -------------------------------------------------------------------------
// Receive History Table Logic
// -------------------------------------------------------------------------
async function run_receive_history_calc(table) {
    const tbody = table.querySelector('tbody');
    if (!tbody || tbody.rows.length === 0 || tbody.textContent.includes("No matching records")) return;

    const n = tbody.rows.length;
    const quantities = extractTdValues(tbody, 5).map(val => Number(val) || 0);

    let total_quantity = 0;
    const wrapper = table.closest('.dataTables_wrapper') || table.parentElement;
    const allHeaders = wrapper.querySelectorAll('th');

    for (let th of allHeaders) {
        const match = th.textContent.match(/Quantity\s*\(\s*([\d,]+)\s*\)/i);
        if (match) {
            total_quantity = parseInt(match[1].replace(/,/g, ''), 10);
            break;
        }
    }

    if (!total_quantity) total_quantity = quantities.reduce((a, b) => a + b, 0);

    const placeholders = Array(n).fill("Loading...");
    insert_custom_td(tbody, 7, placeholders, false);
    insert_th_all(table, 7, "Unit Price");

    insert_custom_td(tbody, 8, placeholders, false);
    insert_th_all(table, 8, "Total Cost");

    let asin = "N/A";
    const sampleSize = Math.min(3, n);
    for (let i = 0; i < sampleSize; i++) {
        const cellText = tbody.rows[i].cells[3]?.textContent.trim();
        if (cellText && cellText !== "") {
            asin = cellText;
            break;
        }
    }

    if (asin === "N/A") {
        update_custom_td(tbody, 7, Array(n).fill("N/A"), false);
        update_custom_td(tbody, 8, Array(n).fill("N/A"), false);
        update_th_text(table, 7, "Unit Price (N/A)");
        return;
    }

    let p_doc = await resolve_request("https://fcresearch-na.aka.amazon.com/" + site + "/results/product?s=" + asin, { response_type: "document" });
    let a_doc = await resolve_request("https://www.amazon.ca/gp/product/" + asin, { response_type: "document" });
    let unit_price = round(extract_price(p_doc, a_doc));

    const formatted_price = format_dollar(unit_price);
    const price_array = Array(n).fill(formatted_price);
    const totals_array = quantities.map(q => format_dollar(q * unit_price));

    const grand_total = total_quantity * unit_price;
    const formatted_grand_total = format_dollar(grand_total);

    update_custom_td(tbody, 7, price_array, false);
    update_custom_td(tbody, 8, totals_array, false);
    update_th_text(table, 7, "Unit Price");
    update_th_text(table, 8, `Total Cost (${total_quantity} * ${formatted_price} = ${formatted_grand_total})`);
}

// -------------------------------------------------------------------------
// Hidden Iframe "Headless Browser" ASIN Extractor
// -------------------------------------------------------------------------
async function fetch_live_asin(url) {
    return new Promise((resolve) => {
        if (!url) { resolve("N/A"); return; }

        const iframe = document.createElement('iframe');
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        iframe.style.position = 'absolute';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);

        let attempts = 0;
        let checkInterval;

        iframe.onload = () => {
            checkInterval = setInterval(() => {
                attempts++;
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    const cells = doc.querySelectorAll('td');
                    for (let cell of cells) {
                        const text = cell.textContent.trim();
                        if (/^(B[A-Z0-9]{9}|\d{9}[X\d])$/i.test(text)) {
                            cleanup(text.toUpperCase());
                            return;
                        }
                    }

                    if (doc.body && doc.body.textContent.includes("No matching records found")) {
                        cleanup("N/A");
                        return;
                    }
                } catch(e) {}

                if (attempts > 60) cleanup("N/A");
            }, 100);
        };

        const fallbackTimeout = setTimeout(() => cleanup("N/A"), 8000);
        iframe.src = url;

        function cleanup(result) {
            clearInterval(checkInterval);
            clearTimeout(fallbackTimeout);
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
            resolve(result);
        }
    });
}

// -------------------------------------------------------------------------
// Price Extraction (Fixed Regex & Typo)
// -------------------------------------------------------------------------
function extract_price(doc_fc, doc_am) {
    const regex_fc = /List Price[\s\n\r]*(?:CAD|USD)?[\s\n\r]*\$?[\s\n\r]*([\d,]+(?:\.\d{2})?)/i;
    const regex_am = /"priceAmount":(\d+(?:\.\d+)?)/;

    try {
        const fc_text = doc_fc?.body?.innerText || doc_fc?.documentElement?.textContent || "";
        const am_text = doc_am?.body?.innerText || doc_am?.documentElement?.textContent || "";

        const match_fc = fc_text.match(regex_fc);
        const match_am = am_text.match(regex_am);

        if (match_fc && match_fc[1]) {
            return parseFloat(match_fc[1].replace(/,/g, ''));
        } else if (match_am && match_am[1]) {
            return parseFloat(match_am[1].replace(/,/g, ''));
        }
    } catch(e) {
        console.error("Error extracting price:", e);
    }
    return 0;
}

// -------------------------------------------------------------------------
// Global Table Helpers
// -------------------------------------------------------------------------
function insert_custom_td(tbody, index, values, isHTML = false) {
    if (!(tbody instanceof Element) || !tbody.rows) return;
    for (let i = 0; i < tbody.rows.length; i++) {
        const row = tbody.rows[i];
        const cell = document.createElement("td");
        cell.className = "a-text-center";
        if (isHTML && values[i]) cell.innerHTML = values[i];
        else cell.textContent = values[i] != null ? values[i] : "";

        const pos = Math.max(0, Math.min(index, row.children.length));
        if (pos === row.children.length) row.appendChild(cell);
        else row.insertBefore(cell, row.children[pos]);
    }
}

function update_custom_td(tbody, index, values, isHTML = false) {
    if (!(tbody instanceof Element) || !tbody.rows) return;
    for (let i = 0; i < tbody.rows.length; i++) {
        const row = tbody.rows[i];
        const cell = row.children[index];
        if (cell) {
            if (isHTML && values[i]) cell.innerHTML = values[i];
            else cell.textContent = values[i] != null ? values[i] : "";
        }
    }
}

function insert_th_all(table, index, text) {
    const wrapper = table.closest('.dataTables_wrapper') || table.parentElement;
    const thead_rows = wrapper.querySelectorAll('thead tr');

    thead_rows.forEach(row => {
        const th = document.createElement("th");
        th.className = "a-span4 a-text-center sorting";
        th.style.fontWeight = "bold";
        th.textContent = text;

        const kids = row.children;
        if (index >= kids.length) row.appendChild(th);
        else row.insertBefore(th, kids[index]);
    });
}

function update_th_text(table, index, text) {
    const wrapper = table.closest('.dataTables_wrapper') || table.parentElement;
    const thead_rows = wrapper.querySelectorAll('thead tr');
    thead_rows.forEach(row => {
        const th = row.children[index];
        if (th) th.textContent = text;
    });
}

function clone_attributes(body, from_el, to_el) {
    if (!(from_el instanceof Element) || !(to_el instanceof Element)) return to_el;
    if (from_el === to_el) return to_el;

    for (const name of to_el.getAttributeNames()) to_el.removeAttribute(name);
    for (const name of from_el.getAttributeNames()) {
        const val = from_el.getAttribute(name);
        to_el.setAttribute(name, val == null ? "" : val);
    }
    if (from_el.className && typeof from_el.className === "object" && "baseVal" in from_el.className) {
        to_el.setAttribute("class", from_el.className.baseVal || "");
    } else if (typeof from_el.className === "string") {
        to_el.setAttribute("class", from_el.className);
    }
    to_el.style.cssText = from_el.style.cssText;
    return to_el;
}

function insert_td_with_anchor(tbody, index, A, elements) {
    if (!(tbody instanceof Element) || !tbody.rows) return;

    const cell_tag = elements && typeof elements[0] === "string" ? elements[0].toLowerCase() : "td";
    const child_tag = elements && typeof elements[1] === "string" ? elements[1].toLowerCase() : "a";

    for (let i = 0; i < tbody.rows.length; i++) {
        const row = tbody.rows[i];
        const cell = document.createElement(cell_tag);
        const child = document.createElement(child_tag);
        child.textContent = (A && i in A && A[i] != null) ? String(A[i]) : "";
        cell.appendChild(child);

        const kids = row.children;
        const pos = Math.max(0, Math.min(index, kids.length));
        if (pos === kids.length){
            row.appendChild(clone_attributes(tbody, kids[kids.length-1], cell));
        }else{
            row.insertBefore(clone_attributes(tbody, kids[pos], cell), kids[pos]);
        }
    }
}

function multiply_indexwise(lists) {
    if (!Array.isArray(lists) || lists.length === 0) return [];
    const len = Math.min(...lists.map(a => a.length));
    const out = new Array(len);
    for (let i = 0; i < len; i++) {
        let prod = 1;
        for (let j = 0; j < lists.length; j++) prod *= Number(lists[j][i]);
        out[i] = prod;
    }
    return out;
}

function format_dollar(value, decimals = 2) {
    if (typeof value !== "number" || !Number.isFinite(value)) return String(value);
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

// Fixed Round Function
function round(n, p = 2) {
    return Number(Math.round(n + 'e' + p) + 'e-' + p);
}

function extractTdValues(tbody, tdIndex) {
    const el = typeof tbody === "string" ? document.querySelector(tbody) : tbody;
    if (!el || el.tagName !== "TBODY" || typeof tdIndex !== "number") return [];
    return Array.from(el.rows).map(tr => {
        const cell = tr.cells[tdIndex];
        return cell ? cell.textContent.trim() : null;
    });
}

// -------------------------------------------------------------------------
// Initializers / Watchers (Global Observer)
// -------------------------------------------------------------------------
const stop_inventory = on_child_of('div[data-section-type="inventory"]', run_when_ready, {
    once: true,
    check_existing: true
});

const table_observer = new MutationObserver(() => {
    // Watch for Hierarchy Table IB
    const hierarchy_table = document.getElementById('table-container-hierarchy');
    if (hierarchy_table && hierarchy_table.querySelector('tbody tr td') && !hierarchy_table.dataset.processed) {
        hierarchy_table.dataset.processed = "true";
        run_hierarchy_calc(hierarchy_table);
    }

    // Watch for Receive History Table
    const receive_table = document.getElementById('table-receive-history');
    if (receive_table && receive_table.querySelector('tbody tr td') && !receive_table.dataset.processed) {
        receive_table.dataset.processed = "true";
        run_receive_history_calc(receive_table);
    }
});
table_observer.observe(document.body, { childList: true, subtree: true });
