"use client";

import { useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import menuRuleEngine from "../utils/ruleEngine";

import EditMenuForm from "./EditMenuForm";

export default function MenuItemCard({ item, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useUser();

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        const res = await fetch(`/api/menu/${item._id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error("Failed to delete menu item");
        }

        onDelete(item._id);
      } catch (error) {
        console.error("Error deleting menu item:", error);
      }
    }
  };

  const handleEditSave = (updatedItem) => {
    onUpdate(updatedItem);
    setIsEditing(false);
  };

  // Get appropriate badge color based on category
  const getCategoryBadgeColor = (category) => {
    switch (category) {
      case "appetizer":
        return "bg-yellow-100 text-yellow-800";
      case "main":
        return "bg-green-100 text-green-800";
      case "dessert":
        return "bg-pink-100 text-pink-800";
      case "beverage":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 shadow-md ${
        item.isAvailable === false ? "bg-gray-100" : "bg-white"
      }`}
    >
      {isEditing ? (
        <EditMenuForm
          item={item}
          onSave={handleEditSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <>
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-black">
              {item.name}
              {item.isAvailable === false && (
                <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  Unavailable
                </span>
              )}
            </h3>
            <span className="text-lg font-bold text-green-700">
              ${item.price.toFixed(2)}
            </span>
          </div>

          {item.name.toLowerCase().includes("premium") && (
            <div className="mt-1 mb-2">
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                Premium
              </span>
            </div>
          )}

          {item.category && (
            <div className="mt-2">
              <span
                className={`text-xs px-2 py-1 rounded ${getCategoryBadgeColor(
                  item.category
                )}`}
              >
                {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
              </span>

              <span className="text-sm text-gray-500">
                With tax: ${menuRuleEngine.getFinalPrice(item).toFixed(2)}
              </span>
            </div>
          )}

          {user && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
