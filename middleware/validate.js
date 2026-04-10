const { validationResult } = require("express-validator");

/**
 * Wraps express-validator chains into a single middleware
 * that runs all validations then checks for errors.
 * Compatible with Express 5.
 */
function validate(validations) {
  return async (req, res, next) => {
    for (const validation of validations) {
      await validation.run(req);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    next();
  };
}

module.exports = validate;
