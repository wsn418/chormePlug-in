// 初始化侧边栏
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// 监听插件图标点击事件
chrome.action.onClicked.addListener((tab) => {
  // 确保侧边栏打开
  chrome.sidePanel.open({tabId: tab.id}).catch((error) => {
    console.error('打开侧边栏失败:', error);
  });
});

// 转发消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'selectedText') {
    // 转发选中的文本到侧边栏
    chrome.runtime.sendMessage(message);
  }
}); 