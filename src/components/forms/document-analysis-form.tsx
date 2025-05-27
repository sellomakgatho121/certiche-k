
'use client';

import type React from 'react';
import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Keep for other potential uses, but not for documentType
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import FileUploader from '@/components/shared/file-uploader';
import { fileToDataUri } from '@/lib/file-utils';
import { handleAnalyzeDocumentAction } from '@/app/actions';
import type { AnalyzeDocumentOutput } from '@/ai/flows/analyze-document';
import DocumentAnalysisReport from '@/components/reports/document-analysis-report';
import { Loader2, FileSearch } from 'lucide-react';

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

const formSchema = z.object({
  documentFile: z.instanceof(File, { message: "Document file is required." })
    .refine(file => file.size > 0, "Document file cannot be empty."),
  documentType: z.string().min(1, "Document type is required."),
  description: z.string().optional(),
});

type DocumentAnalysisFormValues = z.infer<typeof formSchema>;

export default function DocumentAnalysisForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeDocumentOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
      const documentDataUri = await fileToDataUri(data.documentFile);
      const result = await handleAnalyzeDocumentAction({
        documentDataUri,
        documentType: data.documentType,
        description: data.description,
      });
      setAnalysisResult(result);
      toast({
        title: "Analysis Complete",
        description: "Document analysis finished successfully.",
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

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
            <FileSearch className="text-primary"/>
            Document Analysis
        </CardTitle>
        <CardDescription>
          Upload a document to analyze its authenticity and identify potential anomalies.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="documentFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="documentFile-analysis">Document File</FormLabel>
                  <FormControl>
                    <FileUploader
                      id="documentFile-analysis"
                      onFileSelect={(file) => field.onChange(file)}
                      acceptedFileTypes="image/*,.pdf,.doc,.docx,.txt"
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
                  <FormLabel htmlFor="documentType">Document Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger id="documentType">
                        <SelectValue placeholder="Select a document type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {documentTypes.map((docType) => (
                        <SelectItem key={docType} value={docType}>
                          {docType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="description">Optional Description</FormLabel>
                  <FormControl>
                    <Textarea
                      id="description"
                      placeholder="Provide any relevant context or specific areas to focus on."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-4">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Document'
              )}
            </Button>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </CardFooter>
        </form>
      </Form>
      {analysisResult && <DocumentAnalysisReport report={analysisResult} />}
    </Card>
  );
}
