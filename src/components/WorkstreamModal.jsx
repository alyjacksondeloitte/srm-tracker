import React, { useState } from 'react';

const SWATCHES = ['#E91E8C','#FF7043','#FFC107','#66BB6A','#26C6DA','#7B68EE','#78909C','#9E9E9E'];

export default function WorkstreamModal({ open, onSave, onClose }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#9E9E9E');

  function handleSave() {
    if (!name.trim()) { alert('Please enter a workstream name.'); return; }
    onSave({ id: 'ws-' + Date.now(), label: name.trim(), color });
    setName(''); setColor('#9E9E9E');
    onClose();
  }

  if (!open) return null;

  return (
    <div className="overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Add Workstream</h2>
        <div className="fg">
          <label>Workstream Name *</label>
          <input className="fi" value={name} placeholder="e.g. Communications"
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()} />
        </div>
        <div className="fg">
          <label>Color</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {SWATCHES.map(c => (
              <div key={c} className={`color-swatch${color === c ? ' selected' : ''}`}
                style={{ background: c }} onClick={() => setColor(c)} />
            ))}
            <input type="color" className="fi" value={color}
              style={{ width: 36, height: 36, padding: 2, cursor: 'pointer' }}
              title="Custom color" onChange={e => setColor(e.target.value)} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={handleSave}>Add Workstream</button>
        </div>
      </div>
    </div>
  );
}
