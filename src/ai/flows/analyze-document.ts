
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
  anomalyType: z.string().describe('The type of anomaly detected (e.g., "Signature Mismatch", "Altered Text", "Font Inconsistency", "Image Manipulation", "Unusual Layout").'),
  description: z.string().describe('A detailed description of the anomaly and why it is suspicious.'),
  location: z.string().optional().describe('The specific location or section of the anomaly in the document, if applicable (e.g., "Page 2, Signature Area", "Header Section", "Document 1: Photo ID area").'),
  severity: z.enum(['low', 'medium', 'high']).describe('The assessed severity of the anomaly, indicating its likelihood of being part of a forgery.'),
});

const AnalyzeDocumentOutputSchema = z.object({
  isAuthentic: z.boolean().describe('A boolean indicating whether the document is likely authentic. This should be false if significant anomalies are found or if analysis is severely hindered by quality.'),
  anomalies: z.array(AnomalySchema).describe('A list of anomalies detected in the document. Even if the document is deemed authentic, list any minor irregularities. If multiple documents are present, try to specify which document an anomaly pertains to.'),
  summary: z.string().describe('A concise summary of the analysis, highlighting key findings, overall authenticity assessment, and any limitations due to image quality or multiple documents.'),
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
  2.  **Authenticity Assessment:** Based on your comprehensive analysis, determine if the document is likely authentic. Set 'isAuthentic' to false if there are any medium or high severity anomalies. If image quality severely hinders analysis, this may also lead to a non-authentic assessment due to inability to verify.
  3.  **Anomaly Detection:** Identify and list ALL anomalies, even minor ones. For each anomaly, provide:
      *   \\\`anomalyType\\\`: A specific category (e.g., "Signature Mismatch", "Altered Text", "Font Inconsistency", "Image Manipulation", "Watermark Irregularity", "Unusual Layout", "Metadata Discrepancy" if applicable and detectable from image, "Scan Artifact" if clearly identifiable as such and not suspicious).
      *   \\\`description\\\`: A detailed explanation of what the anomaly is and why it raises suspicion (or why it's considered a benign artifact if applicable).
      *   \\\`location\\\`: The precise area in the document where the anomaly is found. If multiple documents are in the image, specify which document (e.g., "Driver's License: Signature", "Utility Bill: Address Block").
      *   \\\`severity\\\`: Classify the severity as 'low', 'medium', or 'high'. High severity indicates a strong likelihood of forgery. Scan artifacts should generally be 'low' unless they obscure critical information or appear deliberately manipulated.
  4.  **Consider Advanced Techniques:** Be aware of advanced forgery methods, including digital manipulation, pixel-level alterations, font recreation, and subtle background tampering.
  5.  **Cross-Verification (Conceptual):** Although you cannot access external databases, think about what elements would ideally be cross-verified (e.g., official seals, serial numbers, signatures against known exemplars). Mention if an anomaly pertains to such an element.

  Specific Considerations for Scanned Documents and Image Quality:
  6.  **Scanned Document Artifacts:** Differentiate between common scanning artifacts (e.g., slight skew, dust specks, minor shadows from scanner lid, moiré patterns, typical resolution of scans, slightly uneven lighting across the scan bed) and actual signs of manipulation. Do not automatically assume a scanned document is problematic due to these artifacts unless they are unusually pronounced, combined with other suspicious indicators, or obscure critical information. An anomaly can be of type "Scan Artifact" with a low severity if it's clearly benign.
  7.  **Multiple Documents in One Image:** If the uploaded image contains multiple distinct documents (e.g., an ID card and a utility bill scanned together), attempt to analyze each document individually. Your report should clearly delineate findings for each document. Anomalies should specify the document they pertain to in their 'location' or 'description'. The overall 'isAuthentic' status should reflect the assessment of all documents; if one is suspect, the overall authenticity may be questionable.
  8.  **Image Quality Impact:** If the image quality (e.g., poor lighting, unfavorable angle, obstructions, blurriness, low resolution, reflections) significantly hinders a thorough analysis, explicitly state this in your summary and in the description of relevant anomalies. Detail any specific areas obscured or made difficult to assess. While you should still report any discernible anomalies, be cautious in concluding a document is forged *solely* due to poor image quality preventing full verification. If quality is too low for meaningful analysis of critical features, this can impact the 'isAuthentic' assessment and should be clearly stated.
  9.  **Summary:** Provide a concise summary of your findings, highlighting the most critical observations, your overall conclusion on the document's authenticity, and explicitly mention any limitations due to scan quality, multiple documents, or image issues.

  Even if a document seems legitimate, your role is to find any indication, however small, that could point to manipulation. Maintain a critical and investigative mindset.
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

