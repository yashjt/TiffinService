export class RuleEngine {
  constructor() {
    this.rules = [];
    // Default tax settings
    this.taxConfig = {
      baseRate: 0.0875, // 8.75% default tax rate
      alcoholRate: 0.1125, // 11.25% tax rate for alcoholic beverages
      exemptCategories: ["dessert"], // Categories that might have different tax treatment
    };
  }

  /**
   * Add a new validation rule
   * @param {string} ruleName - Unique name for the rule
   * @param {function} condition - Function that returns true if valid, false if invalid
   * @param {string} message - Error message to display if validation fails
   */
  addRule(ruleName, condition, message) {
    this.rules.push({
      name: ruleName,
      condition,
      message,
    });
  }

  /**
   * Validate data against all registered rules
   * @param {object} data - The data to validate
   * @returns {object} Validation result with valid flag and errors array
   */
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

  /**
   * Calculate tax for a menu item
   * @param {object} menuItem - The menu item data
   * @returns {number} The calculated tax amount
   */
  calculateTax(menuItem) {
    // Skip tax calculation for tax-exempt items
    if (menuItem.taxExempt) {
      return 0;
    }

    const price = Number(menuItem.price);
    let taxRate = this.taxConfig.baseRate;

    // Apply special tax rate for alcoholic beverages
    if (
      menuItem.category === "beverage" &&
      (menuItem.name.toLowerCase().includes("wine") ||
        menuItem.name.toLowerCase().includes("beer") ||
        menuItem.name.toLowerCase().includes("cocktail") ||
        menuItem.name.toLowerCase().includes("alcohol"))
    ) {
      taxRate = this.taxConfig.alcoholRate;
    }

    // Apply special treatment for desserts (potentially lower tax)
    if (this.taxConfig.exemptCategories.includes(menuItem.category)) {
      // In some regions, desserts might have reduced tax or be exempt
      // This is just an example - adjust according to your needs
      taxRate = taxRate / 2;
    }

    return Number((price * taxRate).toFixed(2));
  }

  /**
   * Get final price including tax
   * @param {object} menuItem - The menu item data
   * @returns {number} The final price with tax
   */
  getFinalPrice(menuItem) {
    const price = Number(menuItem.price);
    const tax = this.calculateTax(menuItem);

    return Number((price + tax).toFixed(2));
  }
}

// Create a singleton instance with predefined rules for menu items
const menuRuleEngine = new RuleEngine();

// Add business rules matching the server-side rules
menuRuleEngine.addRule(
  "premiumPriceThreshold",
  (menu) =>
    !(menu.name.toLowerCase().includes("premium") && Number(menu.price) < 15),
  "Premium items must be priced at least $15"
);

menuRuleEngine.addRule(
  "specialCharactersInName",
  (menu) => /^[a-zA-Z0-9\s,'-()&]+$/.test(menu.name),
  "Menu name contains invalid special characters"
);

menuRuleEngine.addRule(
  "priceRounding",
  (menu) => {
    const price = Number(menu.price);
    return Math.round(price * 100) === price * 100;
  },
  "Price must have at most 2 decimal places"
);

menuRuleEngine.addRule(
  "categoryValidation",
  (menu) => {
    if (!menu.category) return true; // Optional field
    return ["appetizer", "main", "dessert", "beverage"].includes(menu.category);
  },
  "Category must be appetizer, main, dessert, or beverage"
);

// Tax-related rules
menuRuleEngine.addRule(
  "alcoholBeverageMinPrice",
  (menu) => {
    // Alcoholic beverages should be priced higher due to taxes and regulations
    if (
      menu.category === "beverage" &&
      (menu.name.toLowerCase().includes("wine") ||
        menu.name.toLowerCase().includes("beer") ||
        menu.name.toLowerCase().includes("cocktail") ||
        menu.name.toLowerCase().includes("alcohol"))
    ) {
      return Number(menu.price) >= 8;
    }
    return true;
  },
  "Alcoholic beverages must be priced at least $8"
);

menuRuleEngine.addRule(
  "taxExemptMaxPrice",
  (menu) => {
    // If the item is marked as tax exempt, it shouldn't be too expensive
    if (menu.taxExempt === true) {
      return Number(menu.price) <= 5;
    }
    return true;
  },
  "Tax-exempt items must be priced at $5 or less"
);

// Export the singleton instance
export default menuRuleEngine;
