import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { assets as defaultAssets, type Asset } from '../data/assets';

interface Props {
  onAssetSelect?: (asset: Asset) => void;
}

export function AssetLookup({ onAssetSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assets, setAssets] = useState<Asset[]>(defaultAssets);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search within current assets
  const searchAssets = (searchQuery: string): Asset[] => {
    const searchTerm = searchQuery.trim().toLowerCase();
    if (!searchTerm) return [];

    return assets.filter(a =>
      a.assetNumber.toLowerCase().includes(searchTerm) ||
      a.description.toLowerCase().includes(searchTerm) ||
      a.manufacturer.toLowerCase().includes(searchTerm) ||
      a.model.toLowerCase().includes(searchTerm)
    );
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim().length > 0) {
      setResults(searchAssets(value));
    } else {
      setResults([]);
    }
    setSelectedAsset(null);
  };

  const handleSelect = (asset: Asset) => {
    setSelectedAsset(asset);
    setQuery(asset.assetNumber);
    setResults([]);
    onAssetSelect?.(asset);
  };

  const isOverdue = (dateStr: string) => {
    if (!dateStr) return false;
    const dueDate = new Date(dateStr);
    return dueDate < new Date();
  };

  // Handle Excel file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        // Find header row and column indices
        const headers = jsonData[0]?.map(h => h?.toString().toLowerCase().trim()) || [];

        // Map column names to indices
        const findCol = (keywords: string[]) =>
          headers.findIndex(h => h && keywords.some(k => h.includes(k)));

        const assetIdx = findCol(['asset', 'title']);
        const statusIdx = findCol(['status']);
        const mfgIdx = findCol(['manufacturer', 'maker', 'mfg']);
        const modelIdx = findCol(['model']);
        const descIdx = findCol(['description', 'desc']);
        const rangeIdx = findCol(['range']);
        const rangeLowIdx = headers.findIndex(h => h?.includes('range') && h?.includes('low'));
        const rangeHighIdx = headers.findIndex(h => h?.includes('range') && h?.includes('high'));
        const rangeUnitsIdx = headers.findIndex(h => h?.includes('range') && h?.includes('unit'));
        const accuracyIdx = findCol(['accuracy', 'acc']);
        const calDateIdx = findCol(['check', 'cal', 'date']);
        const deptIdx = findCol(['department', 'dept']);
        const outputHighIdx = headers.findIndex(h => h?.includes('output') && h?.includes('high'));
        const outputLowIdx = headers.findIndex(h => h?.includes('output') && h?.includes('low'));
        const outputUnitsIdx = headers.findIndex(h => h?.includes('output') && h?.includes('unit'));

        // Parse rows into assets
        const newAssets: Asset[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || !row[assetIdx]) continue;

          // Handle date formatting
          let calDate = '';
          const calDateRaw = row[calDateIdx];
          if (calDateRaw) {
            if (typeof calDateRaw === 'number') {
              const date = XLSX.SSF.parse_date_code(calDateRaw);
              calDate = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
            } else {
              calDate = calDateRaw.toString().slice(0, 10);
            }
          }

          newAssets.push({
            assetNumber: row[assetIdx]?.toString() || '',
            status: row[statusIdx]?.toString() || '',
            manufacturer: row[mfgIdx]?.toString() || '',
            model: row[modelIdx]?.toString() || '',
            description: row[descIdx]?.toString() || '',
            range: row[rangeIdx]?.toString() || '',
            rangeLow: row[rangeLowIdx]?.toString() || '',
            rangeHigh: row[rangeHighIdx]?.toString() || '',
            rangeUnits: row[rangeUnitsIdx]?.toString() || '',
            accuracy: row[accuracyIdx]?.toString() || '',
            calDate,
            department: row[deptIdx]?.toString() || '',
            outputHigh: row[outputHighIdx]?.toString() || '',
            outputLow: row[outputLowIdx]?.toString() || '',
            outputUnits: row[outputUnitsIdx]?.toString() || ''
          });
        }

        if (newAssets.length > 0) {
          setAssets(newAssets);
          setUploadStatus(`Loaded ${newAssets.length} assets from ${file.name}`);
          setQuery('');
          setResults([]);
          setSelectedAsset(null);
        } else {
          setUploadStatus('No valid assets found in file');
        }
      } catch (err) {
        setUploadStatus('Error reading file. Make sure it\'s a valid Excel file.');
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('active')) return 'status-active';
    if (s.includes('missing')) return 'status-missing';
    if (s.includes('disposed')) return 'status-disposed';
    return '';
  };

  return (
    <div className="asset-lookup">
      <div className="lookup-header">
        <h3>Asset Lookup</h3>
        <p className="lookup-hint">Type asset number, model, or manufacturer to find equipment</p>
      </div>

      <div className="lookup-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Enter asset number (e.g., 33204)"
          className="lookup-input"
        />
        {results.length > 0 && (
          <div className="lookup-dropdown">
            {results.map((asset, idx) => (
              <div
                key={`${asset.assetNumber}-${idx}`}
                className="lookup-option"
                onClick={() => handleSelect(asset)}
              >
                <span className="option-asset">{asset.assetNumber}</span>
                <span className="option-desc">{asset.manufacturer} {asset.model} - {asset.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedAsset && (
        <div className="asset-info-card">
          <div className="asset-info-header">
            <span className="asset-title">{selectedAsset.assetNumber}</span>
            <span className={`status-badge ${getStatusColor(selectedAsset.status)}`}>
              {selectedAsset.status}
            </span>
          </div>

          <div className="asset-info-row">
            <span className="info-label">Manufacturer:</span>
            <span className="info-value">{selectedAsset.manufacturer}</span>
          </div>
          <div className="asset-info-row">
            <span className="info-label">Model:</span>
            <span className="info-value">{selectedAsset.model}</span>
          </div>
          <div className="asset-info-row">
            <span className="info-label">Description:</span>
            <span className="info-value">{selectedAsset.description}</span>
          </div>

          {selectedAsset.accuracy && (
            <div className="asset-info-row highlight">
              <span className="info-label">Accuracy:</span>
              <span className="info-value accuracy">{selectedAsset.accuracy}</span>
            </div>
          )}

          {(selectedAsset.rangeHigh || selectedAsset.range) && (
            <div className="asset-info-row">
              <span className="info-label">Range:</span>
              <span className="info-value">
                {selectedAsset.rangeLow && `${selectedAsset.rangeLow} to `}
                {selectedAsset.rangeHigh} {selectedAsset.rangeUnits}
                {!selectedAsset.rangeHigh && selectedAsset.range}
              </span>
            </div>
          )}

          {selectedAsset.outputHigh && (
            <div className="asset-info-row">
              <span className="info-label">Output:</span>
              <span className="info-value">
                {selectedAsset.outputLow}-{selectedAsset.outputHigh} {selectedAsset.outputUnits}
              </span>
            </div>
          )}

          {selectedAsset.calDate && (
            <div className="asset-info-row">
              <span className="info-label">Cal Date:</span>
              <span className={`info-value ${isOverdue(selectedAsset.calDate) ? 'overdue' : ''}`}>
                {selectedAsset.calDate}
                {isOverdue(selectedAsset.calDate) && ' (OVERDUE)'}
              </span>
            </div>
          )}

          {selectedAsset.department && (
            <div className="asset-info-row">
              <span className="info-label">Department:</span>
              <span className="info-value">{selectedAsset.department}</span>
            </div>
          )}
        </div>
      )}

      <div className="upload-section">
        <label className="upload-btn">
          Upload Asset List (.xlsx)
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
        {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
        <p className="asset-count">{assets.length} assets loaded</p>
      </div>
    </div>
  );
}
