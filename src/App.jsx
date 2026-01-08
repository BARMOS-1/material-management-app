import React, { useState } from 'react';
import { Page, Toolbar, Card, Button, List, ListItem, Icon, Tabbar, Tab, Dialog, ProgressCircular, ListHeader } from 'react-onsenui';
import 'onsenui/css/onsenui.css';
import 'onsenui/css/onsen-css-components.css';
// ビデオファイルをインポート
import manualVideo from './assets/manual_op.mp4'; 
import manualPdf from './assets/manual_doc.pdf'; // PDFをインポート

const styles = `
  .page-container { max-width: 1200px; margin: 0 auto; padding-bottom: 50px; }
  .material-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; padding: 10px; }
  @media (min-width: 600px) { .material-grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; padding: 20px; } }
  .item-card { margin: 0 !important; cursor: pointer; transition: transform 0.2s; text-align: center; border-radius: 12px; overflow: hidden; background: #fff; }
  .ons-dialog { max-width: 400px !important; width: 90% !important; border-radius: 12px !important; overflow: hidden; }
  .send-button-container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .video-fullscreen-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #000; z-index: 10000; display: flex; flex-direction: column; }
  .fullscreen-video { width: 100%; height: 100%; object-fit: contain; }
  .video-close-btn { position: absolute; top: env(safe-area-inset-top, 20px); right: 20px; background: rgba(0,0,0,0.5); color: white; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 10001; border: none; outline: none; }
  .video-footer { position: absolute; bottom: 0; width: 100%; padding: 20px; background: linear-gradient(transparent, rgba(0,0,0,0.8)); text-align: center; z-index: 10001; }
`;



