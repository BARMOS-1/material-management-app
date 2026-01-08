import React, { useState } from 'react';
import { Page, Toolbar, Card, Button, List, ListItem, Icon, Tabbar, Tab, Dialog, ProgressCircular, ListHeader } from 'react-onsenui';
import 'onsenui/css/onsenui.css';
import 'onsenui/css/onsen-css-components.css';

// --- 素材のインポート ---
import manualVideo from './assets/manual_op.mp4';

const styles = `
  .page-container { max-width: 1200px; margin: 0 auto; padding-bottom: 50px; }
  .material-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; padding: 10px; }
  .item-card { margin: 0 !important; cursor: pointer; text-align: center; border-radius: 12px; overflow: hidden; }
  
  /* モーダル共通 */
  .ons-dialog { border-radius: 12px !important; overflow: hidden; }
  .menu-btn { margin-bottom: 12px !important; height: 50px; font-size: 16px; }

  /* メディア表示オーバーレイ（最重要：横向き対応） */
  .full-overlay { 
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; 
    background: #000; z-index: 10001; display: flex; flex-direction: column; 
    overflow: hidden; 
  }
  .media-box { 
    flex: 1; width: 100%; display: flex; align-items: center; justify-content: center; 
    background: #000; overflow: hidden; 
  }
  .footer-bar { 
    height: 90px; background: #222; display: flex; align-items: center; 
    justify-content: center; padding: 0 15px; flex-shrink: 0; /* 高さを死守 */
  }
  .physical-back-btn { 
    width: 100%; max-width: 500px; height: 60px; background: #ff9800; color: white; 
    font-size: 18px; font-weight: bold; border: none; border-radius: 10px; 
    box-shadow: 0 4px 0 #e68a00;
  }
  .physical-back-btn:active { transform: translateY(2px); box-shadow: 0 2px 0 #e68a00; }

  /* 横向き画面での微調整 */
  @media (orientation: landscape) {
    .footer-bar { height: 65px; }
    .physical-back-btn { height: 45px; font-size: 16px; }
    video, iframe { max-height: 100%; }
  }

  /* 計算機デザイン */
  .calc-btn { height: 50px; font-size: 18px; background-color: #666; }
`;

