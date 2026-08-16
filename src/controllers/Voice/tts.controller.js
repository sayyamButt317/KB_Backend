import fs from "fs";
import path from "path";
import client from "../../Config/ai.config.js";


const speechFile = path.resolve("./speech.mp3");

export async function TextToSpeech() {
  const mp3 = await client.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "coral",
    input: "Today is a wonderful day to build something people love!",
    instructions: "Speak in a cheerful and positive tone.",
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);
}
