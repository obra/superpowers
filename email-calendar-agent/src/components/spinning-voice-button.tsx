"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinningVoiceButtonProps {
  className?: string;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
}

export function SpinningVoiceButton({ 
  className, 
  onStartRecording, 
  onStopRecording 
}: SpinningVoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  const handleClick = async () => {
    if (!isRecording) {
      setIsRecording(true);
      setIsSpinning(true);
      onStartRecording?.();
    } else {
      setIsRecording(false);
      setIsSpinning(false);
      onStopRecording?.();
    }
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <motion.button
        onClick={handleClick}
        className={cn(
          "relative w-20 h-20 rounded-full overflow-hidden",
          "bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500",
          "shadow-2xl shadow-purple-500/25",
          "hover:shadow-purple-500/40 transition-all duration-300",
          "focus:outline-none focus:ring-4 focus:ring-purple-500/20",
          isRecording && "ring-4 ring-red-500/30"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
        transition={
          isSpinning 
            ? { 
                duration: 2, 
                repeat: Infinity, 
                ease: "linear" 
              }
            : { 
                duration: 0.3 
              }
        }
      >
        {/* Gradient overlay that spins */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent"
          animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
          transition={
            isSpinning 
              ? { 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "linear" 
                }
              : { 
                  duration: 0.3 
                }
          }
        />
        
        {/* Inner content */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <motion.div
            animate={isRecording ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
          >
            {isRecording ? (
              <MicOff className="w-8 h-8 text-white drop-shadow-lg" />
            ) : (
              <Mic className="w-8 h-8 text-white drop-shadow-lg" />
            )}
          </motion.div>
        </div>

        {/* Pulse effect when recording */}
        {isRecording && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-red-400"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.8, 0, 0.8]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.button>
    </div>
  );
}