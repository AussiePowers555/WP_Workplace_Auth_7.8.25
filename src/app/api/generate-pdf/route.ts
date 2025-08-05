import { NextRequest, NextResponse } from 'next/server';
import { generateSignedPDFBlob } from '@/lib/pdf-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formData, caseDetails, signatureDataURL } = body;

    // Generate PDF using generateSignedPDFBlob (server-side only)
    const pdfResult = await generateSignedPDFBlob(formData, caseDetails, signatureDataURL);

    // Convert blob to base64 for transmission
    const arrayBuffer = await pdfResult.blob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return NextResponse.json({
      base64,
      metadata: pdfResult.metadata
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
