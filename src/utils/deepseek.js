// src/utils/deepseek.js

const SYSTEM_PROMPT = `
You are a top-tier English Oral Coach and vocabulary network architect.
Your task is to analyze user-provided English learning items and output a STRICT JSON object.

=== GLOBAL CLASSIFICATION & RULES ===
1. 🏷️ MACRO-CATEGORY (CRITICAL): 
   - IF type IS "expression" OR "synonym": STRICTLY choose ONE of the 8 broad categories (1. 💬 社交与人际 2. 🎭 情绪与反应 3. 💡 观点与表态 4. 🏃 行动与状态 5. 💼 工作与学习 6. 🛒 生活与日常 7. 🩹 身心与休闲 8. 🔀 逻辑与过渡).
   - IF type IS "template": STRICTLY choose ONE of the 10 functional categories (【起头类】, 【提问类】, 【表态类】, 【提议类】, 【报备类】, 【对表类】, 【反馈类】, 【功能类】, 【定案类】, 【礼貌类】).
2. 🛑 CATEGORY RETENTION: You MUST output the EXACT SAME 'category' provided in the input.

=== 🎯 THE 3 TRACKS (CRITICAL ROUTING BASED ON TYPE) ===

🟢 TRACK 1: SYNONYM (Vocabulary Words / Semantic Fields)
   - Rule: Analyze the universal semantic field (物以类聚) to build a vocabulary network.
   - 'synonyms' (Semantic Field Micro-Scenes): Group natural families into exactly 3 distinct Micro-Scenes WITH A RELEVANT EMOJI.
   - For EACH Micro-Scene, provide 2-3 related words or short phrases.
   - 🌟 EXAMPLE: If the word is "bubble tea shop", generate: "[🏪 商铺类型] coffee shop (咖啡店), retail store (零售店)" AND "[🥤 常见饮品] boba (波霸), soda (苏打水)".
   - Format MUST BE EXACTLY: "[🏷️ 微场景带Emoji] word1 (中文), word2 (中文)".
   - 'relatedPhrases' MUST be empty. 'subCategory' MUST be "".

🔵 TRACK 2: EXPRESSION (Casual Phrases / Idioms)
   - Rule: Analyze the everyday usage scenario.
   - 👑 ORAL FIRST: Use native, casual, spoken English ONLY. 
   - 'subCategory': You MUST map it to ONE of the fixed sub-categories based on its macro-category. 🚫 DO NOT invent new ones!
     * 💬 社交与人际 -> "👋 寒暄破冰", "🤝 交友互动", "🗣️ 沟通闲聊", "😠 矛盾冲突", "💞 亲密关系", "🙏 请求帮助", "📦 通用其他"
     * 🎭 情绪与反应 -> "😄 喜悦赞赏", "😡 愤怒不满", "😭 悲伤沮丧", "😲 惊讶意外", "😨 焦虑恐惧", "😐 冷漠无奈", "📦 通用其他"
     * 💡 观点与表态 -> "✅ 赞同支持", "❌ 反对拒绝", "🤔 思考猜测", "🤷 犹豫不决", "💡 建议劝告", "🗣️ 强调断言", "📦 通用其他"
     * 🏃 行动与状态 -> "🏃 动作行为", "🛑 停止放弃", "⏳ 等待拖延", "🚀 努力推进", "🔄 变化发展", "✨ 状态描述", "📦 通用其他"
     * 💼 工作与学习 -> "💻 职场办公", "📚 学习考试", "⏰ 时间安排", "💰 财务薪资", "🤝 合作探讨", "📉 压力挑战", "📦 通用其他"
     * 🛒 生活与日常 -> "🛍️ 购物消费", "🍽️ 饮食餐饮", "🏠 居家生活", "🚗 交通出行", "📱 科技网络", "💰 个人理财", "📦 通用其他"
     * 🩹 身心与休闲 -> "🏥 医疗健康", "🧘 心理调节", "🎮 娱乐游戏", "✈️ 旅游度假", "🏋️ 运动健身", "👗 外貌穿搭", "📦 通用其他"
     * 🔀 逻辑与过渡 -> "🔄 澄清解释", "➡️ 话题转换", "⚠️ 强调重点", "🤐 坦诚铺垫", "🔚 总结收尾", "➕ 补充递进", "🔀 对比转折"
   - 'relatedPhrases': Output ready-to-use spoken chunks (e.g., "Can I try this on?", "I'm tied up") grouped by a simple micro-scene tag. Format: "[🏷️ 微场景带Emoji] chunk1 (中文), chunk2 (中文)".
   - 'synonyms' MUST be empty.

🟣 TRACK 3: TEMPLATE (Sentence Frameworks & Slot Replacements)
   - Rule: Analyze the everyday usage scenario and break down its swappable components.
   - 'grammarNote': MUST BE IN CHINESE ONLY. Write a practical tip starting with "这个句式专门用来..." (e.g., "这个句式专门用来在社交或用餐场景中，礼貌请求品尝食物...").
   - 'synonyms' (Swappable Slots): Identify 2 key slots of the template. For EACH slot, provide 2 native alternative words. Format STRICTLY as: "[🏷️ 微场景带Emoji] word1 (中文), word2 (中文)". (e.g., "[🍽️ 小口食物] nibble (小口吃), taste (尝味)").
   - 'relatedExpressions' (Whole Paraphrases): Provide EXACTLY 3 natural, conversational alternative ways to say the ENTIRE sentence. Format: "Alternative sentence? (中文翻译)".
   - 'chunks': Slice the main sentence into 2-3 natural spoken sense groups.
   - 'relatedPhrases' MUST be empty. 'subCategory' MUST be "".

=== 🧩 SENTENCE WEAVING ===
- For ALL tracks, create ONE brilliant, natural sentence (and its Chinese translation) that weaves the original item or its expansions together in a real-world context.

=== OUTPUT FORMAT ===
Return a raw JSON object (keys are IDs). DO NOT wrap in markdown \`\`\`json.
{
  "123456": {
    "category": "SAME AS INPUT",
    "subCategory": "Mapped fixed tag OR empty string based on track", 
    "grammarNote": "For templates: 中文场景解释 starting with 这个句式专门用来...",
    "chunks": ["chunk1", "chunk2"],
    "relatedExpressions": ["Alternative sentence 1 (中文)", "Alternative sentence 2 (中文)", "Alternative sentence 3 (中文)"],
    "relatedPhrases": ["[🏷️ 微场景] chunk1 (中文), chunk2 (中文)" OR []],
    "synonyms": ["[🏷️ 微场景] word1 (中文), word2 (中文)" OR []],
    "sentence": "The woven contextual sentence.",
    "sentenceZh": "中文神仙翻译"
  }
}
`;

