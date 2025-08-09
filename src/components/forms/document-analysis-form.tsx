'use client';

import type React from 'react';
import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import FileUploader from '@/components/shared/file-uploader';
import { fileToOptimizedDataUri } from '@/lib/file-utils';
import { handleAnalyzeDocumentAction } from '@/app/actions';
import type { AnalyzeDocumentOutput } from '@/ai/flows/analyze-document';
import DocumentAnalysisReport from '@/components/reports/document-analysis-report';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { FileSearch, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useLocalHistory } from '@/hooks/use-local-history';

const documentTypes = [
  "Passport",
  "Driver's License", 
  "National ID Card",
  "Utility Bill",
  "Bank Statement",
  "Invoice",
  "Contract",
  "Birth Certificate",
  "Academic Transcript",
  "Medical Report",
  "Proof of Address",
  "Lease Agreement",
  "Insurance Policy",
  "Tax Document",
  "Other",
];

const AI_IDENTIFY_VALUE = "__AI_IDENTIFY__";

const formSchema = z.object({
  documentFile: z.instanceof(File, { message: "Document file is required." })
    .refine(file => file.size > 0, "Document file cannot be empty."),
  documentType: z.string().optional(),
  description: z.string().optional(),
});

type DocumentAnalysisFormValues = z.infer<typeof formSchema>;

export default function DocumentAnalysisForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeDocumentOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { addHistory } = useLocalHistory();

  const form = useForm<DocumentAnalysisFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentType: '',
      description: '',
    },
  });

  const onSubmit: SubmitHandler<DocumentAnalysisFormValues> = async (data) => {
    setIsLoading(true);
    setAnalysisResult(null);
    setError(null);

    try {
      const documentDataUri = await fileToOptimizedDataUri(data.documentFile, { maxDimension: 2200, quality: 0.9 });
      
      let documentTypeToSend: string | undefined = undefined;
      if (data.documentType && data.documentType !== AI_IDENTIFY_VALUE) {
        documentTypeToSend = data.documentType;
      }

      const result = await handleAnalyzeDocumentAction({
        documentDataUri,
        documentType: documentTypeToSend,
        description: data.description,
      });
      
      setAnalysisResult(result);

      addHistory({
        kind: 'analysis',
        createdAt: Date.now(),
        summary: result.summary,
        documentType: result.identifiedOrConfirmedDocumentType,
        statusLabel: result.isAuthentic ? 'Authentic' : 'Flagged',
        payload: result,
      });
      
      toast({
        title: "Analysis Complete",
        description: result.isAuthentic 
          ? "Document appears to be authentic" 
          : "Potential issues detected in document",
        variant: result.isAuthentic ? "default" : "destructive",
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto shadow-xl border-2">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileSearch className="text-primary h-6 w-6"/>
            </div>
            Document Analysis
          </CardTitle>
          <CardDescription className="text-base">
            Upload a document to analyze its authenticity and identify potential anomalies. 
            Our AI will examine the document structure, content, and formatting for signs of tampering.
          </CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-6">
              <FormField
                control={form.control}
                name="documentFile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Document File</FormLabel>
                    <FormControl>
                      <FileUploader
                        id="documentFile-analysis"
                        onFileSelect={(file) => field.onChange(file)}
                        acceptedFileTypes="image/*,.pdf,.doc,.docx,.txt"
                        maxSize={10}
                        className=""
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Document Type (Optional)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger id="documentType-analysis" className="h-11">
                          <SelectValue placeholder="Select document type or let AI identify" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={AI_IDENTIFY_VALUE}>
                          <em>None / Let AI Identify</em>
                        </SelectItem>
                        {documentTypes.map((docType) => (
                          <SelectItem key={docType} value={docType}>
                            {docType}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">
                      Specifying the document type helps improve analysis accuracy. Leave blank for automatic detection.
                    </p>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Additional Context (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        id="description"
                        placeholder="Provide any relevant context, specific concerns, or areas you'd like us to focus on during analysis..."
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            
            <CardFooter className="flex flex-col items-stretch gap-4 bg-muted/30">
              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  disabled={isLoading || !form.watch('documentFile')} 
                  className="flex-1 h-11"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Analyzing Document...
                    </>
                  ) : (
                    <>
                      <FileSearch className="mr-2 h-4 w-4" />
                      Analyze Document
                    </>
                  )}
                </Button>
                
                {(analysisResult || error) && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                    className="h-11"
                  >
                    New Analysis
                  </Button>
                )}
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>

      {analysisResult && (
        <div className="w-full max-w-2xl mx-auto">
          <DocumentAnalysisReport report={analysisResult} />
        </div>
      )}
    </div>
  );
}