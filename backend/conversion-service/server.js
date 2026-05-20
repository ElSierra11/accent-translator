const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { EdgeTTS } = require('node-edge-tts');
const db = require('../shared/database');
const { authenticateToken } = require('../shared/auth');

const app = express();
app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.get('/api/conversions', authenticateToken, (req, res) => {
  let query = "SELECT * FROM conversions ORDER BY id DESC LIMIT 50";
  let params = [];
  
  if (req.user.role !== 'admin') {
    query = "SELECT * FROM conversions WHERE user_id = ? ORDER BY id DESC LIMIT 50";
    params = [req.user.id];
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/conversions', authenticateToken, async (req, res) => {
  let { text, accentName, locale, voice, accentId } = req.body;
  
  if (!voice) {
    const defaultVoices = {
      "es-CO": "es-CO-SalomeNeural", "es-AR": "es-AR-TomasNeural", "es-MX": "es-MX-DaliaNeural",
      "es-ES": "es-ES-ElviraNeural", "en-US": "en-US-ChristopherNeural", "es-CL": "es-CL-LorenzoNeural",
      "es-VE": "es-VE-SebastianNeural", "es-PE": "es-PE-AlexNeural", "es-PR": "es-PR-VictorNeural",
      "es-CU": "es-CU-ManuelNeural", "es-DO": "es-DO-RamonaNeural"
    };
    voice = defaultVoices[locale] || "es-ES-ElviraNeural";
  }

  if (!text) return res.status(400).json({ error: "Missing text data" });

  const dateStr = new Date().toLocaleString();
  const filename = `conversion_${Date.now()}.mp3`;
  const filepath = path.join(uploadsDir, filename);

  const saveToDbAndRespond = () => {
    const query = `INSERT INTO conversions (date, text, accent, audio_filename, user_id) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [dateStr, text, accentName, filename, req.user.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, audioUrl: `/uploads/${filename}`, id: this.lastID });
    });
  };

  db.get("SELECT value FROM config WHERE key = 'elevenlabs_api_key'", async (err, rowApiKey) => {
    const apiKey = rowApiKey ? rowApiKey.value : null;

    if (apiKey && apiKey.trim() !== '') {
      db.get("SELECT value FROM config WHERE key = 'elevenlabs_voice_mapping'", async (err, rowMapping) => {
        let voiceMapping = {};
        if (rowMapping && rowMapping.value) {
          voiceMapping = JSON.parse(rowMapping.value);
        }

        const elVoiceId = voiceMapping[accentId] || "pNInz6obpgDQGcFmaJgB";
        
        try {
          const response = await axios({
            method: 'POST',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${elVoiceId}`,
            headers: {
              'Accept': 'audio/mpeg',
              'xi-api-key': apiKey,
              'Content-Type': 'application/json',
            },
            data: {
              text: text,
              model_id: "eleven_multilingual_v2",
              voice_settings: { stability: 0.5, similarity_boost: 0.7 }
            },
            responseType: 'stream'
          });

          const writer = fs.createWriteStream(filepath);
          response.data.pipe(writer);
          writer.on('finish', saveToDbAndRespond);
          writer.on('error', () => res.status(500).json({ error: "Failed to save ElevenLabs audio" }));
        } catch (elError) {
          const detailedError = elError.response?.data?.detail?.message || elError.response?.data?.detail || elError.message;
          console.error("ElevenLabs Error:", detailedError);
          res.status(500).json({ error: "ElevenLabs Error: " + detailedError });
        }
      });
    } else {
      try {
        const tts = new EdgeTTS({
          voice: voice,
          lang: locale || 'es-ES',
          outputFormat: "audio-24khz-48kbitrate-mono-mp3"
        });
        await tts.ttsPromise(text, filepath);
        saveToDbAndRespond();
      } catch (err) {
        console.error("node-edge-tts error:", err);
        return res.status(500).json({ error: "Failed to generate Edge TTS: " + err.message });
      }
    }
  });
});

app.listen(4002, () => console.log('Conversion Service corriendo en puerto 4002'));
