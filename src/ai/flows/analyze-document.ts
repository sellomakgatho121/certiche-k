
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
  documentType: z.string().optional().describe('The type of the document being analyzed, if specified by the user. If multiple document types are present in the image, this might be a general category or one of the primary types.'),
  description: z.string().optional().describe('Optional description of the document or the set of documents.'),
});
export type AnalyzeDocumentInput = z.infer<typeof AnalyzeDocumentInputSchema>;

const AnomalySchema = z.object({
  anomalyType: z.string().describe('The type of anomaly detected (e.g., "Signature Mismatch", "Altered Text", "Font Inconsistency", "Image Manipulation", "Unusual Layout", "Scan Artifact").'),
  description: z.string().describe('A detailed description of the anomaly and why it is suspicious, or if it is a benign artifact.'),
  location: z.string().optional().describe('The specific location or section of the anomaly in the document. If multiple documents are present in the image, specify which document this anomaly pertains to (e.g., "Page 2, Signature Area of Contract", "Driver\'s License: Photo ID area", "Utility Bill: Address Block").'),
  severity: z.enum(['low', 'medium', 'high']).describe('The assessed severity of the anomaly. For benign scan artifacts, this should be \'low\'.'),
});

const AnalyzeDocumentOutputSchema = z.object({
  isAuthentic: z.boolean().describe('A boolean indicating whether the document (or set of documents) is likely authentic. This should be false if significant anomalies are found in any of the documents OR if analysis is severely hindered by quality, making verification impossible (state this reason clearly in summary).'),
  anomalies: z.array(AnomalySchema).describe('A list of anomalies detected in the document(s). Even if the document(s) are deemed authentic, list any minor irregularities or benign scan artifacts. If multiple documents are present, ensure anomalies clearly state which document they pertain to.'),
  summary: z.string().describe('A concise summary of the analysis, highlighting key findings for each document if multiple are present, overall authenticity assessment, and crucially, any limitations due to image quality. Explicitly state if low quality prevents full verification rather than implying forgery.'),
  identifiedOrConfirmedDocumentType: z.string().describe('The document type(s) identified or confirmed by the AI. If a single document type was provided by the user and confirmed, list that. If the user did not provide a type, or if multiple documents are detected in the image, list all identified types (e.g., "Driver\'s License, Utility Bill, Passport", or "Unknown Document Type" if identification is not possible).'),
});
export type AnalyzeDocumentOutput = z.infer<typeof AnalyzeDocumentOutputSchema>;

