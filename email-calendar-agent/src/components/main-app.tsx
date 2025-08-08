"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Homepage } from "@/components/homepage";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ChatModal } from "@/components/chat-modal";

export function MainApp() {
  const [activeTab, setActiveTab] = useState("home");
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    if (tab === "chat") {
      setIsChatOpen(true);
    } else {
      setActiveTab(tab);
      setIsChatOpen(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <Homepage />;
      case "calendar":
        return (
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center pb-24">
            <div className="text-center text-white">
              <h2 className="text-3xl font-bold mb-4">Calendar</h2>
              <p className="text-gray-400">Calendar view coming soon...</p>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center pb-24">
            <div className="text-center text-white">
              <h2 className="text-3xl font-bold mb-4">Settings</h2>
              <p className="text-gray-400">Settings panel coming soon...</p>
            </div>
          </div>
        );
      default:
        return <Homepage />;
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Main content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />

      {/* Chat Modal */}
      <ChatModal 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}