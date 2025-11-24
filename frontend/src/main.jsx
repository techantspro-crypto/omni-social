import React from 'react'
import ReactDOM from 'react-dom/client'
// [修正] 修正回相對路徑，因為 main.jsx 和 OmniSocialApp.jsx 是同一個資料夾的檔案
import App from './OmniSocialApp.jsx' 
import './index.css'

// 錯誤邊界：當程式崩潰時顯示錯誤訊息，而不是白畫面
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
        <div style={{ padding: '2rem', color: '#dc2626', fontFamily: 'monospace', background: '#fff0f0', height: '100vh' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>應用程式發生錯誤</h1>
          <p>請截圖此畫面並檢查程式碼：</p>
          <pre style={{ background: '#fff', padding: '1rem', borderRadius: '0.5rem', overflow: 'auto', border: '1px solid #fca5a5' }}>
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