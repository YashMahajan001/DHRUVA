import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Radio, Lock, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [operatorId, setOperatorId] = useState('CDR. V. SHASTRI [OP-7741]');
  const [accessKey, setAccessKey] = useState('aerospace-telemetry-alpha');
  const [showPassword, setShowPassword] = useState(false);
  const [stationRole, setStationRole] = useState('engineer');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('VERIFYING BIOMETRICS & ENCRYPTION KEY...');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInitiateAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = operatorId.trim();
    if (!trimmedId || !accessKey.trim()) {
      setErrorMessage('Please provide both Operator ID and Terminal Access Key.');
      return;
    }

    // DRDO Official Domain Validation
    // If entered credential is an email address, strictly validate official @drdo.gov.in domain
    if (trimmedId.includes('@')) {
      const drdoDomainRegex = /^[a-zA-Z0-9._%+-]+@drdo\.gov\.in$/i;
      if (!drdoDomainRegex.test(trimmedId)) {
        setErrorMessage('Access Denied: Authentication requires an official DRDO credential (@drdo.gov.in).');
        return;
      }
    }
    setErrorMessage('');
    setIsScanning(true);
    let step = 0;

    const interval = setInterval(async () => {
      step += 4;
      setScanStep(step);

      if (step === 24) {
        setScanStatusText('VERIFYING HARDWARE TOKEN & BIOMETRICS...');
      } else if (step === 52) {
        setScanStatusText('ESTABLISHING DIGITAL TWIN REALTIME STREAM...');
      } else if (step === 80) {
        setScanStatusText('SYNCHRONIZING MALE UAV TELEMETRY BUS...');
      } else if (step >= 100) {
        clearInterval(interval);
        setScanStatusText('ACCESS GRANTED // TELEMETRY GATEWAY UNLOCKED');
        await login(operatorId, accessKey, stationRole);
        setTimeout(() => {
          setIsScanning(false);
          navigate('/overview');
        }, 600);
      }
    }, 35);
  };

  return (
    <div className="relative min-h-screen bg-[#090e1b] text-[#dee2f5] flex items-center justify-center p-4 aerospace-grid">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.08)_0,transparent_70%)] pointer-events-none" />

      <div className="relative w-full max-w-xl bg-[#161b29]/95 border border-[#00f0ff]/40 p-8 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.85)] shadow-[#00f0ff]/10 backdrop-blur-2xl">
        {/* Terminal Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/50 flex items-center justify-center text-[#00f0ff] shadow-[0_0_16px_rgba(0,240,255,0.35)] flex-shrink-0">
            <Radio className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display font-bold text-3xl text-[#dbfcff] tracking-tight">
                DHRUVAA
              </h1>
              <span className="bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 text-xs font-mono px-2 py-0.5 rounded uppercase tracking-wider font-semibold">
                v2.4 SECURE
              </span>
            </div>
            <p className="text-xs font-mono text-[#b9cacb] tracking-wider uppercase mt-1">
              AI-Enabled Digital Twin System // Aero Piston Engine Health
            </p>
          </div>
        </div>

        {/* Security Clearance Notice */}
        <div className="bg-[#090e1b]/90 border border-[#3b494b] px-4 py-3 rounded mb-6 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-[#ffb4ab]">
              <Shield className="w-4 h-4 text-[#ffb4ab]" />
              <span className="font-bold tracking-wider">LEVEL 2 // CLASSIFIED FLIGHT ENVELOPE</span>
            </div>
            <span className="text-[11px] text-[#00f0ff]">AUTH PROTOCOL 256-BIT</span>
          </div>
          <div className="flex items-center justify-between text-[#b9cacb] text-[11px] font-mono">
            <span>SYSTEM INTEGRITY: 99.98%</span>
            <span className="text-[#00f0ff]">MIL-STD-810G COMPLIANT</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-2.5 rounded bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-mono">
            {errorMessage}
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleInitiateAuth} className="space-y-4">
          {/* Operator ID */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono text-[#b9cacb] mb-1.5">
              <span>OPERATOR DRDO EMAIL / CALLSIGN</span>
              <span className="text-[10px] text-[#00f0ff] font-bold">CAC VERIFIED</span>
            </div>
            <input
              id="operator-id-input"
              type="text"
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              placeholder="e.g. operator@drdo.gov.in or CDR. V. SHASTRI [OP-7741]"
              required
              className="w-full bg-[#090e1b] text-[#dee2f5] font-mono text-sm px-3.5 py-2.5 rounded border border-[#3b494b] focus:border-[#00f0ff] focus:outline-none transition-colors"
            />
          </div>

          {/* Access Key */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono text-[#b9cacb] mb-1.5">
              <span>TERMINAL ACCESS KEY</span>
              <span className="text-[10px] text-[#849495]">RSA ROTATION: ACTIVE</span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                required
                className="w-full bg-[#090e1b] text-[#dee2f5] font-mono text-sm px-3.5 pr-10 py-2.5 rounded border border-[#3b494b] focus:border-[#00f0ff] focus:outline-none tracking-wider transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b9cacb] hover:text-[#00f0ff] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Station Role */}
          <div>
            <label className="text-xs font-mono text-[#b9cacb] block mb-1.5">
              STATION CONSOLE ASSIGNMENT
            </label>
            <select
              value={stationRole}
              onChange={(e) => setStationRole(e.target.value)}
              className="w-full bg-[#090e1b] text-[#00f0ff] font-mono text-sm px-3.5 py-2.5 rounded border border-[#3b494b] focus:border-[#00f0ff] focus:outline-none transition-colors"
            >
              <option value="controller">Flight Controller (Level 2)</option>
              <option value="engineer">Propulsion Systems Engineer</option>
              <option value="commander">Maintenance Commander</option>
            </select>
          </div>

          {/* Token checkboxes */}
          <div className="space-y-1.5 pt-1 text-xs font-mono text-[#b9cacb]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-[#00f0ff] rounded" />
              <span>Maintain Session via Encrypted FIPS-140 Token</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-[#00f0ff] rounded" />
              <span>Hardware Security Key (YubiKey / CAC) Verified</span>
            </label>
          </div>

          {/* Biometrics Scan progress */}
          {isScanning && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#00f0ff] font-bold animate-pulse">{scanStatusText}</span>
                <span className="text-[#00f0ff] font-bold">{scanStep}%</span>
              </div>
              <div className="w-full h-2 bg-[#090e1b] rounded-full overflow-hidden border border-[#3b494b]/50">
                <div
                  className="h-full bg-gradient-to-r from-[#0053db] to-[#00f0ff] shadow-[0_0_12px_#00f0ff] transition-all duration-150"
                  style={{ width: `${scanStep}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Trigger */}
          <button
            type="submit"
            disabled={isScanning}
            className="w-full mt-3 bg-[#00f0ff]/20 hover:bg-[#00f0ff] text-[#00f0ff] hover:text-[#090e1b] font-display font-bold py-3 px-4 rounded transition-all duration-200 shadow-[0_0_20px_rgba(0,240,255,0.25)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span className="tracking-wider">ACCESS MISSION CONSOLE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Card Footer */}
        <div className="mt-6 pt-4 border-t border-[#3b494b]/50 flex items-center justify-between text-xs font-mono text-[#849495]">
          <span>CONNECTED NODE: NEW DELHI - SAT-LINK 04</span>
          <span className="text-[#00f0ff]">LATENCY: 1.42ms</span>
        </div>
      </div>
    </div>
  );
};
export default Login;
