// src/utils/deepseek.js

const SYSTEM_PROMPT = `
You are a top-tier English linguistics expert and vocabulary network architect.
Your task is to analyze user-provided English learning items and output a STRICT JSON object.
The input items fall into three types: 'template' (sentence structures), 'expression' (casual/daily phrases), and 'synonym' (vocabulary words).
You MUST apply different analysis rules based on the 'type' of each item.

=== TRACK 1: TEMPLATE (Sentence Structures) ===
Rule: Analyze the syntactic skeleton.
1. Category: Must be its underlying grammar structure (e.g., "Present Perfect", "Post-modifier", "Conditional Clause").
2. Chunks: Slice the sentence into 3-4 grammatical sense groups (e.g., ["If you want", "to see someone", "clearly"]).
3. Expansion: Provide 3 parallel structural replacements using the exact same grammar skeleton but advanced vocabulary (e.g., ["know sb truly", "understand sb fully", "judge sb accurately"]). Put these in 'relatedExpressions'.

=== TRACK 2: EXPRESSION (Casual Phrases / Idioms) ===
Rule: Analyze the pragmatic function & communication intent.
1. Category: STRICTLY choose one of these 6 tags:
   - 🗣️ 社交与回应 (Social & Reactions)
   - ☕ 生活与日常 (Daily Routine)
   - 🤕 身体与状态 (Health & Status)
   - 🧠 观点与逻辑 (Views & Logic)
   - 💼 职场与商务 (Work & Business)
   - 🌍 人生与社会 (Life & Society)
2. Intent Dismantling: Identify 1-3 core intents/aspects of the phrase, and provide 2-3 native, highly-frequent alternative phrases for each intent. Format as strings in 'relatedPhrases' like: "[Intent/Tag] alt1, alt2".
3. SentenceWeaving: Create ONE brilliant, natural sentence that weaves the original phrase or its exact elements together in a real-world context.

=== TRACK 3: SYNONYM (Vocabulary Words) ===
Rule: Analyze the universal semantic field & nuances.
1. Category: STRICTLY choose one of these 5 tags:
   - 👔 职场沟通 (Work & Comm)
   - 📈 商业政经 (Biz & Macro)
   - 🛁 生活感官 (Life & Senses)
   - ❤️ 情感意愿 (Emotion & Will)
   - ✨ 状态程度 (State & Degree)
2. Clustering & Completion: Group the word with its natural family, adding missing highly-frequent members. Detail their specific nuance (e.g., formal vs casual). Put these in 'synonyms' like: "word (nuance)".
3. SentenceWeaving: Create ONE brilliant sentence that uses 2-3 words from this semantic family to show how they fit together.

=== OUTPUT FORMAT ===
You must return a raw JSON object where the keys are the item IDs, and the values are the analyzed objects. DO NOT wrap in markdown \`\`\`json.
Example structure:
{
  "123456": {
    "category": "The English Category (from rules)",
    "categoryZh": "The Chinese Category Translation",
    "chunks": ["chunk1", "chunk2"], // For templates
    "relatedExpressions": ["parallel1", "parallel2"], // For templates
    "relatedPhrases": ["[Tag] word1, word2"], // For expressions
    "synonyms": ["word (nuance/context)"], // For synonyms
    "sentence": "The woven contextual sentence.",
    "sentenceZh": "中文神仙翻译"
  }
}
`;

export const categorizeItemsWithAI = async (items, apiKey) => {
  if (!items || items.length === 0) return {};

  const promptData = items.map(item => ({
    id: item.id,
    type: item.type,
    content: item.word || item.content || item.baseWord || '',
    chinese: item.chinese || item.zh || item.baseWordZh || ''
  }));

  const userPrompt = `Please analyze the following items according to the system rules:\n${JSON.stringify(promptData, null, 2)}`;

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    // Fallback cleanup if the LLM still wraps in markdown
    if (content.startsWith('```json')) content = content.replace(/^```json/, '');
    if (content.endsWith('```')) content = content.replace(/```$/, '');

    return JSON.parse(content);
  } catch (error) {
    console.error("Deepseek API Error:", error);
    throw error;
  }
};

// 粗分逻辑：保持极简，让 AI 只返回 ID 和 对应的大类
export const categorizeItemsCoarse = async (items, existingCategories, apiKey) => {
  if (!items || items.length === 0) return {};

  const promptData = items.map(item => ({
    id: item.id,
    type: item.type,
    content: item.word || item.content || item.baseWord || ''
  }));

  const userPrompt = `
You are a router. Based on the 'type' of each item, assign it to its broad category.
- If type='expression', strictly use one of: 🗣️ 社交与回应, ☕ 生活与日常, 🤕 身体与状态, 🧠 观点与逻辑, 💼 职场与商务, 🌍 人生与社会.
- If type='synonym', strictly use one of: 👔 职场沟通, 📈 商业政经, 🛁 生活感官, ❤️ 情感意愿, ✨ 状态程度.
- If type='template', extract its fundamental grammatical structure (e.g., Present Perfect).

Input:
${JSON.stringify(promptData, null, 2)}

Output a pure JSON object mapping ID to { "category": "Eng/Emoji Name", "categoryZh": "Chinese Name" }. No markdown.`;

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    if (content.startsWith('```json')) content = content.replace(/^```json/, '');
    if (content.endsWith('```')) content = content.replace(/```$/, '');
    return JSON.parse(content);
  } catch (error) {
    console.error("Coarse categorization error:", error);
    throw error;
  }
};