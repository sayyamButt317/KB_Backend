import CompanyModel from "../../Model/Company.Model.js";

const CompanyController = async (req, res) => {
  try {
    const company = await CompanyModel.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }
    return res.status(200).json({
      success: true,
      company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const CompanyControllerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (String(id) !== String(req.user.companyId)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const company = await CompanyModel.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    return res.status(200).json({
      success: true,
      company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export { CompanyController, CompanyControllerById };
