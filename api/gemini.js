export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // API Key එක අරගෙන, අගට මුලට තියෙන හිස්තැන් සහ කොමාවල් (Quotes) අයින් කිරීම
    const apiKey = (process.env.GEMINI_API_KEY || '').replace(/['"]/g, '').trim();

    if (!apiKey) {
      return res.status(500).json({ error: 'API Key එක Vercel එකෙන් ඇවිත් නෑ!' });
    }

    // 1. Google සර්වර් එකෙන් ඔයාගේ Key එකට සපෝට් කරන මොඩල් ලිස්ට් එක ඉල්ලනවා
    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listData = await listResponse.json();

    let validModels = "මොඩල් කිසිවක් සොයාගත නොහැක (API එක සක්‍රීය කර නැත)";
    if (listData.models) {
        // තියෙන මොඩල්ස් වල නම් ටික වෙන් කරලා ගන්නවා
        validModels = listData.models.map(m => m.name).join(" | ");
    }

    // 2. ඒ මොඩල් ලිස්ට් එක කෙලින්ම සයිට් එකේ පෙන්නන්න කියලා අපි හිතාමතාම එරර් එකක් යවනවා
    return res.status(400).json({ 
        error: `ඔයාගේ Key එක නියමෙටම වැඩ! හැබැයි Google එකෙන් සපෝට් කරන්නේ මේ මොඩල් වලට විතරයි: ${validModels}` 
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
