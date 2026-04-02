// File ini berjalan di Server Vercel, BUKAN di browser pengguna.
// Token di sini 100% AMAN dan tidak bisa dilihat oleh orang lain.

export default async function handler(req, res) {
  // Hanya izinkan metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { path, message, content, owner, repo } = req.body;

    // Mengambil Token Rahasia dari Environment Variable Server
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 

    if (!GITHUB_TOKEN) {
      return res.status(500).json({ message: 'Token GitHub belum di-setting di Server Vercel.' });
    }

    // Melakukan request ke GitHub dari Server
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        content: content,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json({ success: true, data });
    } else {
      return res.status(response.status).json({ success: false, message: data.message });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server backend.' });
  }
}
