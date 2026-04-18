import React, { useState, useEffect } from 'react';
import { logbooksAPI } from '../../services/api';

function SupervisorReview({ currentUser }) {
  const [logbooks, setLogbooks]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [updating, setUpdating]   = useState(null);
  const [success, setSuccess]     = useState('');
  const [filter, setFilter]       = useState('Submitted');

  useEffect(() => {
    logbooksAPI.list()
      .then(r => setLogbooks(r.data))
      .catch(() => setError('Failed to load logbooks.'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, newStatus) => {
    setUpdating(id);
    setSuccess('');
    setError('');
    try {
      await logbooksAPI.updateStatus(id, { submission_status: newStatus });
      setLogbooks(prev => prev.map(lb =>
        lb.id === id ? { ...lb, submission_status: newStatus } : lb
      ));
      setSuccess(`Logbook ${newStatus.toLowerCase()} successfully.`);
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to update logbook.');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = logbooks.filter(lb =>
    filter === 'All' ? true : lb.submission_status === filter
  );

  const statusColor = (s) => {
    if (s === 'Approved')  return { background:'#d4edda', color:'#155724' };
    if (s === 'Submitted') return { background:'#fff3cd', color:'#856404' };
    return { background:'#f8d7da', color:'#721c24' };
  };

  const btnStyle = (color) => ({
    padding:'5px 14px', border:'none', borderRadius:'4px',
    cursor:'pointer', fontSize:'12px', fontWeight:'500',
    background: color, color:'#fff', marginRight:'6px'
  });

  return (
    <div>
      <h2 style={{ marginBottom:'6px' }}>Logbook Review</h2>
      <p style={{ color:'#666', fontSize:'14px', marginBottom:'20px' }}>
        Review and approve student logbook submissions.
      </p>

      {error   && <p style={{ color:'red',   background:'#ffeaea', padding:'10px', borderRadius:'6px', marginBottom:'12px' }}>{error}</p>}
      {success && <p style={{ color:'green', background:'#eaffea', padding:'10px', borderRadius:'6px', marginBottom:'12px' }}>{success}</p>}

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'20px' }}>
        {['All', 'Submitted', 'Approved', 'Draft'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'6px 16px', borderRadius:'20px', border:'1px solid #ccc',
            background: filter === f ? '#2E5DA6' : '#fff',
            color: filter === f ? '#fff' : '#333',
            cursor:'pointer', fontSize:'13px'
          }}>
            {f} ({f === 'All' ? logbooks.length : logbooks.filter(lb => lb.submission_status === f).length})
          </button>
        ))}
      </div>

      {loading && <p>Loading logbooks...</p>}

      {!loading && filtered.length === 0 && (
        <p style={{ color:'#888', textAlign:'center', padding:'40px' }}>
          No {filter === 'All' ? '' : filter.toLowerCase()} logbooks found.
        </p>
      )}

      {!loading && filtered.map(lb => (
        <div key={lb.id} style={{
          background:'#fff', border:'1px solid #e0e0e0', borderRadius:'8px',
          padding:'16px 20px', marginBottom:'12px',
          borderLeft:`4px solid ${lb.submission_status === 'Approved' ? '#28a745' : lb.submission_status === 'Submitted' ? '#ffc107' : '#dc3545'}`
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
            <div>
              <h4 style={{ margin:0, fontSize:'15px' }}>Week {lb.week_number}</h4>
              <span style={{ fontSize:'12px', color:'#888' }}>
                {lb.start_date} → {lb.end_date} &nbsp;|&nbsp; {lb.hours_worked} hours worked
              </span>
            </div>
            <span style={{ ...statusColor(lb.submission_status), padding:'3px 10px', borderRadius:'12px', fontSize:'12px', fontWeight:'500' }}>
              {lb.submission_status}
            </span>
          </div>

          <p style={{ margin:'0 0 8px', fontSize:'13px', color:'#444' }}>
            <strong>Tasks: </strong>{lb.tasks_done}
          </p>

          {lb.challenges && lb.challenges !== 'None' && (
            <p style={{ margin:'0 0 12px', fontSize:'13px', color:'#666' }}>
              <strong>Challenges: </strong>{lb.challenges}
            </p>
          )}

          {/* Action buttons — only show if Submitted */}
          {lb.submission_status === 'Submitted' && (
            <div style={{ marginTop:'12px', paddingTop:'12px', borderTop:'1px solid #f0f0f0' }}>
              <button
                onClick={() => updateStatus(lb.id, 'Approved')}
                disabled={updating === lb.id}
                style={btnStyle('#28a745')}>
                {updating === lb.id ? 'Updating...' : 'Approve'}
              </button>
              <button
                onClick={() => updateStatus(lb.id, 'Draft')}
                disabled={updating === lb.id}
                style={btnStyle('#dc3545')}>
                Send Back to Draft
              </button>
            </div>
          )}

          {lb.submission_status === 'Approved' && (
            <p style={{ margin:'12px 0 0', fontSize:'12px', color:'#28a745' }}>
              Approved — this logbook is locked and cannot be edited.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default SupervisorReview;