const MATERIALS = [
  { id: 1, name: '支柱', img: 'https://placehold.jp/24/333333/ffffff/150x100.png?text=支柱', videoUrl: manualVideo },
  { id: 2, name: '手すり', img: 'https://placehold.jp/24/666666/ffffff/150x100.png?text=手すり', videoUrl: manualVideo },
  { id: 3, name: '先行手すり', img: 'https://placehold.jp/24/999999/ffffff/150x100.png?text=先行手すり', videoUrl: manualVideo },
  { id: 4, name: 'Sウォーク', img: 'https://placehold.jp/24/0044cc/ffffff/150x100.png?text=Sウォーク', videoUrl: manualVideo },
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
  const [showDialog, setShowDialog] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [calcDisplay, setCalcDisplay] = useState(''); 
  const [editingIndex, setEditingIndex] = useState(null);

  const handleLogin = async () => {
    if (!inputPass) { alert("パスワードを入力してください"); return; }
    setLoading(true);
    try {
      const response = await fetch(GAS_URL, {
        method: "POST", mode: "cors", 
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ auth: inputPass, mode: "login" })
      });
      const data = await response.json();
      if (data.result === "success") {
        setAuthToken(inputPass);
        setIsLoggedIn(true);
        fetchHistoryByPost(inputPass);
      } else {
        alert("認証エラー");
        setInputPass("");
      }
    } catch (e) { alert("通信エラー"); } finally { setLoading(false); }
  };

  const fetchHistoryByPost = async (token = authToken) => {
    if (!token || loading) return;
    setLoading(true);
    try {
      const response = await fetch(GAS_URL, {
        method: "POST", mode: "cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ auth: token, mode: "history" })
      });
      const data = await response.json();
      if (Array.isArray(data)) processHistoryData(data);
    } catch (e) { console.error("履歴取得エラー", e); } finally { setLoading(false); }
  };

  const processHistoryData = (data) => {
    const summary = data.reduce((acc, obj) => {
      if (!obj.date) return acc;
      const dateKey = obj.date.split(' ')[0];
      const itemKey = `${obj.name}-${obj.type}`;
      if (!acc[dateKey]) acc[dateKey] = {};
      if (!acc[dateKey][itemKey]) acc[dateKey][itemKey] = { ...obj };
      else acc[dateKey][itemKey].count = Number(acc[dateKey][itemKey].count) + Number(obj.count);
      return acc;
    }, {});
    setHistory(summary);
  };

  const sendOrder = async () => {
    if (cart.length === 0 || isSending) return;
    setIsSending(true);
    try {
      const cleanItems = cart.map(item => ({ name: item.name, count: Number(item.count), type: item.type }));
      await fetch(GAS_URL, {
        method: "POST", mode: "no-cors", 
        body: JSON.stringify({ auth: authToken, items: cleanItems })
      });
      alert("送信完了！");
      setCart([]);
      setTimeout(() => fetchHistoryByPost(authToken), 3000); 
    } catch (e) { alert("送信エラー"); } finally { setIsSending(false); }
  };

  const handleCalcBtn = (val) => {
    if (val === 'C') return setCalcDisplay('');
    if (val === '=') {
      try { if (calcDisplay) setCalcDisplay(new Function(`return ${calcDisplay}`)().toString()); } 
      catch (e) { setCalcDisplay('Error'); }
      return;
    }
    setCalcDisplay(prev => prev + val);
  };

  const addToCart = (type) => {
    const finalCount = parseInt(calcDisplay) || 0;
    if (finalCount === 0) return alert("数量を入力してください");
    if (editingIndex !== null) {
      const newCart = [...cart];
      newCart[editingIndex] = { ...selectedItem, count: finalCount, type: type };
      setCart(newCart);
    } else {
      setCart([...cart, { ...selectedItem, count: finalCount, type: type }]);
    }
    closeAll();
  };

  const closeAll = () => { 
    setShowDialog(false); 
    setShowVideo(false); 
    setSelectedItem(null); 
    setCalcDisplay(''); 
    setEditingIndex(null); 
  };

  const getTypeColor = (type) => {
    const colors = { '通常': '#555', 'ケレン': '#FF9800', '修理': '#f44336', '完全': '#4CAF50' };
    return colors[type] || '#000';
  };

  if (!isLoggedIn) {
    return (
      <Page renderToolbar={() => <Toolbar><div className="center">ログイン</div></Toolbar>}>
        <style>{styles}</style>
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Icon icon="md-lock" style={{ fontSize: '50px', color: '#00629d', marginBottom: '20px' }} />
          <h3>資材管理・整備システム</h3>
          <input type="password" placeholder="パスワード" value={inputPass} onChange={(e) => setInputPass(e.target.value)} style={{ width: '100%', padding: '15px', fontSize: '20px', marginBottom: '15px', textAlign: 'center', border:'1px solid #ccc', borderRadius:'8px' }} />
          <Button modifier="large" onClick={handleLogin} disabled={loading}>{loading ? <ProgressCircular indeterminate /> : "ログイン"}</Button>
        </div>
      </Page>
    );
  }

  return (
    <Page renderToolbar={() => (
      <Toolbar>
        <div className="center">資材管理・整備</div>
        <div className="right">
          <Button modifier="quiet" onClick={() => { setIsLoggedIn(false); setAuthToken(''); setInputPass(''); }}><Icon icon="md-sign-out" style={{color:'white'}} /></Button>
        </div>
      </Toolbar>
    )}>
      <style>{styles}</style>
      <Tabbar
        position='bottom'
        renderTabs={() => [
          { content: (
            <Page key="tab-video">
              <div className="page-container">
                <div style={{padding:'10px', color:'#666', fontSize:'13px'}}><Icon icon="md-info" /> 資材タップで整備動画が再生されます</div>
                <div className="material-grid">
                  {MATERIALS.map(item => (
                    <Card key={item.id} className="item-card" onClick={() => { setSelectedItem(item); setShowVideo(true); }}>
                      <img src={item.img} alt={item.name} style={{ width: '100%', aspectRatio: '3/2', objectFit: 'cover' }} />
                      <div style={{ fontWeight: 'bold', padding: '10px' }}>{item.name}</div>
                    </Card>
                  ))}
                </div>
              </div>
            </Page>
          ), tab: <Tab label="整備動画" icon="md-play-circle-outline" key="t1" /> },
          { content: (
            <Page key="tab-cart">
              <div className="page-container" style={{ maxWidth: '800px' }}>
                <ListHeader>送信待ちリスト</ListHeader>
                <List>
                  {cart.map((c, i) => (
                    <ListItem key={`cart-${i}`} onClick={() => { setSelectedItem(c); setEditingIndex(i); setCalcDisplay(c.count.toString()); setShowDialog(true); }} tappable>
                      <div className="center">
                        <span style={{ fontWeight: 'bold' }}>{c.name}</span>
                        <span style={{ marginLeft: '10px', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: getTypeColor(c.type), color: 'white' }}>{c.type}</span>
                      </div>
                      <div className="right" style={{ color: '#0044cc', fontSize: '1.2rem', fontWeight: 'bold' }}>{c.count}</div>
                    </ListItem>
                  ))}
                </List>
                <div className="send-button-container">
                  <Button modifier="large" onClick={sendOrder} disabled={cart.length === 0 || isSending}>
                    {isSending ? <ProgressCircular indeterminate /> : `送信 (${cart.length})`}
                  </Button>
                </div>
              </div>
            </Page>
          ), tab: <Tab label="送信待" icon="md-format-list-bulleted" key="t2" badge={cart.length > 0 ? cart.length : null} /> },
          { content: (
            <Page key="tab-history">
              <div className="page-container" style={{ maxWidth: '800px' }}>
                <div style={{ textAlign: 'center', padding: '15px' }}>
                  <Button onClick={() => fetchHistoryByPost()} modifier="outline" disabled={loading}>{loading ? <ProgressCircular indeterminate /> : <><Icon icon="md-refresh" /> 更新</>}</Button>
                </div>
                {Object.keys(history).map(date => (
                  <div key={`group-${date}`}>
                    <ListHeader style={{backgroundColor: '#00629d', color: 'white'}}>{date}</ListHeader>
                    <List>
                      {Object.values(history[date]).map((h, i) => (
                        <ListItem key={`hist-${date}-${h.name}-${h.type}-${i}`}>
                          <div className="center"><b>{h.name}</b> <small style={{backgroundColor: getTypeColor(h.type), color:'white', padding:'2px 5px', borderRadius:'5px', marginLeft:'5px'}}>{h.type}</small></div>
                          <div className="right"><b>{h.count}</b></div>
                        </ListItem>
                      ))}
                    </List>
                  </div>
                ))}
              </div>
            </Page>
          ), tab: <Tab label="履歴" icon="md-time-restore" key="t3" /> }
        ]}
      />
      
      {showVideo && selectedItem && (
        <div className="video-fullscreen-overlay">
          <button className="video-close-btn" onClick={() => setShowVideo(false)}>
            <Icon icon="md-close" size={28} />
          </button>
          <video 
            className="fullscreen-video" 
            controls 
            autoPlay 
            playsInline 
            muted 
            src={selectedItem.videoUrl}
            key={selectedItem.id} 
            onLoadedData={(e) => e.target.play().catch(err => console.log("Auto-play blocked:", err))}
          >
            お使いのブラウザはビデオタグをサポートしていません。
          </video>
          <div className="video-footer">
            <div style={{color:'white', marginBottom:'10px', fontWeight:'bold'}}>{selectedItem.name} 整備手順</div>
            <Button onClick={() => { setShowVideo(false); setShowDialog(true); }}>整備完了・数量入力へ</Button>
          </div>
        </div>
      )}

      <Dialog isOpen={showDialog} onCancel={closeAll} cancelable>
        <div style={{ padding: '15px', textAlign: 'center', backgroundColor: '#fff' }}>
          <h3 style={{margin:'10px 0'}}>{selectedItem?.name}</h3>
          <div style={{ backgroundColor: '#f0f0f0', padding: '10px', fontSize: '32px', textAlign: 'right', borderRadius: '5px', marginBottom: '10px' }}>{calcDisplay || '0'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
            {['7','8','9','+','4','5','6','-','1','2','3','*','C','0','=','/'].map(btn => (
              <Button key={`btn-${btn}`} onClick={() => handleCalcBtn(btn)} style={{ padding: '15px 0', backgroundColor: btn === 'C' ? '#f44336' : (btn === '=' ? '#4CAF50' : '#666') }}>{btn}</Button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '15px' }}>
            {['通常', 'ケレン', '修理', '完全'].map(t => <Button key={`save-${t}`} onClick={() => addToCart(t)} style={{ backgroundColor: getTypeColor(t), color:'white' }}>{t}保存</Button>)}
          </div>
        </div>
      </Dialog>
    </Page>
  );
}

export default App;