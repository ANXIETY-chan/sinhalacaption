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

    // 1. Marketing වචන අඳුරගන්න Logic එක
    const marketingKeywords = ['මිල', 'විකිණීමට', 'රුපියල්', 'රු.', 'rs', 'price', 'sale', 'discount', 'offer', 'order', 'delivery', 'stock', 'aluth', 'cash on delivery'];
    const lowerCasePrompt = (prompt || '').toLowerCase();
    
    // User ගේ prompt එකේ අර වචන තියෙනවද කියලා බලනවා
    const isMarketing = marketingKeywords.some(keyword => lowerCasePrompt.includes(keyword));

    // 2. Marketing නම් දෙන අමතර උපදෙස
    let marketingInstruction = "";
    if (isMarketing) {
      marketingInstruction = "- මෙය ව්‍යාපාරික/අලෙවිකරණ (Marketing) පෝස්ට් එකක් බැවින්, පාරිභෝගිකයින් භාණ්ඩය හෝ සේවාව මිලදී ගැනීමට පෙළඹෙන ආකාරයේ (Persuasive) සහ ආකර්ෂණීය වචන භාවිතා කරන්න.";
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

    // 🔥 යාවත්කාලීන කළ, Quality එක වැඩි කරන Expert Prompt එක 🔥
    const systemPrompt = `ඔබ වසර ගණනාවක අත්දැකීම් ඇති, අතිදක්ෂ Social Media Copywriter සහ SEO Expert කෙනෙකි. 
    පරිශීලකයා ලබා දෙන අදහස (English, Singlish හෝ Sinhala කුමන භාෂාවකින් තිබුණද), එය කියවන්නාගේ අවධානය වහාම දිනාගන්නා (engaging) සහ අලෙවිකරණයට (marketing) ඉතාම සුදුසු ඉහළම ගුණාත්මකභාවයෙන් යුත් සිංහල කැප්ෂන් එකක් බවට පත් කිරීම ඔබේ කාර්යයයි.
    
    විශේෂ උපදෙස්:
    - ආකර්ෂණීය ආරම්භයක් (Hook), පැහැදිලි අන්තර්ගතයක් (Body) සහ ක්‍රියාමාර්ගයකට යොමු කරන අවසානයක් (Call to Action) යොදාගනිමින් කැප්ෂන් එක වෘත්තීය මට්ටමින් ගොඩනගන්න.
    - පරිශීලකයා ලබා දෙන කිසිදු තොරතුරක් (විශේෂයෙන්ම මිල ගණන්, නම්, ස්ථාන) මඟ නොහරින්න. ඒවා ඉතා උපායශීලීව වාක්‍යවලට ගලපන්න.
    ${marketingInstruction}
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
        messages: [{ role: 'user', content: systemPrompt }],
        max_tokens: 1500,
        stream: true 
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        return new Response(errorText, { status: response.status });
    }

    // Streaming Logic එක 
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        const encoder = new TextEncoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('data: ')) {
                const dataStr = trimmedLine.replace('data: ', '');
                if (dataStr === '[DONE]') continue;
                
                try {
                  const dataObj = JSON.parse(dataStr);
                  const content = dataObj.choices?.[0]?.delta?.content;
                  if (content) {
                    const fakeGeminiChunk = `data: ${JSON.stringify({
                      candidates: [{ content: { parts: [{ text: content }] } }]
                    })}\n\n`;
                    controller.enqueue(encoder.encode(fakeGeminiChunk));
                  }
                } catch (e) {
                  // Ignore minor parse errors in stream
                }
              }
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
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
