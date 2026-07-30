export const config = {
  runtime: 'edge', // තත්පර 10 සීමාවෙන් බේරෙන මැජික් එක!
};

export default async function handler(req) {
  // Edge function වලදී req.method සහ req.json() පාවිච්චි කරන විදිය වෙනස්
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { prompt, addEmojis, addHashtags } = await req.json();
    
    const apiKey = (process.env.GEMINI_API_KEY || '').replace(/['"]/g, '').trim();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key එක Vercel එකෙන් ඇවිත් නෑ!' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let emojiInstruction = addEmojis 
        ? "- අන්තර්ගතයට ගැළපෙන Emojis භාවිතා කරන්න. නමුත් එය පමණට වඩා වැඩි නොවිය යුතුය (මුළු කැප්ෂන් එකටම Emojis 2ක් හෝ 3ක් පමණක් ඉතා අලංකාරව එක් කරන්න)." 
        : "- කිසිදු Emojis භාවිතා නොකරන්න.";
        
    let hashtagInstruction = addHashtags 
        ? "- සමාජ මාධ්‍යවල Reach එක වැඩි කරන, අන්තර්ගතයට ගැළපෙන Trending Hashtags 3ත් 5ත් අතර ප්‍රමාණයක් අවසානයට එක් කරන්න." 
        : "- කිසිදු Hashtags (හැෂ්ටැග්) භාවිතා නොකරන්න.";

    const systemPrompt = `ඔබ දක්ෂ භාෂා පරිවර්තකයෙකි සහ Social Media කැප්ෂන් රචකයෙකි. 
    පරිශීලකයා ලබා දෙන ආදානය (Input) **English, Singlish හෝ Sinhala** කුමන භාෂාවකින් තිබුණද, එහි අන්තර්ගතය හොඳින් තේරුම් ගෙන, එය වඩාත් ආකර්ෂණීය සහ ස්වාභාවික **informal (එදිනෙදා කතා කරන/spoken) සිංහල** කැප්ෂන් එකක් බවට පත් කර දෙන්න.
    
    විශේෂ උපදෙස්:
    - නිල හෝ පොත්පත්වල පාවිච්චි කරන Formal බස භාවිත නොකරන්න (උදාහරණ: 'පැමිණියෙමි' වෙනුවට 'ආවා', 'කරයි' වෙනුවට 'කරනවා' යනාදී ලෙස කතා කරන විලාසය පාවිච්චි කරන්න).
    - පරිශීලකයා ලබා දී ඇති ආදානය දිගු ඡේදයක් (Paragraph) නම් හෝ කරුණු කිහිපයක් තිබේ නම්, එය කියවීමට පහසු වන පරිදි කෙටි ඡේද හෝ Bullet points (•) ලෙස වෙන් කර දක්වන්න.
    ${emojiInstruction}
    ${hashtagInstruction}
    - අමතර පැහැදිලි කිරීම්, සටහන් හෝ සුබපැතුම් කිසිවක් අවශ්‍ය නැත.
    - අවසාන නිවැරදි සිංහල කැප්ෂන් පෙළ පමණක් ප්‍රතිදානය (Output) කරන්න.
    
    පරිශීලකයාගේ අදහස: ${prompt}`;

    // මෙතන API URL එකට streamGenerateContent?alt=sse යොදා ඇත
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`, {
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

    // උත්තරය අකුරෙන් අකුර (Stream එකක් විදියට) කෙලින්ම සයිට් එකට යැවීම
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
