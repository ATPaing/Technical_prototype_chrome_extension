document
    .getElementById("readability-toggle")
    .addEventListener("change", function () {
        chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    increaseReadability: this.checked,
                });
            }.bind(this)
        );
    });

// Initialize the toggle state
chrome.storage.sync.get("readabilityEnabled", function (data) {
    document.getElementById('readability-toggle').checked = data.readabilityEnabled || false;
});

