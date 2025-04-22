"use client";

import { useState, useEffect } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import MenuItemCard from "./MenuItemCard";
import AddMenuForm from "./AddMenuForm";

export default function MenuList() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useUser();

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/menu");

      if (!res.ok) {
        throw new Error("Failed to fetch menu items");
      }

      const data = await res.json();
      setMenuItems(data.data);
    } catch (error) {
      setError("Error loading menu items. Please try again later.");
      console.error("Error fetching menu items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (newItem) => {
    setMenuItems([...menuItems, newItem]);
  };

  const handleDeleteItem = (itemId) => {
    setMenuItems(menuItems.filter((item) => item._id !== itemId));
  };

  const handleUpdateItem = (updatedItem) => {
    setMenuItems(
      menuItems.map((item) =>
        item._id === updatedItem._id ? updatedItem : item
      )
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading menu items...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div>
      {user && <AddMenuForm onAddItem={handleAddItem} />}

      <h2 className="text-2xl font-bold mb-4">Menu Items</h2>

      {menuItems.length === 0 ? (
        <p className="text-gray-500">No menu items available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <MenuItemCard
              key={item._id}
              item={item}
              onDelete={handleDeleteItem}
              onUpdate={handleUpdateItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
