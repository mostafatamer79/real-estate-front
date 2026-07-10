import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Lightbulb, Map, FileText, Grid3x3, MapPin } from 'lucide-react';

// Tutorial Step Interface
interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string;
  icon: React.ReactNode;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

// Tutorial Component
export  const Tutorial = ({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const steps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'مرحباً بك في منصتنا!',
      description: 'دعنا نأخذك في جولة سريعة لاكتشاف المميزات الرئيسية للمنصة',
      target: 'none',
      icon: <Lightbulb className="w-8 h-8" />,
      position: 'center'
    },
    {
      id: 'map',
      title: 'الخريطة التفاعلية',
      description: 'هنا يمكنك عرض موقع العقار على الخريطة والتفاعل معه بسهولة',
      target: 'map-section',
      icon: <Map className="w-6 h-6" />,
      position: 'bottom'
    },
    {
      id: 'info-cards',
      title: 'بطاقات المعلومات',
      description: 'اطلع على العمليات السابقة، الإعلانات، والصفقات من خلال هذه البطاقات التفاعلية',
      target: 'info-cards-section',
      icon: <FileText className="w-6 h-6" />,
      position: 'top'
    },
    {
      id: 'quick-actions',
      title: 'الإجراءات السريعة',
      description: 'الوصول السريع لجميع الخدمات: إدارة العقار، المحفظة، الخدمات، العروض، والطلبات',
      target: 'quick-actions-section',
      icon: <Grid3x3 className="w-6 h-6" />,
      position: 'top'
    },
    {
      id: 'complete',
      title: 'أنت جاهز للبدء!',
      description: 'يمكنك الآن استكشاف المنصة والاستفادة من جميع مميزاتها',
      target: 'none',
      icon: <Lightbulb className="w-8 h-8" />,
      position: 'center'
    }
  ];

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (currentStepData.target !== 'none') {
      const element = document.getElementById(currentStepData.target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep, currentStepData.target]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    // Save that tutorial has been completed
    localStorage.setItem('tutorial_completed', 'true');
    setTimeout(onComplete, 300);
  };

  const handleSkipTutorial = () => {
    setIsVisible(false);
    // Save that tutorial has been skipped
    localStorage.setItem('tutorial_completed', 'true');
    setTimeout(onSkip, 300);
  };

  if (!isVisible) return null;

  // Center modal for welcome and complete steps
  if (currentStepData.position === 'center') {
    return (
      <>
        {/* Overlay */}
        <div className="fixed inset-0 bg-black/70 z-[100] transition-opacity duration-300" />
        
        {/* Center Modal */}
        <div className="fixed inset-0 flex items-center justify-center z-[101] p-4" dir="rtl">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl w-[95vw] sm:max-w-lg w-full p-8 border-2 border-blue-500/30 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-500/20 rounded-xl text-blue-400">
                  {currentStepData.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{currentStepData.title}</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    خطوة {currentStep + 1} من {steps.length}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSkipTutorial}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              {currentStepData.description}
            </p>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex gap-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      index <= currentStep ? 'bg-slate-500' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronRight className="w-5 h-5" />
                  السابق
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex-1 py-3 px-4 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {currentStep === steps.length - 1 ? 'ابدأ الآن' : 'التالي'}
                {currentStep !== steps.length - 1 && <ChevronLeft className="w-5 h-5" />}
              </button>
            </div>

            <button
              onClick={handleSkipTutorial}
              className="w-full mt-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              تخطي الشرح
            </button>
          </div>
        </div>
      </>
    );
  }

  // Spotlight for specific sections
  return (
    <>
      {/* Overlay with cutout */}
      <div className="fixed inset-0 z-[100]" style={{ pointerEvents: 'none' }}>
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Highlight Target */}
      <div className="fixed inset-0 z-[101] pointer-events-none">
        <div
          id={`tutorial-highlight-${currentStepData.target}`}
          className="absolute border-4 border-blue-500 rounded-xl shadow-[0_0_50px_rgba(59,130,246,0.5)] animate-pulse"
          style={{
            ...((() => {
              const element = document.getElementById(currentStepData.target);
              if (!element) return {};
              const rect = element.getBoundingClientRect();
              return {
                top: `${rect.top - 8}px`,
                left: `${rect.left - 8}px`,
                width: `${rect.width + 16}px`,
                height: `${rect.height + 16}px`,
              };
            })())
          }}
        />
      </div>

      {/* Tooltip */}
      <div className="fixed z-[102] pointer-events-auto" dir="rtl">
        <div
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl w-[95vw] sm:max-w-md p-6 border-2 border-blue-500/30"
          style={{
            ...((() => {
              const element = document.getElementById(currentStepData.target);
              if (!element) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
              const rect = element.getBoundingClientRect();
              
              if (currentStepData.position === 'top') {
                return {
                  top: `${rect.top - 20}px`,
                  left: `${rect.left + rect.width / 2}px`,
                  transform: 'translate(-50%, -100%)'
                };
              } else if (currentStepData.position === 'bottom') {
                return {
                  top: `${rect.bottom + 20}px`,
                  left: `${rect.left + rect.width / 2}px`,
                  transform: 'translateX(-50%)'
                };
              }
              return {};
            })())
          }}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-500/20 rounded-lg text-blue-400">
                {currentStepData.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{currentStepData.title}</h3>
                <p className="text-xs text-gray-400">
                  {currentStep + 1} / {steps.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleSkipTutorial}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-gray-300 mb-4 leading-relaxed">
            {currentStepData.description}
          </p>

          {/* Progress Dots */}
          <div className="flex gap-1.5 mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index <= currentStep ? 'bg-slate-500' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="flex-1 py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
              >
                <ChevronRight className="w-4 h-4" />
                السابق
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 py-2 px-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
            >
              {currentStep === steps.length - 1 ? 'إنهاء' : 'التالي'}
              {currentStep !== steps.length - 1 && <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};