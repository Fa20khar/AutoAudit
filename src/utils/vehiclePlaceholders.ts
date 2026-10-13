import sedanSilhouette from '../assets/images/sedan_silhouette_1791903241365.jpg';
import suvSilhouette from '../assets/images/suv_silhouette_1791903256667.jpg';
import pickupSilhouette from '../assets/images/pickup_silhouette_1791903273738.jpg';

export type VehicleBodyStyle = 'sedan' | 'suv' | 'pickup';

export interface VehicleSilhouetteOption {
  id: VehicleBodyStyle;
  label: string;
  image: string;
  description: string;
  commonModels: string[];
}

export const VEHICLE_SILHOUETTES: Record<VehicleBodyStyle, VehicleSilhouetteOption> = {
  sedan: {
    id: 'sedan',
    label: 'Sedan / Saloon',
    image: sedanSilhouette,
    description: 'Generic aerodynamic 4-door passenger car blueprint silhouette',
    commonModels: ['Audi A4/A6', 'Honda Accord/Civic', 'Toyota Camry/Corolla', 'BMW 3/5 Series', 'Mercedes C/E-Class'],
  },
  suv: {
    id: 'suv',
    label: 'SUV / Crossover',
    image: suvSilhouette,
    description: 'Generic elevated sport utility & crossover vehicle blueprint silhouette',
    commonModels: ['Toyota RAV4/Prado/Highlander', 'Honda CR-V', 'Audi Q5/Q7', 'BMW X3/X5', 'Kia Sportage'],
  },
  pickup: {
    id: 'pickup',
    label: 'Pickup Truck',
    image: pickupSilhouette,
    description: 'Generic utility truck with open rear cargo bed blueprint silhouette',
    commonModels: ['Toyota Hilux/Tacoma/Tundra', 'Ford F-150/Ranger', 'Chevy Silverado', 'RAM 1500'],
  },
};

/**
 * Automatically detects the most suitable body style silhouette from a vehicle description or title string.
 */
export function detectVehicleBodyStyle(vehicleNameOrType?: string): VehicleBodyStyle {
  if (!vehicleNameOrType) return 'sedan';

  const normalized = vehicleNameOrType.toLowerCase();

  // Check Pickup truck keywords
  const pickupKeywords = [
    'pickup', 'truck', 'hilux', 'tacoma', 'tundra', 'f-150', 'f150', 'ranger',
    'silverado', 'sierra', 'ram 1500', 'colorado', 'frontier', 'gladiator', 'd-max', 'navara'
  ];
  if (pickupKeywords.some(kw => normalized.includes(kw))) {
    return 'pickup';
  }

  // Check SUV / Crossover keywords
  const suvKeywords = [
    'suv', 'crossover', 'rav4', 'cr-v', 'crv', 'prado', 'land cruiser', 'highlander',
    'sportage', 'tucson', 'santa fe', 'q3', 'q5', 'q7', 'q8', 'x1', 'x3', 'x5', 'x7',
    'glc', 'gle', 'gls', 'explorer', 'cherokee', 'wrangler', 'tahoe', 'suburban',
    'patrol', 'fortuner', 'vezel', 'cx-5', 'cx-30', 'cx-9', 'outback', 'forester'
  ];
  if (suvKeywords.some(kw => normalized.includes(kw))) {
    return 'suv';
  }

  // Default to sedan for sedans, coupés, hatchbacks, wagons, or generic cars
  return 'sedan';
}

/**
 * Returns the placeholder vehicle silhouette image URL.
 */
export function getVehiclePlaceholderImage(vehicleNameOrType?: string, overrideStyle?: VehicleBodyStyle): string {
  const style = overrideStyle || detectVehicleBodyStyle(vehicleNameOrType);
  return VEHICLE_SILHOUETTES[style].image;
}
