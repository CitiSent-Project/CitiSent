import React, { useState } from "react";
import { motion } from "framer-motion";
import { IoCopyOutline, IoCheckmark } from "react-icons/io5";

/**
 * CopyButton Component
 *
 * Micro-interaction component with clipboard interaction and animated visual feedback.
 *
 * @param {string} text - The text string to copy to the system clipboard
 * @param {string} [title] - Tooltip text on hover (defaults to "Copy to clipboard")
 * @param {string} [className] - Additional Tailwind classes
 * @param {boolean} [showText] - Whether to render a label alongside the icon
 */
export function CopyButton({
  text,
  title = "Copy to clipboard",
  className = "",
  showText = false,
  textLabel = "Copy",
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e) {
    e.stopPropagation();
    if (!text) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-https or older browser contexts
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied!" : title}
      className={`inline-flex items-center gap-1.5 p-1 rounded-md transition-all cursor-pointer ${
        copied
          ? "text-emerald-400 bg-emerald-950/60 border border-emerald-800/80"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
      } ${className}`}
    >
      <motion.span
        key={copied ? "check" : "copy"}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        className="flex items-center"
      >
        {copied ? (
          <IoCheckmark className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <IoCopyOutline className="w-3.5 h-3.5" />
        )}
      </motion.span>
      {showText && (
        <span className="text-[11px] font-medium">
          {copied ? "Copied" : textLabel}
        </span>
      )}
    </button>
  );
}
