const CompanyController = async(request, response) => {
    try {
        const company = await CompanyModel.findOne({});
        return response.status(200).json({
            success: true,
            company: company
        })
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const CompanyControllerById =async(request,response) => {
    try {
        const { id } = request.params;
        const company = await CompanyModel.findById(id);
        return response.status(200).json({
            success: true,
            company: company
        })
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export default CompanyController;