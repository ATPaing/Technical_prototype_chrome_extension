// background.js
chrome.runtime.onInstalled.addListener(() => {
    // Clear the readability mode every time extension is reloaded
    chrome.storage.sync.set({ readabilityEnabled: false });
    
    chrome.contextMenus.create({
        id: "increase-font",
        title: "Increase Font Size of Selected Text",
        contexts: ["selection"],
    });

    chrome.contextMenus.create({
        id: "reset-font",
        title: "Reset Font to Default",
        contexts: ["all"],
    });

    chrome.contextMenus.create({
        id: "separator-1",
        type: "separator",
        contexts: ["all"],
    });

    chrome.contextMenus.create({
        id: "highlight-text",
        title: "Highlight Selected Text",
        contexts: ["selection"],
    });

    chrome.contextMenus.create({
        id: "dehighlight-text",
        title: "Remove Highlights",
        contexts: ["all"],
    });

    chrome.contextMenus.create({
        id: "separator-2",
        type: "separator",
        contexts: ["all"],
    });

    chrome.contextMenus.create({
        id: "read-aloud",
        title: "Read Aloud Selected Text",
        contexts: ["selection"],
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "read-aloud") {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (text) => {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 1.0;
                window.speechSynthesis.speak(utterance);
            },
            args: [info.selectionText],
        });
    }
    if (info.menuItemId === "highlight-text") {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const selection = window.getSelection();
                if (selection.rangeCount) {
                    const range = selection.getRangeAt(0);
                    const span = document.createElement("span");
                    span.style.backgroundColor = "rgba(255, 230, 100, 0.4)";
                    range.surroundContents(span);
                    selection.removeAllRanges();
                }
            },
        });
    }
    if (info.menuItemId === "increase-font") {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const selection = window.getSelection();
                if (selection.rangeCount) {
                    const range = selection.getRangeAt(0);
                    const span = document.createElement("span");
                    span.style.fontSize = "larger";
                    range.surroundContents(span);
                    selection.removeAllRanges();
                }
            },
        });
    }
    if (info.menuItemId === "dehighlight-text") {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const selection = window.getSelection();

                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const node = range.startContainer;

                    // Walk up the DOM tree to find the closest element parent
                    const parentElement =
                        node.nodeType === 3 ? node.parentElement : node;

                    console.log(
                        "Selected text comes from a:",
                        parentElement.tagName
                    );

                    if (parentElement.tagName === "SPAN") {
                        console.log("✅ Selected text is inside a <span> tag");
                        parentElement.style.backgroundColor = "transparent";
                    } else {
                        console.log(
                            "❌ Selected text is NOT inside a <span> tag"
                        );
                    }
                }
            },
        });
    }
    if (info.menuItemId === "reset-font") {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const selection = window.getSelection();

                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const node = range.startContainer;

                    // Walk up the DOM tree to find the closest element parent
                    const parentElement =
                        node.nodeType === 3 ? node.parentElement : node;

                    console.log(
                        "Selected text comes from a:",
                        parentElement.tagName
                    );

                    if (parentElement.tagName === "SPAN") {
                        console.log("✅ Selected text is inside a <span> tag");
                        parentElement.style.fontSize = "";
                    } else {
                        console.log(
                            "❌ Selected text is NOT inside a <span> tag"
                        );
                    }
                }
            },
        });
    }
});

console.log("Text Enhancer Extension Loaded");
