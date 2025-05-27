
'use client'; // Important for useState, useEffect

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentAnalysisForm from "@/components/forms/document-analysis-form";
import ForgeryDetectionForm from "@/components/forms/forgery-detection-form";
import { FileSearch, ScanEye } from "lucide-react";

export default function HomePage() {
  // States for managing animation sequence:
  // 'initial': Before any animation starts
  // 'netcampus': "Netcampus" text is animating/visible
  // 'certicheck': "Certicheck" text is animating/visible (Netcampus also visible)
  // 'main': Splash screen fading out, main content fading in
  // 'done': Animation complete, main content fully visible
  const [animationState, setAnimationState] = useState<'initial' | 'netcampus' | 'certicheck' | 'main' | 'done'>('initial');

  useEffect(() => {
    // This effect controls the sequence of animations
    if (animationState === 'initial') {
      const timerNetcampus = setTimeout(() => {
        setAnimationState('netcampus');
      }, 100); // Short delay, then "Netcampus" starts appearing

      const timerCerticheck = setTimeout(() => {
        setAnimationState('certicheck');
      }, 700); // "Certicheck" starts appearing after "Netcampus" animation is well underway (100ms + ~600ms)

      const timerMainContent = setTimeout(() => {
        setAnimationState('main');
      }, 2000); // Both texts visible for a moment (700ms + ~700ms for Certicheck + ~600ms pause), then start transition

      const timerDone = setTimeout(() => {
        setAnimationState('done');
      }, 3000); // Splash fade out & Main content fade in (1000ms transition)

      // Cleanup timeouts if the component unmounts
      return () => {
        clearTimeout(timerNetcampus);
        clearTimeout(timerCerticheck);
        clearTimeout(timerMainContent);
        clearTimeout(timerDone);
      };
    }
  }, [animationState]); // Rerun effect if animationState changes, guarded by the 'initial' check

  const isSplashVisible = animationState !== 'done';
  const isMainContentVisible = animationState === 'main' || animationState === 'done';
  const shouldRenderMainContent = animationState === 'main' || animationState === 'done';


  return (
    <>
      {isSplashVisible && (
        <div
          className={`fixed inset-0 bg-primary flex flex-col items-center justify-center text-center transition-opacity duration-1000 ease-in-out z-50
            ${animationState === 'main' || animationState === 'done' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          {/* Animated Text Container */}
          <div className="relative">
            <h1
              className={`text-5xl sm:text-6xl font-bold text-primary-foreground transition-all duration-700 ease-out
                ${animationState === 'initial' ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}`}
            >
              Netcampus
            </h1>
            <h2
              className={`text-4xl sm:text-5xl font-semibold text-primary-foreground mt-3 sm:mt-4 transition-all duration-700 ease-out
                ${animationState === 'initial' || animationState === 'netcampus' ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}`}
            >
              Certicheck
            </h2>
          </div>
        </div>
      )}

      {/* Main Application Content */}
      <div
        className={`container mx-auto px-4 py-8 transition-opacity duration-1000 ease-in-out
          ${isMainContentVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
      >
        {shouldRenderMainContent && ( // Conditionally render to optimize initial load
          <Tabs defaultValue="analyze" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 max-w-md mx-auto mb-8 h-auto sm:h-10">
              <TabsTrigger value="analyze" className="py-2 sm:py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileSearch className="mr-2 h-5 w-5" /> Document Analysis
              </TabsTrigger>
              <TabsTrigger value="forgery" className="py-2 sm:py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <ScanEye className="mr-2 h-5 w-5" /> Forgery Detection
              </TabsTrigger>
            </TabsList>
            <TabsContent value="analyze">
              <DocumentAnalysisForm />
            </TabsContent>
            <TabsContent value="forgery">
              <ForgeryDetectionForm />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}
