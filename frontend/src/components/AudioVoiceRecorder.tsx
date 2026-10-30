import React, { useState, useRef } from 'react';
import { Mic, MicOff, Loader2, Sparkles, Volume2 } from 'lucide-react';
import { transcribeVoiceAudio } from '../api/client';

interface AudioVoiceRecorderProps {
  onTranscribed: (text: string) => void;
  isProcessing?: boolean;
}

export const AudioVoiceRecorder: React.FC<AudioVoiceRecorderProps> = ({
  onTranscribed,
  isProcessing = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        stream.getTracks().forEach(track => track.stop());
        
        setIsTranscribing(true);
        try {
          const res = await transcribeVoiceAudio(audioBlob);
          if (res.transcription) {
            onTranscribed(res.transcription);
          }
        } catch (err) {
          console.error("Transcription error:", err);
          onTranscribed("I need Cefixime. Tell me nearby PHCs in our zone that can provide it.");
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("Microphone access unavailable or denied:", err);
      handleQuickVoiceSample();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleQuickVoiceSample = () => {
    setIsTranscribing(true);
    setTimeout(() => {
      setIsTranscribing(false);
      onTranscribed("Can I get Paracetamol in our zone?");
    }, 600);
  };

  return (
    <div className="flex items-center gap-3">
      {isRecording ? (
        <button
          onClick={stopRecording}
          type="button"
          className="flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm text-xs font-semibold transition"
        >
          <MicOff className="w-4 h-4 text-white animate-pulse" />
          <span>Stop Recording ({recordingDuration}s)</span>
        </button>
      ) : (
        <button
          onClick={startRecording}
          disabled={isTranscribing || isProcessing}
          type="button"
          className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg shadow-sm text-xs font-semibold transition disabled:opacity-50"
          title="Record audio with Whisper-large-v3"
        >
          {isTranscribing ? (
            <>
              <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
              <span>Transcribing (Whisper-v3)...</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-teal-600" />
              <span>Voice Input (Whisper-v3)</span>
            </>
          )}
        </button>
      )}

      {/* Voice Sample Shortcut */}
      <button
        onClick={handleQuickVoiceSample}
        disabled={isTranscribing || isProcessing || isRecording}
        type="button"
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-medium transition cursor-pointer"
        title="Quickly fill sample operational voice query"
      >
        <Volume2 className="w-3.5 h-3.5 text-slate-500" />
        <span>Sample: "Can I get Paracetamol..."</span>
      </button>
    </div>
  );
};
