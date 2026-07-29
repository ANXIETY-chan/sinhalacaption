export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, addEmojis, addHashtags } = req.body;
    
    const apiKey = (process.env.GEMINI_API_KEY || '').replace(/['"]/g, '').trim();

    if (!apiKey) {
      return res.status(500).json({ error: 'API Key එක Vercel එකෙන් ඇවිත් නෑ!' });
    }

    // Emojis අඩුවෙන් දාන්න උපදෙස් දීම
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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
       return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
