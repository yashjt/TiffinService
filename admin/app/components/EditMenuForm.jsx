"use client";
import { useState } from "react";
import menuRuleEngine from "../utils/ruleEngine";

export default function EditMenuForm({ item, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: item.name,
    price: item.price,
    category: item.category || "main", // Using the existing category or defaulting to "main"
    isAvailable: item.isAvailable !== false, // Default to true if not specified
  });

  const [error, setError] = useState("");
  const [businessRuleErrors, setBusinessRuleErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = name === "isAvailable" ? e.target.checked : value;

    setFormData({
      ...formData,
      [name]: newValue,
    });

    // Clear errors when user makes changes
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
      const res = await fetch(`/api/menu/${item._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          price: Number(formData.price),
          category: formData.category,
          isAvailable: formData.isAvailable,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update menu item");
      }

      const data = await res.json();
      onSave(data.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Edit Menu Item</h3>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded mb-3 text-sm">
          {error}
        </div>
      )}

      {businessRuleErrors.length > 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-1 rounded mb-3 text-sm">
          <p className="font-semibold">Please correct the following issues:</p>
          <ul className="list-disc pl-4 mt-1">
            {businessRuleErrors.map((err, index) => (
              <li key={index}>{err.message}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-medium mb-1">
            Item Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>

        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-medium mb-1">
            Price ($)
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>

        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-medium mb-1">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1 text-sm"
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
              name="isAvailable"
              checked={formData.isAvailable}
              onChange={handleChange}
              className="mr-2"
            />
            Item is available
          </label>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