const MATERIALS = [
  { id: 1, name: '支柱', img: 'https://placehold.jp/24/333333/ffffff/150x100.png?text=支柱', pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  { id: 2, name: '手すり', img: 'https://placehold.jp/24/666666/ffffff/150x100.png?text=手すり', pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  { id: 3, name: '先行手すり', img: 'https://placehold.jp/24/999999/ffffff/150x100.png?text=先行', pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  { id: 4, name: 'Sウォーク', img: 'https://placehold.jp/24/0044cc/ffffff/150x100.png?text=Sウォーク', pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
];

const GAS_URL = "https://script.google.com/macros/s/AKfycbzKVWHXiTdqR30nQQy3V17A6KtzLYjFZj75G_jtliZqvSiOCkh5bk_h2A9rCPX-1ZWsvg/exec";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [inputPass, setInputPass] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [cart, setCart] = useState([]); 
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // モーダル管理
  const [showChoiceDialog, setShowChoiceDialog] = useState(false);
  const [showCalcDialog, setShowCalcDialog] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [calcDisplay, setCalcDisplay] = useState(''); 
  const [editingIndex, setEditingIndex] = useState(null);

  // --- GAS連携ロジック ---
  const handleLogin = async () => {
    if (!inputPass) return;
    setLoading(true);
    try {
      const response = await fetch(GAS_URL, { method: "POST", body: JSON.stringify({ auth: inputPass, mode: "login" }) });
      const data = await response.json();
      if (data.result === "success") { setAuthToken(inputPass); setIsLoggedIn(true); fetchHistory(inputPass); }
      else { alert("パスワードが違います"); }
    } catch (e) { alert("通信エラー"); } finally { setLoading(false); }
  };

  const fetchHistory = async (token) => {
    try {
      const response = await fetch(GAS_URL, { method: "POST", body: JSON.stringify({ auth: token, mode: "history" }) });
      const data = await response.json();
      if (Array.isArray(data)) {
        const summary = data.reduce((acc, obj) => {
          const dateKey = obj.date.split(' ')[0];
          if (!acc[dateKey]) acc[dateKey] = {};
          const itemKey = `${obj.name}-${obj.type}`;
          if (!acc[dateKey][itemKey]) acc[dateKey][itemKey] = { ...obj };
          else acc[dateKey][itemKey].count += Number(obj.count);
          return acc;
        }, {});
        setHistory(summary);
      }
    } catch (e) { console.error(e); }
  };

  const sendOrder = async () => {
    setIsSending(true);
    try {
      await fetch(GAS_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ auth: authToken, items: cart.map(i => ({name: i.name, count: i.count, type: i.type})) }) });
      alert("送信完了しました"); setCart([]); setTimeout(() => fetchHistory(authToken), 3000);
    } catch (e) { alert("送信エラー"); } finally { setIsSending(false); }
  };

  // --- 操作ロジック ---
  const addToCart = (type) => {
    const count = parseInt(calcDisplay) || 0;
    if (count <= 0) return alert("数量を正しく入力してください");
    if (editingIndex !== null) {
      const newCart = [...cart];
      newCart[editingIndex] = { ...selectedItem, count, type };
      setCart(newCart);
    } else {
      setCart([...cart, { ...selectedItem, count, type }]);
    }
    closeAll();
  };

  const closeAll = () => {
    setShowChoiceDialog(false); setShowCalcDialog(false); setShowVideo(false); setShowPdf(false);
    setSelectedItem(null); setCalcDisplay(''); setEditingIndex(null);
  };

  const getTypeColor = (type) => {
    const colors = { '通常': '#555', 'ケレン': '#FF9800', '修理': '#f44336', '完全': '#4CAF50' };
    return colors[type] || '#000';
  };

  if (!isLoggedIn) {
    return (
      <Page>
        <style>{styles}</style>
        <div style={{ padding: '80px 20px', textAlign: 'center' }}>
          <Icon icon="md-lock" style={{ fontSize: '50px', color: '#00629d' }} />
          <h3>資材管理システム</h3>
          <input type="password" placeholder="パスワード入力" value={inputPass} onChange={e => setInputPass(e.target.value)} 
                 style={{ width: '80%', padding: '15px', fontSize: '20px', margin: '20px 0', textAlign: 'center', border: '1px solid #ccc', borderRadius: '8px' }} />
          <Button modifier="large" onClick={handleLogin}>{loading ? <ProgressCircular indeterminate /> : "ログイン"}</Button>
        </div>
      </Page>
    );
  }

  return (
    <Page renderToolbar={() => <Toolbar><div className="center">資材管理・整備</div></Toolbar>}>
      <style>{styles}</style>
      <Tabbar position='bottom' renderTabs={() => [
        { content: (
          <Page>
            <div className="material-grid">
              {MATERIALS.map(item => (
                <Card key={item.id} className="item-card" onClick={() => { setSelectedItem(item); setShowChoiceDialog(true); }}>
                  <img src={item.img} alt={item.name} style={{ width: '100%', aspectRatio: '3/2', objectFit: 'cover' }} />
                  <div style={{ fontWeight: 'bold', padding: '10px' }}>{item.name}</div>
                </Card>
              ))}
            </div>
          </Page>
        ), tab: <Tab label="資材" icon="md-apps" /> },
        { content: (
          <Page>
            <ListHeader>送信待ち</ListHeader>
            <List>
              {cart.map((c, i) => (
                <ListItem key={i} onClick={() => { setSelectedItem(c); setEditingIndex(i); setCalcDisplay(c.count.toString()); setShowCalcDialog(true); }} tappable>
                  <div className="center"><b>{c.name}</b> <small style={{backgroundColor: getTypeColor(c.type), color: '#fff', padding: '2px 8px', borderRadius: '10px', marginLeft: '5px', fontSize: '10px'}}>{c.type}</small></div>
                  <div className="right" style={{color: '#0044cc', fontWeight: 'bold'}}>{c.count}</div>
                </ListItem>
              ))}
            </List>
            <div style={{padding: '20px'}}><Button modifier="large" onClick={sendOrder} disabled={cart.length === 0}>{isSending ? <ProgressCircular indeterminate /> : `サーバーへ送信 (${cart.length})`}</Button></div>
          </Page>
        ), tab: <Tab label="送信" icon="md-upload" badge={cart.length > 0 ? cart.length : null} /> },
        { content: (
          <Page>
            {Object.keys(history).length === 0 ? <div style={{padding: '20px', textAlign: 'center', color: '#888'}}>履歴がありません</div> :
              Object.keys(history).sort().reverse().map(date => (
                <div key={date}>
                  <ListHeader style={{backgroundColor: '#00629d', color: '#fff'}}>{date}</ListHeader>
                  <List>{Object.values(history[date]).map((h, i) => (
                    <ListItem key={i}><div className="center">{h.name} <small style={{marginLeft: '5px'}}>({h.type})</small></div><div className="right">{h.count}</div></ListItem>
                  ))}</List>
                </div>
              ))
            }
          </Page>
        ), tab: <Tab label="履歴" icon="md-time" /> }
      ]} />

      {/* 3区分選択ダイアログ */}
      <Dialog isOpen={showChoiceDialog} onCancel={closeAll} cancelable>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h3 style={{marginTop: 0}}>{selectedItem?.name}</h3>
          <Button modifier="large" className="menu-btn" onClick={() => { setShowChoiceDialog(false); setShowVideo(true); }}>
            <Icon icon="md-videocam" /> 手順動画を見る
          </Button>
          <Button modifier="large" className="menu-btn" onClick={() => { setShowChoiceDialog(false); setShowPdf(true); }}>
            <Icon icon="md-file-text" /> マニュアル(PDF)
          </Button>
          <Button modifier="large" className="menu-btn" style={{backgroundColor: '#00629d'}} onClick={() => { setShowChoiceDialog(false); setShowCalcDialog(true); }}>
            <Icon icon="md-edit" /> 整備完了・数量入力
          </Button>
          <Button modifier="quiet" onClick={closeAll}>キャンセル</Button>
        </div>
      </Dialog>

      {/* 電卓ダイアログ */}
      <Dialog isOpen={showCalcDialog} onCancel={closeAll} cancelable>
        <div style={{ padding: '15px', textAlign: 'center' }}>
          <h3 style={{margin: '0 0 10px 0'}}>{selectedItem?.name}</h3>
          <div style={{ background: '#eee', padding: '10px', fontSize: '28px', textAlign: 'right', borderRadius: '5px', fontWeight: 'bold' }}>{calcDisplay || '0'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginTop: '10px' }}>
            {['7','8','9','+','4','5','6','-','1','2','3','*','C','0','=','/'].map(b => (
              <Button key={b} className="calc-btn" onClick={() => {
                if (b === 'C') setCalcDisplay('');
                else if (b === '=') { try { setCalcDisplay(eval(calcDisplay).toString()); } catch { setCalcDisplay('Error'); } }
                else setCalcDisplay(prev => prev + b);
              }}>{b}</Button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '15px' }}>
            {['通常', 'ケレン', '修理', '完全'].map(t => <Button key={t} onClick={() => addToCart(t)} style={{backgroundColor: getTypeColor(t)}}>{t}保存</Button>)}
          </div>
        </div>
      </Dialog>

      {/* フル画面動画（横向き対応） */}
      {showVideo && (
        <div className="full-overlay">
          <div className="media-box">
            <video src={manualVideo} controls autoPlay playsInline style={{maxWidth:'100%', maxHeight:'100%'}} />
          </div>
          <div className="footer-bar">
            <button className="physical-back-btn" onClick={() => { setShowVideo(false); setShowChoiceDialog(true); }}>
              ← メニューに戻る
            </button>
          </div>
        </div>
      )}

      {/* フル画面PDF（横向き対応） */}
      {showPdf && (
        <div className="full-overlay">
          <div className="media-box" style={{background:'#fff'}}>
            <iframe src={selectedItem?.pdfUrl} style={{width:'100%', height:'100%', border:'none'}} title="manual-pdf" />
          </div>
          <div className="footer-bar">
            <button className="physical-back-btn" onClick={() => { setShowPdf(false); setShowChoiceDialog(true); }}>
              ← メニューに戻る
            </button>
          </div>
        </div>
      )}
    </Page>
  );
}

export default App;