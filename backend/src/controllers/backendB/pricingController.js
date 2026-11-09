
import pricingService from "../../services/backendB/pricingService.js";

export const getPrices = async (req, res) => {
  try {
    const prices = await pricingService.getAllPrices();
    return res.status(200).json({
      success: true,
      data: prices
    });
  } catch (error) {
    console.error("Get prices error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve ingredient prices"
    });
  }
};

export const getPrice = async (req, res) => {
  try {
    const price = await pricingService.getPriceByIngredient(
      req.params.ingredientId
    );

    if (!price) {
      return res.status(404).json({
        success: false,
        message: "Price not found for this ingredient"
      });
    }

    return res.status(200).json({
      success: true,
      data: price
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const createPrice = async (req, res) => {
  try {
    const price = await pricingService.createPrice(req.body);

    return res.status(201).json({
      success: true,
      message: "Ingredient price created successfully",
      data: price
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A price already exists for this ingredient"
      });
    }

    const status = error.message.includes("not found") ? 404 : 400;

    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

export const updatePrice = async (req, res) => {
  try {
    const price = await pricingService.updatePrice(
      req.params.ingredientId,
      req.body.pricePerUnit
    );

    return res.status(200).json({
      success: true,
      message: "Ingredient price updated successfully",
      data: price
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Price not found"
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const deletePrice = async (req, res) => {
  try {
    await pricingService.deletePrice(req.params.ingredientId);

    return res.status(200).json({
      success: true,
      message: "Ingredient price deleted successfully"
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Price not found"
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
