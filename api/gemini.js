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
    
    // ඔයාගේ අලුත් API Key එක මෙහි කෙලින්ම ඇතුළත් කර ඇත
    const apiKey = 'AQ.Ab8RN6KhbpAeheI7bJSTR6anlTVGwtTPeuUDISmJ1WVPC5dXTw';

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key එකක් ලබා දී නැත!' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Tone එක අනුව AI එකට දෙන උපදෙස්
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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:streamGenerateContent?key=${apiKey}&alt=sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }]
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        return new Response(errorText, { status: response.status });
    }

    return new Response(response.body, {
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
