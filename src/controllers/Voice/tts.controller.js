import fs from "fs";
import path from "path";
import client from "../../Config/ai.config.js";


const speechFile = path.resolve("./speech.mp3");

export async function TextToSpeech(req, res) {
  try {
    const mp3 = await client.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "coral",
    input: req.body.text,
    instructions: "Speak in a cheerful and positive tone.",
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);
  return res.status(200).json({
    success: true,
    message: "Speech generated successfully",
    data: {
      url: `https://api.openai.com/v1/audio/speech?model=gpt-4o-mini-tts&voice=coral&input=${req.body.text}`,
      buffer: buffer,
      fileName: "speech.mp3",
      contentType: "audio/mpeg",
      length: buffer.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate speech",
    });
  }
}
