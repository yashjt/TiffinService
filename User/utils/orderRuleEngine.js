// utils/orderRuleEngine.js

/**
 * A rule engine for order validation
 */
class RuleEngine {
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
   * Calculate tax for an item
   * @param {object} item - The menu item data
   * @returns {number} The calculated tax amount
   */
  calculateItemTax(item) {
    const price = Number(item.price);
    let taxRate = this.taxConfig.baseRate;

    // Apply special tax rate for alcoholic beverages
    if (this.isAlcoholicBeverage(item)) {
      taxRate = this.taxConfig.alcoholRate;
    }

    // Apply special treatment for certain categories
    if (
      item.category &&
      this.taxConfig.exemptCategories.includes(item.category)
    ) {
      taxRate = taxRate / 2; // Half tax rate for special categories
    }

    return Number((price * taxRate).toFixed(2));
  }

  /**
   * Calculate total tax for a full order
   * @param {object} order - The complete order data
   * @returns {number} Total tax amount for the order
   */
  calculateOrderTax(order) {
    if (!order.items || !Array.isArray(order.items)) {
      return 0;
    }

    return order.items.reduce((totalTax, item) => {
      const itemTax = this.calculateItemTax(item);
      return totalTax + itemTax * (item.quantity || 1);
    }, 0);
  }

  /**
   * Check if an item is an alcoholic beverage
   * @param {object} item - The menu item
   * @returns {boolean} Whether the item is alcoholic
   */
  isAlcoholicBeverage(item) {
    if (item.isAlcoholic === true) {
      return true;
    }

    if (item.category !== "beverage") {
      return false;
    }

    const name = item.name.toLowerCase();
    return (
      name.includes("wine") ||
      name.includes("beer") ||
      name.includes("cocktail") ||
      name.includes("alcohol")
    );
  }

  /**
   * Get subtotal price before tax
   * @param {object} order - The order data
   * @returns {number} Subtotal before tax
   */
  getSubtotal(order) {
    if (!order.items || !Array.isArray(order.items)) {
      return 0;
    }

    return order.items.reduce((subtotal, item) => {
      return subtotal + Number(item.price) * (item.quantity || 1);
    }, 0);
  }

  /**
   * Get final price including tax
   * @param {object} order - The order data
   * @returns {number} The final price with tax
   */
  getFinalPrice(order) {
    const subtotal = this.getSubtotal(order);
    const tax = this.calculateOrderTax(order);

    return Number((subtotal + tax).toFixed(2));
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
    // Use subtotal for minimum order validation
    const subtotal = orderRuleEngine.getSubtotal(order);
    return subtotal >= 5;
  },
  "Minimum order value is $5 (before tax)"
);

// Rule: Alcoholic beverage pricing validation
orderRuleEngine.addRule(
  "alcoholBeverageMinPrice",
  (order) => {
    if (!order.items || !Array.isArray(order.items)) return true;
    return order.items.every((item) => {
      if (orderRuleEngine.isAlcoholicBeverage(item)) {
        return item.price >= 8;
      }
      return true;
    });
  },
  "Alcoholic beverages must be priced at least $8"
);

// No tax exempt rules needed

module.exports = orderRuleEngine;
