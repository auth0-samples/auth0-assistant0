import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';

import { createDocument } from '@/lib/actions/documents';

const ALLOWED_FILE_TYPES = ['text/plain', 'application/pdf', 'text/markdown'];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file provided.' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          message: `Invalid file type. Allowed types are: ${ALLOWED_FILE_TYPES.join(', ')}. Received: ${file.type}`,
        },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ message: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` }, { status: 400 });
    }

    // Read file content
    const [content, buffer] = await extractFileContent(file);

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ message: 'File is empty or has only images.' }, { status: 400 });
    }

    const result = await createDocument(
      {
        content: buffer!,
        fileName: file.name,
        fileType: file.type,
        sharedWith: [],
      },
      content,
    );

    if (result) {
      return NextResponse.json(
        {
          message: 'Document successfully uploaded and embedded.',
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        },
        { status: 200 },
      );
    } else {
      return NextResponse.json({ message: 'Failed to process upload.', error: result }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    const errorMessage = error.message || 'An unexpected error occurred.';
    return NextResponse.json({ message: 'Failed to process upload.', error: errorMessage }, { status: 500 });
  }
}

const extractFileContent = async (file: File): Promise<[string | null, Buffer | null]> => {
  const fileBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(fileBuffer);
  if (file.type === 'application/pdf') {
    const data = await pdf(buffer);
    return [data.text, buffer];
  } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
    return [buffer.toString('utf-8'), buffer];
  }
  // For other types or if extraction isn't applicable/fails for some reason
  return [null, null];
};
