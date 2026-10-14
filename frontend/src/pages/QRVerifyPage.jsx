import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle } from 'lucide-react';

export default function QRVerifyPage() {
  const { qr_code_id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`/api/verify-by-qr/${qr_code_id}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'QR যাচাই ব্যর্থ।');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [qr_code_id]);

  return (
    <div className="dashboard-dark" style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: '520px', width: '100%' }}>
        <div className="glass-card" style={{ padding: '36px 28px', textAlign: 'center' }}>
          {loading && <div className="loader" style={{ margin: '0 auto' }} />}
          {error && (
            <div>
              <XCircle size={48} color="#dc2626" style={{ margin: '0 auto 16px' }} />
              <div style={{ color: '#fca5a5', fontSize: '18px', fontWeight: '700' }}>❌ QR যাচাই ব্যর্থ</div>
              <div style={{ color: '#cbd5e1', fontSize: '14px', marginTop: '8px' }}>{error}</div>
            </div>
          )}
          {data && (
            <div className="animate-fade-in-up">
              <CheckCircle size={48} color="#22c55e" style={{ margin: '0 auto 16px' }} />
              <div style={{ color: '#86efac', fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>✅ খতিয়ান বৈধ ও সত্য প্রমাণিত</div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '24px' }}>QR Code ID: {qr_code_id}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', textAlign: 'left' }}>
                {data.data && Object.entries({
                  'মৌজা': data.data.mouza, 'দাগ নং': data.data.dag_no,
                  'খতিয়ান': data.data.khatian_no, 'মালিক': data.data.owner_name,
                  'জমি': `${data.data.total_area_decimal} শতাংশ`, 'স্ট্যাটাস': data.data.status,
                }).map(([k, v]) => (
                  <div key={k} style={{ padding: '10px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{k}</div>
                    <div style={{ fontSize: '14px', color: '#f1f5f9', fontWeight: '700', marginTop: '2px' }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '18px', padding: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                <strong style={{ color: '#cbd5e1' }}>SHA-256 Hash:</strong> {data.data?.deed_hash}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
