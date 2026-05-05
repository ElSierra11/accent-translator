# 🎙️ AccentShift — Traductor de Acentos

Habla en tu voz y escúchate con cualquier acento del mundo.

## ¿Cómo funciona?

```
Tu voz → [Whisper / OpenAI] transcribe → [ElevenLabs] sintetiza con acento → 🎧
```

## Tecnologías usadas

| Función | Herramienta | Por qué |
|---|---|---|
| Captura de audio | Web MediaRecorder API | Nativa del navegador, gratis |
| Transcripción (STT) | OpenAI Whisper | Mejor STT del mercado, soporta todos los idiomas |
| Síntesis con acento (TTS) | ElevenLabs Multilingual v2 | Voces con acentos realistas, multilingüe |

## Setup rápido

### 1. Obtén tus API keys

**OpenAI (Whisper):**
- Ve a https://platform.openai.com/api-keys
- Crea una nueva API key
- Costo aprox: $0.006 por minuto de audio

**ElevenLabs (TTS con acentos):**
- Ve a https://elevenlabs.io
- Crea cuenta (hay plan gratuito con 10,000 caracteres/mes)
- Ve a Profile → API Key

### 2. Personalizar voces (opcional)

Edita `js/accents.js` y reemplaza los `voice_id` con voces de tu cuenta ElevenLabs.

Para ver voces disponibles:
```
GET https://api.elevenlabs.io/v1/voices
Header: xi-api-key: TU_API_KEY
```

También puedes **clonar tu propia voz** en ElevenLabs y usarla como base.

### 3. Abrir el proyecto

Abre `index.html` en tu navegador. No necesita servidor (funciona como archivo local).

> ⚠️ Para que el micrófono funcione en Chrome, puede que necesites servir el archivo con un servidor local:
> ```bash
> npx serve .
> # o
> python3 -m http.server 8080
> ```

### 4. Ingresar las keys en la app

Al abrir la app, ingresa tus API keys en el panel superior. Se guardan en `localStorage` de tu navegador.

## Estructura del proyecto

```
accent-translator/
├── index.html          # App principal
├── css/
│   └── style.css       # Estilos
├── js/
│   ├── accents.js      # Catálogo de acentos y voice IDs
│   └── app.js          # Lógica principal
└── README.md
```

## Agregar nuevos acentos

En `js/accents.js`, agrega un objeto al array `ACCENTS`:

```js
{
  id: "venezolano",
  name: "Venezolano",
  country: "Venezuela",
  flag: "🇻🇪",
  color: "#CF142B",
  voice_id: "TU_VOICE_ID_DE_ELEVENLABS",
  description: "Acento caraqueño"
}
```

## Costos estimados

- 1 minuto de grabación ≈ $0.006 (Whisper) + ~$0.03 (ElevenLabs) = **~$0.036 por uso**
- Plan gratuito de ElevenLabs: 10,000 caracteres/mes (~15-20 usos)
