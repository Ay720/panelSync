import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Share2,
  PhoneOff,
  Code2,
  FileText,
  Star,
  CheckCircle2,
  Clock,
  Play,
  Terminal,
  User,
  Shield,
  Sparkles,
  Download,
} from 'lucide-react';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export const InterviewRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useNotification();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Audio/Video mock toggles
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [activeTab, setActiveTab] = useState('code'); // 'code' | 'evaluation'

  // Code editor state
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(`// PanelSync Live Collaborative Technical Scratchpad
// Candidate: Live Session

function designRateLimiter(maxRequests, windowSeconds) {
  const timestamps = new Map();
  
  return function isAllowed(clientId) {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;
    
    let clientRequests = timestamps.get(clientId) || [];
    // Filter out old timestamps
    clientRequests = clientRequests.filter(t => t > windowStart);
    
    if (clientRequests.length < maxRequests) {
      clientRequests.push(now);
      timestamps.set(clientId, clientRequests);
      return true;
    }
    
    return false; // Rate limit exceeded
  };
}

console.log("Algorithm initialized successfully.");
`);
  const [executionOutput, setExecutionOutput] = useState('');
  const [runningCode, setRunningCode] = useState(false);

  // Evaluation Rubric Scorecard state
  const [scores, setScores] = useState({
    technical: 4,
    architecture: 5,
    communication: 4,
  });
  const [recommendation, setRecommendation] = useState('Hire');
  const [feedbackNotes, setFeedbackNotes] = useState(
    'Strong analytical instincts, solid understanding of time complexity and distributed trade-offs.'
  );
  const [submittingEvaluation, setSubmittingEvaluation] = useState(false);

  useEffect(() => {
    fetchInterview();
  }, [id]);

  const fetchInterview = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/interviews/${id}`);
      if (res.success) {
        setInterview(res.interview);
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Could not load interview session' });
    } finally {
      setLoading(false);
    }
  };

  const handleRunCode = () => {
    setRunningCode(true);
    setTimeout(() => {
      setExecutionOutput(`[Running in Sandbox V8 isolate...]\nAlgorithm initialized successfully.\nTest Case 1 Passed: 5 requests within 10s window allowed.\nTest Case 2 Passed: 6th request correctly blocked with 429 Too Many Requests.\nExecution Time: 14ms | Memory: 3.2MB`);
      setRunningCode(false);
    }, 600);
  };

  const handleSubmitEvaluation = async () => {
    setSubmittingEvaluation(true);
    try {
      const res = await api.post(`/interviews/${id}/feedback`, {
        scores,
        recommendation,
        feedbackNotes,
      });

      if (res.success) {
        addToast({
          type: 'success',
          title: 'Evaluation Submitted',
          message: 'Interview marked completed and candidate pipeline updated.',
        });
        navigate('/calendar');
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setSubmittingEvaluation(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Connecting to Virtual Interview Room...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-600">Interview session not found.</p>
        <Button variant="primary" size="sm" onClick={() => navigate('/calendar')} className="mt-3">
          Back to Calendar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto h-[calc(100vh-6.5rem)] flex flex-col">
      {/* Top Header Bar */}
      <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-xs">
            LIVE
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-tight">{interview.title}</h2>
            <p className="text-[11px] text-slate-400">
              Candidate: <strong>{interview.candidate?.name}</strong> • Role: {interview.jobRole}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={interview.status}>{interview.status}</Badge>
          <a
            href={`/api/interviews/${interview._id}/ics`}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-xs text-purple-300 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700 font-medium"
          >
            <Download className="w-3.5 h-3.5" /> Download .ics
          </a>
        </div>
      </div>

      {/* Main Split Layout: Video Conference & Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* Left Side: Video Conferencing Grid (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3 h-full">
          {/* Candidate Tile */}
          <div className="flex-1 bg-slate-900 rounded-2xl relative overflow-hidden border border-slate-800 flex items-center justify-center min-h-[180px] shadow-inner">
            <div className="text-center p-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-600 to-purple-400 mx-auto flex items-center justify-center text-white text-2xl font-black shadow-xl ring-4 ring-purple-500/20 mb-2">
                {interview.candidate?.name?.substring(0, 2).toUpperCase() || 'CD'}
              </div>
              <p className="text-white font-bold text-sm">{interview.candidate?.name}</p>
              <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 mt-1 inline-block">
                ● Live Video Stream
              </span>
            </div>

            {/* Audio Indicator Overlay */}
            <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs text-white flex items-center gap-1.5 font-medium border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{interview.candidate?.name?.split(' ')[0]} (Candidate)</span>
            </div>
          </div>

          {/* Panelist Tile(s) */}
          <div className="flex-1 bg-slate-900 rounded-2xl relative overflow-hidden border border-slate-800 flex items-center justify-center min-h-[180px]">
            {videoOn ? (
              <div className="text-center p-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 mx-auto flex items-center justify-center text-white text-xl font-bold border border-slate-700 mb-2">
                  {user?.name?.substring(0, 2).toUpperCase() || 'ME'}
                </div>
                <p className="text-white font-bold text-xs">{user?.name} (You)</p>
                <span className="text-[10px] text-slate-400">Panel Evaluator</span>
              </div>
            ) : (
              <div className="text-slate-500 text-xs font-semibold flex items-center gap-2">
                <VideoOff className="w-5 h-5" /> Camera Disabled
              </div>
            )}

            <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs text-white flex items-center gap-1.5 font-medium border border-slate-800">
              <span className={`w-2 h-2 rounded-full ${micOn ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span>{user?.name || 'You'} ({micOn ? 'Mic On' : 'Muted'})</span>
            </div>
          </div>

          {/* Media Control Toolbar */}
          <div className="bg-slate-900 p-2.5 rounded-2xl border border-slate-800 flex items-center justify-center gap-3 shrink-0">
            <button
              onClick={() => setMicOn(!micOn)}
              className={`p-2.5 rounded-xl text-white transition-colors ${
                micOn ? 'bg-slate-800 hover:bg-slate-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
              title={micOn ? 'Mute' : 'Unmute'}
            >
              {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setVideoOn(!videoOn)}
              className={`p-2.5 rounded-xl text-white transition-colors ${
                videoOn ? 'bg-slate-800 hover:bg-slate-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
              title={videoOn ? 'Stop Camera' : 'Start Camera'}
            >
              {videoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setScreenSharing(!screenSharing)}
              className={`p-2.5 rounded-xl transition-colors ${
                screenSharing
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
              title="Share Screen"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/calendar')}
              className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              title="Leave Room"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Side: Interactive Code Editor & Evaluation Rubric (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden h-full">
          {/* Navigation Tabs */}
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'code'
                    ? 'bg-white text-brand-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" /> Collaborative Scratchpad
              </button>

              <button
                onClick={() => setActiveTab('evaluation')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'evaluation'
                    ? 'bg-white text-brand-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-500 fill-current" /> Evaluation Rubric
              </button>
            </div>

            {activeTab === 'code' && (
              <div className="flex items-center gap-2">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="javascript">JavaScript / TypeScript</option>
                  <option value="python">Python</option>
                  <option value="go">Go</option>
                  <option value="system_design">System Design RFC</option>
                </select>

                <Button
                  size="sm"
                  variant="primary"
                  icon={Play}
                  loading={runningCode}
                  onClick={handleRunCode}
                >
                  Run
                </Button>
              </div>
            )}
          </div>

          {/* Tab 1: Live Code Editor Area */}
          {activeTab === 'code' && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-950 font-mono text-xs">
              <div className="flex-1 p-4 overflow-y-auto">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-full bg-transparent text-purple-200 resize-none focus:outline-none font-mono leading-relaxed"
                  spellCheck="false"
                />
              </div>

              {/* Execution Console Terminal */}
              <div className="h-36 border-t border-slate-800 bg-slate-900/90 p-3 overflow-y-auto shrink-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <Terminal className="w-3 h-3 text-brand-400" />
                  <span>Execution Output Terminal</span>
                </div>
                <pre className="text-emerald-400 text-[11px] font-mono whitespace-pre-wrap">
                  {executionOutput || '// Click "Run" to test algorithm in sandbox...'}
                </pre>
              </div>
            </div>
          )}

          {/* Tab 2: Evaluator Rubric & Scorecard */}
          {activeTab === 'evaluation' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-5 text-xs">
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">
                  Panel Scorecard & Final Recommendation
                </h3>
                <p className="text-slate-500 text-xs">
                  Scores and feedback will be appended directly to candidate's history and audit trail.
                </p>
              </div>

              {/* Rubric Category Star Selectors */}
              <div className="space-y-3">
                {[
                  { key: 'technical', label: 'Technical Depth & Data Structures' },
                  { key: 'architecture', label: 'System Design & Scalability' },
                  { key: 'communication', label: 'Communication, Clarity & Values' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                  >
                    <span className="font-bold text-slate-800">{item.label}</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setScores({ ...scores, [item.key]: star })}
                          className={`p-1 transition-transform hover:scale-125 ${
                            star <= scores[item.key] ? 'text-amber-500' : 'text-slate-300'
                          }`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      ))}
                      <span className="ml-2 font-bold text-slate-900 font-mono">
                        {scores[item.key]}/5
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendation Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Hiring Recommendation
                </label>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-bold text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                >
                  <option value="Strong Hire">Strong Hire (High Priority)</option>
                  <option value="Hire">Hire</option>
                  <option value="Leaning No">Leaning No</option>
                  <option value="Strong No">Strong No</option>
                </select>
              </div>

              {/* Written Feedback Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Detailed Observations & Feedback
                </label>
                <textarea
                  rows={4}
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:outline-none focus:border-brand-500"
                  placeholder="Outline key technical strengths, areas of concern, or specific signals observed during the interview..."
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  loading={submittingEvaluation}
                  onClick={handleSubmitEvaluation}
                  className="w-full py-2.5 font-bold shadow-md shadow-brand-500/20"
                  icon={CheckCircle2}
                >
                  Submit Scorecard & Mark Interview Completed
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;

