// utils/orderRuleEngine.js

/**
 * A rule engine for order validation
 */
class RuleEngine {
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

// Create a singleton instance with predefined rules for orders
const orderRuleEngine = new RuleEngine();

// Rule: Order should have at least one item
orderRuleEngine.addRule(
  "minimumOrderItems",
  (order) => order.items && order.items.length > 0,
  "Order must contain at least one item"
);

// Rule: Delivery address must be at least 10 characters
orderRuleEngine.addRule(
  "deliveryAddressLength",
  (order) => order.deliveryAddress && order.deliveryAddress.length >= 10,
  "Delivery address must be at least 10 characters long"
);

// Rule: Individual item quantity validation
orderRuleEngine.addRule(
  "itemQuantityLimit",
  (order) => {
    if (!order.items || !Array.isArray(order.items)) return true;
    return order.items.every((item) => item.quantity <= 10);
  },
  "Maximum quantity per item is 10"
);

// Rule: Menu item pricing validation (for premium items)
orderRuleEngine.addRule(
  "premiumItemPricing",
  (order) => {
    if (!order.items || !Array.isArray(order.items)) return true;
    return order.items.every((item) => {
      if (item.name && item.name.toLowerCase().includes("premium")) {
        return item.price >= 15;
      }
      return true;
    });
  },
  "Premium items must be priced at least $15"
);

// Rule: Total order value validation
orderRuleEngine.addRule(
  "minimumOrderValue",
  (order) => {
    const totalValue =
      order.totalPrice ||
      (order.items
        ? order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
        : 0);
    return totalValue >= 5;
  },
  "Minimum order value is $5"
);

module.exports = orderRuleEngine;
