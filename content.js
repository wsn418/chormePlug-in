// 监听文本选择事件
document.addEventListener('mouseup', () => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    chrome.runtime.sendMessage({
      type: 'selectedText',
      text: selectedText
    });
  }
}); 