// Asset Database - Equipment inventory with asset numbers
// This file is auto-generated from the asset tracking spreadsheet

export interface Asset {
  assetNumber: string;
  status: string;
  manufacturer: string;
  model: string;
  description: string;
  range: string;
  rangeLow: string;
  rangeHigh: string;
  rangeUnits: string;
  accuracy: string;
  calDate: string;
  department: string;
  outputHigh: string;
  outputLow: string;
  outputUnits: string;
}

// Default assets from "New Look up File.xlsx"
export const assets: Asset[] = [
  {
    assetNumber: "33580",
    status: "Active",
    manufacturer: "Azbil",
    model: "CMS2000BTSH200100",
    description: "Low Pressure Mass Flowmeter",
    range: "0.6-3 (±0.1)g/s",
    rangeLow: "",
    rangeHigh: "3",
    rangeUnits: "g/s",
    accuracy: "±5%OR ±1%FS",
    calDate: "2022-06-13",
    department: "High Pressure Testing",
    outputHigh: "20",
    outputLow: "4",
    outputUnits: "mA"
  },
  {
    assetNumber: "33568",
    status: "Active",
    manufacturer: "Omega",
    model: "TMQSS-125U-12",
    description: "12\" T Type Thermocouple ISO 17025",
    range: "-50°C to 140°C",
    rangeLow: "-200",
    rangeHigh: "200",
    rangeUnits: "°C",
    accuracy: "±0.5°C",
    calDate: "2025-09-10",
    department: "High Pressure Testing",
    outputHigh: "200",
    outputLow: "-200",
    outputUnits: "°C"
  },
  {
    assetNumber: "1572",
    status: "Missing",
    manufacturer: "Stellar",
    model: "GT1600-15000G-225",
    description: "Pressure Transducer 0-15000PSIG",
    range: "15,000psi",
    rangeLow: "",
    rangeHigh: "15000",
    rangeUnits: "psi",
    accuracy: "± 0.10% FSO",
    calDate: "2017-09-14",
    department: "Advanced Transportation",
    outputHigh: "4.9",
    outputLow: "0.1",
    outputUnits: "V"
  },
  {
    assetNumber: "33204",
    status: "Active",
    manufacturer: "NoShok",
    model: "623",
    description: "NoShok 4-20mA Pressure Transducer",
    range: "15,000psi",
    rangeLow: "",
    rangeHigh: "15000",
    rangeUnits: "psi",
    accuracy: "± 0.25% FSO",
    calDate: "2026-01-29",
    department: "High Pressure Testing",
    outputHigh: "20",
    outputLow: "4",
    outputUnits: "mA"
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
    a.manufacturer.toLowerCase().includes(searchTerm) ||
    a.model.toLowerCase().includes(searchTerm)
  );
}
