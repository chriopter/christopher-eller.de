# Chatty - AI Chat in Browser

A fully client-side chat interface powered by Qwen1.5-0.5B running entirely in your browser.

## Features

- **100% Client-Side** - No server required, everything runs in your browser
- **Qwen1.5-0.5B** - Fast, lightweight language model (Feb 2024, ~500MB)
- **ONNX Runtime** - Runs via transformers.js with WebAssembly
- **Modern Chat UI** - Clean, responsive interface with typing indicators
- **Theme Support** - Automatic dark/light mode
- **Privacy-First** - All conversations stay on your device
- **Mobile Responsive** - Works on phones and tablets

## How It Works

Uses [@xenova/transformers](https://github.com/xenova/transformers.js) to run the Qwen1.5-0.5B-Chat model with ONNX Runtime in the browser. The model is downloaded once and cached.

## Requirements

- Modern browser supporting WebAssembly and ES6 modules:
  - Chrome 90+
  - Edge 90+
  - Firefox 88+
  - Safari 15+
- ~500MB available storage for model cache

## Usage

```bash
npm install
```

Open `index.html` in a modern browser. The model will download on first load (~500MB, may take a minute), then cached for future use.

## Model Details

- **Model**: Xenova/Qwen1.5-0.5B-Chat
- **Released**: February 2024
- **Size**: ~500MB (ONNX format)
- **Speed**: Fast inference on CPU via WebAssembly
- **Quality**: Good for simple conversations

## Controls

- **Enter** - Send message
- **Shift+Enter** - New line
- Auto-scrolls to latest message

## License

ISC