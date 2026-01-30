// Asset Database - Equipment inventory with asset numbers
// This file is auto-generated from the asset tracking spreadsheet

export interface Asset {
  assetNumber: string;
  serialNumber: string;
  description: string;
  calibrationDue: string;
  location: string;
  category: 'Pressure' | 'Temperature' | '';
}

export const assets: Asset[] = [
  {
    assetNumber: "33340",
    serialNumber: "",
    description: "Surface Beaded Wire Probe ISO 17025",
    calibrationDue: "2020-06-29",
    location: "Calibration",
    category: "Temperature"
  },
  {
    assetNumber: "33198",
    serialNumber: "110AFXQL",
    description: "NoShok 15k PT ISO 17025",
    calibrationDue: "",
    location: "Quarantine Bin",
    category: "Pressure"
  },
  {
    assetNumber: "34034",
    serialNumber: "821498",
    description: "Digital Pressure Test Gauge ISO 17025",
    calibrationDue: "2022-10-12",
    location: "",
    category: "Pressure"
  },
  {
    assetNumber: "35051",
    serialNumber: "",
    description: "Type T Thermocouple",
    calibrationDue: "",
    location: "",
    category: "Temperature"
  },
  {
    assetNumber: "PLI2652",
    serialNumber: "OM-121121348-2",
    description: "Thermocouple, K-type, CAL-4 (Omega) ISO 17025",
    calibrationDue: "",
    location: "Calibration",
    category: "Temperature"
  }
];

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
    a.serialNumber.toLowerCase().includes(searchTerm)
  );
}
