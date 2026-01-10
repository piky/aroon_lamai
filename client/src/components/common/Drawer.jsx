import { X } from "lucide-react";
import { Button } from "./index";

export function Drawer({ isOpen, onClose, title, children, position = "right" }) {
  if (!isOpen) return null;

  const positionClasses = {
    right: "right-0",
    left: "left-0",
    bottom: "bottom-0",
  };

  const animationClasses = {
    right: "translate-x-0",
    left: "translate-x-0",
    bottom: "translate-y-0",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`absolute ${positionClasses[position]} top-0 h-full w-full max-w-md bg-background shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? animationClasses[position] : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}