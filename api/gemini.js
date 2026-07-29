export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    
    // API Key එක ලබා ගැනීම
    const apiKey = (process.env.GEMINI_API_KEY || '').replace(/['"]/g, '').trim();

    if (!apiKey) {
      return res.status(500).json({ error: 'API Key එක Vercel එකෙන් ඇවිත් නෑ!' });
    }

    // AI එකට ලබාදෙන රහස් උපදෙස (System Prompt)
    const systemPrompt = `පහත ලබා දී ඇති අදහස භාවිතා කර, Facebook, Instagram වැනි සමාජ මාධ්‍ය සඳහා ගැළපෙන, ආකර්ෂණීය සිංහල කැප්ෂන් එකක් පමණක් නිර්මාණය කර දෙන්න. අදාළ Emojis සහ Hashtags ද එකතු කරන්න. ඔබ AI කෙනෙක් බව කිසිවිටෙක නොපෙන්වන්න. උදව් කිරීමට හැකිදැයි ඇසීමෙන් වළකින්න. වෙනත් කිසිදු අමතර කතාබහක් නොමැතිව, කෙලින්ම කැප්ෂන් එක පමණක් ලබා දෙන්න. 
    
    මෙන්න පරිශීලකයාගේ අදහස: ${prompt}`;

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
