export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, style } = req.body; // මෙතනින් style එක අල්ලගන්නවා
    
    const apiKey = (process.env.GEMINI_API_KEY || '').replace(/['"]/g, '').trim();

    if (!apiKey) {
      return res.status(500).json({ error: 'API Key එක Vercel එකෙන් ඇවිත් නෑ!' });
    }

    // පරිශීලකයා තෝරපු විලාසයට අනුව උපදෙස් වෙනස් කිරීම
    let styleInstruction = "";
    if (style === 'formal') {
        styleInstruction = "මෙය අනිවාර්යයෙන්ම ලිඛිත/නිල (Formal) සිංහල භාෂාවෙන් පමණක් ලබා දෙන්න. (උදාහරණ: කරනවා -> කරයි, යනවා -> යයි). ව්‍යාකරණ නිවැරදි විය යුතුය.";
    } else {
        styleInstruction = "මෙය අනිවාර්යයෙන්ම කතා කරන/සාමාන්‍ය (Informal) සිංහල භාෂාවෙන් පමණක් ලබා දෙන්න. මිත්‍රශීලී ස්වභාවයක් ගත යුතුය. (උදාහරණ: කරයි -> කරනවා, යයි -> යනවා).";
    }

    const systemPrompt = `ඔබ දක්ෂ භාෂා පරිවර්තකයෙකි. 
    පරිශීලකයා ලබා දෙන Singlish හෝ සිංහල වාක්‍යයේ අකුරු සහ ව්‍යාකරණ වැරදි සකසා, වඩාත් අර්ථවත් සහ පැහැදිලි සිංහල වාක්‍යයක් බවට පත් කර දෙන්න.
    
    විශේෂිත භාෂා විලාසය: ${styleInstruction}
    
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
