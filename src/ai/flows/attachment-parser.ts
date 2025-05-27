// 'use server';
/**
 * @fileOverview Parses attachments (PDF, images of Pix codes) to extract bill details.
 *
 * - attachmentParser - A function that handles the attachment parsing process.
 * - AttachmentParserInput - The input type for the attachmentParser function.
 * - AttachmentParserOutput - The return type for the attachmentParser function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AttachmentParserInputSchema = z.object({
  attachmentDataUri: z
    .string()
    .describe(
      "The bill attachment as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AttachmentParserInput = z.infer<typeof AttachmentParserInputSchema>;

const AttachmentParserOutputSchema = z.object({
  payeeName: z.string().describe('The name of the payee or vendor.'),
  amount: z.number().describe('The amount due on the bill.'),
  dueDate: z.string().describe('The due date of the bill in ISO 8601 format (YYYY-MM-DD).'),
  paymentDetails: z.string().optional().describe('Optional payment details such as Pix key or barcode.'),
});

export type AttachmentParserOutput = z.infer<typeof AttachmentParserOutputSchema>;

export async function attachmentParser(input: AttachmentParserInput): Promise<AttachmentParserOutput> {
  return attachmentParserFlow(input);
}

const attachmentParserPrompt = ai.definePrompt({
  name: 'attachmentParserPrompt',
  input: {schema: AttachmentParserInputSchema},
  output: {schema: AttachmentParserOutputSchema},
  prompt: `You are an expert financial assistant. Your task is to extract bill details from the provided attachment. 

  Analyze the attachment and extract the following information:
  - Payee Name: The name of the company or person to whom the bill is owed.
  - Amount: The total amount due on the bill.
  - Due Date: The date by which the payment must be made (YYYY-MM-DD).
  - Payment Details: If available, extract payment details such as Pix key or barcode.

  Attachment: {{media url=attachmentDataUri}}

  Ensure that the extracted information is accurate and complete. If some information is not available, leave it blank.
  Return the result as a JSON object.
  `,
});

const attachmentParserFlow = ai.defineFlow(
  {
    name: 'attachmentParserFlow',
    inputSchema: AttachmentParserInputSchema,
    outputSchema: AttachmentParserOutputSchema,
  },
  async input => {
    const {output} = await attachmentParserPrompt(input);
    return output!;
  }
);
