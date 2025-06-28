'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DocumentAnalysisForm from "@/components/forms/document-analysis-form";
import ForgeryDetectionForm from "@/components/forms/forgery-detection-form";
import { FileSearch, ScanEye, Shield, CheckCircle, AlertTriangle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-primary/10">
            <Shield className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4">
          AI-Powered Document Verification
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Protect yourself from document fraud with our advanced AI technology. 
          Analyze document authenticity and detect sophisticated forgeries with industry-leading accuracy.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSearch className="h-6 w-6 text-primary" />
              Document Analysis
            </CardTitle>
            <CardDescription>
              Comprehensive authenticity verification with detailed anomaly detection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Content integrity verification
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Structural consistency analysis
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Detailed anomaly reporting
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ScanEye className="h-6 w-6 text-orange-600" />
              Forgery Detection
            </CardTitle>
            <CardDescription>
              Advanced AI detection of tampering and digital manipulation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Digital manipulation detection
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Confidence scoring system
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Technique identification
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="analyze" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 max-w-md mx-auto mb-8 h-auto sm:h-12">
          <TabsTrigger 
            value="analyze" 
            className="py-3 sm:py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-base"
          >
            <FileSearch className="mr-2 h-5 w-5" /> 
            Document Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="forgery" 
            className="py-3 sm:py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-base"
          >
            <ScanEye className="mr-2 h-5 w-5" /> 
            Forgery Detection
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="analyze" className="mt-8">
          <DocumentAnalysisForm />
        </TabsContent>
        
        <TabsContent value="forgery" className="mt-8">
          <ForgeryDetectionForm />
        </TabsContent>
      </Tabs>

      {/* Security Notice */}
      <Card className="mt-12 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Privacy & Security
              </h3>
              <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
                Your documents are processed securely and are not stored on our servers. 
                All analysis is performed in real-time and data is immediately discarded after processing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}