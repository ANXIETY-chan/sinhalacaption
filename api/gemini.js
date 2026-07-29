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

    // AI එකට ලබාදෙන අලුත් උපදෙස (System Prompt)
    const systemPrompt = `පහත ලබා දී ඇති Singlish හෝ සිංහල වාක්‍යයේ මූලික අදහස කිසිසේත් වෙනස් නොකර, එය වඩාත් නිවැරදි සහ පැහැදිලි සිංහල භාෂාවට (අවශ්‍ය පරිදි Formal හෝ Informal ලෙස) සකස් කර දෙන්න. 
    
    විශේෂ උපදෙස්:
    - කිසිදු Emojis හෝ Hashtags භාවිතා නොකරන්න.
    - අමතර වචන, සුබ පැතුම් හෝ විස්තර කිරීම් එකතු නොකරන්න.
    - පරිශීලකයා ලබා දී ඇති වාක්‍යය පමණක් නිවැරදි කර ලබා දෙන්න.
    
    වාක්‍යය: ${prompt}`;

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
