export async function categorizeItemsWithAI(items, existingCategories, apiKey) {
  if (!items || items.length === 0) return {};

  const formattedItems = items.map(i => {
    let contentStr = '';
    if (i.type === 'synonym') {
      const related = (i.relatedWords || []).map(r => r.word).join(', ');
      contentStr = `[同义词组] 主词:${i.baseWord} ${i.baseWordZh ? '('+i.baseWordZh+')' : ''} | 关联词:${related}`;
    } else {
      contentStr = `[句子/短语] ${i.content} ${i.zh ? '('+i.zh+')' : ''}`;
    }
    return `ID: ${i.id} | 类型: ${i.type} | 内容: ${contentStr}`;
  }).join('\n');

  const categoriesStr = existingCategories.length > 0 ? existingCategories.join(', ') : '暂无分类，请你自由创建';

  const prompt = `
    你是一个顶级的英语口语与词汇私教。请分析以下用户的学习笔记。
    
    【重要规则 1：星号标记音标】
    如果文本中任何英文单词后面带有星号 "*"(例如 "recipe*")，你必须在返回时去掉星号，并在该单词后附上英式或美式音标 (例如 "recipe [ˈresəpi]")。

    【重要规则 2：节省分类Token】
    用户当前已有的分类大类有：[${categoriesStr}]。请优先归入这些已有分类。

    【核心教学原则：宁缺毋滥 & 关联归类】
    - 拓展内容只要 1-2 组极其贴切、最地道的高频口语表达。
    - 合并对比原则：如果短语存在��显反义或强关联动作（例如 调高/调低温度、开/关、上/下），必须合并到同一小组，并尽量在同一例句或紧连的例句中对比或串联展示。
    - 每个短语与例句都必须提供精准的中文翻译（字段名为 phraseZh 与 exampleZh）。
    - 小类（subCategory）必须同时返回英文与中文：subCategory（英文）与 subCategoryZh（中文）。

    请根据数据的"类型"进行不同的处理，严格返回对应的 JSON 格式（不要包含任何 Markdown）：

    {
      "项目ID": {
        "type": "expression 或 synonym",
        "category": "宏观分类(English)",
        "subCategory": "小类英文 (例如: Casual Expressions)",
        "subCategoryZh": "小类中文 (例如: 随性表达)",
        "correctedText": "修正后的句子或词汇(带音标)",
        "chunks": "拆分的意群(仅对句子有效)",
        "mainWord": "同义词组的核心词(仅对synonym有效)",
        "relatedGroups": [
          { 
            "groupName": "分组名称(中英，例如: Temperature Control 温度控制)", 
            "items": [
              { 
                "phrase": "短语1 / 短语2 (合并时用 '/' 连接)",
                "phraseZh": "短语的中文释义",
                "example": "英文例句(可在一句里对比正反义)",
                "exampleZh": "例句中文翻译"
              }
            ] 
          }
        ]
      }
    }

    需要分析的数据如下：
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