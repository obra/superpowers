"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Calendar, Users, MessageSquare } from "lucide-react";
import { FeatureCard } from "@/components/feature-card";
import { SpinningVoiceButton } from "@/components/spinning-voice-button";
import { ChatModal } from "@/components/chat-modal";
import { cn } from "@/lib/utils";

interface HomepageProps {
  className?: string;
}

export function Homepage({ className }: HomepageProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleVoiceStart = () => {
    console.log("Voice recording started");
    // TODO: Implement voice recording logic
  };

  const handleVoiceStop = () => {
    console.log("Voice recording stopped");
    // TODO: Implement voice processing logic
  };

  const handleCardClick = (cardType: string) => {
    console.log(`${cardType} card clicked`);
    // TODO: Implement navigation logic for each card
    if (cardType === "chat") {
      setIsChatOpen(true);
    }
  };

  const cards = [
    {
      title: "Email Management",
      subtitle: "Check and organize your messages",
      icon: Mail,
      gradient: "from-blue-600 to-blue-800",
      type: "email"
    },
    {
      title: "Calendar Events",
      subtitle: "View upcoming meetings",
      icon: Calendar,
      gradient: "from-green-600 to-emerald-800",
      type: "calendar"
    },
    {
      title: "Contacts",
      subtitle: "Manage your contact database",
      icon: Users,
      gradient: "from-purple-600 to-purple-800",
      type: "contacts"
    },
    {
      title: "AI Assistant",
      subtitle: "Chat with your assistant",
      icon: MessageSquare,
      gradient: "from-orange-600 to-red-700",
      type: "chat"
    }
  ];

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900",
      "flex flex-col items-center justify-center p-6 pb-24",
      className
    )}>
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
              Business Command
            </span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            Your intelligent workspace for email, calendar, and productivity management
          </p>
        </motion.div>

        {/* Voice Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-16"
        >
          <SpinningVoiceButton
            onStartRecording={handleVoiceStart}
            onStopRecording={handleVoiceStop}
          />
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto"
        >
          {cards.map((card, index) => (
            <motion.div
              key={card.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
            >
              <FeatureCard
                title={card.title}
                subtitle={card.subtitle}
                icon={card.icon}
                gradient={card.gradient}
                onClick={() => handleCardClick(card.type)}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Footer text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12"
        >
          <p className="text-gray-500 text-sm">
            Tap the microphone to start voice commands or select a card above
          </p>
        </motion.div>
      </div>

      {/* Chat Modal */}
      <ChatModal 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}