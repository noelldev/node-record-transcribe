const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const mic = require("mic");
const { Readable } = require("stream");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const config = require("dotenv").config();

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: config.parsed.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

ffmpeg.setFfmpegPath(ffmpegPath);

// Record audio
function recordAudio(filename) {
  return new Promise((resolve, reject) => {
    const micInstance = mic({
      rate: "16000",
      channels: "1",
      fileType: "wav",
    });

    const micInputStream = micInstance.getAudioStream();
    const output = fs.createWriteStream(filename);
    const writable = new Readable().wrap(micInputStream);

    console.log("Recording... Press Ctrl+C to stop.");

    writable.pipe(output);

    micInstance.start();

    process.on("SIGINT", () => {
      micInstance.stop();
      console.log("Finished recording");
      resolve();
    });

    micInputStream.on("error", (err) => {
      reject(err);
    });
  });
}

// Transcribe audio
async function transcribeAudio(filename) {
  const transcript = await openai.createTranscription(
    fs.createReadStream(filename),
    "whisper-1"
  );
  return transcript.data.text;
}

// Main function
async function main() {
  const audioFilename = "recorded_audio.wav";
  await recordAudio(audioFilename);
  const transcription = await transcribeAudio(audioFilename);
  console.log("Transcription:", transcription);
}

main();
