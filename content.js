chrome.runtime.onMessage.addListener((request) => {
    if (request.action && request.selectionText) {
        performContextAction(request.action, request.selectionText);
    }

    if (request.increaseReadability !== undefined) {
        if (request.increaseReadability) {
            applyReadabilityStyles();
        } else {
            resetReadabilityStyles();
        }
        chrome.storage.sync.set({
            readabilityEnabled: request.increaseReadability,
        });
    }
});

function performContextAction(action, selectedText) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    function wrapSelection(styleObj) {
        const span = document.createElement("span");
        Object.assign(span.style, styleObj);
        range.surroundContents(span);
    }

    function unwrapSelection(styleProp) {
        const selectedNodes = range
            .cloneContents()
            .querySelectorAll(`span[style*="${styleProp}"]`);
        if (selectedNodes.length === 0) return;

        selectedNodes.forEach((node) => {
            node.style[styleProp] = "";
            if (
                node.getAttribute("style") === "" ||
                !node.getAttribute("style")
            ) {
                node.replaceWith(...node.childNodes);
            }
        });

        // Replace the selected range with cleaned content
        range.deleteContents();
        range.insertNode(range.cloneContents());
    }

    switch (action) {
        case "increaseFont":
            wrapSelection({ fontSize: "larger" });
            break;

        case "highlight":
            wrapSelection({ backgroundColor: "rgba(255, 230, 100, 0.4)" });
            break;

        case "removeHighlight":
            unwrapSelection("background-color");
            break;

        case "resetFont":
            unwrapSelection("font-size");
            break;

        case "readAloud":
            const utterance = new SpeechSynthesisUtterance(selectedText);
            speechSynthesis.speak(utterance);
            break;
    }
}

// Helper function to remove specific style from selection
function removeStyleFromSelection(styleProp) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container = document.createElement("div");
    container.appendChild(range.cloneContents());

    // Iterate and clean matching spans
    container.querySelectorAll(`span[style]`).forEach((span) => {
        span.style[styleProp] = "";
        if (!span.getAttribute("style")) {
            span.replaceWith(...span.childNodes);
        }
    });

    // Replace original selection
    range.deleteContents();
    range.insertNode(container);
}

function applyReadabilityStyles() {
    document.body.style.letterSpacing = "0.075em";
    document.body.style.lineHeight = "1.5";
}

function resetReadabilityStyles() {
    document.body.style.letterSpacing = "";
    document.body.style.lineHeight = "";
    document.body.style.fontFamily = "";
    document.body.style.backgroundColor = "";
    document.body.style.color = "";
}
