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

// Define a schema for tax configuration
const TaxConfigSchema = new mongoose.Schema({
  baseRate: {
    type: Number,
    default: 0.111, // 11.1% default tax rate
    min: 0,
    max: 1,
  },
  alcoholRate: {
    type: Number,
    default: 0.125, // 12.5% tax rate for alcoholic beverages
    min: 0,
    max: 1,
  },
  dessertRateMultiplier: {
    type: Number,
    default: 0.5, // Half rate for desserts
    min: 0,
    max: 1,
  },
});

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
    taxExempt: {
      type: Boolean,
      default: false,
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

// Create a separate Tax Configuration model
const TaxConfig =
  mongoose.models.TaxConfig || mongoose.model("TaxConfig", TaxConfigSchema);

// Create or update the default tax configuration if it doesn't exist
const ensureDefaultTaxConfig = async () => {
  try {
    const existingConfig = await TaxConfig.findOne();
    if (!existingConfig) {
      await TaxConfig.create({
        baseRate: 0.111,
        alcoholRate: 0.125,
        dessertRateMultiplier: 0.5,
      });
      console.log("Created default tax configuration");
    }
  } catch (error) {
    console.error("Error ensuring default tax config:", error);
  }
};

// Try to create the default tax config when this module is imported
if (mongoose.connection.readyState === 1) {
  // Only run if mongoose is connected
  ensureDefaultTaxConfig();
} else {
  // Otherwise, set up a listener for when the connection is established
  mongoose.connection.once("connected", ensureDefaultTaxConfig);
}

// Method to calculate tax for an item
MenuSchema.methods.calculateTax = async function () {
  // Get the current tax configuration
  const taxConfig = (await TaxConfig.findOne()) || {
    baseRate: 0.111,
    alcoholRate: 0.125,
    dessertRateMultiplier: 0.5,
  };

  // Skip tax calculation for tax-exempt items
  if (this.taxExempt) {
    return 0;
  }

  let taxRate = taxConfig.baseRate;

  // Apply special tax rate for alcoholic beverages
  const isAlcoholic =
    this.category === "beverage" &&
    (this.name.toLowerCase().includes("wine") ||
      this.name.toLowerCase().includes("beer") ||
      this.name.toLowerCase().includes("cocktail") ||
      this.name.toLowerCase().includes("alcohol"));

  if (isAlcoholic) {
    taxRate = taxConfig.alcoholRate;
  }

  // Apply special treatment for desserts (lower tax)
  if (this.category === "dessert") {
    taxRate = taxRate * taxConfig.dessertRateMultiplier;
  }

  return Number((this.price * taxRate).toFixed(2));
};

// Method to get final price with tax
MenuSchema.methods.getFinalPrice = async function () {
  const tax = await this.calculateTax();
  return Number((this.price + tax).toFixed(2));
};

// Static method to get the current tax configuration
MenuSchema.statics.getTaxConfig = async function () {
  return (
    (await TaxConfig.findOne()) || {
      baseRate: 0.111,
      alcoholRate: 0.125,
      dessertRateMultiplier: 0.5,
    }
  );
};

// Static method to update tax configuration
MenuSchema.statics.updateTaxConfig = async function (newConfig) {
  const taxConfig = await TaxConfig.findOne();

  if (taxConfig) {
    // Update existing config
    if (newConfig.baseRate !== undefined)
      taxConfig.baseRate = newConfig.baseRate;
    if (newConfig.alcoholRate !== undefined)
      taxConfig.alcoholRate = newConfig.alcoholRate;
    if (newConfig.dessertRateMultiplier !== undefined)
      taxConfig.dessertRateMultiplier = newConfig.dessertRateMultiplier;

    await taxConfig.save();
    return taxConfig;
  } else {
    // Create new config if none exists
    return await TaxConfig.create({
      baseRate: newConfig.baseRate ?? 0.111,
      alcoholRate: newConfig.alcoholRate ?? 0.125,
      dessertRateMultiplier: newConfig.dessertRateMultiplier ?? 0.5,
    });
  }
};

// Utility method to apply rules manually if needed
MenuSchema.methods.validateBusinessRules = function () {
  return menuRuleEngine.validate(this);
};

// Static method to add new rules at runtime
MenuSchema.statics.addBusinessRule = function (ruleName, condition, message) {
  menuRuleEngine.addRule(ruleName, condition, message);
};

export default mongoose.models.Menu || mongoose.model("Menu", MenuSchema);
export { TaxConfig };
