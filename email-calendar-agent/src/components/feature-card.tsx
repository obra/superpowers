"use client";

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: string;
  onClick?: () => void;
  className?: string;
}

export function FeatureCard({
  title,
  subtitle,
  icon: Icon,
  gradient,
  onClick,
  className
}: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn("group cursor-pointer", className)}
      onClick={onClick}
    >
      <Card className={cn(
        "relative overflow-hidden border-0 h-44",
        "bg-gradient-to-br", gradient,
        "shadow-xl shadow-black/10",
        "group-hover:shadow-2xl group-hover:shadow-black/20",
        "transition-all duration-300"
      )}>
        <CardContent className="p-6 h-full flex flex-col justify-between relative z-10">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-white/20 blur-xl" />
          </div>

          {/* Icon */}
          <div className="relative z-20">
            <motion.div
              className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4"
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Icon className="w-6 h-6 text-white drop-shadow-sm" />
            </motion.div>
          </div>

          {/* Content */}
          <div className="relative z-20">
            <h3 className="text-xl font-bold text-white mb-1 drop-shadow-sm">
              {title}
            </h3>
            <p className="text-white/80 text-sm drop-shadow-sm">
              {subtitle}
            </p>
          </div>

          {/* Hover effect overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}