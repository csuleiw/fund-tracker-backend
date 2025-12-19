export const fetchFundData = async (): Promise<Fund[]> => {
  // 使用绝对路径，不依赖相对路径
  const dataUrl = 'https://csuleiw.github.io/fund-tracker-backend/data/fund-data.json';
  
  try {
    const timestamp = Date.now();
    const response = await fetch(`${dataUrl}?t=${timestamp}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      // 读取响应内容用于调试
      const textResponse = await response.text();
      console.error('非JSON响应内容:', textResponse.substring(0, 500));
      throw new Error(`无效内容类型: ${contentType}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('数据加载失败:', error);
    // 临时：不回退到模拟数据，而是抛出错误
    throw error;
  }
};
