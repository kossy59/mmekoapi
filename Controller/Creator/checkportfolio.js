const userdb = require("../../Creators/userdb");

const checkPortfolio = async (req, res) => {
    const userid = req.params.userid || req.body.userid;

    if (!userid) {
        return res.status(400).json({
            ok: false,
            message: "User ID is required",
        });
    }

    try {
        const user = await userdb.findOne({ _id: userid }).exec();

        if (!user) {
            return res.status(404).json({
                ok: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            ok: true,
            hasPortfolio: user.creator_portfolio === true,
            portfolioId: user.creator_portfolio_id || null,
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            message: `${err.message}`,
        });
    }
};

module.exports = checkPortfolio;
