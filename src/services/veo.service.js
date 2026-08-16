import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function GenerateVideo(prompt) {
  try {
    let operation = await ai.models.generateVideos({
      model: "veo-3.0-generate-preview",
      prompt,
    });
    // Polling  until the video is ready
    while (!operation.done) {
      console.log("Waiting for video generation to complete...");
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
    }
    console.log("Video generation completed successfully");
    console.dir(operation, { depth: null });

    const videoUrl = operationResult.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUrl) throw new Error("Video URL not found in response");

    return videoUrl;
  } catch (err) {
    console.error("❌ Veo video generation error:", err);
    throw new Error("Veo video generation failed");
  }
}

export default GenerateVideo;
