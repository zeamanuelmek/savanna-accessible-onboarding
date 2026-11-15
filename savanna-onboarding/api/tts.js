// Vercel serverless function: POST /api/tts -> Addis AI text-to-speech (demo host's reference proxy; see _addis.js).
const { handleTts } = require('./_addis');
module.exports = (req, res) => handleTts(req, res);