export async function analyzeDocument(input: AnalyzeDocumentInput): Promise<AnalyzeDocumentOutput> {
  return analyzeDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeDocumentPrompt',
  input: {schema: AnalyzeDocumentInputSchema},
  output: {schema: AnalyzeDocumentOutputSchema},
  prompt: `You are an expert forensic document examiner with a specialization in detecting highly sophisticated forgeries. Your task is to perform a meticulous analysis of the provided document(s) in the image.

  {{#if documentType}}
  User-Provided Document Type (may refer to one or all documents if multiple are present): {{{documentType}}}
  {{else}}
  User-Provided Document Type: None (AI to identify all document types present)
  {{/if}}
  Description: {{{description}}}
  Document Image (may contain one or more documents): {{media url=documentDataUri}}

  Instructions for Analysis:

  1.  **Document Type Context and Identification (Crucial for Multiple Documents):**
      *   **Multiple Documents Scenario:** If the image appears to contain multiple distinct documents (e.g., an ID card, a driver's license, and a utility bill on the same scan), **your first priority is to try to identify each of these document types.** Populate the \`identifiedOrConfirmedDocumentType\` field with a comma-separated list of all clearly identified types (e.g., "ID Card, Driver's License, Utility Bill"). If exact identification is challenging for some, you can use general terms like "Multiple Identification Documents" or "Set of Personal Documents" while still listing specific ones if possible.
      *   {{#if documentType}}
          **User-Provided Type (Guidance):** The user specified \`{{{documentType}}}\`. If multiple documents are present, this might refer to one primary document or a general category. Use this as guidance, but independently identify all documents. Your \`identifiedOrConfirmedDocumentType\` field should reflect all documents seen.
      *   {{else}}
          **AI Identification Required (Primary Task):** The user has NOT provided a document type. Your first step is to carefully examine the document image and attempt to identify all distinct document types present. Populate the \`identifiedOrConfirmedDocumentType\` field accordingly. If you cannot reliably identify any types, state "Unknown Document Type(s)".
      *   {{/if}}

  2.  **Leverage Identified/Confirmed Document Type(s):** For each document identified (as listed in \`identifiedOrConfirmedDocumentType\`), you MUST tailor your analysis. Consider specific expected features, layouts, security elements (if applicable, like holograms for IDs), common content, typical paper/font styles, and known areas of scrutiny for *each specific document type*.
      *   For example, if you identify a "Passport," a "Driver's License," AND a "Utility Bill":
          *   Passport/Driver's License: Scrutinize photo integration, holographic overlays, MRZ codes, microprinting, data consistency (birth date vs. issue/expiry).
          *   Utility Bill: Check company branding, consistent layouts for addresses/account numbers, font usage for alterations.
      *   If \`identifiedOrConfirmedDocumentType\` lists multiple types, your analysis must address each.

  3.  **Scrutinize with Extreme Detail:** Assume that forgeries can be very subtle. Look for minute inconsistencies in each document.

  4.  **Authenticity Assessment (Overall and Per Document if Possible):** Based on your comprehensive analysis of all documents, determine overall authenticity. Set \`isAuthentic\` to \`false\` if any document has medium/high severity anomalies indicative of forgery. If image quality severely hinders analysis of critical features on *any* document, set \`isAuthentic\` to \`false\` and clearly state in the summary that this is due to *inability to verify that specific document*, not a confirmed forgery.

  5.  **Anomaly Detection (Link to Specific Document):** Identify and list ALL anomalies for ALL documents. For each anomaly:
      *   \`anomalyType\`: Specific category (e.g., "Signature Mismatch", "Altered Text").
      *   \`description\`: Detailed explanation. If it's a common scan artifact, explain its benign nature.
      *   \`location\`: **Crucially, if multiple documents are present, specify WHICH document the anomaly pertains to** (e.g., "Driver's License: Signature Area", "Utility Bill: Date Field", "Top-left Document: Watermark").
      *   \`severity\`: 'low', 'medium', or 'high'. Benign scan artifacts are 'low'.

  6.  **Consider Advanced Techniques:** Be aware of advanced forgery methods relevant to the identified document types.

  7.  **Cross-Verification (Conceptual):** Note elements that would ideally be cross-verified for each document.

  Specific Considerations for Scanned Documents and Image Quality:
  8.  **Scanned Document Artifacts:** Differentiate benign scanning artifacts (skew, dust, minor shadows, moiré patterns, resolution limits, uneven lighting) from actual manipulation. These common artifacts, by themselves, are NOT indicators of forgery. Focus analysis on inconsistencies *within each document's content* not attributable to scanning. Prioritize looking for inconsistencies *within the document's content itself* rather than over-penalizing the medium (the scan). Only flag scan-related issues as anomalies if unusually pronounced, obscuring critical information intentionally, or combined with content-based suspicions. Categorize pure scan artifacts as "Scan Artifact" with 'low' severity.

  9.  **Image Quality Impact (Per Document):** If image quality (poor lighting, angle, blur, low resolution) significantly hinders analysis of *any specific document*, state this in your summary and anomaly descriptions (linking the quality issue to the affected document). Detail obscured areas. Do NOT conclude a document is inauthentic solely due to poor image quality preventing verification. If analysis of a document is severely hindered, this contributes to overall \`isAuthentic\` being \`false\` due to inability to verify.

  10. **Summary (Address All Documents):** Provide a concise summary. If multiple documents were analyzed, briefly summarize findings for each. Highlight critical observations, your overall authenticity conclusion (considering all \`identifiedOrConfirmedDocumentType\`s), and explicitly mention limitations. If authenticity of any document cannot be confirmed due to quality, state this clearly.

  Even if documents seem legitimate, find any indication of manipulation. Maintain a critical mindset but differentiate clearly between capture artifacts and deliberate forgery for each document.
  Output in JSON format. Ensure \`identifiedOrConfirmedDocumentType\` accurately reflects all identified document types in the image.`,
});

const analyzeDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeDocumentFlow',
    inputSchema: AnalyzeDocumentInputSchema,
    outputSchema: AnalyzeDocumentOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);

    if (output && typeof output.identifiedOrConfirmedDocumentType !== 'string' || !output.identifiedOrConfirmedDocumentType.trim()) {
      // If AI fails to specify, or returns empty, use user input or mark as unknown
      if (input.documentType) {
        output.identifiedOrConfirmedDocumentType = `User specified: ${input.documentType} (AI did not confirm/specify further)`;
      } else {
        output.identifiedOrConfirmedDocumentType = 'Unknown Document Type(s) (AI failed to specify)';
      }
    }
    return output!;
  }
);
