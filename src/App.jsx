import React, { useState } from 'react';
import { Page, Toolbar, Card, Button, Icon, Dialog } from 'react-onsenui';
import 'onsenui/css/onsenui.css';
import 'onsenui/css/onsen-css-components.css';

// --- 各アイテムごとのファイルをインポート ---
import videoShichu from './assets/video/shichu.mp4';
import videoTesuri from './assets/video/tesuri.mp4';
import videoSenko from './assets/video/senko.mp4';
import videoSwalk from './assets/video/swalk.mp4';

import pdfShichu from './assets/pdf/shichu.pdf';
import pdfTesuri from './assets/pdf/tesuri.pdf';
import pdfSenko from './assets/pdf/senko.pdf';
import pdfSwalk from './assets/pdf/swalk.pdf';

const MATERIALS = [
  { id: 1, name: '支柱', img: 'https://placehold.jp/150x100.png?text=支柱', videoUrl: videoShichu, pdfUrl: pdfShichu },
  { id: 2, name: '手すり', img: 'https://placehold.jp/150x100.png?text=手すり', videoUrl: videoTesuri, pdfUrl: pdfTesuri },
  { id: 3, name: '先行手すり', img: 'https://placehold.jp/150x100.png?text=先行', videoUrl: videoSenko, pdfUrl: pdfSenko },
  { id: 4, name: 'Sウォーク', img: 'https://placehold.jp/150x100.png?text=Sウォーク', videoUrl: videoSwalk, pdfUrl: pdfSwalk },
];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [inputPass, setInputPass] = useState('');
  const [showMediaTypeDialog, setShowMediaTypeDialog] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [calcDisplay, setCalcDisplay] = useState('');

  // すべてのオーバーレイを閉じる
  const closeAll = () => {
    setShowMediaTypeDialog(false);
    setShowVideo(false);
    setShowPdf(false);
    setShowDialog(false);
    setSelectedItem(null);
    setCalcDisplay('');
  };

  // ログイン画面
  if (!isLoggedIn) {
    return (
      <Page>
        <div style={{ padding: '100px 20px', textAlign: 'center' }}>
          <h3>資材管理システム</h3>
          <input 
            type="password" 
            value={inputPass} 
            onChange={(e) => setInputPass(e.target.value)} 
            style={{ width: '100%', padding: '15px', fontSize: '20px', marginBottom: '20px', boxSizing: 'border-box' }} 
            placeholder="パスワード" 
          />
          <Button modifier="large" onClick={() => setIsLoggedIn(true)}>ログイン</Button>
        </div>
      </Page>
    );
  }

  return (
    <Page renderToolbar={() => <Toolbar><div className="center">資材管理・整備</div></Toolbar>}>
      
      <style>{`
        /* 動画・PDF表示用の最強レイヤー */
        .overlay-screen {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: #000; z-index: 200000; display: flex; flex-direction: column;
        }
        /* 上部固定の戻るボタンエリア */
        .overlay-header {
          height: 70px; background: #222; display: flex; align-items: center;
          padding: 0 15px; flex-shrink: 0; border-bottom: 1px solid #444;
        }
        /* 赤い戻るボタン */
        .exit-button {
          background: #ff3b30; color: white; border: none; padding: 10px 20px;
          border-radius: 8px; font-size: 17px; font-weight: bold; cursor: pointer;
        }
        /* コンテンツ表示エリア */
        .overlay-content {
          flex: 1; width: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
      `}</style>

      {/* メインの資材リスト */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '10px' }}>
        {MATERIALS.map(item => (
          <Card key={item.id} onClick={() => { setSelectedItem(item); setShowMediaTypeDialog(true); }} style={{ textAlign: 'center', margin: 0 }}>
            <img src={item.img} style={{ width: '100%', height: '100px', objectFit: 'cover' }} alt={item.name} />
            <div style={{ fontWeight: 'bold', padding: '5px' }}>{item.name}</div>
          </Card>
        ))}
      </div>

      {/* 選択ダイアログ */}
      <Dialog isOpen={showMediaTypeDialog} onCancel={closeAll} cancelable>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h3 style={{ marginTop: 0 }}>{selectedItem?.name}</h3>
          <Button modifier="large" onClick={() => { setShowMediaTypeDialog(false); setShowVideo(true); }} style={{ marginBottom: '10px' }}>動画を表示</Button>
          <Button modifier="large" onClick={() => { setShowMediaTypeDialog(false); setShowPdf(true); }} style={{ marginBottom: '10px' }}>PDFを表示</Button>
          <Button modifier="quiet" onClick={() => { setShowMediaTypeDialog(false); setShowDialog(true); }}>スキップして入力</Button>
        </div>
      </Dialog>

      {/* 動画再生オーバーレイ（赤い戻るボタンを最上部に固定） */}
      {showVideo && (
        <div className="overlay-screen">
          <div className="overlay-header">
            <button className="exit-button" onClick={() => { setShowVideo(false); setShowMediaTypeDialog(true); }}>
              ✕ 動画を閉じて戻る
            </button>
            <span style={{ color: 'white', marginLeft: '15px' }}>{selectedItem?.name}</span>
          </div>
          <div className="overlay-content">
            <video src={selectedItem?.videoUrl} controls autoPlay playsInline style={{ width: '100%', maxHeight: '100%' }} />
          </div>
        </div>
      )}

      {/* PDF表示オーバーレイ */}
      {showPdf && (
        <div className="overlay-screen">
          <div className="overlay-header">
            <button className="exit-button" onClick={() => { setShowPdf(false); setShowMediaTypeDialog(true); }}>
              ✕ PDFを閉じて戻る
            </button>
            <span style={{ color: 'white', marginLeft: '15px' }}>{selectedItem?.name}</span>
          </div>
          <div className="overlay-content" style={{ background: '#fff' }}>
            <iframe src={selectedItem?.pdfUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Preview" />
          </div>
        </div>
      )}

      {/* 数量入力ダイアログ */}
      <Dialog isOpen={showDialog} onCancel={closeAll} cancelable>
        <div style={{ padding: '15px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>{selectedItem?.name}</h3>
          <div style={{ background: '#eee', padding: '10px', fontSize: '28px', textAlign: 'right', borderRadius: '5px' }}>
            {calcDisplay || '0'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px', margin: '15px 0' }}>
            {['7','8','9','+','4','5','6','-','1','2','3','*','C','0','=','/'].map(b => (
              <Button key={b} onClick={() => {
                if (b === 'C') setCalcDisplay('');
                else if (b === '=') { try { setCalcDisplay(eval(calcDisplay).toString()); } catch { setCalcDisplay('Error'); } }
                else setCalcDisplay(prev => prev + b);
              }} style={{ background: '#666', padding: '10px 0' }}>{b}</Button>
            ))}
          </div>
          <Button modifier="large" onClick={closeAll}>保存して閉じる</Button>
        </div>
      </Dialog>

    </Page>
  );
}

export default App;