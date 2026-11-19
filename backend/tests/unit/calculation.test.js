import { describe, it, expect } from 'vitest';

function calculateBufferedServings(guestCount, bufferPercent) {
  return Math.ceil((guestCount * (100 + bufferPercent)) / 100);
}

function calculateDishCost(recipeIngredients, recipeServings, plannedServings) {
  const scale = plannedServings / recipeServings;
  return recipeIngredients.reduce((total, item) => {
    return total + item.quantity * scale * item.pricePerUnit;
  }, 0);
}

function calculateWasteMetrics(prepared, consumed, enteredLeftover) {
  const calculatedLeftover =
    enteredLeftover !== undefined ? enteredLeftover : Math.max(0, prepared - consumed);
  const wastePercentage =
    prepared > 0 ? Number(((calculatedLeftover / prepared) * 100).toFixed(2)) : 0;
  return { calculatedLeftover, wastePercentage };
}

describe('MealMate Catering Calculations (Unit)', () => {
  it('scales guest count correctly with food buffer percentage', () => {
    expect(calculateBufferedServings(100, 10)).toBe(110);
    expect(calculateBufferedServings(75, 15)).toBe(87);
    expect(calculateBufferedServings(50, 0)).toBe(50);
  });

  it('calculates recipe-backed dish cost for planned servings', () => {
    const paneerMasalaIngredients = [
      { quantity: 1.0, pricePerUnit: 350 }, 
      { quantity: 0.5, pricePerUnit: 50 },  
      { quantity: 0.2, pricePerUnit: 150 }, 
    ];

    expect(calculateDishCost(paneerMasalaIngredients, 10, 100)).toBeCloseTo(4050);
  });

  it('computes leftover and waste percentage accurately', () => {
    expect(calculateWasteMetrics(100, 82)).toEqual({
      calculatedLeftover: 18,
      wastePercentage: 18,
    });
  });

  it('respects manually entered leftover when provided', () => {
    expect(calculateWasteMetrics(100, 80, 15)).toEqual({
      calculatedLeftover: 15,
      wastePercentage: 15,
    });
  });

  it('prevents division by zero when prepared quantity is 0', () => {
    expect(calculateWasteMetrics(0, 0)).toEqual({
      calculatedLeftover: 0,
      wastePercentage: 0,
    });
  });
});