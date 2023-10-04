// Add this listener in your background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message);
    if (message.type === 'updateForm') {
        document.getElementById('critical').value = message.data.criticalSum;
        document.getElementById('high').value = message.data.highSum;
        document.getElementById('medium').value = message.data.mediumSum;
        document.getElementById('low').value = message.data.lowSum;
    }
});
