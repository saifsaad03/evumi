export default function EvumiLoader({
  message = 'ভূমি সেবা এখন আপনার হাতের মুঠোয়',
  subMessage = 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার',
  fullScreen = true
}) {
  return (
    <div
      id="evumi-loader"
      className="evumi-loader-root"
      role="status"
      aria-live="polite"
      aria-label="লোড হচ্ছে..."
      style={fullScreen ? {} : { position: 'relative', minHeight: '320px', inset: 'auto' }}
    >
      <div className="loader" aria-hidden="true">
        <span className="ch" style={{ '--d': '0ms' }}>
          <span><b>e</b><b>e</b></span>
        </span>
        <span className="ch down" style={{ '--d': '120ms' }}>
          <span><b>-</b><b>-</b></span>
        </span>
        <span className="ch gold" style={{ '--d': '240ms' }}>
          <span><b>ভূ</b><b>ভূ</b></span>
        </span>
        <span className="ch gold down" style={{ '--d': '360ms' }}>
          <span><b>মি</b><b>মি</b></span>
        </span>
      </div>
      <div className="rule"><i aria-hidden="true"></i></div>
      <div className="sub">{message}</div>
      <div className="foot">{subMessage}</div>
    </div>
  );
}
