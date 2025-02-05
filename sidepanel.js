document.addEventListener('DOMContentLoaded', () => {
  const inputText = document.getElementById('inputText');
  const translateBtn = document.getElementById('translateBtn');
  const summarizeBtn = document.getElementById('summarizeBtn');
  const resultContent = document.getElementById('resultContent');
  const loading = document.getElementById('loading');
  const settingsBtn = document.getElementById('settingsBtn');
  const clearBtn = document.getElementById('clearBtn');
  const targetLang = document.getElementById('targetLang');

  // 从storage获取API key
  let apiKey = '';
  chrome.storage.sync.get([config.STORAGE_KEYS.API_KEY], (result) => {
    apiKey = result[config.STORAGE_KEYS.API_KEY];
    if (!apiKey) {
      promptForApiKey();
    }
  });

  // 监听来自content script的选中文本
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'selectedText' && request.text) {
      inputText.value = request.text;
      // 自动滚动到输入框
      inputText.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // API调用函数
  async function callDeepSeekApi(prompt, text) {
    if (!apiKey) {
      alert('请先设置API Key');
      promptForApiKey();
      return;
    }

    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "model": config.MODEL,
        "messages": [{
          "role": "user",
          "content": `${prompt}\n${text}`
        }],
        "stream": false,
        "max_tokens": config.MAX_TOKENS,
        "temperature": config.TEMPERATURE,
        "top_p": config.TOP_P,
        "top_k": config.TOP_K,
        "frequency_penalty": config.FREQUENCY_PENALTY,
        "n": 1
      })
    };

    try {
      const response = await fetch(config.API_ENDPOINT, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API响应:', data); // 添加日志
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      } else {
        throw new Error('无效的API响应格式');
      }
    } catch (error) {
      console.error('API调用错误:', error);
      throw error;
    }
  }

  // 清除按钮点击事件
  clearBtn.addEventListener('click', () => {
    inputText.value = '';
    resultContent.textContent = '';
    // 聚焦输入框
    inputText.focus();
  });

  // 设置按钮加载状态
  function setButtonLoading(button, isLoading) {
    if (isLoading) {
      button.disabled = true;
      button.classList.add('loading');
      button.classList.add('ant-btn-loading');
    } else {
      button.disabled = false;
      button.classList.remove('loading');
      button.classList.remove('ant-btn-loading');
    }
  }

  // 翻译按钮点击事件
  translateBtn.addEventListener('click', async () => {
    const text = inputText.value.trim();
    if (!text) {
      alert('请输入或选择要翻译的文本');
      return;
    }

    setButtonLoading(translateBtn, true);
    
    try {
      const langPrompts = {
        'zh': '请将以下内容翻译成中文：',
        'en': '请将以下内容翻译成英文：',
        'ja': '请将以下内容翻译成日文：'
      };
      
      const result = await callDeepSeekApi(langPrompts[targetLang.value], text);
      resultContent.textContent = result || '未获取到结果';
    } catch (error) {
      resultContent.textContent = '翻译失败: ' + error.message;
    } finally {
      setButtonLoading(translateBtn, false);
    }
  });

  // 添加总结文本的函数
  async function summarizeText(text) {
    if (!text.trim()) {
      throw new Error('没有获取到有效内容');
    }

    const prompt = `请用中文简要总结以下内容的主要观点，要求：
1. 控制在300字以内
2. 突出重点
3. 必须使用中文回复
4. 如果原文是英文请翻译后再总结

内容如下：`;

    try {
      const result = await callDeepSeekApi(prompt, text);
      return result;
    } catch (error) {
      console.error('总结API调用失败:', error);
      throw error;
    }
  }

  // 总结按钮点击事件
  summarizeBtn.addEventListener('click', async () => {
    setButtonLoading(summarizeBtn, true);
    await handleSummarize();
    setButtonLoading(summarizeBtn, false);
  });

  // 设置按钮点击事件
  settingsBtn.addEventListener('click', () => {
    promptForApiKey();
  });

  // 提示输入API Key
  function promptForApiKey() {
    const key = prompt('请输入DeepSeek API Key:');
    if (key) {
      chrome.storage.sync.set({
        [config.STORAGE_KEYS.API_KEY]: key
      }, () => {
        apiKey = key;
      });
    }
  }

  async function handleSummarize() {
    const inputText = document.getElementById('inputText').value.trim();
    
    try {
      // 显示加载状态
      const summarizeBtn = document.getElementById('summarizeBtn');
      summarizeBtn.classList.add('ant-btn-loading');
      
      let textToSummarize;
      
      if (inputText) {
        // 如果输入框有文字，总结输入框的文字
        textToSummarize = inputText;
      } else {
        // 如果输入框没有文字，总结整个页面
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const [{result}] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: () => {
            // 获取页面主要内容
            return document.body.innerText;
          }
        });
        textToSummarize = result;
      }

      // 调用 API 进行总结
      const response = await summarizeText(textToSummarize);
      
      // 显示结果
      const resultContent = document.getElementById('resultContent');
      resultContent.textContent = response;

    } catch (error) {
      console.error('总结失败:', error);
      // 显示错误信息
      const resultContent = document.getElementById('resultContent');
      resultContent.textContent = '总结失败，请稍后重试';
    } finally {
      // 移除加载状态
      const summarizeBtn = document.getElementById('summarizeBtn');
      summarizeBtn.classList.remove('ant-btn-loading');
    }
  }

  // 复制文本功能
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showCopyTip('复制成功');
    } catch (err) {
      console.error('复制失败:', err);
      showCopyTip('复制失败');
    }
  }

  // 显示复制提示
  function showCopyTip(message) {
    const tip = document.createElement('div');
    tip.className = 'copy-tip';
    tip.textContent = message;
    document.body.appendChild(tip);

    // 添加显示动画类
    setTimeout(() => tip.classList.add('show'), 0);

    // 2秒后移除提示
    setTimeout(() => {
      tip.classList.remove('show');
      setTimeout(() => tip.remove(), 300);
    }, 2000);
  }

  // 为结果内容添加点击复制功能
  resultContent.addEventListener('click', () => {
    if (resultContent.textContent) {
      copyText(resultContent.textContent);
    }
  });
}); 