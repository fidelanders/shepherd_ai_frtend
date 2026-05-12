import React, { useState, useRef, useCallback, useEffect } from "react";

/* ══════════════════════════════════════════════════════════
   SHEPHERD AI · TRANSCRIPTION STUDIO  v4.0
   Now with Landing Page & Navigation
══════════════════════════════════════════════════════════ */

const API_URL = 'http://localhost:5000/api';
const API_KEY = 'shepherd-AI-2026';

const apiFetch = (path, opts = {}) => {
  const isPublic = path === '/health' || path === '/offline-mode';
  const headers = {
    ...(opts.headers || {}),
    ...(!isPublic ? { 'X-API-Key': API_KEY } : {}),
  };
  if (opts.body instanceof FormData) delete headers['Content-Type'];
  return fetch(`${API_URL}${path}`, { ...opts, headers });
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,400;1,500&family=Instrument+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --ink:#1c1410;--ink2:#3d322a;--ink3:#6b5c52;--ink4:#9c8e87;--ink5:#c4b8b2;
  --parch:#faf6ef;--parch2:#f2ebe0;--parch3:#e6ddd0;--parch4:#d8cfc0;
  --gold:#b8860b;--gold2:#d4a017;--gold3:#f0c040;
  --goldbg:rgba(184,134,11,.09);--goldborder:rgba(184,134,11,.28);
  --sage:#3a5a40;--sagebg:rgba(58,90,64,.1);--sageborder:rgba(58,90,64,.28);
  --cobalt:#1e3a5f;--cobaltbg:rgba(30,58,95,.09);--cobaltborder:rgba(30,58,95,.25);
  --sienna:#8b3a2a;--siennabg:rgba(139,58,42,.09);
  --white:#ffffff;
}
body{background:var(--parch);font-family:'Instrument Sans',system-ui,sans-serif;color:var(--ink);font-size:13px;line-height:1.55;overflow:hidden}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--parch4);border-radius:10px}
input,select,textarea,button{font-family:'Instrument Sans',system-ui,sans-serif;outline:none}
button{cursor:pointer}
@keyframes fadeUp{from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}
@keyframes slideIn{from{transform:translateX(-20px);opacity:0}to{transform:translateX(0);opacity:1}}
.fu {animation:fadeUp .5s ease both}
.fu2{animation:fadeUp .5s .1s ease both}
.fu3{animation:fadeUp .5s .2s ease both}
.fu4{animation:fadeUp .5s .3s ease both}
.fu5{animation:fadeUp .5s .4s ease both}
.fi {animation:fadeIn .3s ease both}
.slide-in{animation:slideIn .4s ease both}
`;

const T = {
  ink:"#1c1410",ink2:"#3d322a",ink3:"#6b5c52",ink4:"#9c8e87",ink5:"#c4b8b2",
  parch:"#faf6ef",parch2:"#f2ebe0",parch3:"#e6ddd0",parch4:"#d8cfc0",
  gold:"#b8860b",gold2:"#d4a017",gold3:"#f0c040",
  goldbg:"rgba(184,134,11,.09)",goldborder:"rgba(184,134,11,.28)",
  sage:"#3a5a40",sagebg:"rgba(58,90,64,.1)",sageborder:"rgba(58,90,64,.28)",
  cobalt:"#1e3a5f",cobaltbg:"rgba(30,58,95,.09)",cobaltborder:"rgba(30,58,95,.25)",
  sienna:"#8b3a2a",siennabg:"rgba(139,58,42,.09)",
  white:"#ffffff",
};

const display = "'Playfair Display',Georgia,serif";

/* ── Primitives ─────────────────────────────────────────── */
const Tag = ({children,color=T.cobalt,bg=T.cobaltbg,border="rgba(30,58,95,.2)",style={}})=>(
  <span style={{display:"inline-flex",alignItems:"center",gap:4,background:bg,color,
    border:`1px solid ${border}`,borderRadius:20,padding:"2px 9px",
    fontSize:10.5,fontWeight:500,lineHeight:1.5,flexShrink:0,...style}}>
    {children}
  </span>
);

const Dot = ({color=T.sage,size=7,anim=true})=>(
  <span style={{display:"inline-block",width:size,height:size,borderRadius:"50%",
    background:color,flexShrink:0,animation:anim?"pulse 2s infinite":"none"}}/>
);

const Card = ({children,style={},className=""})=>(
  <div className={className} style={{background:T.white,border:`1px solid ${T.parch3}`,
    borderRadius:14,boxShadow:"0 2px 6px rgba(28,20,16,.06)",...style}}>
    {children}
  </div>
);

const ProgressBar = ({pct,color=T.gold,height=5,style={}})=>(
  <div style={{background:T.parch3,borderRadius:8,height,overflow:"hidden",...style}}>
    <div style={{width:`${Math.min(100,Math.max(0,pct||0))}%`,height:"100%",background:color,
      borderRadius:8,transition:"width .45s ease"}}/>
  </div>
);

const SH = ({children,action})=>(
  <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:12}}>
    <span style={{fontFamily:display,fontSize:15,fontWeight:500,color:T.ink2}}>{children}</span>
    {action}
  </div>
);

const ErrorBanner = ({message,onClose})=> message ? (
  <div style={{background:T.siennabg,border:"1px solid rgba(139,58,42,.28)",borderRadius:10,
    padding:"10px 14px",marginBottom:14,fontSize:12.5,color:T.sienna,
    display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <span>⚠ {message}</span>
    {onClose && <button onClick={onClose} style={{background:"none",border:"none",
      color:T.sienna,fontSize:14,cursor:"pointer",padding:"0 4px"}}>×</button>}
  </div>
) : null;

/* ══ DASHBOARD PAGE ═══════════════════════════════════════════ */
const DashboardPage = ({ jobs, onOpenJob, onDeleteJob, onNewTranscription }) => {
  const completed = jobs.filter(j => j.status === "completed");
  const processing = jobs.filter(j => j.status === "processing" || j.status === "queued");
  
  const formatSize = bytes => {
    if (!bytes) return '–';
    return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(0)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  const statusConfig = status => ({
    completed: { color: T.sage, bg: T.sagebg, border: T.sageborder, label: "Completed" },
    processing: { color: T.gold, bg: T.goldbg, border: T.goldborder, label: "Processing" },
    failed: { color: T.sienna, bg: T.siennabg, border: "rgba(139,58,42,.28)", label: "Failed" },
    queued: { color: T.ink4, bg: T.parch2, border: T.parch4, label: "Queued" },
  }[status] || { color: T.ink4, bg: T.parch2, border: T.parch4, label: "Unknown" });

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 34px", background: T.parch }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Header */}
        <div className="fu" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: display, fontSize: 34, color: T.ink, marginBottom: 8 }}>
              Dashboard
            </div>
            <div style={{ fontSize: 14, color: T.ink3 }}>
              Manage sermon transcriptions, insights, and exports.
            </div>
          </div>
          <button
            onClick={onNewTranscription}
            style={{
              background: T.ink,
              color: T.gold3,
              border: "none",
              padding: "12px 20px",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer"
            }}
          >
            + New Transcription
          </button>
        </div>

        {/* Stats Cards */}
        <div className="fu2" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total Sermons", value: jobs.length, color: T.gold, icon: "🎙" },
            { label: "Completed", value: completed.length, color: T.sage, icon: "✓" },
            { label: "Processing", value: processing.length, color: T.cobalt, icon: "⚡" },
            { label: "Total Hours", value: `${Math.round(jobs.reduce((a, b) => a + (b.durationSeconds || 0), 0) / 3600)}`, color: T.sienna, icon: "⏱" },
          ].map((stat, i) => (
            <Card key={i} style={{ padding: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontFamily: display, fontSize: 30, color: stat.color, fontWeight: 600 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: T.ink4, marginTop: 6 }}>{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Sermon Library */}
        <div className="fu3">
          <div style={{ fontFamily: display, fontSize: 22, marginBottom: 16, color: T.ink }}>Sermon Library</div>
          <Card style={{ overflow: "hidden" }}>
            {jobs.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center", color: T.ink4 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                <div style={{ fontSize: 14 }}>No sermon transcriptions yet.</div>
                <button
                  onClick={onNewTranscription}
                  style={{
                    marginTop: 16,
                    background: T.gold,
                    color: T.white,
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: 8,
                    cursor: "pointer"
                  }}
                >
                  Upload your first sermon
                </button>
              </div>
            ) : (
              jobs.map((job, i) => {
                const sc = statusConfig(job.status);
                return (
                  <div
                    key={job.id}
                    style={{
                      padding: "18px 24px",
                      borderBottom: i < jobs.length - 1 ? `1px solid ${T.parch3}` : "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      transition: "background .12s",
                      ...(job.status === "completed" ? { cursor: "pointer" } : {})
                    }}
                    onMouseEnter={e => { if (job.status === "completed") e.currentTarget.style.background = T.parch2; }}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    onClick={() => { if (job.status === "completed") onOpenJob(job); }}
                  >
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: T.ink,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.gold3} strokeWidth="1.6">
                        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 4 }}>
                        {job.fileName}
                      </div>
                      <div style={{ fontSize: 12, color: T.ink4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{job.wordCount?.toLocaleString() || 0} words</span>
                        <span>•</span>
                        <span>{formatSize(job.fileSize)}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Tag color={sc.color} bg={sc.bg} border={sc.border}>
                        {sc.label}
                      </Tag>
                      {job.status === "completed" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenJob(job); }}
                          style={{
                            border: "none",
                            background: T.ink,
                            color: T.gold3,
                            borderRadius: 8,
                            padding: "6px 12px",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          Open
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteJob(job.id); }}
                        style={{
                          border: `1px solid ${T.parch3}`,
                          background: T.parch2,
                          color: T.sienna,
                          borderRadius: 8,
                          padding: "6px 10px",
                          fontSize: 11,
                          cursor: "pointer"
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        </div>

        {/* Recent Activity Sidebar */}
        <div className="fu4" style={{ marginTop: 24 }}>
          <div style={{ fontFamily: display, fontSize: 18, marginBottom: 14, color: T.ink }}>Recent Activity</div>
          <Card style={{ padding: 20 }}>
            {jobs.slice(0, 5).map((j, i) => (
              <div key={i} style={{
                padding: "12px 0",
                borderBottom: i < 4 ? `1px solid ${T.parch3}` : "none"
              }}>
                <div style={{ fontSize: 13, color: T.ink2, marginBottom: 4 }}>{j.fileName}</div>
                <div style={{ fontSize: 11, color: T.ink4 }}>
                  {j.status} • {new Date(j.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
            {jobs.length === 0 && (
              <div style={{ textAlign: "center", color: T.ink4, padding: "20px 0" }}>
                No activity yet
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

/* ══ LANDING PAGE ═══════════════════════════════════════════ */
const LandingPage = ({ onNavigate }) => {
  const features = [
    { icon: "🎙", title: "Full Transcript", desc: "Word-for-word with speaker labels and timestamps" },
    { icon: "👥", title: "Speaker Diarization", desc: "Separates pastor, congregation, worship team" },
    { icon: "📖", title: "Verse Detection", desc: "Every Bible reference tagged across all 66 books" },
    { icon: "✦", title: "AI Highlights", desc: "Key quotes, scripture moments, and insight themes" },
    { icon: "📋", title: "Chapter Markers", desc: "Sermon structure auto-detected and segmented" },
    { icon: "📤", title: "4 Export Formats", desc: "TXT · SRT · DOCX · JSON" },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", background: T.parch }}>
      {/* Hero Section */}
      <div style={{ 
        background: `linear-gradient(135deg, ${T.ink} 0%, ${T.ink2} 100%)`,
        padding: "80px 40px 100px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ 
          position: "absolute", 
          top: -100, 
          right: -100, 
          width: 300, 
          height: 300, 
          background: T.goldbg, 
          borderRadius: "50%",
          filter: "blur(60px)"
        }} />
        <div style={{ 
          position: "absolute", 
          bottom: -80, 
          left: -80, 
          width: 250, 
          height: 250, 
          background: T.cobaltbg, 
          borderRadius: "50%",
          filter: "blur(60px)"
        }} />
        
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div className="fu" style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ 
              fontFamily: display, 
              fontSize: 56, 
              color: T.white,
              fontWeight: 600,
              marginBottom: 20,
              letterSpacing: "-0.02em"
            }}>
              Shepherd AI
              <span style={{ 
                display: "block", 
                fontSize: 32, 
                color: T.gold3,
                fontStyle: "italic",
                marginTop: 12
              }}>
                Sermon Intelligence Workspace
              </span>
            </div>
            <div style={{ 
              fontSize: 18, 
              color: "rgba(255,255,255,0.7)",
              maxWidth: 600,
              margin: "0 auto",
              lineHeight: 1.6
            }}>
              Transform sermon audio into actionable insights with AI-powered transcription,
              speaker detection, and biblical analysis.
            </div>
          </div>

          <div className="fu2" style={{ textAlign: "center" }}>
            <button
              onClick={() => onNavigate("upload")}
              style={{
                background: T.gold,
                color: T.white,
                border: "none",
                padding: "16px 40px",
                borderRadius: 40,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all .2s",
                boxShadow: "0 4px 12px rgba(184,134,11,0.3)"
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              Start New Transcription →
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 40px" }}>
        <div className="fu3" style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: display, fontSize: 36, color: T.ink, marginBottom: 16 }}>
            Powerful Features
          </div>
          <div style={{ fontSize: 16, color: T.ink3, maxWidth: 600, margin: "0 auto" }}>
            Everything you need to transform sermon audio into valuable content
          </div>
        </div>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
          gap: 24 
        }}>
          {features.map((feature, i) => (
            <div 
              key={i} 
              className={`fu${i+4}`}
              style={{
                background: T.white,
                border: `1px solid ${T.parch3}`,
                borderRadius: 16,
                padding: 28,
                transition: "all .2s"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>{feature.icon}</div>
              <div style={{ fontFamily: display, fontSize: 20, color: T.ink, marginBottom: 12, fontWeight: 500 }}>
                {feature.title}
              </div>
              <div style={{ fontSize: 14, color: T.ink3, lineHeight: 1.6 }}>
                {feature.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ══ TOP BAR WITH NAVIGATION ═══════════════════════════════ */
const TopBar = ({ currentView, onNavigate }) => (
  <div style={{
    height: 60,
    background: T.ink,
    display: "flex",
    alignItems: "center",
    padding: "0 24px",
    gap: 20,
    flexShrink: 0,
    borderBottom: "1px solid rgba(184,134,11,.2)"
  }}>
    <div 
      onClick={() => onNavigate("landing")}
      style={{ 
        fontFamily: display, 
        fontSize: 20, 
        color: T.gold3, 
        fontWeight: 600,
        letterSpacing: ".02em",
        cursor: "pointer",
        flexShrink: 0
      }}
    >
      Shepherd
      <span style={{ 
        fontStyle: "italic", 
        fontWeight: 400, 
        color: "rgba(240,192,64,.55)",
        fontSize: 15,
        marginLeft: 4
      }}>AI</span>
    </div>
    
    <div style={{ width: 1, height: 22, background: "rgba(255,255,255,.1)", flexShrink: 0 }}/>
    
    {/* Navigation Links */}
    <div style={{ display: "flex", gap: 8, flex: 1 }}>
      {[
        { id: "landing", label: "Home" },
        { id: "upload", label: "Upload" },
        { id: "dashboard", label: "Dashboard" }
      ].map(nav => (
        <button
          key={nav.id}
          onClick={() => onNavigate(nav.id)}
          style={{
            background: currentView === nav.id ? "rgba(255,255,255,.08)" : "transparent",
            color: currentView === nav.id ? T.gold3 : "rgba(255,255,255,.6)",
            border: "none",
            padding: "6px 16px",
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all .15s"
          }}
        >
          {nav.label}
        </button>
      ))}
    </div>
  </div>
);

/* ══ UPLOAD STAGE ═══════════════════════════════════════════ */
const UploadStage = ({ onFileSelect, onOpenJob, recentJobs, loadingJobs }) => {
  const [drag, setDrag] = useState(false);
  const ref = useRef();

  const drop = e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFileSelect(f); };
  const pick = e => { const f = e.target.files[0]; if (f) onFileSelect(f); };

  const formatSize = bytes => {
    if (!bytes) return '–';
    return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(0)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  const statusConfig = status => ({
    completed: { color: T.sage, bg: T.sagebg, border: T.sageborder, label: "Transcribed" },
    processing: { color: T.gold, bg: T.goldbg, border: T.goldborder, label: "Processing…" },
    failed: { color: T.sienna, bg: T.siennabg, border: "rgba(139,58,42,.28)", label: "Failed" },
    queued: { color: T.ink4, bg: T.parch2, border: T.parch4, label: "Queued" },
  }[status] || { color: T.ink4, bg: T.parch2, border: T.parch4, label: "Unknown" });

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "36px 44px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div className="fu" style={{ marginBottom: 36, textAlign: "center" }}>
          <div style={{ fontFamily: display, fontSize: 34, color: T.ink, fontWeight: 500, lineHeight: 1.2, marginBottom: 12 }}>
            From sermon audio to full insight
            <em style={{ display: "block", fontStyle: "italic", color: T.gold, fontSize: 28, marginTop: 4 }}>in minutes.</em>
          </div>
          <div style={{ fontSize: 14, color: T.ink3, maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
            Upload any sermon recording. Whisper transcribes it, then AI extracts highlights,
            themes, summaries, and a complete content package.
          </div>
        </div>

        {/* Drop zone */}
        <div className="fu2"
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={drop}
          onClick={() => ref.current.click()}
          style={{
            border: `2px dashed ${drag ? T.gold2 : T.parch4}`,
            borderRadius: 22,
            padding: "60px 40px",
            textAlign: "center",
            cursor: "pointer",
            background: drag ? "rgba(184,134,11,.06)" : T.parch2,
            transition: "all .2s",
            marginBottom: 28
          }}>
          <input ref={ref} type="file" accept=".mp3,.wav,.m4a,.aac,.flac,.ogg,.mp4"
            style={{ display: "none" }} onChange={pick} />
          <div style={{
            width: 68,
            height: 68,
            borderRadius: 18,
            background: T.ink,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px"
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
              stroke={T.gold3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div style={{ fontFamily: display, fontSize: 22, fontWeight: 500, color: T.ink, marginBottom: 6 }}>
            {drag ? "Drop to begin transcription" : "Drop your sermon audio here"}
          </div>
          <div style={{ fontSize: 13, color: T.ink3, marginBottom: 12 }}>or click to browse</div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
            {["MP3", "WAV", "M4A", "AAC", "FLAC", "OGG", "MP4"].map(f => (
              <span key={f} style={{
                fontSize: 10.5,
                padding: "3px 10px",
                background: T.parch3,
                borderRadius: 6,
                color: T.ink4,
                fontWeight: 500
              }}>{f}</span>
            ))}
          </div>
        </div>

        {/* Recent recordings */}
        <div className="fu3">
          <SH children="Recent recordings" />
          <Card style={{ padding: 0 }}>
            {loadingJobs ? (
              <div style={{ padding: "20px", textAlign: "center", color: T.ink4, fontSize: 12.5 }}>
                Loading recent jobs…
              </div>
            ) : recentJobs.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: T.ink4, fontSize: 12.5 }}>
                No recent recordings yet. Upload your first sermon above.
              </div>
            ) : recentJobs.map((job, i) => {
              const sc = statusConfig(job.status);
              const clickable = job.status === "completed" || job.status === "processing";
              return (
                <div key={job.id}
                  onClick={() => { if (clickable) onOpenJob(job); }}
                  style={{
                    padding: "13px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    borderBottom: i < recentJobs.length - 1 ? `1px solid ${T.parch3}` : "none",
                    cursor: clickable ? "pointer" : "default",
                    transition: "background .12s",
                    borderRadius: i === 0 ? "14px 14px 0 0" : i === recentJobs.length - 1 ? "0 0 14px 14px" : "0"
                  }}
                  onMouseEnter={e => { if (clickable) e.currentTarget.style.background = T.parch2; }}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: T.ink,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke={T.gold3} strokeWidth="1.6" strokeLinecap="round">
                      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: T.ink,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {job.fileName}
                    </div>
                    <div style={{ fontSize: 11.5, color: T.ink4, marginTop: 2 }}>
                      {job.status === "processing" || job.status === "queued"
                        ? `${job.progress || 0}% · ${job.step || "Queued…"}`
                        : new Date(job.createdAt).toLocaleDateString('en-GB',
                          { day: 'numeric', month: 'short', year: 'numeric' })}
                      {" · "}{formatSize(job.fileSize)}
                    </div>
                  </div>
                  {(job.status === "processing" || job.status === "queued") && (
                    <div style={{ width: 60 }}><ProgressBar pct={job.progress || 0} height={3} /></div>
                  )}
                  <Tag color={sc.color} bg={sc.bg} border={sc.border}>{sc.label}</Tag>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
    </div>
  );
};

/* ══ PROCESSING STAGE ═══════════════════════════════════════ */
const STEPS = [
  { pct: 5, label: "Validating audio file" },
  { pct: 10, label: "Converting audio format" },
  { pct: 25, label: "Transcribing…" },
  { pct: 55, label: "Detecting speakers" },
  { pct: 70, label: "Finding Bible verses" },
  { pct: 80, label: "Generating AI insights" },
  { pct: 95, label: "Finalising…" },
  { pct: 100, label: "Complete" },
];

const ProcessingStage = ({ fileName, progress, step }) => (
  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center", maxWidth: 480, padding: 40 }} className="fi">
      <div style={{
        width: 80,
        height: 80,
        borderRadius: 20,
        background: T.ink,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 24px"
      }}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
          stroke={T.gold3} strokeWidth="1.3" strokeLinecap="round">
          <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
        </svg>
      </div>
      <div style={{ fontFamily: display, fontSize: 22, fontWeight: 500, color: T.ink, marginBottom: 6 }}>
        Transcribing sermon
      </div>
      <div style={{
        fontSize: 13,
        color: T.ink4,
        marginBottom: 4,
        maxWidth: 340,
        margin: "0 auto 4px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }}>{fileName}</div>
      <div style={{ fontSize: 13, color: T.ink3, marginBottom: 28, height: 20 }}>{step}</div>
      <div style={{ background: T.parch3, borderRadius: 8, height: 8, marginBottom: 10 }}>
        <div style={{
          width: `${progress}%`,
          height: "100%",
          background: T.gold2,
          borderRadius: 8,
          transition: "width .5s ease"
        }} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: T.gold, marginBottom: 36 }}>
        {Math.round(progress)}%
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
        {STEPS.map((s, i) => {
          const done = progress > s.pct;
          const active = step === s.label;
          return (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              opacity: done || active ? 1 : .35,
              transition: "opacity .3s"
            }}>
              <div style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                flexShrink: 0,
                background: done ? T.sagebg : active ? T.goldbg : T.parch3,
                border: `1px solid ${done ? T.sageborder : active ? T.goldborder : T.parch4}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all .3s"
              }}>
                {done
                  ? <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke={T.sage} strokeWidth="2"><path d="M1.5 6l3 3 6-6" /></svg>
                  : active
                    ? <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold, animation: "pulse 1s infinite" }} />
                    : <span style={{ fontSize: 9 }}>{i + 1}</span>}
              </div>
              <span style={{
                fontSize: 12.5,
                color: done ? T.sage : active ? T.ink : T.ink3,
                fontWeight: active ? 500 : 400
              }}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

