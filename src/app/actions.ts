
'use server';

import { analyzeDocument, type AnalyzeDocumentInput, type AnalyzeDocumentOutput } from '@/ai/flows/analyze-document';
import { detectForgery, type DetectForgeryInput, type DetectForgeryOutput } from '@/ai/flows/detect-forgery';

export async function handleAnalyzeDocumentAction(
  input: AnalyzeDocumentInput
): Promise<AnalyzeDocumentOutput> {
  try {
    const result = await analyzeDocument(input);
    if (!result) {
      throw new Error('Analysis failed to return a result.');
    }
    return result;
  } catch (error) {
    console.error('Error in handleAnalyzeDocumentAction:', error);
    // Consider returning a more structured error object if needed by the client
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred during document analysis.');
  }
}

export async function handleDetectForgeryAction(
  input: DetectForgeryInput 
): Promise<DetectForgeryOutput> {
  try {
    // Ensure documentType is passed correctly, even if it's undefined
    const result = await detectForgery({
      documentDataUri: input.documentDataUri,
      ...(input.documentType && { documentType: input.documentType }),
    });
    if (!result) {
      throw new Error('Forgery detection failed to return a result.');
    }
    return result;
  } catch (error) {
    console.error('Error in handleDetectForgeryAction:', error);
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred during forgery detection.');
  }
}
