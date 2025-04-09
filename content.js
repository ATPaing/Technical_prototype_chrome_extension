console.log("✅ EasyRead content.js injected");

// === Message Listener ===
chrome.runtime.onMessage.addListener((request) => {
    if (request.action && request.selectionText) {
        performContextAction(request.action, request.selectionText);
    }

    if (request.increaseReadability !== undefined) {
        request.increaseReadability ? applyReadabilityStyles() : resetReadabilityStyles();
        chrome.storage.sync.set({ readabilityEnabled: request.increaseReadability });
    }
});

// === Perform Action Based on Message ===
function performContextAction(action, selectedText) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const parentEl = range.startContainer.parentElement;

    // Assign ID if missing (not used for matching now but kept for completeness)
    if (!parentEl.id) {
        parentEl.id = `easyread-id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    function wrapSelection(styleObj, actionName) {
        const span = document.createElement("span");
        const highlightId = `highlightedId-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        Object.assign(span.style, styleObj);
        span.className = "easyread-highlight";
        span.setAttribute("data-highlight-id", highlightId);
        span.textContent = range.toString();

        const fullText = parentEl.textContent;
        const selectedText = range.toString().trim();
        const startOffset = fullText.indexOf(selectedText);
        const endOffset = startOffset + selectedText.length;

        if (startOffset === -1) {
            console.warn("❌ Could not locate selected text in parent element.");
            return;
        }

        range.deleteContents();
        range.insertNode(span);

        if (actionName === "highlight") {
            const domain = window.location.hostname;
            const tagName = parentEl.tagName;
            const textSnippet = fullText.slice(0, 50);

            const obj = {
                domain,
                elementId: parentEl.id,
                endOffset,
                highlightedId: highlightId,
                startOffset,
                tagName,
                text: selectedText,
                textSnippet
            };

            const key = highlightId;

            chrome.storage.local.get(["highlightedItems"], (data) => {
                const current = data.highlightedItems || [];
                current.push({ key, value: JSON.stringify(obj) });
                chrome.storage.local.set({ highlightedItems: current }, () => {
                    console.log("✅ Highlight stored:", obj);
                });
            });
        }
    }

    function removeSelectionHighlight() {
        const span = range.startContainer.parentElement;
        if (
            span.tagName === "SPAN" &&
            span.classList.contains("easyread-highlight") &&
            span.dataset.highlightId
        ) {
            const highlightId = span.dataset.highlightId;
            const plainText = span.textContent;
            span.replaceWith(document.createTextNode(plainText));

            chrome.storage.local.get(["highlightedItems"], (data) => {
                let current = data.highlightedItems || [];
                current = current.filter(item => item.key !== highlightId);
                chrome.storage.local.set({ highlightedItems: current }, () => {
                    console.log("🧹 Highlight removed:", highlightId);
                });
            });
        }
    }

    function removeFontSizeSpans() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
    
        const range = selection.getRangeAt(0);
        const node = range.startContainer;
    
        // Walk up to find the nearest span
        let span = node.nodeType === 3 ? node.parentElement : node;
    
        while (span && span.tagName !== "SPAN") {
            span = span.parentElement;
        }
    
        if (
            span &&
            span.tagName === "SPAN" &&
            span.style.fontSize
        ) {
            console.log("🧼 Found font-size span:", span);
    
            span.style.fontSize = "";
    
            // If no other styles remain, unwrap it
            if (!span.getAttribute("style") || span.getAttribute("style").trim() === "") {
                const text = span.textContent;
                const textNode = document.createTextNode(text);
                span.replaceWith(textNode);
                console.log("✅ Span unwrapped");
            } else {
                console.log("✅ Font-size removed, span kept");
            }
        } else {
            console.log("ℹ️ No font-size span found in selection");
        }
    }
    

    switch (action) {
        case "highlight":
            wrapSelection({ backgroundColor: "rgba(255, 230, 100, 0.4)" }, "highlight");
            break;
        case "removeHighlight":
            removeSelectionHighlight();
            break;
        case "increaseFont":
            wrapSelection({ fontSize: "larger" }, "font"); // temporary only
            break;
        case "resetFont":
            removeFontSizeSpans();
            break;
        case "readAloud":
            const utterance = new SpeechSynthesisUtterance(selectedText);
            speechSynthesis.speak(utterance);
            break;
    }
}

// === Readability ===
function applyReadabilityStyles() {
    document.body.style.letterSpacing = "0.075em";
    document.body.style.lineHeight = "1.5";
}

function resetReadabilityStyles() {
    document.body.style.letterSpacing = "";
    document.body.style.lineHeight = "";
}

// === Restore Highlights on Load ===
restoreHighlights();
window.addEventListener("load", restoreHighlights);

function restoreHighlights() {
    chrome.storage.local.get(["highlightedItems"], (data) => {
        const highlights = data.highlightedItems || [];
        const domain = window.location.hostname;

        if (highlights.length === 0) {
            console.log("📭 No highlights stored.");
            return;
        }

        console.log("🗃️ Stored highlights:", highlights);

        // Group highlights by tag + snippet
        const grouped = {};
        highlights.forEach(item => {
            const obj = JSON.parse(item.value);
            if (obj.domain !== domain) return;

            const key = `${obj.tagName}|${obj.textSnippet}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(obj);
        });

        Object.entries(grouped).forEach(([key, items]) => {
            const [tagName, textSnippet] = key.split("|");

            const candidates = document.querySelectorAll(tagName);
            const target = Array.from(candidates).find(el =>
                el.textContent.includes(textSnippet)
            );

            if (!target) {
                console.warn("❌ Could not find element for:", key);
                return;
            }

            const text = target.textContent;
            let html = "";
            let lastIndex = 0;

            const sorted = items.sort((a, b) => a.startOffset - b.startOffset);

            sorted.forEach(h => {
                const { startOffset, endOffset, text: highlightText, highlightedId } = h;
                const match = text.slice(startOffset, endOffset);

                if (match !== highlightText) {
                    console.warn(`⚠️ Skipping mismatch: "${match}" !== "${highlightText}"`);
                    return;
                }

                html += escapeHTML(text.slice(lastIndex, startOffset));
                html += `<span class="easyread-highlight" style="background-color: rgba(255, 230, 100, 0.4);" data-highlight-id="${highlightedId}">${escapeHTML(match)}</span>`;
                lastIndex = endOffset;
            });

            html += escapeHTML(text.slice(lastIndex));
            target.innerHTML = html;
        });
    });
}

// === Escape HTML Helper ===
function escapeHTML(str) {
    return str.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[m]);
}
