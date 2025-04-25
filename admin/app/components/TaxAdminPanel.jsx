"use client";

import { useState, useEffect } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";

export default function TaxAdminPanel() {
  const { user, isLoading } = useUser();
  const [taxConfig, setTaxConfig] = useState({
    baseRate: 0.111,
    alcoholRate: 0.125,
    dessertRateMultiplier: 0.5,
  });
  const [formData, setFormData] = useState({
    baseRate: 0.111,
    alcoholRate: 0.125,
    dessertRateMultiplier: 0.5,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);

  // Fetch current tax configuration
  useEffect(() => {
    const fetchTaxConfig = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/tax-config");
        if (response.ok) {
          const data = await response.json();
          setTaxConfig(data.config);
          setFormData(data.config);
        }
      } catch (error) {
        console.error("Error fetching tax configuration:", error);
        setMessage({
          type: "error",
          text: "Failed to load tax configuration",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTaxConfig();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = parseFloat(value);
    
    // Ensure value is within 0-1 range and not NaN
    if (!isNaN(parsedValue)) {
      if (parsedValue < 0) parsedValue = 0;
      if (parsedValue > 1) parsedValue = 1;
      
      setFormData({
        ...formData,
        [name]: parsedValue,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tax-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setTaxConfig(data.config);
        setMessage({
          type: "success",
          text: "Tax configuration updated successfully",
        });
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to update tax configuration",
        });
      }
    } catch (error) {
      console.error("Error updating tax configuration:", error);
      setMessage({
        type: "error",
        text: "An error occurred while updating tax configuration",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If the user is not authenticated or still loading, don't show the panel
  if (isLoading || !user) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4 bg-gray-50 mb-6">
      <h2 className="text-xl font-bold mb-4 text-black">Tax Configuration</h2>

      {loading ? (
        <div className="text-center py-4">Loading tax configuration...</div>
      ) : (
        <>
          {message.text && (
            <div
              className={`${
                message.type === "success"
                  ? "bg-green-100 border-green-400 text-green-700"
                  : "bg-red-100 border-red-400 text-red-700"
              } px-4 py-2 rounded mb-4 border`}
            >
              {message.text}
            </div>
          )}

          <div className="mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Current Tax Rates:</h3>
            <ul className="list-disc pl-5">
              <li>Base Rate: {(taxConfig.baseRate * 100).toFixed(2)}%</li>
              <li>Alcohol Rate: {(taxConfig.alcoholRate * 100).toFixed(2)}%</li>
              <li>
                Dessert Rate: {(taxConfig.baseRate * taxConfig.dessertRateMultiplier * 100).toFixed(2)}% 
                (Base Rate × {(taxConfig.dessertRateMultiplier * 100).toFixed(0)}%)
              </li>
            </ul>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-1">
                Base Tax Rate (0-1)
              </label>
              <input
                type="number"
                name="baseRate"
                value={formData.baseRate}
                onChange={handleChange}
                step="0.01"
                min="0"
                max="1"
                className="w-full border rounded px-3 py-2 text-black"
                placeholder="e.g., 0.111 for 11.1%"
              />
              <p className="text-sm text-gray-500 mt-1">
                Current value: {(formData.baseRate * 100).toFixed(2)}%
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-1">
                Alcohol Tax Rate (0-1)
              </label>
              <input
                type="number"
                name="alcoholRate"
                value={formData.alcoholRate}
                onChange={handleChange}
                step="0.01"
                min="0"
                max="1"
                className="w-full border rounded px-3 py-2 text-black"
                placeholder="e.g., 0.125 for 12.5%"
              />
              <p className="text-sm text-gray-500 mt-1">
                Current value: {(formData.alcoholRate * 100).toFixed(2)}%
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-1">
                Dessert Rate Multiplier (0-1)
              </label>
              <input
                type="number"
                name="dessertRateMultiplier"
                value={formData.dessertRateMultiplier}
                onChange={handleChange}
                step="0.1"
                min="0"
                max="1"
                className="w-full border rounded px-3 py-2 text-black"
                placeholder="e.g., 0.5 for 50%"
              />
              <p className="text-sm text-gray-500 mt-1">
                Current value: {(formData.dessertRateMultiplier * 100).toFixed(0)}% of base rate
                (resulting in {(formData.baseRate * formData.dessertRateMultiplier * 100).toFixed(2)}% tax)
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
            >
              {isSubmitting ? "Updating..." : "Update Tax Configuration"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}