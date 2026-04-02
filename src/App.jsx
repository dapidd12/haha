import React, { useState, useEffect } from 'react';
import { UploadCloud, Link as LinkIcon, X, Copy, Check, ExternalLink, Zap, Sparkles, FileText, ArrowRight, CheckCircle2, Code2, ShieldCheck, Globe, Code } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('file'); 
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Konfigurasi Global
  const REPO_OWNER = 'dapidd12';
  const REPO_NAME = 'storage';

  // State File to URL
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); 
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileUrlResult, setFileUrlResult] = useState('');
  
  // State URL Shortener
  const [longUrl, setLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [isShortening, setIsShortening] = useState(false);
  const [shortUrlResult, setShortUrlResult] = useState('');

  // State Deploy HTML
  const [selectedHtmlFile, setSelectedHtmlFile] = useState(null);
  const [htmlCustomAlias, setHtmlCustomAlias] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployUrlResult, setDeployUrlResult] = useState('');

  // State Umum
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedFile, setCopiedFile] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedDeploy, setCopiedDeploy] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedKaiDevGlobal');
    if (!hasVisited) {
      setShowWelcome(true);
    }
  }, []);

  const closeWelcome = () => {
    localStorage.setItem('hasVisitedKaiDevGlobal', 'true');
    setShowWelcome(false);
  };

  const copyToClipboard = (text, type) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      if (type === 'file') { setCopiedFile(true); setTimeout(() => setCopiedFile(false), 2000); }
      else if (type === 'url') { setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }
      else if (type === 'deploy') { setCopiedDeploy(true); setTimeout(() => setCopiedDeploy(false), 2000); }
    } catch (err) {
      setErrorMsg('Gagal menyalin tautan.');
    }
    document.body.removeChild(textArea);
  };

  const openInBrowser = (url) => window.open(url, '_blank', 'noopener,noreferrer');
  const toBase64 = (str) => btoa(unescape(encodeURIComponent(str)));

  // Fungsi Universal untuk memanggil Serverless API Vercel
  const callBackendApi = async (path, message, content) => {
    const response = await fetch('/api/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: path,
        message: message,
        content: content
      })
    });
    return response;
  };

  // 1. Upload File (via Backend)
  const handleFileUpload = async () => {
    if (!selectedFile) return setErrorMsg('Pilih file terlebih dahulu!');
    setIsUploadingFile(true);
    setErrorMsg('');
    setFileUrlResult('');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onloadend = async () => {
        const base64Data = reader.result.split(',')[1];
        const safeFilename = `${Date.now()}-${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const path = `tes/${safeFilename}`;
        
        const response = await callBackendApi(path, `Upload file ${selectedFile.name}`, base64Data);
        const data = await response.json();

        if (response.ok && data.success) {
          setFileUrlResult(`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${path}`);
          setSelectedFile(null); 
        } else {
          setErrorMsg(data.message || 'Gagal mengunggah file.');
        }
        setIsUploadingFile(false);
      };
    } catch (err) {
      setErrorMsg(`Terjadi kesalahan jaringan.`);
      setIsUploadingFile(false);
    }
  };

  // 2. Shortener Link (via Backend)
  const handleUrlShorten = async () => {
    if (!longUrl) return setErrorMsg('Masukkan URL yang ingin diperpendek!');
    if (!longUrl.startsWith('http')) return setErrorMsg('URL harus diawali http:// atau https://');

    let finalAlias = customAlias ? customAlias.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') : Math.random().toString(36).substring(2, 8);
    if (customAlias && !finalAlias) return setErrorMsg('Format custom link tidak valid');

    setIsShortening(true);
    setErrorMsg('');
    setShortUrlResult('');

    try {
      const path = `ya/${finalAlias}.html`; 
      const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0; url=${longUrl}" /><title>Redirecting...</title></head><body><p>Mengalihkan, <a href="${longUrl}">klik di sini</a>.</p></body></html>`;
      const base64Content = toBase64(htmlContent);

      const response = await callBackendApi(path, `Create shortlink ${finalAlias}`, base64Content);
      const data = await response.json();

      if (response.ok && data.success) {
        setShortUrlResult(`https://${REPO_OWNER}.github.io/${REPO_NAME}/${path}`);
        setLongUrl(''); setCustomAlias('');
      } else {
        setErrorMsg(data.message && data.message.includes('sha') ? 'Nama Tautan sudah dipakai!' : data.message);
      }
    } catch (err) {
      setErrorMsg(`Terjadi kesalahan jaringan.`);
    } finally {
      setIsShortening(false);
    }
  };

  // 3. Deploy HTML (via Backend)
  const handleDeployHtml = async () => {
    if (!selectedHtmlFile) return setErrorMsg('Pilih file HTML terlebih dahulu!');
    if (!selectedHtmlFile.name.endsWith('.html') && !selectedHtmlFile.name.endsWith('.htm')) return setErrorMsg('Harus format .html');

    let finalAlias = htmlCustomAlias ? htmlCustomAlias.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') : selectedHtmlFile.name.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9-]/gi, '-').toLowerCase() || Math.random().toString(36).substring(2, 8);
    if (htmlCustomAlias && !finalAlias) return setErrorMsg('Format nama link tidak valid');

    setIsDeploying(true);
    setErrorMsg('');
    setDeployUrlResult('');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Content = toBase64(e.target.result);
        const path = `ha/${finalAlias}.html`;
        
        const response = await callBackendApi(path, `Deploy HTML ${finalAlias}`, base64Content);
        const data = await response.json();

        if (response.ok && data.success) {
          setDeployUrlResult(`https://${REPO_OWNER}.github.io/${REPO_NAME}/${path}`);
          setSelectedHtmlFile(null); setHtmlCustomAlias('');
        } else {
          setErrorMsg(data.message && data.message.includes('sha') ? 'Nama Path sudah dipakai!' : data.message);
        }
        setIsDeploying(false);
      };
      reader.readAsText(selectedHtmlFile);
    } catch (err) {
      setErrorMsg(`Terjadi kesalahan jaringan.`);
      setIsDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans flex flex-col select-none relative overflow-x-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50"></div>
        <div className="absolute top-0 left-[20%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-[20%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen animate-pulse-slow" style={{animationDelay: '2s'}}></div>
      </div>
      
      {/* Kartu Welcome */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712]/90 backdrop-blur-md p-4 transition-all">
          <div className="bg-slate-900/80 rounded-[2rem] shadow-2xl p-8 max-w-md w-full border border-white/5 transform transition-all text-center animate-scale-in relative overflow-hidden">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner relative">
              <Sparkles size={36} className="text-blue-400 relative z-10" />
            </div>
            <h2 className="text-3xl font-black mb-3 text-white tracking-tight">Selamat Datang</h2>
            <p className="text-slate-400 mb-8 leading-relaxed text-sm">
              Platform modern untuk mengelola file, tautan, dan web deployment Anda. Semua fitur kini tersedia untuk umum.
            </p>
            <button 
              onClick={closeWelcome}
              className="w-full bg-white text-slate-900 font-bold py-4 px-6 rounded-xl transition-all hover:bg-slate-200 active:scale-95 flex items-center justify-center gap-2"
            >
              Mulai Eksplorasi <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Konten Utama */}
      <main className="flex-grow container mx-auto px-4 py-12 max-w-2xl flex flex-col items-center justify-center relative z-10">
        
        {/* Header Teks */}
        <div className="text-center mb-8 w-full animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tighter drop-shadow-sm">
            Cloud<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400">Link</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto">Solusi lengkap untuk unggah file, perpendek URL, & Deploy Web. Siapapun bisa pakai!</p>
        </div>

        {/* Notifikasi Error */}
        {errorMsg && (
          <div className="w-full bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-4 rounded-2xl mb-6 flex items-center justify-between animate-fade-in shadow-lg backdrop-blur-md">
            <span className="text-sm font-medium flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> {errorMsg}
            </span>
            <button onClick={() => setErrorMsg('')} className="hover:bg-red-500/20 p-1.5 rounded-lg transition-colors"><X size={16} /></button>
          </div>
        )}

        <div className="w-full bg-[#0B1120]/80 backdrop-blur-2xl rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          
          {/* Navigasi Tab */}
          <div className="p-2 border-b border-white/5">
            <div className="w-full flex relative">
              <div 
                className={`absolute top-0 bottom-0 w-1/3 bg-white/5 rounded-xl transition-transform duration-300 ease-out`}
                style={{ transform: activeTab === 'file' ? 'translateX(0)' : activeTab === 'url' ? 'translateX(100%)' : 'translateX(200%)' }}
              ></div>
              
              <button
                onClick={() => setActiveTab('file')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm transition-colors duration-300 relative z-10 ${
                  activeTab === 'file' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <UploadCloud size={18} className="hidden sm:block" /> File
              </button>
              <button
                onClick={() => setActiveTab('url')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm transition-colors duration-300 relative z-10 ${
                  activeTab === 'url' ? 'text-purple-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <LinkIcon size={18} className="hidden sm:block" /> Tautan
              </button>
              <button
                onClick={() => setActiveTab('deploy')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm transition-colors duration-300 relative z-10 ${
                  activeTab === 'deploy' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Code size={18} className="hidden sm:block" /> Deploy
              </button>
            </div>
          </div>

          {/* Area Konten Tab */}
          <div className="p-6 md:p-8 min-h-[400px]">
            
            {/* --- TAB 1: FILE UPLOAD --- */}
            {activeTab === 'file' && (
              <div className="space-y-6 animate-fade-in flex flex-col h-full">
                <div className="relative group flex-grow">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative border border-dashed border-slate-700 hover:border-blue-500/50 bg-[#0B1120] rounded-3xl p-8 text-center transition-all duration-300 overflow-hidden min-h-[240px] flex flex-col items-center justify-center">
                    <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" title="Pilih file" />

                    {selectedFile ? (
                      <div className="w-full max-w-[200px] aspect-square rounded-2xl mx-auto mb-4 relative z-10 border border-slate-800 p-1 shadow-lg bg-[#050914] flex items-center justify-center overflow-hidden">
                        {selectedFile.type.startsWith('image/') ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-xl" /> : selectedFile.type.startsWith('video/') ? <video src={previewUrl} className="w-full h-full object-cover rounded-xl" /> : <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center flex-col gap-2"><FileText size={42} className="text-blue-500" /></div>}
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-5 relative z-10 group-hover:scale-110 transition-transform duration-300">
                        <UploadCloud size={32} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                      </div>
                    )}

                    {selectedFile ? (
                      <div className="relative z-10 animate-fade-in-up">
                        <p className="text-white font-bold truncate px-4 text-sm mb-1 max-w-[250px] mx-auto">{selectedFile.name}</p>
                        <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div className="relative z-10">
                        <p className="text-white font-medium">Klik atau seret file</p>
                        <p className="text-slate-500 text-xs mt-1">Global Mode Aktif</p>
                      </div>
                    )}
                  </div>
                </div>

                <button onClick={handleFileUpload} disabled={isUploadingFile || !selectedFile} className="w-full bg-blue-600 hover:bg-blue-500 text-white disabled:bg-slate-800 disabled:text-slate-500 font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-[0.98] relative z-20">
                  {isUploadingFile ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Mengunggah File...</> : <><UploadCloud size={18} /> Unggah & Generate URL</>}
                </button>

                {fileUrlResult && (
                  <div className="mt-4 p-[1px] rounded-2xl bg-gradient-to-r from-blue-500/30 via-indigo-500/30 to-blue-500/30 animate-fade-in-up relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                    <div className="bg-[#0B1120] rounded-2xl p-5 relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={18} className="text-blue-400" />
                          <span className="text-sm font-bold text-white tracking-wide">Tautan Raw File Dibuat</span>
                        </div>
                      </div>
                      <div className="bg-[#050914] border border-white/5 rounded-xl p-2 flex items-center gap-2 shadow-inner">
                        <div className="px-3 text-slate-500"><Globe size={16}/></div>
                        <input type="text" readOnly value={fileUrlResult} className="flex-1 bg-transparent text-blue-300 text-sm font-mono focus:outline-none truncate w-full" />
                        <div className="flex gap-1">
                          <button onClick={() => copyToClipboard(fileUrlResult, 'file')} className="p-2.5 bg-slate-800/50 hover:bg-slate-700 text-white rounded-lg transition-colors border border-white/5"><Copy size={16} /></button>
                          <button onClick={() => openInBrowser(fileUrlResult)} className="p-2.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-colors border border-blue-500/20"><ExternalLink size={16} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- TAB 2: URL SHORTENER --- */}
            {activeTab === 'url' && (
              <div className="space-y-6 animate-fade-in flex flex-col h-full">
                <div className="space-y-5 flex-grow">
                  <div className="bg-[#0B1120] border border-slate-800 rounded-3xl p-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tautan Panjang Asli</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><LinkIcon size={18} className="text-slate-600" /></div>
                      <input type="url" value={longUrl} onChange={(e) => setLongUrl(e.target.value)} placeholder="https://website-target-anda.com/..." className="w-full bg-[#050914] border border-white/5 rounded-2xl pl-11 pr-4 py-4 focus:outline-none focus:border-purple-500/50 text-white transition-all placeholder:text-slate-700 font-mono text-sm shadow-inner" />
                    </div>

                    <div className="mt-5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex justify-between"><span>Tautan Kustom</span><span className="text-slate-600 normal-case text-[10px]">Opsional</span></label>
                      <div className="flex bg-[#050914] border border-white/5 rounded-2xl overflow-hidden focus-within:border-purple-500/50 transition-all shadow-inner">
                        <div className="bg-white/5 px-4 py-4 flex items-center border-r border-white/5 text-slate-500 text-xs font-mono select-none hidden sm:flex">{REPO_OWNER}.github.io/ya/</div>
                        <input type="text" value={customAlias} onChange={(e) => setCustomAlias(e.target.value)} placeholder="nama-unik" className="w-full bg-transparent px-4 py-4 focus:outline-none text-purple-300 placeholder:text-slate-700 font-mono text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                <button onClick={handleUrlShorten} disabled={isShortening || !longUrl} className="w-full bg-purple-600 hover:bg-purple-500 text-white disabled:bg-slate-800 disabled:text-slate-500 font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 active:scale-[0.98] relative z-20">
                  {isShortening ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Memproses Link...</> : <><Zap size={18} /> Buat Tautan Pendek</>}
                </button>

                {shortUrlResult && (
                  <div className="mt-4 p-[1px] rounded-2xl bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30 animate-fade-in-up relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                    <div className="bg-[#0B1120] rounded-2xl p-5 relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-purple-400" /><span className="text-sm font-bold text-white tracking-wide">Tautan Pendek Aktif</span></div>
                      </div>
                      <div className="bg-[#050914] border border-white/5 rounded-xl p-2 flex items-center gap-2 shadow-inner">
                        <div className="px-3 text-slate-500"><Globe size={16}/></div>
                        <input type="text" readOnly value={shortUrlResult} className="flex-1 bg-transparent text-purple-300 text-sm font-mono focus:outline-none truncate w-full" />
                        <div className="flex gap-1">
                          <button onClick={() => copyToClipboard(shortUrlResult, 'url')} className="p-2.5 bg-slate-800/50 hover:bg-slate-700 text-white rounded-lg transition-colors border border-white/5"><Copy size={16} /></button>
                          <button onClick={() => openInBrowser(shortUrlResult)} className="p-2.5 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white rounded-lg transition-colors border border-purple-500/20"><ExternalLink size={16} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- TAB 3: DEPLOY HTML --- */}
            {activeTab === 'deploy' && (
              <div className="space-y-6 animate-fade-in flex flex-col h-full">
                <div className="relative group flex-grow">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative border border-dashed border-slate-700 hover:border-emerald-500/50 bg-[#0B1120] rounded-3xl p-8 text-center transition-all duration-300 overflow-hidden min-h-[180px] flex flex-col items-center justify-center">
                    <input type="file" accept=".html,.htm" onChange={(e) => setSelectedHtmlFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" title="Pilih file HTML" />
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10 transition-transform duration-300 ${selectedHtmlFile ? 'bg-emerald-500/20 scale-110 border border-emerald-500/30' : 'bg-slate-800/50 group-hover:scale-110'}`}>
                      <Code size={32} className={`${selectedHtmlFile ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'} transition-colors`} />
                    </div>
                    {selectedHtmlFile ? (
                      <div className="relative z-10 animate-fade-in-up">
                        <p className="text-white font-bold truncate px-4 text-sm mb-1 max-w-[250px] mx-auto">{selectedHtmlFile.name}</p>
                      </div>
                    ) : (
                      <div className="relative z-10">
                        <p className="text-white font-medium">Pilih file HTML Anda</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#0B1120] border border-slate-800 rounded-2xl p-5 relative z-10">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex justify-between"><span>Nama Path Website</span></label>
                  <div className="flex bg-[#050914] border border-white/5 rounded-xl overflow-hidden focus-within:border-emerald-500/50 transition-all shadow-inner">
                    <div className="bg-white/5 px-3 py-3 flex items-center border-r border-white/5 text-slate-500 text-xs font-mono select-none hidden sm:flex">{REPO_OWNER}.github.io/ha/</div>
                    <input type="text" value={htmlCustomAlias} onChange={(e) => setHtmlCustomAlias(e.target.value)} placeholder={selectedHtmlFile ? selectedHtmlFile.name.replace('.html','') : "nama-project"} className="w-full bg-transparent px-3 py-3 focus:outline-none text-emerald-300 placeholder:text-slate-700 font-mono text-sm" />
                  </div>
                </div>

                <button onClick={handleDeployHtml} disabled={isDeploying || !selectedHtmlFile} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-slate-800 disabled:text-slate-500 font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-[0.98] relative z-20">
                  {isDeploying ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Mendeploy Web...</> : <><Globe size={18} /> Deploy ke GitHub Pages</>}
                </button>

                {deployUrlResult && (
                  <div className="mt-4 p-[1px] rounded-2xl bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-emerald-500/30 animate-fade-in-up relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                    <div className="bg-[#0B1120] rounded-2xl p-5 relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-400" /><span className="text-sm font-bold text-white tracking-wide">Website Telah Live!</span></div>
                      </div>
                      <div className="bg-[#050914] border border-white/5 rounded-xl p-2 flex items-center gap-2 shadow-inner">
                        <div className="px-3 text-slate-500"><Globe size={16}/></div>
                        <input type="text" readOnly value={deployUrlResult} className="flex-1 bg-transparent text-emerald-300 text-sm font-mono focus:outline-none truncate w-full" />
                        <div className="flex gap-1">
                          <button onClick={() => copyToClipboard(deployUrlResult, 'deploy')} className="p-2.5 bg-slate-800/50 hover:bg-slate-700 text-white rounded-lg transition-colors border border-white/5"><Copy size={16} /></button>
                          <button onClick={() => openInBrowser(deployUrlResult)} className="p-2.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg transition-colors border border-emerald-500/20"><ExternalLink size={16} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-auto py-8 text-center relative z-10 border-t border-white/5 bg-[#030712]/50 backdrop-blur-sm">
        <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
          <Code2 size={16} /> Dibuat oleh
          <a href="https://tesporto-nine.vercel.app/" target="_blank" rel="noopener noreferrer" className="font-bold text-slate-300 hover:text-white transition-colors relative group ml-1">
            KaiDev<span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
          </a>
        </p>
      </footer>
      <style dangerouslySetInnerHTML={{__html: `@keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } } @keyframes pulse-slow { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.05); } } .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; } .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; } .animate-scale-in { animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; } .animate-shimmer { animation: shimmer 8s linear infinite; } .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }`}} />
    </div>
  );
}


