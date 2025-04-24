"use client";

import { useState } from "react";
import menuRuleEngine from "../utils/ruleEngine";

export default function AddMenuForm({ onAddItem }) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "main", // Added default category
  });
  const [error, setError] = useState("");
  const [businessRuleErrors, setBusinessRuleErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear errors when user types
    setError("");
    setBusinessRuleErrors([]);
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }

    if (
      !formData.price ||
      isNaN(formData.price) ||
      Number(formData.price) <= 0
    ) {
      setError("Please enter a valid price");
      return false;
    }

    // Business rules validation
    const validationResult = menuRuleEngine.validate(formData);
    if (!validationResult.valid) {
      setBusinessRuleErrors(validationResult.errors);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusinessRuleErrors([]);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          price: Number(formData.price),
          category: formData.category,
          isAvailable: true,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add menu item");
      }

      const data = await res.json();
      onAddItem(data.data);

      // Reset form
      setFormData({
        name: "",
        price: "",
        category: "main",
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50 mb-6">
      <h2 className="text-xl font-bold mb-4 text-black">Add New Menu Item</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {businessRuleErrors.length > 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded mb-4">
          <p className="font-semibold">Please correct the following issues:</p>
          <ul className="list-disc pl-5 mt-1">
            {businessRuleErrors.map((err, index) => (
              <li key={index}>{err.message}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-1">
            Item Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-black"
            placeholder="e.g., Vegetarian Thali"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-1">
            Price ($)
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full border rounded px-3 py-2 text-black"
            placeholder="e.g., 12.99"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-1">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-black"
          >
            <option value="appetizer">Appetizer</option>
            <option value="main">Main Course</option>
            <option value="dessert">Dessert</option>
            <option value="beverage">Beverage</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="flex items-center text-gray-700 text-sm font-medium">
            <input
              type="checkbox"
              name="taxExempt"
              checked={formData.taxExempt}
              onChange={handleChange}
              className="mr-2"
            />
            Tax exempt item
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
        >
          {isSubmitting ? "Adding..." : "Add Item"}
        </button>
      </form>
    </div>
  );
}
