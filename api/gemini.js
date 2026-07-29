export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    
    // API Key එක අරගෙන, හිස්තැන් සහ අමතර දේවල් අයින් කිරීම
    const apiKey = (process.env.GEMINI_API_KEY || '').replace(/['"]/g, '').trim();

    if (!apiKey) {
      return res.status(500).json({ error: 'API Key එක Vercel එකෙන් ඇවිත් නෑ!' });
    }

    // අලුත් අකවුන්ට් වලට වැඩ කරන අලුත්ම 'gemini-flash-latest' මොඩල් එක යොදා ඇත
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
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