/* ══ WORKSPACE STAGE (YOUR EXISTING TRANSCRIPT PAGE) ═══════ */
const parseWhisperSegments = rawText => {
  if (!rawText) return [];
  const re = /\[(\d+:\d+:\d+\.\d+)\s-->\s(\d+:\d+:\d+\.\d+)\]\s(.+)/g;
  const toS = t => { const [h, m, s] = t.split(":"); return +h * 3600 + +m * 60 + parseFloat(s); };
  const out = []; let m;
  while ((m = re.exec(rawText)) !== null)
    out.push({ start: toS(m[1]), end: toS(m[2]), text: m[3], speaker: "Speaker 1" });
  return out;
};

const formatTime = s => {
  if (typeof s !== 'number') return '–';
  const m = Math.floor(s / 60), ss = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};

/* ── TRANSCRIPT TAB (PRESERVED) ── */
const TranscriptTab = ({ results }) => {
  const [search, setSearch] = useState("");
  const [spk, setSpk] = useState("All");
  const [playing, setPlaying] = useState(null);

  const segments = results.segments?.length ? results.segments : parseWhisperSegments(results.transcript);
  const speakers = ["All", ...new Set(segments.map(s => s.speaker).filter(Boolean))];
  const filtered = segments.filter(s =>
    (spk === "All" || s.speaker === spk) &&
    (search === "" || s.text.toLowerCase().includes(search.toLowerCase()))
  );

  const hl = text => {
    if (!search) return text;
    return text.split(new RegExp(`(${search})`, "gi")).map((p, i) =>
      p.toLowerCase() === search.toLowerCase()
        ? <mark key={i} style={{ background: "rgba(184,134,11,.25)", borderRadius: 2, padding: "0 1px", color: T.ink }}>{p}</mark>
        : p
    );
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 256px", height: "100%", minHeight: 0 }}>
      <div style={{ overflowY: "auto", padding: "20px 24px", borderRight: `1px solid ${T.parch3}` }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }} className="fu">
          <div style={{ position: "relative", flex: 1 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search transcript…"
              style={{
                width: "100%",
                padding: "8px 14px 8px 36px",
                border: `1px solid ${T.parch3}`,
                borderRadius: 9,
                fontSize: 13,
                background: T.parch2
              }} />
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
              stroke={T.ink5} strokeWidth="1.5"
              style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" />
            </svg>
          </div>
          <select value={spk} onChange={e => setSpk(e.target.value)}
            style={{
              padding: "8px 12px",
              border: `1px solid ${T.parch3}`,
              borderRadius: 9,
              fontSize: 12.5,
              background: T.parch2,
              color: T.ink2
            }}>
            {speakers.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: T.ink4, fontSize: 13, padding: "40px 0" }}>
            {segments.length === 0
              ? "No transcript segments available — check transcription setup."
              : "No segments match your search or filter."}
          </div>
        )}
        {filtered.map((seg, i) => (
          <div key={i} style={{
            display: "flex",
            gap: 14,
            marginBottom: 20,
            animation: `fadeUp .3s ${Math.min(i, .7) * 0.05}s ease both`,
            opacity: 0,
            animationFillMode: "both"
          }}>
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: T.cobaltbg,
                border: `1px solid ${T.cobaltborder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10.5,
                fontWeight: 500,
                color: T.cobalt,
                flexShrink: 0
              }}>
                {seg.speaker?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "SP"}
              </div>
              {i < filtered.length - 1 && (
                <div style={{ width: 1, flex: 1, background: T.parch3, minHeight: 8, marginTop: 4 }} />
              )}
            </div>
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: T.cobalt }}>{seg.speaker || "Unknown"}</span>
                <span style={{ fontSize: 10.5, color: T.ink5 }}>{formatTime(seg.start)}–{formatTime(seg.end)}</span>
                <div style={{ flex: 1 }} />
                <button onClick={() => setPlaying(playing === i ? null : i)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 10.5,
                    padding: "3px 9px",
                    border: `1px solid ${T.parch3}`,
                    borderRadius: 6,
                    background: playing === i ? T.ink : T.parch2,
                    color: playing === i ? T.gold3 : T.ink4,
                    transition: "all .15s"
                  }}>
                  {playing === i ? "⏸ Playing" : "▶ Play"}
                </button>
              </div>
              <div style={{ fontFamily: display, fontSize: 14.5, lineHeight: 1.85, color: T.ink }}>
                {hl(seg.text)}
              </div>
              {seg.confidence != null && (
                <div style={{ marginTop: 5 }}>
                  <Tag color={T.ink4} bg={T.parch2} border={T.parch4} style={{ fontSize: 9.5, padding: "1px 7px" }}>
                    {Math.round(seg.confidence * 100)}% conf
                  </Tag>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar: verses + speakers */}
      <div style={{ overflowY: "auto", padding: 16, background: T.parch }}>
        <div className="fu">
          <SH children="Bible verses" />
          {!(results.verses?.length) && (
            <div style={{ fontSize: 12, color: T.ink4, textAlign: "center", padding: "20px 0" }}>No verses detected</div>
          )}
          {(results.verses || []).map((v, i) => (
            <div key={i} style={{
              background: T.white,
              border: `1px solid ${T.parch3}`,
              borderRadius: 10,
              padding: "10px 12px",
              marginBottom: 8,
              borderLeft: `3px solid ${T.gold2}`
            }}>
              <div style={{ fontFamily: display, fontSize: 13, fontWeight: 500, color: T.ink }}>{v.ref}</div>
              {v.text && (
                <div style={{
                  fontFamily: display,
                  fontStyle: "italic",
                  fontSize: 11.5,
                  color: T.ink3,
                  marginTop: 3,
                  lineHeight: 1.5
                }}>{v.text.slice(0, 80)}{v.text.length > 80 ? "…" : ""}</div>
              )}
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <span style={{ fontSize: 10, color: T.ink5 }}>{v.time || "00:00"}</span>
                <Tag color={T.cobalt} bg={T.cobaltbg} border={T.cobaltborder} style={{ fontSize: 9.5, padding: "1px 7px" }}>
                  {v.trans || "ESV"}
                </Tag>
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${T.parch3}`, margin: "14px 0" }} />
        <div className="fu2">
          <SH children="Speakers" />
          {!(results.speakers?.length) && (
            <div style={{ fontSize: 12, color: T.ink4 }}>No speaker data</div>
          )}
          {(results.speakers || []).map((s, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: T.ink2 }}>{s.name}</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: s.color }}>{s.percentage}%</span>
              </div>
              <ProgressBar pct={s.percentage} color={s.color} height={4} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── OTHER TABS (PRESERVED) ── */
