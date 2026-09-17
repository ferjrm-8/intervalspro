import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Volume2, VolumeX, Volume1, Volume, Sparkles, X, 
  Play, Radio, Bell, ShieldAlert, Check, Mic
} from 'lucide-react';
import { AudioSettings, SoundTheme, SoundVolume } from '../types';
import { audio } from '../utils/audio';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AudioSettingsModal({ isOpen, onClose }: AudioSettingsModalProps) {
  const [settings, setSettings] = useState<AudioSettings>(() => audio.getSettings());
  const [tested, setTested] = useState(false);

  if (!isOpen) return null;

  const handleVolumeChange = (vol: SoundVolume) => {
    const updated = { ...settings, volume: vol };
    setSettings(updated);
    audio.saveSettings({ volume: vol });
    audio.setMute(false);
  };

  const handleThemeChange = (theme: SoundTheme) => {
    const updated = { ...settings, theme };
    setSettings(updated);
    audio.saveSettings({ theme });
  };

  const handleToggleVoice = () => {
    const next = !settings.voiceEnabled;
    const updated = { ...settings, voiceEnabled: next };
    setSettings(updated);
    audio.saveSettings({ voiceEnabled: next });
    if (next) {
      audio.speak('Voz en español activada');
    }
  };

  const handleToggleVibration = () => {
    const next = !settings.vibrationEnabled;
    const updated = { ...settings, vibrationEnabled: next };
    setSettings(updated);
    audio.saveSettings({ vibrationEnabled: next });
    if (next) {
      audio.triggerVibrate([100, 50, 100]);
    }
  };

  const handleTestSound = () => {
    setTested(true);
    audio.testCurrentSound();
    setTimeout(() => setTested(false), 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="bg-[#111111] border border-zinc-800 p-6 rounded-2xl max-w-md w-full shadow-2xl text-white"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black border border-zinc-800 flex items-center justify-center text-[#CCFF00]">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-tight text-white">
                Potencia de Audio y Avisos
              </h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Configura el volumen máximo y tipo de sonido
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Volume Level selector */}
        <div className="mt-5 flex flex-col gap-2">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center justify-between">
            <span>Potencia de Salida (Loudness Boost)</span>
            <span className="text-[#CCFF00] font-mono">
              {settings.volume === 'ultra' ? 'ULTRA POTENTE (+100%)' : settings.volume === 'high' ? 'ALTO (+40%)' : 'NORMAL (100%)'}
            </span>
          </label>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleVolumeChange('normal')}
              className={`py-3 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                settings.volume === 'normal'
                  ? 'bg-black border-[#CCFF00] text-white shadow-sm'
                  : 'bg-black/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Volume className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-tight">Normal</span>
              <span className="text-[8px] text-zinc-500 font-bold uppercase">Interior</span>
            </button>

            <button
              onClick={() => handleVolumeChange('high')}
              className={`py-3 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                settings.volume === 'high'
                  ? 'bg-black border-[#CCFF00] text-white shadow-sm'
                  : 'bg-black/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Volume1 className="w-4 h-4 text-[#CCFF00]" />
              <span className="text-[10px] font-black uppercase tracking-tight">Fuerte</span>
              <span className="text-[8px] text-zinc-500 font-bold uppercase">Gimnasio</span>
            </button>

            <button
              onClick={() => handleVolumeChange('ultra')}
              className={`py-3 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                settings.volume === 'ultra'
                  ? 'bg-black border-[#CCFF00] text-[#CCFF00] shadow-sm shadow-[#CCFF00]/10'
                  : 'bg-black/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Volume2 className="w-4 h-4 text-[#CCFF00] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-tight">Ultra Fuerte</span>
              <span className="text-[8px] text-[#CCFF00]/70 font-bold uppercase">Exterior / Música</span>
            </button>
          </div>
        </div>

        {/* Sound Theme Profiles */}
        <div className="mt-5 flex flex-col gap-2">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            Estilo de Tono Acústico
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'whistle' as SoundTheme, label: 'Silbato Árbitro', desc: 'Penetra viento y ruido' },
              { id: 'boxing' as SoundTheme, label: 'Campana Boxeo', desc: 'Gong resonante y claro' },
              { id: 'buzzer' as SoundTheme, label: 'Bocina Pabellón', desc: 'Alarma grave contundente' },
              { id: 'digital' as SoundTheme, label: 'Beep Digital Hi-Fi', desc: 'Pulso electrónico 2.4kHz' },
            ].map((t) => {
              const active = settings.theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    active
                      ? 'bg-black border-[#CCFF00] text-white'
                      : 'bg-black/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-black uppercase tracking-tight ${active ? 'text-[#CCFF00]' : 'text-zinc-200'}`}>
                      {t.label}
                    </span>
                    {active && <Check className="w-3 h-3 text-[#CCFF00]" />}
                  </div>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase mt-1">
                    {t.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Voice Assistant & Vibration Toggles */}
        <div className="mt-5 flex flex-col gap-2.5 bg-black p-3.5 rounded-xl border border-zinc-800">
          
          {/* Voice Prompt Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-[#CCFF00]" />
              <div>
                <div className="text-[11px] font-black uppercase tracking-tight text-zinc-200">
                  Voz de Asistente en Español
                </div>
                <div className="text-[9px] text-zinc-500 font-bold uppercase">
                  Avisa "Ritmo Fuerte", "Calentamiento", etc.
                </div>
              </div>
            </div>
            <button
              onClick={handleToggleVoice}
              className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer border ${
                settings.voiceEnabled ? 'bg-[#CCFF00] border-[#CCFF00]' : 'bg-zinc-800 border-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-black transition-transform ${
                  settings.voiceEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-zinc-900 my-0.5" />

          {/* Haptic Vibration Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-[11px] font-black uppercase tracking-tight text-zinc-200">
                  Vibración Háptica (Móvil)
                </div>
                <div className="text-[9px] text-zinc-500 font-bold uppercase">
                  Vibra en cambios de intervalo
                </div>
              </div>
            </div>
            <button
              onClick={handleToggleVibration}
              className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer border ${
                settings.vibrationEnabled ? 'bg-[#CCFF00] border-[#CCFF00]' : 'bg-zinc-800 border-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-black transition-transform ${
                  settings.vibrationEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Sound Test Button & Close */}
        <div className="mt-6 flex gap-2.5">
          <button
            onClick={handleTestSound}
            className="flex-1 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${tested ? 'text-[#CCFF00] animate-spin' : ''}`} />
            Probar Sonido Ahora
          </button>
          
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#CCFF00]/5 active:scale-95"
          >
            Guardar y Listo
          </button>
        </div>

      </motion.div>
    </div>
  );
}
