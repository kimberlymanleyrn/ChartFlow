import React, { useState, useRef } from 'react';
import { Icons, DOC_TYPES } from './constants';
import { DocumentationType, ProcessingState } from './types';
import { processNursingNotes } from './services/geminiService';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [selectedDocType, setSelectedDocType] = useState<DocumentationType>('ProgressNote');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    result: null,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScanNotes = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera
        });

        if (image.dataUrl) {
          setImagePreview(image.dataUrl);
          setInputText('');
          setProcessing(p => ({ ...p, result: null, error: null }));
        }
      } catch (error: any) {
        console.error('Native Camera Error:', error);
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setInputText(''); 
        setProcessing(p => ({ ...p, result: null, error: null }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcess = async () => {
    if (!inputText && !imagePreview) {
      setProcessing(prev => ({ ...prev, error: "Missing clinical input. Please provide notes or an image." }));
      return;
    }

    setProcessing({ isProcessing: true, error: null, result: null });
    setCopySuccess(false);
    setHasAcknowledged(false);

    try {
      let input: string | { data: string; mimeType: string };
      
      if (imagePreview) {
        const base64Parts = imagePreview.split(',');
        const base64Data = base64Parts[1];
        const mimeType = base64Parts[0].split(';')[0].split(':')[1];
        input = { data: base64Data, mimeType };
      } else {
        input = inputText;
      }

      const result = await processNursingNotes(input, selectedDocType);
      setProcessing({ isProcessing: false, error: null, result });
    } catch (err: any) {
      setProcessing({ 
        isProcessing: false, 
        error: err.message || "The clinical reasoning engine encountered an error.", 
        result: null 
      });
    }
  };

  const copyToClipboard = () => {
    if (processing.result && hasAcknowledged) {
      navigator.clipboard.writeText(processing.result.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handlePrint = () => {
    if (processing.result && hasAcknowledged) {
      window.print();
    }
  };

  return (
    <div className="min-h-screen text-black pb-20">
      <header className="glass border-b border-slate-200 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="medical-gradient p-2.5 rounded-xl shadow-lg shadow-teal-500/20 transform hover:scale-105 transition-transform cursor-default flex items-center justify-center">
              <Icons.ChartLogo />
            </div>
            <div>
              <h1 className="text-2xl font-black text-black tracking-tight leading-none">ChartFlow</h1>
              <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mt-1">Clinical Documentation Pro</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nurse-Led Design</span>
              <span className="text-[12px] font-bold text-black bg-slate-100 px-2 py-0.5 rounded">Created and used by a nurse</span>
            </div>
            <div className="h-8 w-px bg-slate-200 hidden sm:block mx-2"></div>
            <div className="bg-black text-white px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-2.5 shadow-xl shadow-slate-200 hover:bg-slate-800 transition-colors">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-400/20"></div>
              Engine Ready
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto text-center mb-8 space-y-4 no-print">
          <h2 className="text-5xl font-black text-black tracking-tighter leading-none">
            ChartFlow
          </h2>
          <p className="text-lg text-slate-600 font-semibold max-w-2xl mx-auto leading-relaxed">
            Upgrade bedside scribbles into professional clinical documentation.
          </p>
        </div>

        {/* Verification Protocol Banner - Black text on White background */}
        <div className="mb-8 no-print flex justify-center">
          <div className="bg-white border-2 border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 shadow-xl shadow-slate-100 safety-pulse relative overflow-hidden max-w-3xl w-full">
            <div className="shrink-0 text-emerald-600 bg-emerald-50 p-2 rounded-lg h-fit border border-emerald-100 shadow-sm w-fit">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div className="relative z-10 flex-grow">
              <h3 className="text-[10px] font-black text-black uppercase tracking-[0.2em] mb-0.5">Verification Protocol</h3>
              <p className="text-[12px] text-black leading-snug font-bold">
                AI assists transcription but DOES NOT replace clinical judgment. <span className="underline decoration-emerald-500 decoration-2">Do not enter Protected Health Information.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Format Preference Selection - Moved Above Grid */}
        <div className="mb-10 no-print flex flex-col items-center gap-4">
          <label className="block text-[10px] font-black text-black uppercase tracking-[0.2em]">Format Preference</label>
          <div className="flex flex-wrap justify-center gap-2">
            {DOC_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedDocType(type.id as DocumentationType)}
                className={`px-4 py-2.5 text-[10px] font-black rounded-xl border-2 transition-all uppercase tracking-wider ${
                  selectedDocType === type.id
                    ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-200'
                    : 'bg-white border-slate-200 text-black hover:border-teal-400 hover:text-teal-600'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 items-stretch">
          {/* Documentation Input Section */}
          <div className="no-print flex flex-col">
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-300/40 border border-slate-100 overflow-hidden relative group flex flex-col h-full border-b-[12px] border-b-black">
              {/* Header Styled like Output - White text on Black background */}
              <div className="px-8 py-6 bg-black flex items-center justify-between min-h-[96px]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-teal-500 shadow-lg shadow-teal-500/50"></div>
                  <div className="flex flex-col">
                    <h3 className="font-black text-white uppercase text-[11px] tracking-[0.3em] leading-tight">Documentation Input</h3>
                    <span className="text-[9px] font-bold text-white opacity-80 uppercase tracking-widest mt-1">(Shorthand or handwritten scan)</span>
                  </div>
                </div>
                <button 
                  onClick={handleScanNotes}
                  className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-white medical-gradient rounded-lg transition-all shadow-lg hover:brightness-110 active:scale-95 whitespace-nowrap uppercase tracking-widest"
                >
                  <Icons.Camera />
                  <span>Scan</span>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
                </button>
              </div>
              
              <div className="p-8 flex-grow flex flex-col bg-slate-50/40">
                <div className="flex-grow space-y-8 flex flex-col">
                  {imagePreview ? (
                    <div className="relative group rounded-[2rem] overflow-hidden border-2 border-slate-200 bg-slate-50 p-3 ring-8 ring-slate-100/50 flex-grow flex items-center justify-center">
                      <img src={imagePreview} alt="Handwritten scan" className="w-full h-auto max-h-[30rem] object-contain rounded-[1.5rem] shadow-sm" />
                      <button 
                        onClick={clearImage}
                        className="absolute top-6 right-6 p-3 bg-white/95 hover:bg-white text-red-500 rounded-full shadow-2xl transition-all hover:rotate-90 hover:scale-110"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  ) : (
                    <div className="relative flex-grow min-h-[450px]">
                      <textarea
                        className="w-full h-full p-8 rounded-[2rem] border-2 border-slate-200 focus:ring-8 focus:ring-teal-500/5 focus:border-teal-500/50 resize-none bg-white placeholder:text-slate-400 text-[16px] leading-relaxed transition-all font-semibold shadow-inner text-black"
                        placeholder="Type rough notes here... (DO NOT enter Protected Health Information). e.g., Pt found in bed, alert, lungs clear, HR 82. Denies pain."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                      />
                      <div className="absolute bottom-6 right-8 flex items-center gap-2 opacity-60">
                        <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-black uppercase tracking-widest">Awaiting Data</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      disabled={processing.isProcessing || (!inputText && !imagePreview)}
                      onClick={handleProcess}
                      className="w-full py-5 px-8 bg-black hover:bg-slate-800 disabled:bg-slate-200 text-white font-black rounded-2xl shadow-2xl shadow-slate-300 transition-all flex items-center justify-center gap-4 active:scale-[0.98] transform group"
                    >
                      {processing.isProcessing ? (
                        <>
                          <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                          <span>Synthesizing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6 transform group-hover:-translate-y-1 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          <span>Process Clinical Notes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Documentation Output Section */}
          <div className="flex flex-col">
            <div id="printable-note" className={`bg-white rounded-[2rem] shadow-2xl shadow-slate-300 border border-slate-100 overflow-hidden h-full flex flex-col border-b-[12px] border-b-black ring-1 ring-slate-100 flex-grow transition-all duration-700 ${processing.result ? 'opacity-100' : 'opacity-40'}`}>
              <div className="px-8 py-6 bg-black flex items-center justify-between no-print min-h-[96px]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
                  <div className="flex flex-col">
                    <h3 className="font-black text-white uppercase text-[11px] tracking-[0.3em] leading-tight">Documentation Output</h3>
                    <span className="text-[9px] font-bold text-white opacity-80 uppercase tracking-widest mt-1">Generated Professional Note</span>
                  </div>
                </div>
                {processing.result && (
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{processing.result.timestamp}</span>
                )}
              </div>
              
              <div className="p-8 flex-grow overflow-auto bg-slate-50/40 print:bg-white flex flex-col">
                {processing.result ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col h-full">
                    <div className="space-y-6 flex-grow">
                      <div className="flex items-center gap-4">
                        <div className="w-2.5 h-10 medical-gradient rounded-full shadow-lg shadow-teal-500/20 no-print"></div>
                        <h4 className="text-2xl font-black text-black tracking-tight">{processing.result.title}</h4>
                      </div>
                      
                      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 clinical-mono text-[15px] text-black leading-relaxed whitespace-pre-wrap selection:bg-teal-100 relative print:border-none print:shadow-none print:p-0 flex-grow min-h-[300px]">
                        {processing.result.content}
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none no-print">
                          <Icons.Stethoscope />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 no-print pt-6">
                      <label className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer border-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] ${
                        hasAcknowledged ? 'bg-emerald-50 border-emerald-500 ring-4 ring-emerald-500/5' : 'bg-white border-slate-200 hover:border-teal-300 shadow-md'
                      }`}>
                        <div className="relative flex items-center mt-1">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer border-2 border-slate-300 transition-all" 
                            checked={hasAcknowledged}
                            onChange={(e) => setHasAcknowledged(e.target.checked)}
                          />
                        </div>
                        <span className="text-[11px] font-black text-black leading-tight uppercase tracking-wide">
                          I certify accuracy and assume professional responsibility.
                        </span>
                      </label>

                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          disabled={!hasAcknowledged}
                          onClick={copyToClipboard}
                          className={`group py-4 flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.15em] rounded-xl transition-all shadow-xl active:scale-95 ${
                            hasAcknowledged 
                            ? 'medical-gradient text-white hover:brightness-105 shadow-teal-300' 
                            : 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                          }`}
                        >
                          {copySuccess ? (
                            <><Icons.Check /><span>Copied</span></>
                          ) : (
                            <><Icons.Copy /><span>Export EHR</span></>
                          )}
                        </button>

                        <button 
                          disabled={!hasAcknowledged}
                          onClick={handlePrint}
                          className={`group py-4 flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.15em] rounded-xl transition-all shadow-xl active:scale-95 ${
                            hasAcknowledged 
                            ? 'bg-black text-white hover:bg-slate-900 shadow-slate-300' 
                            : 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                          }`}
                        >
                          <Icons.Print />
                          <span>Print</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[450px] flex flex-col items-center justify-center text-center space-y-6 px-12 no-print flex-grow">
                    <div className="relative">
                      <div className="absolute inset-0 bg-teal-100 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                      <div className="relative w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center border border-slate-200 shadow-2xl transform rotate-12">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                      </div>
                    </div>
                    <div className="max-w-[200px]">
                      <p className="text-black text-[10px] font-black uppercase tracking-[0.3em] mb-2">Awaiting Synthesis</p>
                      <p className="text-slate-500 text-[11px] font-bold leading-relaxed">
                        Processed documentation will appear here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - White text on Black background */}
      <footer className="max-w-5xl mx-auto px-6 mt-16 no-print">
        <div className="bg-black rounded-[2rem] p-8 text-white space-y-6 shadow-2xl border border-slate-800">
           <div className="text-center space-y-2">
            <h4 className="text-xl font-black tracking-tighter text-white">ChartFlow Pro</h4>
            <p className="text-teal-400 font-bold uppercase tracking-[0.4em] text-[8px]">Clinical Integrity Assured</p>
           </div>

           <div className="text-white text-[13px] max-w-4xl mx-auto font-medium leading-relaxed text-center border-t border-slate-800 pt-6 space-y-4">
             <p>
               Notice: This is a Clinical Productivity Tool. <span className="font-bold text-white uppercase tracking-wide">DO NOT ENTER PROTECTED HEALTH INFORMATION.</span> ChartFlow is not an Electronic Medical Record (EMR) system. 
             </p>
             <p>
               All users are strictly bound by their professional clinical license, institutional policies, and <span className="text-teal-400 font-bold">HIPAA (Health Insurance Portability and Accountability Act)</span> federal guidelines. Users are solely responsible for verifying the accuracy of all generated documentation before final signature or EHR entry.
             </p>
             <div className="flex justify-center pt-2">
               <span className="text-[10px] font-black text-white bg-slate-800/80 px-5 py-2 rounded-full uppercase tracking-[0.3em]">Designed for the Healthcare Frontline</span>
             </div>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;