import UserModel from "../../Model/User.Model.js";
import { generateAccessToken } from "../../Utils/jwt.js";

const registerController = async (req, res) => {
  const { name, companyName, email, password, role } = req.body;

  if (!name || !companyName || !email || !password) {
    return res.status(400).json({
      message:
        "name, companyName, email, and password are required in the JSON body",
    });
  }

  try {
    const userExists = await UserModel.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        message: `User with this email already exists`,
      });
    }

    const user = await UserModel.create({
      name,
      companyName,
      email,
      password,
      ...(role ? { role } : {}),
    });

    return res.status(201).json({
      message: `User registered successfully`,
      user: {
        id: user._id,
        name: user.name,
        companyName: user.companyName,
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

const loginController = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "email and password are required in the JSON body",
    });
  }

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        companyName: user.companyName,
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

const verifyEmailController = async (req, res) => {
  const { email } = req.body;
}

export { registerController, loginController, verifyEmailController };
