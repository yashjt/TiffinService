// models/TaxConfig.js
const mongoose = require("mongoose");

const TaxConfigSchema = new mongoose.Schema({
  baseRate: {
    type: Number,
    default: 0.11, // 11.1% default tax rate
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

// Create the model
const TaxConfig = mongoose.model("TaxConfig", TaxConfigSchema);

// Create default configuration if none exists
const ensureDefaultConfig = async () => {
  try {
    const count = await TaxConfig.countDocuments();
    if (count === 0) {
      await TaxConfig.create({
        baseRate: 0.111,
        alcoholRate: 0.125,
        dessertRateMultiplier: 0.5,
      });
      console.log("Created default tax configuration");
    }
  } catch (error) {
    console.error("Error creating default tax config:", error);
  }
};

// Run this when the model is imported
ensureDefaultConfig();

module.exports = TaxConfig;
