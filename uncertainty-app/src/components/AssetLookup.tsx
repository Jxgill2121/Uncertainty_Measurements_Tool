import { useState } from 'react';
import { searchAssets, type Asset } from '../data/assets';

interface Props {
  onAssetSelect?: (asset: Asset) => void;
}

export function AssetLookup({ onAssetSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

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
            {results.map((asset) => (
              <div
                key={asset.assetNumber}
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
          <div className="asset-info-row">
            <span className="info-label">Category:</span>
            <span className={`info-value category-badge ${selectedAsset.category.toLowerCase()}`}>
              {selectedAsset.category}
            </span>
          </div>
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
    </div>
  );
}
