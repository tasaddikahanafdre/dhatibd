import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

const BUCKET_NAME = 'image';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const folder = (formData.get('folder') as string) || 'uploads';
    
    // Support both single file ('file') and multiple files ('files' or multiple 'file' entries)
    let files: File[] = [];
    const filesList = formData.getAll('files') as File[];
    const singleFileList = formData.getAll('file') as File[];
    
    if (filesList.length > 0) {
      files = filesList;
    } else if (singleFileList.length > 0) {
      files = singleFileList;
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided for upload' }, { status: 400 });
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (!file || typeof file === 'string') continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = path.extname(file.name) || '.jpg';
      const cleanBase = path.basename(file.name, ext).replace(/[^\w-]/g, '_').slice(0, 30);
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanBase}${ext}`;
      const storagePath = `${folder}/${fileName}`;

      let publicUrl = '';

      // Upload to Supabase Storage 'image' bucket
      try {
        const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        });

        if (error) {
          console.error('Supabase upload error for', file.name, error);
        } else if (data) {
          const { data: pubData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
          publicUrl = pubData.publicUrl;
        }
      } catch (sbErr) {
        console.error('Supabase client error:', sbErr);
      }

      // Fallback to local storage if Supabase upload failed
      if (!publicUrl) {
        const localDir = path.join(process.cwd(), 'public', 'uploads', folder);
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }
        const localFilePath = path.join(localDir, fileName);
        fs.writeFileSync(localFilePath, buffer);
        publicUrl = `/uploads/${folder}/${fileName}`;
      }

      uploadedUrls.push(publicUrl);
    }

    return NextResponse.json({
      url: uploadedUrls[0] || '',
      urls: uploadedUrls,
      count: uploadedUrls.length
    });
  } catch (error: any) {
    console.error('API Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Image upload failed' }, { status: 500 });
  }
}
