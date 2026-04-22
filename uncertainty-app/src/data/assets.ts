// Asset Database - Equipment inventory with asset numbers
// This file is auto-generated from the asset tracking spreadsheet

export interface Asset {
  assetNumber: string;
  serialNumber: string;
  description: string;
  custodian: string;
  noCalRequired: boolean;
  calibrationDue: string;
  location: string;
  notes: string;
  department: string;
  model: string;
  manufacturer: string;
  type: string;  // A/B/C/D classification
  category: string;
  // Legacy fields for backward compatibility
  status?: string;
  range?: string;
  rangeLow?: string;
  rangeHigh?: string;
  rangeUnits?: string;
  accuracy?: string;
  calDate?: string;
  outputHigh?: string;
  outputLow?: string;
  outputUnits?: string;
}

// Upload your asset list via the Excel upload button in the app
export const assets: Asset[] = [];

// Lookup function
export function findAsset(assetNumber: string): Asset | undefined {
  const searchTerm = assetNumber.trim().toLowerCase();
  return assets.find(a =>
    a.assetNumber.toLowerCase() === searchTerm ||
    a.assetNumber.toLowerCase().includes(searchTerm)
  );
}

// Search function (partial match)
export function searchAssets(query: string): Asset[] {
  const searchTerm = query.trim().toLowerCase();
  if (!searchTerm) return [];

  return assets.filter(a =>
    a.assetNumber.toLowerCase().includes(searchTerm) ||
    a.description.toLowerCase().includes(searchTerm) ||
    a.manufacturer.toLowerCase().includes(searchTerm) ||
    a.model.toLowerCase().includes(searchTerm) ||
    a.category?.toLowerCase().includes(searchTerm)
  );
}
