import CompanyModel from "../../../Model/Company.Model.js";
import UserModel from "../../../Model/User.Model.js";

const userFields = "name email role companyName createdAt updatedAt";

async function attachUsers(company) {
  const users = await UserModel.find({ companyId: company._id })
    .select(userFields)
    .lean();

  return {
    ...company,
    userCount: users.length,
    users,
  };
}

const getAllCompanies = async (req, res) => {
  try {
    const companies = await CompanyModel.find().sort({ createdAt: -1 }).lean();
    const companiesWithDetails = await Promise.all(
      companies.map((company) => attachUsers(company))
    );

    return res.status(200).json({
      success: true,
      count: companiesWithDetails.length,
      companies: companiesWithDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await CompanyModel.findById(id).lean();

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const companyWithDetails = await attachUsers(company);

    return res.status(200).json({
      success: true,
      company: companyWithDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export { getAllCompanies, getCompanyById };
