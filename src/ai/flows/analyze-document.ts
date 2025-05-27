
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
  documentType: z.string().optional().describe('The type of the document being analyzed, if specified by the user.'),
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
  identifiedOrConfirmedDocumentType: z.string().describe('The document type identified by the AI if not provided by the user, or the user-provided document type if it was supplied. If identification is not possible or reliable, this can state "Unknown", "Unclear", or "Multiple document types detected".'),
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

  {{#if documentType}}
  User-Provided Document Type: {{{documentType}}}
  {{else}}
  User-Provided Document Type: None (AI to identify)
  {{/if}}
  Description: {{{description}}}
  Document: {{media url=documentDataUri}}

  Instructions for Analysis:
  1.  **Document Type Context and Identification:**
      *   {{#if documentType}}
          **User-Provided Type:** The user has specified the document type as \`{{{documentType}}}\`. Confirm this type and use it as the primary basis for your analysis. Populate the \`identifiedOrConfirmedDocumentType\` field in your output with this user-provided type: \`{{{documentType}}}\`.
      *   {{else}}
          **AI Identification Required:** The user has NOT provided a document type. Your first step is to carefully examine the document image and attempt to identify its type (e.g., "Driver's License," "Passport," "Utility Bill," "Invoice," "ID Card," "Contract," "Academic Transcript," "Bank Statement," "Letter," "Receipt," "Other"). Populate the \`identifiedOrConfirmedDocumentType\` field in your output with the type you identify. If you cannot reliably identify a single, clear type (e.g., it's very generic, or multiple distinct documents are present), state "Unknown Document Type", "Unclear Document Type", or "Multiple document types detected" in this field.
      *   {{/if}}

  2.  **Leverage Identified/Confirmed Document Type:** Once the document type is established (as populated in \`identifiedOrConfirmedDocumentType\`), you MUST use this information to tailor your analysis. Consider specific expected features, layouts, security elements (if applicable for this type like holograms, watermarks, microprinting), common content, typical paper quality or texture appearance, font styles, and known areas of scrutiny or potential manipulation for *that specific document type*. For example:
      *   For a "Passport" or "Driver's License" or "National ID Card": Pay close attention to photo integration, holographic overlays, MRZ (Machine Readable Zone) correctness and font, microprinting, guilloche patterns, and data consistency (e.g., birth date vs. issue/expiry dates).
      *   For a "Utility Bill" or "Bank Statement" or "Invoice": Check for typical company branding (logos, addresses, contact info), consistent layouts for addresses, account numbers, line items, totals. Look for irregularities in font usage that might indicate inserted or altered text.
      *   For a "Contract" or "Lease Agreement": Examine signature consistency, page numbering, clause structure, and look for signs of page substitution or alteration of key terms.
      *   For an "Academic Transcript" or "Birth Certificate": Look for official seals or stamps, correct institutional formatting, and consistency in grading or personal information details.
      *   If the \`identifiedOrConfirmedDocumentType\` is "Other", "Unknown Document Type", "Unclear Document Type", or if the type is very generic, conduct a more general but still meticulous examination based on the visual evidence and any provided description, looking for universal signs of tampering.

  3.  **Scrutinize with Extreme Detail:** Assume that forgeries can be very subtle. Look for minute inconsistencies that might be overlooked by a standard review.

  4.  **Authenticity Assessment:** Based on your comprehensive analysis, determine if the document is likely authentic. Set \`isAuthentic\` to \`false\` if there are any medium or high severity anomalies indicative of forgery. If image quality severely hinders analysis to the point where critical features cannot be verified, set \`isAuthentic\` to \`false\` and clearly state in the summary that this is due to *inability to verify*, not a confirmed forgery.

  5.  **Anomaly Detection:** Identify and list ALL anomalies. For each anomaly, provide:
      *   \`anomalyType\`: A specific category (e.g., "Signature Mismatch", "Altered Text", "Font Inconsistency", "Image Manipulation", "Watermark Irregularity", "Unusual Layout", "Metadata Discrepancy" if applicable and detectable, "Scan Artifact", "Data Inconsistency", "Security Feature Anomaly").
      *   \`description\`: A detailed explanation of what the anomaly is and why it raises suspicion. If it's a common scan artifact (see point 8), explain that it's likely benign.
      *   \`location\`: The precise area in the document where the anomaly is found. If multiple documents are in the image, specify which document (e.g., "Driver's License: Signature", "Utility Bill: Address Block").
      *   \`severity\`: Classify the severity as 'low', 'medium', or 'high'. Benign scan artifacts should be 'low'. High severity indicates a strong likelihood of actual forgery.

  6.  **Consider Advanced Techniques:** Be aware of advanced forgery methods, including digital manipulation, pixel-level alterations, font recreation, subtle background tampering, and chemical alterations (though the latter is harder to detect from an image alone, look for tell-tale signs like discoloration).

  7.  **Cross-Verification (Conceptual):** Although you cannot access external databases, think about what elements would ideally be cross-verified (e.g., ID numbers, addresses). Mention if an anomaly pertains to such an element.

  Specific Considerations for Scanned Documents and Image Quality:
  8.  **Scanned Document Artifacts:** It is crucial to differentiate between common, benign scanning artifacts and actual signs of manipulation. Common artifacts include slight skew, dust specks, minor shadows from the scanner lid, moiré patterns, typical scan resolution limitations, and slightly uneven lighting. **These common artifacts, by themselves, are NOT indicators of forgery.** Focus your analysis on inconsistencies *within the document's content itself* that cannot be reasonably attributed to a standard scanning process. Only flag scan-related issues as anomalies if they are unusually pronounced, obscure critical information in a way that seems intentional, or are combined with other specific, content-based suspicious indicators. If an anomaly is purely a common scan artifact, categorize it as "Scan Artifact" with a 'low' severity and clearly state in the description that it is likely a benign characteristic of the scanning process. Prioritize looking for inconsistencies *within the document's content itself* rather than over-penalizing the medium (the scan).

  9.  **Multiple Documents in One Image:** If the uploaded image contains multiple distinct documents, attempt to analyze each document individually, referencing the overall identified/confirmed document type if it applies to all (e.g., "Set of Identification Documents") or focusing on primary document if it's a mix. Your report should clearly delineate findings for each document if separable. Anomalies should specify the document they pertain to. The overall \`isAuthentic\` status should reflect the assessment of all documents; if one is suspect due to forgery (not just scan quality), the overall authenticity may be questionable.

  10. **Image Quality Impact:** If the image quality (e.g., poor lighting, unfavorable angle, obstructions, blurriness, low resolution, reflections) significantly hinders a thorough analysis, this MUST be explicitly stated in your summary and in the description of any related anomalies. Detail which specific areas are obscured or made difficult to assess. **Critically, do NOT conclude a document is inauthentic or forged *solely* because poor image quality prevents full verification of some features.** Instead, state that the authenticity of those specific features (or the entire document, if severely affected) cannot be fully confirmed due to these quality issues. The \`isAuthentic\` assessment should reflect this: if analysis is severely hindered, \`isAuthentic\` should be set to \`false\` due to the inability to verify, not because it is confirmed as forged. The summary must clearly articulate this distinction.

  11. **Summary:** Provide a concise summary of your findings, highlighting the most critical observations, your overall conclusion on the document's authenticity (considering the \`identifiedOrConfirmedDocumentType\`), and explicitly mention any limitations due to scan quality, multiple documents, or image issues. If authenticity cannot be confirmed due to quality, state this clearly.

  Even if a document seems legitimate, your role is to find any indication, however small, that could point to manipulation. Maintain a critical and investigative mindset, but differentiate clearly between artifacts of the capture process and signs of deliberate forgery.
  Output in JSON format according to the defined schema. Ensure \`identifiedOrConfirmedDocumentType\` is populated based on the logic described in point 1.`,
});

const analyzeDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeDocumentFlow',
    inputSchema: AnalyzeDocumentInputSchema,
    outputSchema: AnalyzeDocumentOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);

    // Ensure identifiedOrConfirmedDocumentType is present in the output
    if (output && typeof output.identifiedOrConfirmedDocumentType !== 'string') {
        output.identifiedOrConfirmedDocumentType = input.documentType || 'Unknown Document Type (AI failed to specify)';
    } else if (output && !output.identifiedOrConfirmedDocumentType && input.documentType) {
        // If user provided a type, but AI cleared it, restore user's type.
        output.identifiedOrConfirmedDocumentType = input.documentType;
    } else if (output && !output.identifiedOrConfirmedDocumentType && !input.documentType) {
        // If user didn't provide, and AI didn't identify, mark as such.
        output.identifiedOrConfirmedDocumentType = 'Unknown Document Type (AI failed to specify)';
    }
    return output!;
  }
);

    