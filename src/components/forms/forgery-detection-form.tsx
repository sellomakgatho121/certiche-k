'use client';

import type React from 'react';
import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import FileUploader from '@/components/shared/file-uploader';
import { fileToDataUri } from '@/lib/file-utils';
import { handleDetectForgeryAction } from '@/app/actions';
import type { DetectForgeryOutput } from '@/ai/flows/detect-forgery';
import ForgeryDetectionReport from '@/components/reports/forgery-detection-report';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ScanEye, AlertTriangle, Shield } from 'lucide-react';

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
});

type ForgeryDetectionFormValues = z.infer<typeof formSchema>;

export default function ForgeryDetectionForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectForgeryOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ForgeryDetectionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentType: '',
    }
  });

  const onSubmit: SubmitHandler<ForgeryDetectionFormValues> = async (data) => {
    setIsLoading(true);
    setDetectionResult(null);
    setError(null);

    try {
      const documentDataUri = await fileToDataUri(data.documentFile);
      
      let documentTypeToSend: string | undefined = undefined;
      if (data.documentType && data.documentType !== AI_IDENTIFY_VALUE) {
        documentTypeToSend = data.documentType;
      }

      const result = await handleDetectForgeryAction({ 
        documentDataUri,
        documentType: documentTypeToSend, 
      });
      
      setDetectionResult(result);
      
      toast({
        title: "Detection Complete",
        description: result.isForged 
          ? "Potential forgery detected" 
          : "No clear signs of forgery found",
        variant: result.isForged ? "destructive" : "default",
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({
        title: "Detection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setDetectionResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto shadow-xl border-2">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <ScanEye className="text-orange-600 dark:text-orange-400 h-6 w-6"/>
            </div>
            Forgery Detection
          </CardTitle>
          <CardDescription className="text-base">
            Upload a document or image to detect potential signs of forgery or manipulation. 
            Our advanced AI analyzes content integrity, structural consistency, and digital artifacts.
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
                    <FormLabel className="text-base font-medium">Document or Image File</FormLabel>
                    <FormControl>
                      <FileUploader
                        id="documentFile-forgery"
                        onFileSelect={(file) => field.onChange(file)}
                        acceptedFileTypes="image/*,.pdf"
                        maxSize={10}
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
                        <SelectTrigger id="documentType-forgery" className="h-11">
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
                      Document type helps focus the forgery detection analysis. Leave blank for automatic identification.
                    </p>
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
                  variant="default"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Detecting Forgery...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Detect Forgery
                    </>
                  )}
                </Button>
                
                {(detectionResult || error) && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                    className="h-11"
                  >
                    New Detection
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

      {detectionResult && (
        <div className="w-full max-w-2xl mx-auto">
          <ForgeryDetectionReport report={detectionResult} />
        </div>
      )}
    </div>
  );
}