import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './OmniSocialApp.jsx'
import './index.css'

// 定義錯誤邊界元件，用來捕捉並顯示崩潰錯誤
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#dc2626', fontFamily: 'monospace' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>應用程式發生錯誤</h1>
          <p>請截圖此畫面並檢查您的程式碼設定：</p>
          <pre style={{ background: '#fee2e2', padding: '1rem', borderRadius: '0.5rem', overflow: 'auto' }}>
            {this.state.error.toString()}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#4b5563', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
            重新整理頁面
          </button>
        </div>
      );
    }
    return this.props.children; 
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)