export async function categorizeItemsWithAI(items, apiKey) {
  if (!items || items.length === 0) return {};

  // 将复杂数据结构格式化为 AI 能读懂的纯文本
  const formattedItems = items.map(i => {
    let contentStr = '';
    if (i.type === 'synonym') {
      const related = (i.relatedWords || []).map(r => r.word).join(', ');
      contentStr = `主词:${i.baseWord} ${i.baseWordZh ? '('+i.baseWordZh+')' : ''} | 关联词:${related}`;
    } else {
      contentStr = `${i.content} ${i.zh ? '('+i.zh+')' : ''}`;
    }
    return `ID: ${i.id} | 内容: ${contentStr}`;
  }).join('\n');

  const prompt = `
    你是一个专业的英语学习归纳助手。请分析以下英语学习笔记，将它们自动归纳到合适的主题分类中（如 food, travel, work, casual, emotion 等，分类名称必须用简短的英文）。
    必须严格按以下 JSON 格式返回，不要包含任何 Markdown 标记，也不要有任何额外的解释文本：
    {"项目ID": "分类名称"}
    需要分类的数据如下：
    ${formattedItems}
  `;

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" } 
    })
  });

  if (!response.ok) {
    throw new Error('API 请求失败，请检查 API Key 或网络');
  }

  const data = await response.json();
  let jsonString = data.choices[0].message.content;
  jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(jsonString);
}