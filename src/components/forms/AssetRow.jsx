import React from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import '../../styles/components.css';

export default function AssetRow({ asset, index, onChange, onRemove }) {
  return (
    <div className="asset-row">
      <div className="asset-left">
        <div className="asset-ticker">{asset.ticker}</div>
        <div className="asset-name muted-small">{asset.name}</div>
      </div>

      <div className="asset-controls">
        <div className="asset-control">
          <label className="small-label">Peso (%)</label>
          <Input type="number" value={Number(asset.weight) * 100} onChange={(e) => onChange(index, 'weight', e.target.value)} />
        </div>
        <div className="asset-control">
          <label className="small-label">Entry Fee (%)</label>
          <Input type="number" value={asset.entry_fee_percent} onChange={(e) => onChange(index, 'entry_fee_percent', e.target.value)} />
        </div>
        <div className="asset-control">
          <label className="small-label">Annual Fee (%)</label>
          <Input type="number" value={asset.annual_fee_percent} onChange={(e) => onChange(index, 'annual_fee_percent', e.target.value)} />
        </div>
        <div className="asset-remove">
          <Button onClick={() => onRemove(index)} variant="danger">X</Button>
        </div>
      </div>
    </div>
  );
}