// Vercel serverless function: POST /api/stt -> Addis AI speech-to-text (demo host's reference proxy; see _addis.js).
const { handleStt } = require('./_addis');
module.exports = (req, res) => handleStt(req, res);
