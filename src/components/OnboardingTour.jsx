import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";

const steps = [
  {
    title: "Welcome to FarmEazy!",
    content: "This quick tour shows what each main page does so you can run farm operations faster from day one.",
    selector: null,
  },
  {
    title: "Home",
    content: "Use Home for daily highlights and shortcuts to common tasks.",
    selector: '[data-tour="nav-home"]',
  },
  {
    title: "Dashboard",
    content: "Dashboard gives your complete status at a glance: active farms, crops, irrigation and alerts.",
    selector: '[data-tour="nav-dashboard"]',
  },
  {
    title: "Farms",
    content: "Create and manage farm records here. Keep every field and location organized.",
    selector: '[data-tour="nav-farms"]',
  },
  {
    title: "Crops",
    content: "Track crop lifecycle and growth stage to plan activities and harvests better.",
    selector: '[data-tour="nav-crops"]',
  },
  {
    title: "Irrigation",
    content: "Schedule watering and monitor irrigation timing to reduce waste and improve yield.",
    selector: '[data-tour="nav-irrigation"]',
  },
  {
    title: "Services",
    content: "Explore irrigation and related services for installation, maintenance, and support.",
    selector: '[data-tour="nav-services"]',
  },
  {
    title: "Shopping",
    content: "Buy products and farm essentials from marketplace listings.",
    selector: '[data-tour="nav-shopping"]',
  },
  {
    title: "Support",
    content: "Open support quickly for FAQs, issue reporting, and ticket follow-up.",
    selector: '[data-tour="nav-support"]',
  },
  {
    title: "Notifications",
    content: "Review alerts and updates from all modules in one place.",
    selector: '[data-tour="notifications-button"]',
  },
  {
    title: "Cart",
    content: "Your cart keeps selected products ready for checkout.",
    selector: '[data-tour="cart-button"]',
  },
  {
    title: "Profile Menu",
    content: "Use profile menu for password, orders, communication preferences, and account actions.",
    selector: '[data-tour="profile-menu"]',
  },
  {
    title: "Tour & Theme",
    content: "Use the Tour button anytime to replay this guide. Theme preference is available in Settings under User Preferences.",
    selector: '[data-tour="tour-button"]',
  },
  {
    title: "You're Ready!",
    content: "You are all set. Start from Dashboard, then configure farms, crops, and irrigation in sequence for best productivity.",
    selector: null,
  },
];

