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
      a.serialNumber.toLowerCase().includes(searchTerm)
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

        const titleIdx = headers.findIndex(h => h?.includes('title') || h?.includes('asset'));
        const serialIdx = headers.findIndex(h => h?.includes('serial'));
        const descIdx = headers.findIndex(h => h?.includes('description') || h?.includes('desc'));
        const calDueIdx = headers.findIndex(h => h?.includes('calibration') || h?.includes('cal'));
        const locationIdx = headers.findIndex(h => h?.includes('location') || h?.includes('loc'));
        const categoryIdx = headers.findIndex(h => h?.includes('category') || h?.includes('type'));

        // Parse rows into assets
        const newAssets: Asset[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || !row[titleIdx]) continue;

          const calDueRaw = row[calDueIdx];
          let calDue = '';
          if (calDueRaw) {
            // Handle Excel date serial numbers
            if (typeof calDueRaw === 'number') {
              const date = XLSX.SSF.parse_date_code(calDueRaw);
              calDue = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
            } else {
              calDue = calDueRaw.toString().slice(0, 10);
            }
          }

          const categoryRaw = row[categoryIdx]?.toString() || '';
          let category: 'Pressure' | 'Temperature' | '' = '';
          if (categoryRaw.toLowerCase().includes('pressure')) category = 'Pressure';
          else if (categoryRaw.toLowerCase().includes('temp')) category = 'Temperature';

          newAssets.push({
            assetNumber: row[titleIdx]?.toString() || '',
            serialNumber: row[serialIdx]?.toString() || '',
            description: row[descIdx]?.toString() || '',
            calibrationDue: calDue,
            location: row[locationIdx]?.toString() || '',
            category
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

  return (
    <div className="asset-lookup">
      <div className="lookup-header">
        <h3>Asset Lookup</h3>
        <p className="lookup-hint">Type asset number to find equipment info</p>
      </div>

      <div className="lookup-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Enter asset number (e.g., 33198)"
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
                <span className="option-desc">{asset.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedAsset && (
        <div className="asset-info-card">
          <div className="asset-info-row">
            <span className="info-label">Asset #:</span>
            <span className="info-value">{selectedAsset.assetNumber}</span>
          </div>
          {selectedAsset.serialNumber && (
            <div className="asset-info-row">
              <span className="info-label">Serial #:</span>
              <span className="info-value">{selectedAsset.serialNumber}</span>
            </div>
          )}
          <div className="asset-info-row">
            <span className="info-label">Description:</span>
            <span className="info-value">{selectedAsset.description}</span>
          </div>
          {selectedAsset.category && (
            <div className="asset-info-row">
              <span className="info-label">Category:</span>
              <span className={`info-value category-badge ${selectedAsset.category.toLowerCase()}`}>
                {selectedAsset.category}
              </span>
            </div>
          )}
          {selectedAsset.calibrationDue && (
            <div className="asset-info-row">
              <span className="info-label">Cal Due:</span>
              <span className={`info-value ${isOverdue(selectedAsset.calibrationDue) ? 'overdue' : ''}`}>
                {selectedAsset.calibrationDue}
                {isOverdue(selectedAsset.calibrationDue) && ' (OVERDUE)'}
              </span>
            </div>
          )}
          {selectedAsset.location && (
            <div className="asset-info-row">
              <span className="info-label">Location:</span>
              <span className="info-value">{selectedAsset.location}</span>
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
