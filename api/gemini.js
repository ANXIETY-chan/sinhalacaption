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
    const systemPrompt = `ඔබ දක්ෂ භාෂා පරිවර්තකයෙකි. 
    1. පරිශීලකයා Singlish වලින් ටයිප් කර ඇත්නම්, එය නිවැරදි සිංහල අකුරු වලට හරවා අර්ථවත් වාක්‍යයක් සකසන්න. 
    2. පරිශීලකයා දැනටමත් සිංහලෙන් ටයිප් කර ඇත්නම්, එහි ව්‍යාකරණ වැරදි සකසා, අකුරු වැරදි නිවැරදි කර, වඩාත් ආකර්ෂණීය සහ පැහැදිලි සිංහල වාක්‍යයක් බවට පත් කර දෙන්න (අවශ්‍ය පරිදි Formal හෝ Informal ලෙස).
    
    විශේෂ උපදෙස්:
    - කිසිදු Emojis හෝ Hashtags භාවිතා නොකරන්න.
    - අමතර කතාබහක්, සුබ පැතුම් හෝ පැහැදිලි කිරීම් අවශ්‍ය නැත.
    - අවසාන නිවැරදි සිංහල වාක්‍යය පමණක් ප්‍රතිදානය (Output) කරන්න.
    
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
