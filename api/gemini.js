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
    
    // 🔴 ඔයාගේ අලුත් OpenRouter API Key එක (මේක අනිත් අයට පේන්න දෙන්න එපා)
    const apiKey = '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';

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key එකක් ලබා දී නැත!' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Marketing වචන අඳුරගන්න Logic එක 
    const marketingKeywords = ['මිල', 'විකිණීමට', 'රුපියල්', 'රු.', 'rs', 'price', 'sale', 'discount', 'offer', 'order', 'delivery', 'stock', 'business', 'cake'];
    const lowerCasePrompt = (prompt || '').toLowerCase();
    
    const isMarketing = marketingKeywords.some(keyword => lowerCasePrompt.includes(keyword));

    let marketingInstruction = "";
    if (isMarketing) {
      marketingInstruction = "- මෙය ව්‍යාපාරික/අලෙවිකරණ (Marketing) පෝස්ට් එකක් බැවින්, පාරිභෝගිකයින් භාණ්ඩය මිලදී ගැනීමට පෙළඹෙන ආකාරයේ ආකර්ෂණීය වචන භාවිතා කරන්න.";
    }

    let toneInstruction = "- භාෂා විලාසය: එදිනෙදා කතා කරන ස්වාභාවික informal (spoken) සිංහල පාවිච්චි කරන්න (උදා: 'පැමිණියෙමි' වෙනුවට 'ආවා').";
    if (tone === 'formal') {
      toneInstruction = "- භාෂා විලාසය: ව්‍යාපාරික හෝ ආයතනික නිවේදනවලට ගැළපෙන formal (නිල) සිංහල බස භාවිත කරන්න.";
    }

    let emojiInstruction = addEmojis 
        ? "- අන්තර්ගතයට ගැළපෙන Emojis 2ක් හෝ 3ක් පමණක් එක් කරන්න." 
        : "- කිසිදු Emojis භාවිතා නොකරන්න.";
        
    let hashtagInstruction = addHashtags 
        ? "- සමාජ මාධ්‍යවලට ගැළපෙන Trending Hashtags 3ත් 5ත් අතර ප්‍රමාණයක් අනිවාර්යයෙන්ම කැප්ෂන් එක අවසානයට එක් කරන්න." 
        : "- කිසිදු Hashtags භාවිතා නොකරන්න.";

    // 🔥 යාවත්කාලීන කළ, ඉතා දැඩි (Strict) System Prompt එක 🔥
    const systemPrompt = `ඔබ දක්ෂ Social Media Copywriter කෙනෙකි. පහත දෙන අදහස කියවා, එය ලස්සන සිංහල කැප්ෂන් එකක් බවට පත් කරන්න.
    
    🔴 ඉතා වැදගත් නීති (CRITICAL RULES - MUST FOLLOW):
    1. ඔබ ප්‍රතිදානය (Output) කළ යුත්තේ අවසාන සිංහල කැප්ෂන් එක පමණි!
    2. කිසිදු හේතුවක් මත ඉංග්‍රීසි වචන, අමතර පැහැදිලි කිරීම් (උදා: "Here is your caption", "I will rephrase this") හෝ අඩකින් නැවැත්වූ වාක්‍ය ඇතුළත් නොකරන්න. සම්පූර්ණයෙන්ම සිංහලෙන් පමණක් ලියා අවසන් කරන්න.
    3. පරිශීලකයා දී ඇති මිල ගණන් (උදා: 2500) සහ නම් අනිවාර්යයෙන්ම කැප්ෂන් එකට ඇතුළත් කරන්න.
    
    උපදෙස්:
    ${marketingInstruction}
    ${toneInstruction}
    ${emojiInstruction}
    ${hashtagInstruction}
    
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
        // 🔴 අලුත්, වැඩ කරන Free Model එක 🔴
        model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
        messages: [{ role: 'user', content: systemPrompt }],
        max_tokens: 1500,
        temperature: 0.7, 
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
                const dataStr = trimmedLine.substring(6); 
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
                  // සුළු Errors මඟහරින්න
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
