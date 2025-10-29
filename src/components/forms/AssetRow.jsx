import React from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function AssetRow({ asset, index, onChange, onRemove }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 80px 60px', gap: 8, alignItems: 'center', marginBottom: 8 }}>
      <div style={{ fontWeight: 700 }}>{asset.ticker}</div>
      <div>{asset.name ?? ''}</div>
      <Input type="number" value={Math.round((asset.weight ?? 0) * 100)} onChange={(e) => onChange(index, 'weight', e.target.value)} style={{ width: '70px' }} />
      <Input type="number" step="0.01" value={asset.entry_fee_percent ?? 0} onChange={(e) => onChange(index, 'entry_fee_percent', e.target.value)} style={{ width: '90px' }} />
      <Button onClick={() => onRemove(index)} style={{ background: '#ef5350' }}>X</Button>
    </div>
  );
}