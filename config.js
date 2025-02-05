const config = {
  API_ENDPOINT: 'https://api.siliconflow.cn/v1/chat/completions',
  MODEL: 'deepseek-ai/DeepSeek-V2.5',
  MAX_TOKENS: 512,
  TEMPERATURE: 0.7,
  TOP_P: 0.7,
  TOP_K: 50,
  FREQUENCY_PENALTY: 0.5,
  
  // 翻译提示词
  TRANSLATE_PROMPT: '请将以下文本翻译成中文，保持专业和准确：',
  
  // 总结提示词
  SUMMARIZE_PROMPT: '请总结以下文本的主要内容，用简洁的中文表达：',
  
  // 存储键
  STORAGE_KEYS: {
    API_KEY: 'deepseek_api_key',
    THEME: 'theme_preference'
  }
}; 