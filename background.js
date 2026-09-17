// ============================================================================
// background.js
//
// Service worker. Открывает приветственную вкладку при первой установке.
// При обновлениях расширения — не открывает.
// ============================================================================

chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install') {
        chrome.tabs.create({ url: chrome.runtime.getURL('ui/welcome/welcome.html') });
    }
});