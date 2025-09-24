const Joi = require("joi");

const userValidationSchema = Joi.object({
  fullName: Joi.string().min(3).max(100).required(),
  address: Joi.string().min(5).max(200).required(),
  country: Joi.string().min(2).max(100).required(),
  city: Joi.string().min(2).max(100).required(),
  residentialAddress: Joi.string().min(5).max(200).required(),
});

module.exports = userValidationSchema;
