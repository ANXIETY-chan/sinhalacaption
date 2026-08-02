export const config = {
  runtime: 'edge', 
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { prompt, tone, addEmojis, addHashtags } = await req.json();
    
    // ඔයාගේ OpenRouter API Key එක
    const apiKey = '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';

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key එකක් ලබා දී නැත!' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let toneInstruction = "- භාෂා විලාසය: එදිනෙදා කතා කරන ස්වාභාවික informal (spoken) සිංහල පාවිච්චි කරන්න (උදා: 'පැමිණියෙමි' වෙනුවට 'ආවා').";
    if (tone === 'formal') {
      toneInstruction = "- භාෂා විලාසය: ව්‍යාපාරික හෝ ආයතනික නිවේදනවලට ගැළපෙන formal (නිල) සිංහල බස භාවිත කරන්න.";
    }

    let emojiInstruction = addEmojis 
        ? "- අන්තර්ගතයට ගැළපෙන Emojis 2ක් හෝ 3ක් පමණක් ඉතා අලංකාරව එක් කරන්න." 
        : "- කිසිදු Emojis භාවිතා නොකරන්න.";
        
    let hashtagInstruction = addHashtags 
        ? "- සමාජ මාධ්‍යවල Reach එක වැඩි කරන, අන්තර්ගතයට ගැළපෙන Trending Hashtags 3ත් 5ත් අතර ප්‍රමාණයක් අවසානයට එක් කරන්න." 
        : "- කිසිදු Hashtags භාවිතා නොකරන්න.";

    const systemPrompt = `ඔබ දක්ෂ භාෂා පරිවර්තකයෙකි සහ Social Media කැප්ෂන් රචකයෙකි. 
    පරිශීලකයා ලබා දෙන ආදානය (Input) English, Singlish හෝ Sinhala කුමන භාෂාවකින් තිබුණද, එය ආකර්ෂණීය සිංහල කැප්ෂන් එකක් බවට පත් කර දෙන්න.
    
    විශේෂ උපදෙස්:
    ${toneInstruction}
    - ඡේද දිගු නම් කියවීමට පහසු වන පරිදි කෙටි ඡේද හෝ Bullet points (•) ලෙස වෙන් කර දක්වන්න.
    ${emojiInstruction}
    ${hashtagInstruction}
    - අමතර පැහැදිලි කිරීම් අවශ්‍ය නැත. අවසාන නිවැරදි සිංහල කැප්ෂන් පෙළ පමණක් ප්‍රතිදානය කරන්න.
    
    පරිශීලකයාගේ අදහස: ${prompt}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://sinhalacaption.lk',
        'X-Title': 'Sinhala Caption AI',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'user', content: systemPrompt }
        ],
        max_tokens: 1000,
        stream: false // Stream එක off කළා සම්පූර්ණ උත්තරේ එකපාර ගන්න
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        return new Response(errorText, { status: response.status });
    }

    // OpenRouter එකෙන් එන උත්තරේ කියවීම
    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    // Frontend එකට තේරෙන Google Gemini Format එකට උත්තරේ හැදීම
    const fakeGeminiFormat = `data: ${JSON.stringify({
      candidates: [{ content: { parts: [{ text: generatedText }] } }]
    })}\n\n`;

    return new Response(fakeGeminiFormat, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
