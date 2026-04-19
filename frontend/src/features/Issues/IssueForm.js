import React, { useState } from 'react';
import { issuesAPI } from '../../services/api';

function IssueForm({ onSubmitted }) {
  const [form, setForm] = useState({ title: '', description: '' });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const set = field => e => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await issuesAPI.create(form);
      setSuccess('Issue reported successfully! An administrator will review it shortly.');
      setForm({ title: '', description: '' });
      setTimeout(onSubmitted, 2000);
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to submit issue.');
    } finally {
      setSaving(false);
    }
  };

  const inp = { width:'100%', padding:'10px', marginBottom:'14px', borderRadius:'6px', border:'1px solid #ccc', fontSize:'14px', boxSizing:'border-box' };
  const lbl = { display:'block', marginBottom:'6px', fontWeight:'500', fontSize:'13px', color:'#333' };

  return (
    <div>
      <h2 style={{ marginBottom:'6px' }}>Report an Issue</h2>
      <p style={{ color:'#666', fontSize:'14px', marginBottom:'24px' }}>
        Experiencing a problem during your internship? Report it here and an administrator will follow up.
      </p>

      {error   && <p style={{ color:'red',   background:'#ffeaea', padding:'10px', borderRadius:'6px', marginBottom:'16px' }}>{error}</p>}
      {success && <p style={{ color:'green', background:'#eaffea', padding:'10px', borderRadius:'6px', marginBottom:'16px' }}>{success}</p>}

      <form onSubmit={handleSubmit} style={{ maxWidth:'560px' }}>
        <label style={lbl}>Issue Title</label>
        <input style={inp} type="text"
          value={form.title}
          placeholder="Briefly describe the problem"
          onChange={set('title')} required />

        <label style={lbl}>Full Description</label>
        <textarea style={{ ...inp, height:'140px', resize:'vertical' }}
          value={form.description}
          placeholder="Explain the issue in detail — what happened, when it happened, and who is involved..."
          onChange={set('description')} required />

        <button type="submit" disabled={saving} style={{
          padding:'10px 28px', background:'#993C1D', color:'#fff',
          border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'14px', fontWeight:'500'
        }}>
          {saving ? 'Submitting...' : 'Submit Issue'}
        </button>

        <button type="button" onClick={onSubmitted} style={{
          padding:'10px 20px', background:'transparent', color:'#666',
          border:'1px solid #ccc', borderRadius:'6px', cursor:'pointer',
          fontSize:'14px', marginLeft:'12px'
        }}>
          Cancel
        </button>
      </form>
    </div>
  );
}

export default IssueForm;