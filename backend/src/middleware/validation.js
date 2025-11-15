const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    // Handle both direct schema and schema object with body/params/query
    let validationSchema = schema;
    let dataToValidate = req.body;
    
    // If schema has a body property, use that for validation
    if (schema.body) {
      validationSchema = schema.body;
      dataToValidate = req.body;
    }
    
    // Validate the data
    const { error, value } = validationSchema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }
    
    // Replace req.body with validated and sanitized data
    req.body = value;
    
    next();
  };
};

// Validation schemas
const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(2).max(50).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50),
    email: Joi.string().email()
  }),

  pdfOperation: Joi.object({
    fileIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
    operation: Joi.string().valid('merge', 'split', 'compress', 'convert').required(),
    options: Joi.object().optional()
  })
};

module.exports = {
  validateRequest,
  schemas
};