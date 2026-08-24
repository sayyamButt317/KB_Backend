import UserModel from "../../Model/User.Model.js";

const registerController = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await UserModel.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        message: `User with this email already exists`,
      });
    }

    await UserModel.create({ name, email, password });
    return res.status(201).json({
      message: `User registered successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const loginController = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export { registerController, loginController };
