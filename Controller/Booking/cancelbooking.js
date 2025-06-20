const bookingdb = require("../../Models/book");

const createLike = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }

  //let data = await connectdatabase()

  try {
    const deletedBooking = await bookingdb.findByIdAndDelete(id).exec();

    if (deletedBooking) {
      return res
        .status(200)
        .json({ ok: true, message: `Deleted successfully` });
    }
    res.status(404).json({ ok: false, message: "Booking not found." });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};
module.exports = createLike;
