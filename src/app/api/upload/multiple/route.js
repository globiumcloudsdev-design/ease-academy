import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import connectDB from '@/lib/database';

export const runtime = 'nodejs';

export const POST = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();

    const formData = await request.formData();
    const files = formData.getAll('attachments'); // Match the field name used in frontend

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadPromises = files.map(async (file) => {
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        const uploadResult = await uploadToCloudinary(dataUrl, {
          folder: `ease-academy/uploads/${authenticatedUser.userId}`,
          resourceType: 'auto',
        });

        return {
          name: file.name,
          url: uploadResult.url,
          publicId: uploadResult.publicId,
        };
      }
      return null;
    });

    const results = await Promise.all(uploadPromises);
    const urls = results.filter(r => r !== null);

    return NextResponse.json({ 
      success: true, 
      urls: urls // Return the array of objects (name, url, publicId)
    });
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    return NextResponse.json({ success: false, message: 'Failed to upload files' }, { status: 500 });
  }
});
