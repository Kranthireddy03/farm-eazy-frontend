import React, { useState } from "react";

const steps = [
  {
    title: "Welcome to FarmEazy!",
    content: "Manage your farm, crops, and irrigation with ease. Let's take a quick tour!",
  },
  {
    title: "Dashboard Overview",
    content: "See your farm stats, weather, notifications, and quick actions all in one place.",
  },
  {
    title: "Profile & Settings",
    content: "Update your profile, change password, and manage your preferences from the profile page.",
  },
  {
    title: "Multi-language Support",
    content: "Switch between English, Hindi, and Telugu anytime from the top menu.",
  },
  {
    title: "Need Help?",
    content: "Access chat support and FAQs from the help icon at the bottom right.",
  },
  {
    title: "You're Ready!",
    content: "Explore FarmEazy and make the most of your smart farming experience.",
  },
];

export default function OnboardingTour({ onFinish }) {
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else if (onFinish) onFinish();
  };
  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h2 className="text-xl font-bold mb-2 text-white">{steps[step].title}</h2>
        <p className="mb-6 text-slate-300">{steps[step].content}</p>
        <div className="flex justify-between">
          <button
            className="px-4 py-2 rounded bg-slate-700 text-slate-200 hover:bg-slate-600"
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
      </div>
    </div>
  );
}
