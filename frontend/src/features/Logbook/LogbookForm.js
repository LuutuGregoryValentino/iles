import React, { useState, useEffect } from 'react';
import { logbooksAPI, placementsAPI } from '../../services/api';

function LogbookForm({ onSubmitted }) {
  const [placements, setPlacements] = useState([]);
  const [form, setForm] = useState({
    placement: '', week_number: '', start_date: '', end_date: '',
    tasks_done: '', hours_worked: '', challenges: '',
    submission_status: 'Submitted',
  });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    placementsAPI.list()
      .then(r => setPlacements(r.data))
      .catch(() => setError('Could not load placements.'));
  }, []);

  const set = field => e => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await logbooksAPI.create({
        ...form,
        week_number:  parseInt(form.week_number),
        hours_worked: parseFloat(form.hours_worked),
      });
      setSuccess('Logbook entry submitted successfully!');
      setTimeout(onSubmitted, 1500);
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Submission failed.');
    } finally {
      setSaving(false);
    }
  };

  const inp = { width:'100%', padding:'8px', marginBottom:'12px', borderRadius:'6px', border:'1px solid #ccc', fontSize:'14px' };
  const lbl = { display:'block', marginBottom:'4px', fontWeight:'500', fontSize:'13px' };

  return (
    <div>
      <h2>Submit Weekly Logbook</h2>
      {error   && <p style={{ color:'red' }}>{error}</p>}
      {success && <p style={{ color:'green' }}>{success}</p>}

      <form onSubmit={handleSubmit} style={{ maxWidth:'560px' }}>
        <label style={lbl}>Placement</label>
        <select style={inp} value={form.placement} onChange={set('placement')} required>
          <option value="">Select your placement</option>
          {placements.map(p => (
            <option key={p.id} value={p.id}>
              {p.organization_name} — {p.position}
            </option>
          ))}
        </select>

        <label style={lbl}>Week Number</label>
        <input style={inp} type="number" min="1" value={form.week_number} onChange={set('week_number')} required />

        <label style={lbl}>Week Start Date</label>
        <input style={inp} type="date" value={form.start_date} onChange={set('start_date')} required />

        <label style={lbl}>Week End Date</label>
        <input style={inp} type="date" value={form.end_date} onChange={set('end_date')} required />

        <label style={lbl}>Tasks Done This Week</label>
        <textarea style={{ ...inp, height:'100px', resize:'vertical' }}
          value={form.tasks_done}
          placeholder="Describe the specific technical tasks you worked on..."
          onChange={set('tasks_done')} required />

        <label style={lbl}>Hours Worked</label>
        <input style={inp} type="number" step="0.5" min="0" max="80"
          value={form.hours_worked} onChange={set('hours_worked')} required />

        <label style={lbl}>Challenges Faced</label>
        <textarea style={{ ...inp, height:'80px', resize:'vertical' }}
          value={form.challenges}
          placeholder="Any challenges? Write 'None' if there were none."
          onChange={set('challenges')} />

        <button type="submit" disabled={saving}
          style={{ padding:'10px 24px', background:'#2E5DA6', color:'#fff', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'14px' }}>
          {saving ? 'Submitting...' : 'Submit Logbook'}
        </button>
      </form>
    </div>
  );
}

export default LogbookForm;
