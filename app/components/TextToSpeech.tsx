"use client";

import { useState, useEffect, useCallback } from 'react';
import { FaPlay, FaPause, FaStop } from 'react-icons/fa';

interface TextToSpeechProps {
    text: string;
}

export default function TextToSpeech({ text }: TextToSpeechProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
    const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setSpeechSynthesis(window.speechSynthesis);
        }
    }, []);

    useEffect(() => {
        if (speechSynthesis && text) {
            const newUtterance = new SpeechSynthesisUtterance(text);
            setUtterance(newUtterance);

            newUtterance.onend = () => {
                setIsPlaying(false);
            };

            return () => {
                speechSynthesis.cancel();
            };
        }
    }, [speechSynthesis, text]);

    const toggleSpeech = useCallback(() => {
        if (!speechSynthesis || !utterance) return;

        if (isPlaying) {
            speechSynthesis.pause();
        } else {
            if (speechSynthesis.paused) {
                speechSynthesis.resume();
            } else {
                speechSynthesis.speak(utterance);
            }
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying, speechSynthesis, utterance]);

    const stopSpeech = useCallback(() => {
        if (!speechSynthesis) return;
        speechSynthesis.cancel();
        setIsPlaying(false);
    }, [speechSynthesis]);

    return (
        <div className="flex items-center gap-2 my-4">
            <button
                onClick={toggleSpeech}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                aria-label={isPlaying ? "Pause reading" : "Start reading"}
            >
                {isPlaying ? <FaPause /> : <FaPlay />}
                {isPlaying ? 'Pause' : 'Read Article'}
            </button>
            {isPlaying && (
                <button
                    onClick={stopSpeech}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                    aria-label="Stop reading"
                >
                    <FaStop />
                    Stop
                </button>
            )}
        </div>
    );
}