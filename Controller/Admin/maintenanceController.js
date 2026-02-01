const GlobalSettings = require("../../Creators/GlobalSettings");

const getMaintenanceStatus = async (req, res) => {
    try {
        let settings = await GlobalSettings.findOne({ key: 'main_config' });

        if (!settings) {
            settings = await GlobalSettings.create({ key: 'main_config', isMaintenance: false });
        }

        return res.status(200).json({ ok: true, isMaintenance: settings.isMaintenance });
    } catch (error) {
        console.error("Error getting maintenance status:", error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};

const toggleMaintenanceStatus = async (req, res) => {
    try {
        let settings = await GlobalSettings.findOne({ key: 'main_config' });

        if (!settings) {
            settings = await GlobalSettings.create({ key: 'main_config', isMaintenance: true });
        } else {
            settings.isMaintenance = !settings.isMaintenance;
            await settings.save();
        }

        return res.status(200).json({ ok: true, isMaintenance: settings.isMaintenance, message: `Maintenance mode turned ${settings.isMaintenance ? 'ON' : 'OFF'}` });
    } catch (error) {
        console.error("Error toggling maintenance status:", error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};

const getCreatorSortStatus = async (req, res) => {
    try {
        let settings = await GlobalSettings.findOne({ key: 'main_config' });

        if (!settings) {
            settings = await GlobalSettings.create({ key: 'main_config', isMaintenance: false, isNewestCreatorsFirst: false });
        }

        return res.status(200).json({ ok: true, isNewestCreatorsFirst: settings.isNewestCreatorsFirst || false });
    } catch (error) {
        console.error("Error getting sort status:", error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};

const toggleCreatorSortStatus = async (req, res) => {
    try {
        let settings = await GlobalSettings.findOne({ key: 'main_config' });

        if (!settings) {
            settings = await GlobalSettings.create({ key: 'main_config', isMaintenance: false, isNewestCreatorsFirst: true });
        } else {
            settings.isNewestCreatorsFirst = !settings.isNewestCreatorsFirst;
            await settings.save();
        }

        return res.status(200).json({
            ok: true,
            isNewestCreatorsFirst: settings.isNewestCreatorsFirst,
            message: `Sort by newest turned ${settings.isNewestCreatorsFirst ? 'ON' : 'OFF'}`
        });
    } catch (error) {
        console.error("Error toggling sort status:", error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};

module.exports = {
    getMaintenanceStatus,
    toggleMaintenanceStatus,
    getCreatorSortStatus,
    toggleCreatorSortStatus
};
