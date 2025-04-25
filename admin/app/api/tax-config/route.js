import connectToDatabase from "../../utils/mongodb";
import Menu, { TaxConfig } from "../../models/Menu";
import { getSession } from "@auth0/nextjs-auth0";

export default async function handler(req, res) {
  try {
    await connectToDatabase();

    // GET request - fetch current tax configuration
    if (req.method === "GET") {
      const taxConfig = await Menu.getTaxConfig();
      return res.status(200).json({
        success: true,
        config: taxConfig,
      });
    }

    // PUT request - update tax configuration
    if (req.method === "PUT") {
      // Check if user is authenticated
      const session = await getSession(req, res);
      if (!session) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Validate the request body
      const { baseRate, alcoholRate, dessertRateMultiplier } = req.body;

      if (baseRate !== undefined && (baseRate < 0 || baseRate > 1)) {
        return res.status(400).json({
          success: false,
          message: "Base rate must be between 0 and 1",
        });
      }

      if (alcoholRate !== undefined && (alcoholRate < 0 || alcoholRate > 1)) {
        return res.status(400).json({
          success: false,
          message: "Alcohol rate must be between 0 and 1",
        });
      }

      if (
        dessertRateMultiplier !== undefined &&
        (dessertRateMultiplier < 0 || dessertRateMultiplier > 1)
      ) {
        return res.status(400).json({
          success: false,
          message: "Dessert rate multiplier must be between 0 and 1",
        });
      }

      // Update the tax configuration
      const updatedConfig = await Menu.updateTaxConfig({
        baseRate,
        alcoholRate,
        dessertRateMultiplier,
      });

      return res.status(200).json({
        success: true,
        message: "Tax configuration updated successfully",
        config: updatedConfig,
      });
    }

    // Method not allowed
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  } catch (error) {
    console.error("Tax config API error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}
