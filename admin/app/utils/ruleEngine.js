export class RuleEngine {
  constructor() {
    this.rules = [];
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

// Optional: Category validation if you decide to add this field
menuRuleEngine.addRule(
  "categoryValidation",
  (menu) => {
    if (!menu.category) return true; // Optional field
    return ["appetizer", "main", "dessert", "beverage"].includes(menu.category);
  },
  "Category must be appetizer, main, dessert, or beverage"
);

// Export the singleton instance
export default menuRuleEngine;
