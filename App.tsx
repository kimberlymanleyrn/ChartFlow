import React, { useState, useRef } from 'react';
import { Icons, DOC_TYPES } from './constants';
import { DocumentationType, ProcessingState } from './types';
import { processNursingNotes } from './services/geminiService';

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

  const handleScanNotes = () => {
    // Revert to standard web file input trigger
    fileInputRef.current?.click();
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
    <div className="min-h-screen text-slate-900 pb-20">
      {/* Dynamic Header */}
      <header className="glass border-b border-slate-200 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="medical-gradient p-2.5 rounded-xl shadow-lg shadow-teal-500/20 transform hover:scale-105 transition-transform cursor-default flex items-center justify-center">
              <Icons.ChartLogo />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">ChartFlow</h1>
              <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mt-1">Clinical Documentation Pro</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nurse-Led Design</span>
              <span className="text-[12px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">Created and used by a nurse</span>
            </div>
            <div className="h-8 w-px bg-slate-200 hidden sm:block mx-2"></div>
            <div className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-2.5 shadow-xl shadow-slate-200 hover:bg-slate-800 transition-colors">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-400/20"></div>
              Engine Ready
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16 space-y-6 no-print">
          <div className="inline-block py-1.5 px-4 bg-teal-50 border border-teal-100 rounded-full mb-2">
            <span className="text-teal-700 text-xs font-black uppercase tracking-[0.2em]">Efficiency Protocol v1.5</span>
          </div>
          <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
            ChartFlow
          </h2>
          <p className="text-xl text-slate-500 font-semibold max-w-2xl mx-auto leading-relaxed">
            Instantly upgrade bedside scribbles and rough notes into professional, high-fidelity clinical documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Work Area: Input */}
          <div className="lg:col-span-7 no-print">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-300/40 border border-slate-100 overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-full h-2 medical-gradient"></div>
              
              <div className="p-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Rough Drafted Notes</h3>
                    <p className="text-sm text-slate-400 font-bold mt-1">Capture bedside shorthand or scan handwritten paper</p>
                  </div>
                  
                  <button 
                    onClick={handleScanNotes}
                    className="flex items-center gap-2.5 px-6 py-3 text-sm font-black text-white medical-gradient rounded-2xl transition-all shadow-xl hover:shadow-teal-300 hover:scale-105 active:scale-95 whitespace-nowrap"
                  >
                    <Icons.Camera />
                    <span>Scan Notes</span>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      capture="environment"
                      onChange={handleFileChange} 
                    />
                  </button>
                </div>

                <div className="space-y-8">
                  {imagePreview ? (
                    <div className="relative group rounded-[2rem] overflow-hidden border-2 border-slate-100 bg-slate-50 p-3 ring-12 ring-slate-50/30">
                      <img src={imagePreview} alt="Handwritten scan" className="w-full h-auto max-h-[28rem] object-contain rounded-[1.5rem] shadow-sm" />
                      <button 
                        onClick={clearImage}
                        className="absolute top-8 right-8 p-3 bg-white/95 hover:bg-white text-red-500 rounded-full shadow-2xl transition-all hover:rotate-90 hover:scale-110"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <textarea
                        className="w-full h-72 p-8 rounded-[2rem] border-2 border-slate-100 focus:ring-8 focus:ring-teal-500/5 focus:border-teal-500/50 resize-none bg-slate-50/50 placeholder:text-slate-300 text-[17px] leading-relaxed transition-all font-semibold shadow-inner"
                        placeholder="Type rough notes here... (DO NOT enter patient names or identifiers). e.g., Pt found in bed, alert, HR 80. Denies pain."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                      />
                      <div className="absolute bottom-6 right-8 flex items-center gap-2 opacity-40">
                        <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Processing</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                    <div className="space-y-4">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Clinical Format</label>
                      <div className="flex flex-wrap gap-2">
                        {DOC_TYPES.map((type) => (
                          <button
                            key={type.id}
                            onClick={() => setSelectedDocType(type.id as DocumentationType)}
                            className={`px-5 py-3 text-[11px] font-black rounded-xl border-2 transition-all uppercase tracking-wider ${
                              selectedDocType === type.id
                                ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-200'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-teal-400 hover:text-teal-600'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      disabled={processing.isProcessing || (!inputText && !imagePreview)}
                      onClick={handleProcess}
                      className="w-full py-5 px-8 bg-slate-900 hover:bg-black disabled:bg-slate-200 text-white font-black rounded-2xl shadow-2xl shadow-slate-300 transition-all flex items-center justify-center gap-4 active:scale-[0.98] transform group"
                    >
                      {processing.isProcessing ? (
                        <>
                          <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                          <span>Synthesizing Documentation...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6 transform group-hover:-translate-y-1 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          <span>Convert to {selectedDocType}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-5 space-y-10">
            
            {/* Regulatory Disclaimer Banner */}
            <div className="glass border-2 border-emerald-100 p-8 rounded-[2.5rem] flex gap-6 shadow-2xl shadow-emerald-50/50 safety-pulse relative overflow-hidden no-print">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div className="shrink-0 text-emerald-600 bg-emerald-50 p-4 rounded-2xl h-fit border border-emerald-100 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-black text-emerald-900 uppercase tracking-[0.15em] mb-2">Verification Protocol</h3>
                <p className="text-[14px] text-emerald-800 leading-relaxed font-bold italic">
                  Critical Warning: AI assists with transcription but DOES NOT replace clinical judgment. <span className="underline decoration-emerald-500 decoration-2">Do not enter identifying information (PHI).</span> Verify all findings against patient EHR before signature.
                </p>
              </div>
            </div>

            <div className={`transition-all duration-1000 ${processing.result ? 'opacity-100 translate-y-0 scale-100' : 'opacity-30 translate-y-6 scale-[0.95]'}`}>
              <div id="printable-note" className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-300 border border-slate-100 overflow-hidden min-h-[550px] flex flex-col border-b-[12px] border-b-slate-900 ring-1 ring-slate-100">
                <div className="px-10 py-6 bg-slate-900 flex items-center justify-between no-print">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
                    <h3 className="font-black text-white uppercase text-[11px] tracking-[0.3em]">Documentation Output</h3>
                  </div>
                  {processing.result && (
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{processing.result.timestamp}</span>
                  )}
                </div>
                
                <div className="p-10 flex-grow overflow-auto bg-slate-50/40 print:bg-white">
                  {processing.result ? (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-2.5 h-10 medical-gradient rounded-full shadow-lg shadow-teal-500/20 no-print"></div>
                          <h4 className="text-2xl font-black text-slate-900 tracking-tight">{processing.result.title}</h4>
                        </div>
                        
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 clinical-mono text-[15px] text-slate-800 leading-relaxed whitespace-pre-wrap selection:bg-teal-100 relative print:border-none print:shadow-none print:p-0">
                          {processing.result.content}
                          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none no-print">
                            <Icons.Stethoscope />
                          </div>
                        </div>
                        
                        <div className="hidden print:block pt-12 border-t border-slate-200">
                          <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span>Nurse Signature: ____________________________</span>
                            <span>Date: {processing.result.timestamp}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8 no-print">
                        <label className={`flex items-start gap-5 p-6 rounded-3xl cursor-pointer border-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] ${
                          hasAcknowledged ? 'bg-emerald-50 border-emerald-500 ring-8 ring-emerald-500/5' : 'bg-white border-slate-100 hover:border-teal-300 shadow-md'
                        }`}>
                          <div className="relative flex items-center mt-1">
                            <input 
                              type="checkbox" 
                              className="w-6 h-6 rounded-lg text-emerald-600 focus:ring-emerald-500 cursor-pointer border-2 border-slate-200 transition-all" 
                              checked={hasAcknowledged}
                              onChange={(e) => setHasAcknowledged(e.target.checked)}
                            />
                          </div>
                          <span className="text-xs font-black text-slate-700 leading-relaxed uppercase tracking-wide">
                            I certify that I have personally reviewed this output for clinical accuracy and EHR compatibility.
                          </span>
                        </label>

                        <div className="grid grid-cols-2 gap-4">
                          <button 
                            disabled={!hasAcknowledged}
                            onClick={copyToClipboard}
                            className={`group py-6 flex items-center justify-center gap-4 font-black text-sm uppercase tracking-[0.15em] rounded-2xl transition-all shadow-2xl active:scale-95 ${
                              hasAcknowledged 
                              ? 'medical-gradient text-white hover:brightness-105 shadow-teal-300' 
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            }`}
                          >
                            {copySuccess ? (
                              <>
                                <Icons.Check />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Icons.Copy />
                                <span>Export to EHR</span>
                              </>
                            )}
                          </button>

                          <button 
                            disabled={!hasAcknowledged}
                            onClick={handlePrint}
                            className={`group py-6 flex items-center justify-center gap-4 font-black text-sm uppercase tracking-[0.15em] rounded-2xl transition-all shadow-2xl active:scale-95 ${
                              hasAcknowledged 
                              ? 'bg-slate-900 text-white hover:bg-black shadow-slate-300' 
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            }`}
                          >
                            <Icons.Print />
                            <span>Print Note</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-8 px-12 no-print">
                      <div className="relative">
                        <div className="absolute inset-0 bg-teal-100 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                        <div className="relative w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center border border-slate-100 shadow-2xl transform rotate-12 hover:rotate-0 transition-transform duration-500">
                          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </div>
                      </div>
                      <div className="max-w-[240px]">
                        <p className="text-slate-500 text-sm font-black uppercase tracking-[0.3em] mb-3">Idle State</p>
                        <p className="text-slate-400 text-xs font-bold leading-relaxed">
                          Provide clinical data via scan or manual entry to initialize professional documentation.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 mt-32 no-print">
        <div className="bg-slate-900 rounded-[4rem] p-16 text-white space-y-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] border border-slate-800">
           <div className="flex justify-center gap-4">
            {[1,2,3,4,5].map(i => <div key={i} className="w-2 h-2 rounded-full bg-teal-500/40"></div>)}
           </div>
           <div className="text-center space-y-4">
            <h4 className="text-4xl font-black tracking-tighter">ChartFlow Pro</h4>
            <p className="text-teal-500 font-bold uppercase tracking-[0.5em] text-[10px]">Clinical Integrity Assured</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 border-y border-slate-800">
             <div className="text-center space-y-2">
               <span className="text-xs font-black text-slate-500 uppercase">Privacy</span>
               <p className="text-sm font-bold">End-to-End Encryption</p>
             </div>
             <div className="text-center space-y-2">
               <span className="text-xs font-black text-slate-500 uppercase">Logic</span>
               <p className="text-sm font-bold">Nursing Protocol Trained</p>
             </div>
             <div className="text-center space-y-2">
               <span className="text-xs font-black text-slate-500 uppercase">Data</span>
               <p className="text-sm font-bold">Zero Persistence Policy</p>
             </div>
           </div>

           <p className="text-slate-500 text-[12px] max-w-3xl mx-auto italic font-medium leading-relaxed text-center">
             Notice: ChartFlow is a productivity-enhancing Decision Support Tool. <span className="font-bold text-slate-300">Users must not enter patient identifiers or Protected Health Information (PHI).</span> It is not an Electronic Medical Record (EMR) system. All users are bound by their clinical license and institutional HIPAA policies. Always cross-reference AI output with original assessment findings.
           </p>
           
           <div className="text-center pt-8">
             <span className="text-[10px] font-black text-slate-700 bg-slate-800 px-6 py-2 rounded-full uppercase tracking-[0.4em]">Designed for the Frontline</span>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;