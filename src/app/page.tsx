
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentAnalysisForm from "@/components/forms/document-analysis-form";
import ForgeryDetectionForm from "@/components/forms/forgery-detection-form";
import { FileSearch, ScanEye } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
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
    </div>
  );
}
