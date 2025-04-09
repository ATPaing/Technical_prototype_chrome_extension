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
        contexts: ["selection"],
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
        contexts: ["selection"],
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
    const { menuItemId, selectionText } = info;

    if (!tab || !tab.id) return;

    switch (menuItemId) {
        case "read-aloud":
            chrome.tabs.sendMessage(tab.id, {
                action: "readAloud",
                selectionText,
            });
            break;

        case "highlight-text":
            chrome.tabs.sendMessage(tab.id, {
                action: "highlight",
                selectionText,
            });
            break;

        case "dehighlight-text":
            chrome.tabs.sendMessage(tab.id, {
                action: "removeHighlight",
                selectionText,
            });
            break;

        case "increase-font":
            chrome.tabs.sendMessage(tab.id, {
                action: "increaseFont",
                selectionText,
            });
            break;

        case "reset-font":
            chrome.tabs.sendMessage(tab.id, {
                action: "resetFont",
                selectionText,
            });
            break;
    }
});

console.log("✅ EasyRead Background Script Loaded");
