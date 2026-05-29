const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ success: false, error: 'URL diperlukan' });

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: 15000,
    });

    if (!data || typeof data !== 'string') {
      return res.json({ success: true, data: [] });
    }

    const $ = cheerio.load(data);
    const episodes = [];
    const seen = new Set();

    const addEpisode = (href, text) => {
      if (!href || !text || text.length < 3) return;
      if (text.toLowerCase().includes('download')) return;
      if (seen.has(href)) return;
      seen.add(href);
      episodes.push({ title: text.trim(), url: href });
    };

    $('a[href*="/videos/"], a[href*="/episode/"], a[href*="/hentai/"]').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      addEpisode(href, text);
    });

    if (episodes.length === 0) {
      $('ul li a, ol li a, table a, .episodes-list a, .chapter-list a, .series-list a').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        addEpisode(href, text);
      });
    }

    if (episodes.length === 0) {
      $('.entry-content a, .post-content a, article a, main a').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        addEpisode(href, text);
      });
    }

    res.json({ success: true, data: episodes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};