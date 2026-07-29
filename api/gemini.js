export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    // පහළ පේළියෙන් API Key එකේ තියෙන හිස්තැන් ස්වයංක්‍රීයව අයින් කරනවා
    const apiKey = process.env.GEMINI_API_KEY?.trim(); 

    if (!apiKey) {
      return res.status(500).json({ error: 'API Key not configured on server' });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey // අලුත් කී එකට හරියන ආරක්ෂිත ක්‍රමය
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