export default function OnboardingTour({ onFinish }) {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(true);
  const [targetRect, setTargetRect] = useState(null);
  const [coachPosition, setCoachPosition] = useState({ top: null, left: null, placement: "bottom" });
  const coachRef = useRef(null);
  const { isDark, theme, toggleTheme } = useTheme();

  const getVisibleElement = (selector) => {
    if (!selector) return null;
    const candidates = Array.from(document.querySelectorAll(selector));
    return candidates.find((node) => {
      const style = window.getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden";
    }) || candidates[0] || null;
  };

  useEffect(() => {
    // Highlight element for current step
    const selector = steps[step].selector;
    if (selector) {
      const el = getVisibleElement(selector);
      if (el) {
        el.classList.add("onboarding-highlight");
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }
    }
    // Remove highlight from previous step
    return () => {
      steps.forEach(s => {
        if (s.selector) {
          const el = getVisibleElement(s.selector);
          if (el) el.classList.remove("onboarding-highlight");
        }
      });
    };
  }, [step]);

  const currentTarget = useMemo(() => {
    const selector = steps[step]?.selector;
    if (!selector) return null;
    return getVisibleElement(selector);
  }, [step]);

  useEffect(() => {
    const updateTargetRect = () => {
      if (!currentTarget) {
        setTargetRect(null);
        return;
      }
      const rect = currentTarget.getBoundingClientRect();
      setTargetRect(rect);
    };

    updateTargetRect();
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);
    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [currentTarget, step]);

  useEffect(() => {
    const cardWidth = Math.min(380, window.innerWidth - 24);
    const cardHeight = coachRef.current?.offsetHeight || 300;

    if (!targetRect) {
      setCoachPosition({
        top: Math.max(16, (window.innerHeight - cardHeight) / 2),
        left: Math.max(12, (window.innerWidth - cardWidth) / 2),
        placement: "bottom",
      });
      return;
    }

    const spaceBelow = window.innerHeight - targetRect.bottom;
    const canPlaceBottom = spaceBelow >= cardHeight + 24;
    const placement = canPlaceBottom ? "bottom" : "top";

    const top = placement === "bottom"
      ? Math.min(window.innerHeight - cardHeight - 12, targetRect.bottom + 12)
      : Math.max(12, targetRect.top - cardHeight - 12);

    const left = Math.min(
      window.innerWidth - cardWidth - 12,
      Math.max(12, targetRect.left + (targetRect.width / 2) - (cardWidth / 2))
    );

    setCoachPosition({ top, left, placement });
  }, [targetRect, step]);

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else {
      setShow(false);
      if (onFinish) onFinish();
    }
  };
  const prev = () => {
    if (step > 0) setStep(step - 1);
  };
  const skip = () => {
    setShow(false);
    if (onFinish) onFinish();
  };
  const close = () => {
    setShow(false);
    if (onFinish) onFinish();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0" style={{ zIndex: 1000 }}>
      <div className="absolute inset-0 bg-black/55" />

      {targetRect && (
        <div
          className="absolute rounded-xl pointer-events-none"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.58)",
            border: "2px solid #22d3ee",
            zIndex: 1001,
          }}
        />
      )}

      <div
        ref={coachRef}
        className={`${isDark ? "bg-muted border-border" : "bg-white border-border"} fixed border rounded-xl shadow-2xl p-5 sm:p-6 w-[min(380px,calc(100vw-1.5rem))] text-left`}
        style={{
          top: coachPosition.top ?? 20,
          left: coachPosition.left ?? 12,
          zIndex: 1002,
          transition: "top 220ms ease, left 220ms ease",
        }}
      >
        {targetRect && (
          <div
            className={`tour-pointer absolute w-3 h-3 rotate-45 ${isDark ? "bg-muted border-border" : "bg-white border-border"} border-l border-t`}
            style={
              coachPosition.placement === "bottom"
                ? {
                    top: -6,
                    left: Math.max(16, Math.min(340, targetRect.left + targetRect.width / 2 - (coachPosition.left || 0) - 6)),
                  }
                : {
                    bottom: -6,
                    left: Math.max(16, Math.min(340, targetRect.left + targetRect.width / 2 - (coachPosition.left || 0) - 6)),
                    transform: "rotate(225deg)",
                  }
            }
          />
        )}

        <button className={`${isDark ? "text-muted-foreground hover:text-white" : "text-muted-foreground hover:text-foreground"} absolute top-2 right-3 text-xl`} onClick={close} aria-label="Close tour">×</button>
        <h2 className={`${isDark ? "text-white" : "text-foreground"} text-lg font-bold mb-1 pr-6`}>{steps[step].title}</h2>
        <p className={`${isDark ? "text-muted-foreground" : "text-foreground"} mb-4 text-sm leading-relaxed`}>{steps[step].content}</p>
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className={`${isDark ? "text-muted-foreground" : "text-muted-foreground"} text-xs`}>Step {step + 1} of {steps.length}</p>
          <button
            type="button"
            onClick={toggleTheme}
            className={`${isDark ? "bg-muted text-yellow-300 hover:bg-slate-600" : "bg-muted text-foreground hover:bg-slate-200"} px-3 py-1.5 rounded-full text-xs font-medium`}
            aria-label="Toggle theme from tour"
            title="Toggle theme"
          >
            {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {steps.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setStep(index)}
              aria-label={`Go to tour step ${index + 1}`}
              className={`h-2.5 rounded-full transition-all duration-200 ${
                index === step
                  ? "w-6 bg-cyan-400"
                  : index < step
                    ? "w-2.5 bg-emerald-400/80 hover:bg-emerald-300"
                    : `${isDark ? "bg-slate-600 hover:bg-muted/300" : "bg-slate-300 hover:bg-slate-400"} w-2.5`
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between gap-2">
          <button
            className={`${isDark ? "bg-muted text-muted-foreground hover:bg-slate-600" : "bg-slate-200 text-foreground hover:bg-slate-300"} px-4 py-2 rounded`}
            onClick={prev}
            disabled={step === 0}
          >
            Back
          </button>
          <button
            className="px-4 py-2 rounded bg-green-600 text-white ml-2 hover:bg-green-500"
            onClick={next}
          >
            {step === steps.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
        <button
          className="mt-3 px-4 py-2 rounded bg-muted/500 text-white hover:bg-gray-400 w-full"
          onClick={skip}
        >
          Skip Tour
        </button>
      </div>
    </div>
  );
}
