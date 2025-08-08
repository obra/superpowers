"use client";

import React from "react";
import { motion } from "framer-motion";
import { Home, MessageSquare, Calendar, Settings, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "settings", label: "Settings", icon: Settings },
];

export function BottomNavigation({ 
  activeTab, 
  onTabChange, 
  className 
}: BottomNavigationProps) {
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-black/95 backdrop-blur-xl border-t border-white/10",
      "px-4 pb-safe-area-inset-bottom",
      className
    )}>
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "relative flex flex-col items-center justify-center",
                "w-16 h-12 rounded-xl transition-colors duration-200",
                isActive 
                  ? "text-white" 
                  : "text-gray-400 hover:text-gray-300"
              )}
              whileTap={{ scale: 0.95 }}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/30"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              {/* Icon */}
              <motion.div
                animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Icon className={cn(
                  "w-5 h-5 mb-0.5",
                  isActive && "drop-shadow-lg"
                )} />
              </motion.div>
              
              {/* Label */}
              <span className={cn(
                "text-xs font-medium",
                isActive && "drop-shadow-sm"
              )}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}