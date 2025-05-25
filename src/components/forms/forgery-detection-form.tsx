'use client';

import type React from 'react';
import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import FileUploader from '@/components/shared/file-uploader';
import { fileToDataUri } from '@/lib/file-utils';
import { handleDetectForgeryAction } from '@/app/actions';
import type { DetectForgeryOutput } from '@/ai/flows/detect-forgery';
import ForgeryDetectionReport from '@/components/reports/forgery-detection-report';
import { Loader2, ScanEye } from 'lucide-react';

const formSchema = z.object({
  documentFile: z.instanceof(File, { message: "Document file is required." })
    .refine(file => file.size > 0, "Document file cannot be empty."),
});

type ForgeryDetectionFormValues = z.infer<typeof formSchema>;

export default function ForgeryDetectionForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectForgeryOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ForgeryDetectionFormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit: SubmitHandler<ForgeryDetectionFormValues> = async (data) => {
    setIsLoading(true);
    setDetectionResult(null);
    setError(null);

    try {
      const documentDataUri = await fileToDataUri(data.documentFile);
      const result = await handleDetectForgeryAction({ documentDataUri });
      setDetectionResult(result);
      toast({
        title: "Detection Complete",
        description: "Forgery detection process finished successfully.",
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

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
            <ScanEye className="text-primary"/>
            Forgery Detection
        </CardTitle>
        <CardDescription>
          Upload a document or image to detect potential signs of forgery or manipulation.
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
                  <FormLabel htmlFor="documentFile-forgery">Document or Image File</FormLabel>
                  <FormControl>
                    <FileUploader
                      id="documentFile-forgery"
                      onFileSelect={(file) => field.onChange(file)}
                      acceptedFileTypes="image/*,.pdf" // Common types for forgery detection
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
                  Detecting Forgery...
                </>
              ) : (
                'Detect Forgery'
              )}
            </Button>
             {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </CardFooter>
        </form>
      </Form>
      {detectionResult && <ForgeryDetectionReport report={detectionResult} />}
    </Card>
  );
}