const HighlightsTab = ({ results }) => {
  const [filter, setFilter] = useState("All");
  const [copied, setCopied] = useState(null);
  const types = ["All", "Scripture", "Key moment", "Notable quote"];
  const highlights = Array.isArray(results.highlights) ? results.highlights : [];
  const filtered = filter === "All" ? highlights : highlights.filter(h => {
    if (filter === "Scripture") return h.type === "scripture";
    if (filter === "Key moment") return h.type === "key";
    return h.type === "quote";
  });
  const tc = t => ({
    scripture: { color: T.gold, bg: T.goldbg, border: T.goldborder, accent: T.gold2 },
    key: { color: T.cobalt, bg: T.cobaltbg, border: T.cobaltborder, accent: T.cobalt },
    quote: { color: T.sage, bg: T.sagebg, border: T.sageborder, accent: T.sage },
  }[t] || { color: T.ink4, bg: T.parch2, border: T.parch4, accent: T.ink5 });

  return (
    <div style={{ overflowY: "auto", padding: "24px 32px", height: "100%" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {highlights.length === 0 ? (
          <div style={{ textAlign: "center", color: T.ink4, fontSize: 13, padding: "60px 0" }}>
            No highlights were generated — AI insights require a valid transcript and a GEMINI_API_KEY.
          </div>
        ) : <>
          <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }} className="fu">
            {types.map(t => (
              <button key={t} onClick={() => setFilter(t)}
                style={{
                  fontSize: 12,
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: `1px solid ${filter === t ? T.gold2 : T.parch3}`,
                  background: filter === t ? T.goldbg : T.parch2,
                  color: filter === t ? T.gold : T.ink3,
                  cursor: "pointer",
                  fontWeight: filter === t ? 500 : 400,
                  transition: "all .15s"
                }}>
                {t}
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: T.ink4, fontSize: 13, padding: "40px 0" }}>
              No highlights for this filter.
            </div>
          )}
          {filtered.map((h, i) => {
            const c = tc(h.type);
            return (
              <div key={h.id || i} style={{
                background: T.white,
                borderRadius: 16,
                border: `1px solid ${T.parch3}`,
                borderLeft: `4px solid ${c.accent}`,
                padding: "18px 20px 16px",
                marginBottom: 14,
                animation: `fadeUp .35s ${i * 0.06}s ease both`,
                opacity: 0,
                animationFillMode: "both"
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                      <Tag color={c.color} bg={c.bg} border={c.border}>
                        {h.type === "scripture" ? "Scripture" : h.type === "key" ? "Key moment" : "Notable quote"}
                      </Tag>
                      <span style={{ fontSize: 11, color: T.ink5 }}>{h.time}</span>
                      {h.verse && <span style={{ fontSize: 12, fontWeight: 500, color: T.gold }}>— {h.verse}</span>}
                      <span style={{ fontSize: 11.5, color: T.ink4, marginLeft: "auto" }}>{h.speaker}</span>
                    </div>
                    <blockquote style={{
                      fontFamily: display,
                      fontSize: h.type === "scripture" ? 18 : 16,
                      lineHeight: 1.8,
                      color: T.ink,
                      fontStyle: "italic",
                      margin: 0
                    }}>
                      "{h.text}"
                    </blockquote>
                  </div>
                  <button onClick={() => {
                    navigator.clipboard?.writeText(h.text).catch(() => { });
                    setCopied(i); setTimeout(() => setCopied(null), 2000);
                  }} style={{
                    flexShrink: 0,
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: copied === i ? T.sagebg : T.parch2,
                    border: `1px solid ${copied === i ? T.sageborder : T.parch3}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all .2s"
                  }}>
                    {copied === i
                      ? <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke={T.sage} strokeWidth="2"><path d="M1 6l3 3 7-7" /></svg>
                      : <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke={T.ink4} strokeWidth="1.5"><rect x="4" y="4" width="9" height="9" rx="1.5" /><path d="M2 2h7v2H2z" /></svg>}
                  </button>
                </div>
              </div>
            );
          })}
        </>}
      </div>
    </div>
  );
};

const InsightsTab = ({ results }) => {
  const hasInsights = results.summary || results.themes?.length || results.questions?.length;
  return (
    <div style={{ overflowY: "auto", padding: "24px 32px", height: "100%" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {!hasInsights && (
          <div style={{ textAlign: "center", padding: "40px 0", color: T.ink4 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
            <div style={{ fontFamily: display, fontSize: 16, color: T.ink3, marginBottom: 8 }}>No AI insights generated</div>
            <div style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
              Add a <code style={{ background: T.parch3, padding: "1px 6px", borderRadius: 4 }}>GEMINI_API_KEY</code> to your
              <code style={{ background: T.parch3, padding: "1px 6px", borderRadius: 4, marginLeft: 4 }}>.env</code> file
              and ensure the transcript is not empty.
            </div>
          </div>
        )}
        {hasInsights && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {results.summary && (
              <Card style={{ padding: 22, gridColumn: "1/-1" }} className="fu">
                <SH children="Sermon summary" />
                <div style={{
                  fontFamily: display,
                  fontSize: 15,
                  lineHeight: 1.9,
                  color: T.ink2,
                  fontStyle: "italic",
                  background: T.parch2,
                  borderRadius: 10,
                  padding: "16px 18px",
                  borderLeft: `4px solid ${T.gold2}`
                }}>
                  {results.summary}
                </div>
              </Card>
            )}
            {results.themes?.length > 0 && (
              <Card style={{ padding: 20 }} className="fu2">
                <SH children="Theological themes" />
                {results.themes.map((th, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12.5, color: T.ink2 }}>{th.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 500, color: th.color }}>{th.pct}%</span>
                    </div>
                    <ProgressBar pct={th.pct} color={th.color} height={5} />
                  </div>
                ))}
              </Card>
            )}
            {results.delivery?.length > 0 && (
              <Card style={{ padding: 20 }} className="fu3">
                <SH children="Tone & delivery" />
                {results.delivery.map((r, i) => (
                  <div key={i} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: i < results.delivery.length - 1 ? `1px solid ${T.parch3}` : "none"
                  }}>
                    <span style={{ fontSize: 12.5, color: T.ink3 }}>{r.k}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: T.ink }}>{r.v}</span>
                  </div>
                ))}
              </Card>
            )}
            {results.newsletter && (
              <Card style={{ padding: 22, gridColumn: "1/-1" }} className="fu4">
                <SH children="Newsletter copy" />
                <div style={{
                  fontFamily: display,
                  fontSize: 14.5,
                  lineHeight: 1.9,
                  color: T.ink2,
                  fontStyle: "italic",
                  background: T.parch2,
                  borderRadius: 10,
                  padding: "16px 18px"
                }}>
                  {results.newsletter}
                </div>
              </Card>
            )}
            {results.questions?.length > 0 && (
              <Card style={{ padding: 22, gridColumn: "1/-1" }} className="fu5">
                <SH children="Small group discussion questions" />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {results.questions.map((q, i) => (
                    <div key={i} style={{
                      display: "flex",
                      gap: 12,
                      padding: "12px 14px",
                      background: T.parch2,
                      borderRadius: 10,
                      border: `1px solid ${T.parch3}`
                    }}>
                      <div style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: T.goldbg,
                        border: `1px solid ${T.goldborder}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 2
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 500, color: T.gold }}>{i + 1}</span>
                      </div>
                      <span style={{ fontFamily: display, fontSize: 14, lineHeight: 1.65, color: T.ink }}>{q}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ChaptersTab = ({ results }) => {
  const [expanded, setExpanded] = useState(null);
  const chapters = Array.isArray(results.chapters) ? results.chapters : [];
  const colors = ["#b8860b", "#3a5a40", "#1e3a5f", "#6b3a8b", "#8b3a2a"];

  return (
    <div style={{ overflowY: "auto", padding: "24px 32px", height: "100%" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {chapters.length === 0 ? (
          <div style={{ textAlign: "center", color: T.ink4, fontSize: 13, padding: "60px 0" }}>
            No chapters detected — AI insights require a GEMINI_API_KEY.
          </div>
        ) : chapters.map((ch, i) => (
          <div key={i} style={{
            background: T.white,
            border: `1px solid ${T.parch3}`,
            borderRadius: 14,
            marginBottom: 10,
            overflow: "hidden",
            borderLeft: `4px solid ${colors[i % colors.length]}`,
            animation: `fadeUp .35s ${i * 0.08}s ease both`,
            opacity: 0,
            animationFillMode: "both"
          }}>
            <div onClick={() => setExpanded(expanded === i ? null : i)}
              style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
              <div style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                flexShrink: 0,
                background: `${colors[i % colors.length]}18`,
                border: `1px solid ${colors[i % colors.length]}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: colors[i % colors.length] }}>{i + 1}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: display, fontSize: 14.5, fontWeight: 500, color: T.ink }}>{ch.label}</div>
                <div style={{ fontSize: 11.5, color: T.ink5, marginTop: 2 }}>{ch.start} – {ch.end}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={T.ink5} strokeWidth="1.5"
                style={{ transform: expanded === i ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}>
                <path d="M4 6l4 4 4-4" />
              </svg>
            </div>
            {expanded === i && (
              <div style={{ padding: "0 18px 16px", borderTop: `1px solid ${T.parch3}` }}>
                <div style={{ paddingTop: 14, fontFamily: display, fontSize: 14, color: T.ink2, lineHeight: 1.8, fontStyle: "italic" }}>
                  {ch.summary}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ExportTab = ({ results, jobId }) => {
  const [downloading, setDownloading] = useState({});
  const [error, setError] = useState(null);

  const resolvedJobId = jobId || results?.id;

  const formats = [
    { id: "txt", icon: "📝", name: "Plain text", ext: "txt", desc: "Clean transcript with summary and discussion questions" },
    { id: "srt", icon: "💬", name: "Subtitle file", ext: "srt", desc: "Time-coded captions ready for video editing software" },
    { id: "docx", icon: "📄", name: "Word document", ext: "docx", desc: "Formatted document for editing and sharing" },
    { id: "json", icon: "🗂", name: "Raw JSON", ext: "json", desc: "Complete structured data for custom processing" },
  ];

  const download = async format => {
    if (!resolvedJobId) { setError("Job ID not available — please re-upload."); return; }
    setError(null);
    setDownloading(d => ({ ...d, [format]: true }));
    try {
      const res = await apiFetch(`/export/${resolvedJobId}/${format}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(body.error || `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const base = (results?.fileName || 'sermon').replace(/\.[^/.]+$/, '');
      a.download = `${base}.${format}`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      setDownloading(d => ({ ...d, [format]: 'done' }));
      setTimeout(() => setDownloading(d => ({ ...d, [format]: false })), 2500);
    } catch (err) {
      setError(err.message);
      setDownloading(d => ({ ...d, [format]: false }));
    }
  };

  return (
    <div style={{ overflowY: "auto", padding: "24px 32px", height: "100%" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <ErrorBanner message={error} onClose={() => setError(null)} />
        <div className="fu" style={{ marginBottom: 20 }}>
          <SH children="Export formats" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {formats.map((f, i) => {
              const state = downloading[f.id];
              return (
                <div key={f.id} style={{
                  background: T.white,
                  border: `1px solid ${T.parch3}`,
                  borderRadius: 12,
                  padding: 18,
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  animation: `fadeUp .3s ${i * 0.04}s ease both`,
                  opacity: 0,
                  animationFillMode: "both"
                }}>
                  <div style={{ fontSize: 20, flexShrink: 0, lineHeight: 1 }}>{f.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: 3 }}>
                      <span style={{ fontFamily: display, fontSize: 14, fontWeight: 500, color: T.ink }}>{f.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 500, background: T.parch2, color: T.ink4, padding: "2px 7px", borderRadius: 5 }}>.{f.ext}</span>
                    </div>
                    <div style={{ fontSize: 12, color: T.ink3, lineHeight: 1.55, marginBottom: 10 }}>{f.desc}</div>
                    <button onClick={() => download(f.id)} disabled={state === true}
                      style={{
                        fontSize: 12,
                        padding: "5px 14px",
                        background: state === 'done' ? T.sagebg : state ? T.parch3 : T.ink,
                        border: state === 'done' ? `1px solid ${T.sageborder}` : state ? `1px solid ${T.parch4}` : "none",
                        borderRadius: 7,
                        color: state === 'done' ? T.sage : state ? T.ink4 : T.gold3,
                        fontWeight: 500,
                        cursor: state ? 'default' : 'pointer',
                        fontFamily: "'Instrument Sans',system-ui,sans-serif",
                        transition: "all .2s",
                        opacity: state === true ? 0.6 : 1
                      }}>
                      {state === 'done' ? "✓ Downloaded" : state ? "Preparing…" : "↓ Download"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {resolvedJobId && (
          <div style={{
            marginTop: 8,
            padding: "10px 14px",
            background: T.parch2,
            borderRadius: 10,
            fontSize: 11.5,
            color: T.ink4,
            border: `1px solid ${T.parch3}`,
            fontFamily: "monospace"
          }}>
            Job ID: {resolvedJobId}
          </div>
        )}
      </div>
    </div>
  );
};

const WorkspaceStage = ({ results, jobId }) => {
  const [tab, setTab] = useState("transcript");
  const TABS = [
    { id: "transcript", label: "Transcript" },
    { id: "highlights", label: "Highlights" },
    { id: "insights", label: "AI Insights" },
    { id: "chapters", label: "Chapters" },
    { id: "export", label: "Export" },
  ];

  if (!results) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: T.ink4 }}>
      Loading results…
    </div>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Stats bar */}
      <div style={{
        background: T.white,
        borderBottom: `1px solid ${T.parch3}`,
        padding: "12px 24px",
        flexShrink: 0
      }} className="fi">
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {[
            { v: (results.wordCount || 0).toLocaleString(), l: "words" },
            { v: results.confidence ? `${Number(results.confidence).toFixed(1)}%` : "–", l: "confidence" },
            { v: results.duration || "–", l: "duration" },
            { v: String(results.speakers?.length || 0), l: "speakers" },
            { v: String(results.verses?.length || 0), l: "verses" },
            { v: String(results.highlights?.length || 0), l: "highlights" },
            { v: String(results.chapters?.length || 0), l: "chapters" },
          ].map(s => (
            <div key={s.l} style={{
              background: T.parch2,
              borderRadius: 8,
              padding: "6px 14px",
              textAlign: "center",
              border: `1px solid ${T.parch3}`
            }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: T.ink, fontFamily: display }}>{s.v}</div>
              <div style={{ fontSize: 10, color: T.ink4, marginTop: 1 }}>{s.l}</div>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <Tag color="#5a9e64" bg="rgba(58,90,64,.1)" border="rgba(58,90,64,.3)">
            <Dot color="#5a9e64" size={6} /> Transcription complete
          </Tag>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        background: T.white,
        borderBottom: `1px solid ${T.parch3}`,
        padding: "0 24px",
        display: "flex",
        gap: 0,
        flexShrink: 0
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "12px 18px",
            border: "none",
            background: "transparent",
            fontSize: 13,
            fontWeight: tab === t.id ? 500 : 400,
            color: tab === t.id ? T.ink : T.ink4,
            borderBottom: tab === t.id ? `2px solid ${T.gold2}` : "2px solid transparent",
            cursor: "pointer",
            transition: "all .15s"
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {tab === "transcript" && <TranscriptTab results={results} />}
        {tab === "highlights" && <HighlightsTab results={results} />}
        {tab === "insights" && <InsightsTab results={results} />}
        {tab === "chapters" && <ChaptersTab results={results} />}
        {tab === "export" && <ExportTab results={results} jobId={jobId} />}
      </div>
    </div>
  );
};

/* ══ ROOT APP ════════════════════════════════════════════════ */
const ShepherdTranscription = () => {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState("");
  const [fileName, setFileName] = useState("");
  const [results, setResults] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [currentView, setCurrentView] = useState("landing");
  const [dashboardJobs, setDashboardJobs] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loadingJobs] = useState(false);
  const pollRef = useRef(null);

  // Load jobs from sessionStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('shepherd_jobs') || '[]');
      setDashboardJobs(saved);
      setRecentJobs(saved.slice(0, 5));
    } catch { }
  }, []);

  const persistJobs = (jobs) => {
    setDashboardJobs(jobs);
    setRecentJobs(jobs.slice(0, 5));
    sessionStorage.setItem('shepherd_jobs', JSON.stringify(jobs));
  };

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const startPolling = useCallback((jid) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await apiFetch(`/jobs/${jid}`);
        if (!res.ok) {
          if (res.status === 404) {
            stopPolling();
            alert('Job not found on server.');
            setCurrentView("upload");
          }
          return;
        }

        const job = await res.json();
        setProgress(job.progress || 0);
        setStep(job.step || "");

        if (job.status === 'completed') {
          stopPolling();
          setResults(job.results || job);
          setCurrentView("workspace");

          // Update job in dashboard
          const updatedJobs = dashboardJobs.map(j => 
            j.id === jid ? { ...j, status: 'completed', wordCount: job.results?.wordCount, durationSeconds: job.results?.durationSeconds } : j
          );
          if (!dashboardJobs.find(j => j.id === jid)) {
            updatedJobs.unshift({
              id: jid,
              fileName: job.fileName,
              fileSize: job.fileSize,
              status: 'completed',
              createdAt: job.createdAt,
              wordCount: job.results?.wordCount,
              durationSeconds: job.results?.durationSeconds
            });
          }
          persistJobs(updatedJobs.slice(0, 20));

        } else if (job.status === 'failed') {
          stopPolling();
          alert(`Transcription failed: ${job.error || 'Unknown error'}`);
          setCurrentView("upload");
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1500);
  }, [dashboardJobs]);

  const openJob = useCallback(async (job) => {
    setJobId(job.id);
    setFileName(job.fileName);

    if (job.status === 'completed') {
      try {
        const res = await apiFetch(`/jobs/${job.id}`);
        if (!res.ok) throw new Error('Failed to load job');
        const data = await res.json();
        setResults(data.results || data);
        setCurrentView("workspace");
      } catch (err) {
        alert('Could not load results — job may have expired.');
      }
    } else if (job.status === 'processing' || job.status === 'queued') {
      setProgress(job.progress || 0);
      setStep(job.step || "");
      setCurrentView("processing");
      startPolling(job.id);
    }
  }, [startPolling]);

  const deleteJob = useCallback((id) => {
    const updated = dashboardJobs.filter(j => j.id !== id);
    persistJobs(updated);
  }, [dashboardJobs]);

  const startProcessing = useCallback(async (file) => {
    setFileName(file.name);
    setCurrentView("processing");
    setProgress(0);
    setStep("Uploading…");
    setResults(null);
    setJobId(null);

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const res = await apiFetch('/transcribe', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');

      const { jobId: jid } = await res.json();
      setJobId(jid);

      // Add to dashboard
      const newJob = {
        id: jid,
        fileName: file.name,
        fileSize: file.size,
        status: 'processing',
        progress: 0,
        createdAt: new Date().toISOString()
      };
      persistJobs([newJob, ...dashboardJobs].slice(0, 20));
      startPolling(jid);

    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed: ' + err.message);
      setCurrentView("upload");
    }
  }, [dashboardJobs, startPolling]);

  const navigate = (view) => {
    setCurrentView(view);
  };

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: T.parch }}>
        <TopBar currentView={currentView} onNavigate={navigate} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {currentView === "landing" && <LandingPage onNavigate={navigate} />}
          {currentView === "upload" && (
            <UploadStage 
              onFileSelect={startProcessing} 
              onOpenJob={openJob} 
              recentJobs={recentJobs}
              loadingJobs={loadingJobs}
            />
          )}
          {currentView === "dashboard" && (
            <DashboardPage 
              jobs={dashboardJobs}
              onOpenJob={openJob}
              onDeleteJob={deleteJob}
              onNewTranscription={() => navigate("upload")}
            />
          )}
          {currentView === "processing" && <ProcessingStage fileName={fileName} progress={progress} step={step} />}
          {currentView === "workspace" && results && <WorkspaceStage results={results} jobId={jobId} />}
        </div>
      </div>
    </>
  );
};

export default ShepherdTranscription;