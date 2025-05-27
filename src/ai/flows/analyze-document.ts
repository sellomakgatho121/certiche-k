
'use server';

/**
 * @fileOverview Document analysis AI agent.
 *
 * - analyzeDocument - A function that handles the document analysis process.
 * - AnalyzeDocumentInput - The input type for the analyzeDocument function.
 * - AnalyzeDocumentOutput - The return type for the analyzeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  documentType: z.string().describe('The type of the document being analyzed.'),
  description: z.string().optional().describe('Optional description of the document.'),
});
export type AnalyzeDocumentInput = z.infer<typeof AnalyzeDocumentInputSchema>;

const AnomalySchema = z.object({
  anomalyType: z.string().describe('The type of anomaly detected (e.g., "Signature Mismatch", "Altered Text", "Font Inconsistency", "Image Manipulation", "Unusual Layout", "Scan Artifact").'),
  description: z.string().describe('A detailed description of the anomaly and why it is suspicious, or if it is a benign artifact.'),
  location: z.string().optional().describe('The specific location or section of the anomaly in the document, if applicable (e.g., "Page 2, Signature Area", "Header Section", "Document 1: Photo ID area").'),
  severity: z.enum(['low', 'medium', 'high']).describe('The assessed severity of the anomaly. For benign scan artifacts, this should be \'low\'.'),
});

const AnalyzeDocumentOutputSchema = z.object({
  isAuthentic: z.boolean().describe('A boolean indicating whether the document is likely authentic. This should be false if significant anomalies are found OR if analysis is severely hindered by quality, making verification impossible (state this reason clearly in summary).'),
  anomalies: z.array(AnomalySchema).describe('A list of anomalies detected in the document. Even if the document is deemed authentic, list any minor irregularities or benign scan artifacts. If multiple documents are present, try to specify which document an anomaly pertains to.'),
  summary: z.string().describe('A concise summary of the analysis, highlighting key findings, overall authenticity assessment, and crucially, any limitations due to image quality or multiple documents. Explicitly state if low quality prevents full verification rather than implying forgery.'),
});
export type AnalyzeDocumentOutput = z.infer<typeof AnalyzeDocumentOutputSchema>;

export async function analyzeDocument(input: AnalyzeDocumentInput): Promise<AnalyzeDocumentOutput> {
  return analyzeDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeDocumentPrompt',
  input: {schema: AnalyzeDocumentInputSchema},
  output: {schema: AnalyzeDocumentOutputSchema},
  prompt: `You are an expert forensic document examiner with a specialization in detecting highly sophisticated forgeries. Your task is to perform a meticulous analysis of the provided document.

  Document Type: {{{documentType}}}
  Description: {{{description}}}
  Document: {{media url=documentDataUri}}

  Instructions for Analysis:
  1.  **Scrutinize with Extreme Detail:** Assume that forgeries can be very subtle. Look for minute inconsistencies that might be overlooked by a standard review.
  2.  **Authenticity Assessment:** Based on your comprehensive analysis, determine if the document is likely authentic. Set \\\`isAuthentic\\\` to false if there are any medium or high severity anomalies indicative of forgery. If image quality severely hinders analysis to the point where critical features cannot be verified, set \\\`isAuthentic\\\` to false and clearly state in the summary that this is due to *inability to verify*, not a confirmed forgery.
  3.  **Anomaly Detection:** Identify and list ALL anomalies. For each anomaly, provide:
      *   \\\`anomalyType\\\`: A specific category (e.g., "Signature Mismatch", "Altered Text", "Font Inconsistency", "Image Manipulation", "Watermark Irregularity", "Unusual Layout", "Metadata Discrepancy" if applicable and detectable, "Scan Artifact").
      *   \\\`description\\\`: A detailed explanation of what the anomaly is and why it raises suspicion. If it's a common scan artifact (see point 6), explain that it's likely benign.
      *   \\\`location\\\`: The precise area in the document where the anomaly is found. If multiple documents are in the image, specify which document (e.g., "Driver's License: Signature", "Utility Bill: Address Block").
      *   \\\`severity\\\`: Classify the severity as 'low', 'medium', or 'high'. Benign scan artifacts should be 'low'. High severity indicates a strong likelihood of actual forgery.
  4.  **Consider Advanced Techniques:** Be aware of advanced forgery methods, including digital manipulation, pixel-level alterations, font recreation, and subtle background tampering.
  5.  **Cross-Verification (Conceptual):** Although you cannot access external databases, think about what elements would ideally be cross-verified. Mention if an anomaly pertains to such an element.

  Specific Considerations for Scanned Documents and Image Quality:
  6.  **Scanned Document Artifacts:** It is crucial to differentiate between common, benign scanning artifacts and actual signs of manipulation. Common artifacts include slight skew, dust specks, minor shadows from the scanner lid, moiré patterns, typical scan resolution limitations, and slightly uneven lighting. **These common artifacts, by themselves, are NOT indicators of forgery.** Only flag scan-related issues as anomalies if they are unusually pronounced, obscure critical information in a way that seems intentional, or are combined with other specific, content-based suspicious indicators. If an anomaly is purely a common scan artifact, categorize it as "Scan Artifact" with a 'low' severity and clearly state in the description that it is likely a benign characteristic of the scanning process.
  7.  **Multiple Documents in One Image:** If the uploaded image contains multiple distinct documents, attempt to analyze each document individually. Your report should clearly delineate findings for each document. Anomalies should specify the document they pertain to. The overall \\\`isAuthentic\\\` status should reflect the assessment of all documents; if one is suspect due to forgery (not just scan quality), the overall authenticity may be questionable.
  8.  **Image Quality Impact:** If the image quality (e.g., poor lighting, unfavorable angle, obstructions, blurriness, low resolution, reflections) significantly hinders a thorough analysis, this MUST be explicitly stated in your summary and in the description of any related anomalies. Detail which specific areas are obscured or made difficult to assess. **Critically, do NOT conclude a document is inauthentic or forged *solely* because poor image quality prevents full verification of some features.** Instead, state that the authenticity of those specific features (or the entire document, if severely affected) cannot be fully confirmed due to these quality issues. The \\\`isAuthentic\\\` assessment should reflect this: if analysis is severely hindered, \\\`isAuthentic\\\` should be set to false due to the inability to verify, not because it is confirmed as forged. The summary must clearly articulate this distinction.
  9.  **Summary:** Provide a concise summary of your findings, highlighting the most critical observations, your overall conclusion on the document's authenticity, and explicitly mention any limitations due to scan quality, multiple documents, or image issues. If authenticity cannot be confirmed due to quality, state this clearly.

  Even if a document seems legitimate, your role is to find any indication, however small, that could point to manipulation. Maintain a critical and investigative mindset, but differentiate clearly between artifacts of the capture process and signs of deliberate forgery.
  Output in JSON format according to the defined schema.`,
});

const analyzeDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeDocumentFlow',
    inputSchema: AnalyzeDocumentInputSchema,
    outputSchema: AnalyzeDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
