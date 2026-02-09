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
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

        if (!jsonData || jsonData.length < 2) {
          setUploadStatus('File appears empty or has no data rows');
          return;
        }

        // Find header row - look for row containing "asset" or similar
        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(5, jsonData.length); i++) {
          const row = jsonData[i];
          if (row && row.some(cell =>
            cell && cell.toString().toLowerCase().includes('asset')
          )) {
            headerRowIdx = i;
            break;
          }
        }

        const headerRow = jsonData[headerRowIdx] || [];
        const headers = headerRow.map(h => h?.toString().toLowerCase().trim() || '');

        // Map column names to indices with flexible matching
        const findCol = (keywords: string[]) =>
          headers.findIndex(h => h && keywords.some(k => h.includes(k)));

        const assetIdx = findCol(['asset', 'title', 'id', 'number']);
        const statusIdx = findCol(['status']);
        const mfgIdx = findCol(['manufacturer', 'maker', 'mfg', 'brand']);
        const modelIdx = findCol(['model', 'part']);
        const descIdx = findCol(['description', 'desc', 'name']);
        const rangeIdx = findCol(['range']);
        const rangeLowIdx = headers.findIndex(h => h?.includes('range') && h?.includes('low'));
        const rangeHighIdx = headers.findIndex(h => h?.includes('range') && h?.includes('high'));
        const rangeUnitsIdx = headers.findIndex(h => h?.includes('range') && h?.includes('unit'));
        const accuracyIdx = findCol(['accuracy', 'acc', 'tolerance']);
        const calDateIdx = findCol(['check', 'cal', 'date']);
        const deptIdx = findCol(['department', 'dept', 'location']);
        const outputHighIdx = headers.findIndex(h => h?.includes('output') && h?.includes('high'));
        const outputLowIdx = headers.findIndex(h => h?.includes('output') && h?.includes('low'));
        const outputUnitsIdx = headers.findIndex(h => h?.includes('output') && h?.includes('unit'));

        // Debug: log what we found
        console.log('Headers found:', headers);
        console.log('Asset column index:', assetIdx);
        console.log('Total rows:', jsonData.length);

        if (assetIdx === -1) {
          setUploadStatus(`Could not find asset column. Headers found: ${headers.slice(0, 5).join(', ')}...`);
          return;
        }

        // Parse rows into assets (start after header row)
        const newAssets: Asset[] = [];
        for (let i = headerRowIdx + 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row) continue;

          // Get asset value - handle numbers and strings
          const assetValue = row[assetIdx];
          if (assetValue === undefined || assetValue === null || assetValue === '') continue;

          // Handle date formatting
          let calDate = '';
          const calDateRaw = calDateIdx >= 0 ? row[calDateIdx] : undefined;
          if (calDateRaw) {
            if (typeof calDateRaw === 'number') {
              try {
                const date = XLSX.SSF.parse_date_code(calDateRaw);
                calDate = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
              } catch {
                calDate = calDateRaw.toString();
              }
            } else {
              calDate = calDateRaw.toString().slice(0, 10);
            }
          }

          const getCell = (idx: number) => idx >= 0 && row[idx] !== undefined ? row[idx]?.toString() || '' : '';

          newAssets.push({
            assetNumber: assetValue.toString(),
            status: getCell(statusIdx),
            manufacturer: getCell(mfgIdx),
            model: getCell(modelIdx),
            description: getCell(descIdx),
            range: getCell(rangeIdx),
            rangeLow: getCell(rangeLowIdx),
            rangeHigh: getCell(rangeHighIdx),
            rangeUnits: getCell(rangeUnitsIdx),
            accuracy: getCell(accuracyIdx),
            calDate,
            department: getCell(deptIdx),
            outputHigh: getCell(outputHighIdx),
            outputLow: getCell(outputLowIdx),
            outputUnits: getCell(outputUnitsIdx)
          });
        }

        if (newAssets.length > 0) {
          setAssets(newAssets);
          setUploadStatus(`Loaded ${newAssets.length} assets from ${file.name}`);
          setQuery('');
          setResults([]);
          setSelectedAsset(null);
        } else {
          setUploadStatus(`No valid assets found. Found ${jsonData.length} rows but no asset data.`);
        }
      } catch (err) {
        setUploadStatus('Error reading file. Make sure it\'s a valid Excel file.');
        console.error('Excel parse error:', err);
      }
    };
    reader.readAsArrayBuffer(file);

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
