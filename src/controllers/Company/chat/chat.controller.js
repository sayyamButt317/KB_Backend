import ChatModel from "../../../Model/Chat.Model.js";

/** List chats for the logged-in user's company (newest first) */
export async function GetChats(req, res) {
  try {
    const companyId = req.user.companyId;
    const { userId, limit = 50 } = req.query;

    const filter = { companyId };
    // Optional: only this user's chats; still scoped to company
    if (userId) {
      if (String(userId) !== String(req.user.id) && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }
      filter.userId = userId;
    }

    const chats = await ChatModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 50, 200))
      .select("-docs")
      .lean();

    return res.status(200).json({
      success: true,
      count: chats.length,
      chats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

/** Get one chat by id (company-scoped) */
export async function GetChatById(req, res) {
  try {
    const companyId = req.user.companyId;
    const chat = await ChatModel.findOne({
      _id: req.params.id,
      companyId,
    }).lean();

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    return res.status(200).json({
      success: true,
      chat,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
