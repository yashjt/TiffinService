import mongoose from "mongoose";

// Simple rule engine implementation
class RuleEngine {
  constructor() {
    this.rules = [];
  }

  addRule(ruleName, condition, message) {
    this.rules.push({
      name: ruleName,
      condition,
      message,
    });
  }

  validate(data) {
    const errors = [];

    for (const rule of this.rules) {
      if (!rule.condition(data)) {
        errors.push({
          rule: rule.name,
          message: rule.message,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Create the Menu rule engine
const menuRuleEngine = new RuleEngine();

// Add business rules
menuRuleEngine.addRule(
  "premiumPriceThreshold",
  (menu) => !(menu.name.toLowerCase().includes("premium") && menu.price < 15),
  "Premium items must be priced at least $15"
);

menuRuleEngine.addRule(
  "specialCharactersInName",
  (menu) => /^[a-zA-Z0-9\s,'-()&]+$/.test(menu.name),
  "Menu name contains invalid special characters"
);

menuRuleEngine.addRule(
  "priceRounding",
  (menu) => Math.round(menu.price * 100) === menu.price * 100,
  "Price must have at most 2 decimal places"
);

// Define the schema
const MenuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name for this item"],
      maxlength: [100, "Name cannot be more than 100 character"],
    },
    price: {
      type: Number,
      required: [true, "Please provide a price for this menu item"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      enum: ["appetizer", "main", "dessert", "beverage"],
      default: "main",
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Add pre-validation middleware to apply business rules
MenuSchema.pre("validate", function (next) {
  const validationResult = menuRuleEngine.validate(this);

  if (!validationResult.valid) {
    const error = new mongoose.Error.ValidationError(this);

    validationResult.errors.forEach((err) => {
      error.errors[err.rule] = new mongoose.Error.ValidatorError({
        message: err.message,
        path: err.rule,
        value: this,
      });
    });

    return next(error);
  }

  next();
});

// Utility method to apply rules manually if needed
MenuSchema.methods.validateBusinessRules = function () {
  return menuRuleEngine.validate(this);
};

// Static method to add new rules at runtime
MenuSchema.statics.addBusinessRule = function (ruleName, condition, message) {
  menuRuleEngine.addRule(ruleName, condition, message);
};

export default mongoose.models.Menu || mongoose.model("Menu", MenuSchema);
