import UserModel from "../../Model/User.Model.js";
import CompanyModel from "../../Model/Company.Model.js";
import { generateAccessToken } from "../../Utils/jwt.js";

function slugifyCompanyName(name) {
  const base = String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "company"}-${Date.now().toString(36)}`;
}

const registerController = async (req, res) => {
  const { name, companyName, email, password } = req.body;

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

    const company = await CompanyModel.create({
      name: companyName,
      slug: slugifyCompanyName(companyName),
    });

    // First user of a new company is admin; never trust client companyId/role for tenancy
    const user = await UserModel.create({
      name,
      email,
      password,
      companyId: company._id,
      companyName: company.name,
      role: "admin",
    });

    const accessToken = generateAccessToken(user);

    return res.status(201).json({
      message: `User registered successfully`,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: company._id,
        companyName: company.name,
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
    const user = await UserModel.findOne({ email }).populate("companyId", "name slug");
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.companyId) {
      return res.status(400).json({
        message: "User is not linked to a company. Please re-register.",
      });
    }

    const company =
      typeof user.companyId === "object" && user.companyId?._id
        ? user.companyId
        : null;

    const tokenUser = {
      _id: user._id,
      companyId: company?._id || user.companyId,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenUser);

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: company?._id || user.companyId,
        companyName: company?.name || user.companyName,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const verifyEmailController = async (req, res) => {
  return res.status(501).json({ message: "Not implemented" });
};

export { registerController, loginController, verifyEmailController };