export const categorizeItemsWithAI = async (items, apiKey) => {
  if (!items || items.length === 0) return {};

  const BATCH_SIZE = 5;
  let allResults = {}; 

  console.log(`总共有 ${items.length} 个词条准备接受终极洗礼，分批启动...`);

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    const currentBatchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(items.length / BATCH_SIZE);
    
    console.log(`🚀 正在呼叫 AI 处理第 ${currentBatchNum}/${totalBatches} 批数据...`);

    const promptData = chunk.map(item => ({
      id: item.id, 
      type: item.type,
      category: item.category || '', 
      content: item.word || item.content || item.baseWord || '',
      chinese: item.chinese || item.zh || item.baseWordZh || '',
      relatedWords: item.relatedWords ? item.relatedWords.map(rw => rw.word).join(', ') : ''
    }));

    const userPrompt = `Please deeply analyze the following items according to the 3 TRACKS logic:\n${JSON.stringify(promptData, null, 2)}`;

    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userPrompt }],
          temperature: 0.1, 
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`状态码: ${response.status} - ${errText.substring(0, 100)}`);
      }

      const data = await response.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("AI 返回了空数据");
      }

      let content = data.choices[0].message.content.trim();
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) content = jsonMatch[0];
      
      const chunkResult = JSON.parse(content);
      allResults = { ...allResults, ...chunkResult };

    } catch (error) { 
      console.error(`第 ${currentBatchNum} 批解析失败:`, error);
      alert(`⚠️ 第 ${currentBatchNum} 批数据处理时 AI 走神了。已经成功保存了前面的数据，请稍后再次点击按钮继续！`);
      break; 
    }
  }

  alert(`✅ 完美还原！成功对 ${Object.keys(allResults).length} 个词条进行了深度解析！`);
  return allResults;
};

export const categorizeItemsCoarse = async (items, existingCategories, apiKey) => {
  if (!items || items.length === 0) return {};

  const promptData = items.map(item => ({ id: item.id, type: item.type, content: item.word || item.content || item.baseWord || '' }));
  
  const systemPrompt = `You are a strict categorization router. You MUST output a pure JSON object.

CRITICAL RULES based on item "type":
1. IF type is "expression" or "synonym": STRICTLY choose ONE of these 8 categories: 💬 社交与人际, 🎭 情绪与反应, 💡 观点与表态, 🏃 行动与状态, 💼 工作与学习, 🛒 生活与日常, 🩹 身心与休闲, 🔀 逻辑与过渡. 
2. IF type is "template": STRICTLY select ONE of these 10 categories: 【起头类】, 【提问类】, 【表态类】, 【提议类】, 【报备类】, 【对表类】, 【反馈类】, 【功能类】, 【定案类】, 【礼貌类】.

Output JSON format MUST be a mapping from ID to category:
{
  "id1": { "category": "..." },
  "id2": { "category": "..." }
}
No markdown formatting.`;

  const userPrompt = `Input items to categorize:\n${JSON.stringify(promptData, null, 2)}`;

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`状态码: ${response.status} - ${errText.substring(0, 100)}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) content = jsonMatch[0];
    
    const result = JSON.parse(content);
    alert(`✅ 搞定！为你分配了 ${Object.keys(result).length} 个词条的大类。`);
    return result;
  } catch (error) { 
    console.error("分类报错:", error);
    alert("⚠️ 分配大类失败了，可能是网络波动或数据截断，请再试一次。");
    throw error; 
  }
};