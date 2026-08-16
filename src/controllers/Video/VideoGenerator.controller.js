import GenerateVideo from "../../services/veo.service.js";

async function VideoGenerator(req, res) {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const video = await GenerateVideo(prompt)
    return res.status(200).json({ video });
  } catch (error) {
    console.error("Error generating video:", error);
    return res.status(500).json({ error: "Failed to generate video" });
  }
}

export default VideoGenerator;