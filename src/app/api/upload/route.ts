// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import { writeFile, mkdir, access, unlink } from "fs/promises";
import { constants } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { withRateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { logAPIError } from "@/lib/error-logger";
import { sanitizeFilename } from "@/lib/input-sanitizer";
import { validateCSRFMiddleware } from "@/lib/csrf";

// File type detection using magic numbers
const FILE_SIGNATURES = {
  // Images
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  'image/bmp': [0x42, 0x4D],
  
  // Documents
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
  
  // Videos (limited support)
  'video/mp4': [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
  'video/webm': [0x1A, 0x45, 0xDF, 0xA3],
};

// Dangerous file extensions that should never be uploaded
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.php', '.asp', '.jsp', '.sh', '.ps1', '.py', '.pl', '.rb', '.go',
  '.dll', '.so', '.dylib', '.msi', '.deb', '.rpm', '.dmg', '.pkg',
];

// Maximum filename length
const MAX_FILENAME_LENGTH = 255;

// Validate file type using magic numbers
function validateFileType(buffer: Buffer, expectedMimeType: string): boolean {
  const signature = FILE_SIGNATURES[expectedMimeType as keyof typeof FILE_SIGNATURES];
  if (!signature) return false;
  
  // Check if buffer starts with the expected signature
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }
  
  return true;
}

// Validate file extension
function validateFileExtension(filename: string, mimeType: string): boolean {
  const extension = path.extname(filename).toLowerCase();
  
  // Block dangerous extensions
  if (DANGEROUS_EXTENSIONS.includes(extension)) {
    return false;
  }
  
  // Validate extension matches MIME type
  const validExtensions: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'image/bmp': ['.bmp'],
    'application/pdf': ['.pdf'],
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
  };
  
  const allowedExts = validExtensions[mimeType];
  return allowedExts ? allowedExts.includes(extension) : false;
}

// Generate secure filename
function generateSecureFilename(originalFilename: string): string {
  const extension = path.extname(originalFilename).toLowerCase();
  const baseName = path.basename(originalFilename, extension);
  
  // Sanitize the base name
  const sanitizedBaseName = sanitizeFilename(baseName);
  
  // Generate UUID for uniqueness and security
  const uuid = uuidv4();
  
  // Combine sanitized name with UUID
  const secureFilename = `${sanitizedBaseName}_${uuid}${extension}`;
  
  // Ensure filename length doesn't exceed limits
  if (secureFilename.length > MAX_FILENAME_LENGTH) {
    return `${uuid}${extension}`;
  }
  
  return secureFilename;
}

// Validate upload directory security
async function validateUploadDirectory(uploadDir: string): Promise<void> {
  const resolvedPath = path.resolve(uploadDir);
  const expectedPath = path.resolve(process.cwd(), "public/uploads");
  
  // Prevent path traversal attacks
  if (!resolvedPath.startsWith(expectedPath)) {
    throw new Error("Invalid upload directory - path traversal detected");
  }
  
  // Ensure directory exists and is writable
  try {
    await access(uploadDir, constants.F_OK | constants.W_OK);
  } catch {
    await mkdir(uploadDir, { recursive: true, mode: 0o755 });
  }
}

// Scan buffer for malicious content (basic implementation)
function scanForMaliciousContent(buffer: Buffer): boolean {
  const content = buffer.toString('ascii', 0, Math.min(1024, buffer.length));
  
  // Check for script tags and other dangerous patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<%/,
    /<\?php/i,
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(content));
}

export async function POST(request: Request) {
  return withRateLimit("upload", async () => {
    try {
      // CRITICAL FIX: Require admin authentication
      const session = await getServerSession(authOptions);
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Unauthorized - Admin access required" },
          { status: 403 }
        );
      }

      // CSRF protection
      if (!validateCSRFMiddleware(request, session.user.id)) {
        return NextResponse.json(
          { error: "Invalid CSRF token" },
          { status: 403 }
        );
      }

      const formData = await request.formData();
      const file = formData.get("file") as File;
      
      if (!file) {
        return NextResponse.json(
          { error: "Nincs feltöltött fájl" },
          { status: 400 }
        );
      }

      // Enhanced file validation
      const maxSize = Number(env.MAX_FILE_SIZE);
      const allowedTypes = env.ALLOWED_FILE_TYPES.split(",").map(t => t.trim());

      // File size validation
      if (file.size === 0) {
        return NextResponse.json(
          { error: "A fájl üres" },
          { status: 400 }
        );
      }

      if (file.size > maxSize) {
        return NextResponse.json(
          {
            error: `A fájl mérete túl nagy. Maximum: ${Math.round(maxSize / (1024 * 1024))}MB`,
          },
          { status: 400 }
        );
      }

      // MIME type validation
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            error: `Nem támogatott formátum. Engedélyezett típusok: ${allowedTypes.join(", ")}`,
          },
          { status: 400 }
        );
      }

      // Filename validation
      if (!file.name || file.name.length === 0) {
        return NextResponse.json(
          { error: "Érvénytelen fájlnév" },
          { status: 400 }
        );
      }

      // Extension validation
      if (!validateFileExtension(file.name, file.type)) {
        return NextResponse.json(
          { error: "Fájlkiterjesztés nem egyezik a fájltípussal" },
          { status: 400 }
        );
      }

      // Read file buffer for validation
      const buffer = Buffer.from(await file.arrayBuffer());

      // Magic number validation
      if (!validateFileType(buffer, file.type)) {
        return NextResponse.json(
          { error: "Fájl tartalom nem egyezik a deklarált típussal" },
          { status: 400 }
        );
      }

      // Malicious content scan
      if (scanForMaliciousContent(buffer)) {
        await logAPIError(new Error(`Malicious file upload attempt blocked`), {
          context: 'File upload security',
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          userId: session.user.id,
        });
        
        return NextResponse.json(
          { error: "Potenciálisan veszélyes tartalom észlelve" },
          { status: 400 }
        );
      }

      // Generate secure filename and path
      const secureFilename = generateSecureFilename(file.name);
      const uploadDir = path.join(process.cwd(), "public/uploads");

      // Validate upload directory security
      await validateUploadDirectory(uploadDir);

      const filePath = path.join(uploadDir, secureFilename);

      // Ensure the final path is still within the upload directory (double-check)
      const resolvedFilePath = path.resolve(filePath);
      const resolvedUploadDir = path.resolve(uploadDir);
      
      if (!resolvedFilePath.startsWith(resolvedUploadDir)) {
        throw new Error("Path traversal attack detected in filename");
      }

      // Write file with proper permissions
      try {
        await writeFile(filePath, buffer, { mode: 0o644 });

        // Log successful upload for audit
        await logAPIError(new Error(`File uploaded successfully: ${secureFilename}`), {
          context: 'File upload audit',
          filename: secureFilename,
          originalFilename: file.name,
          mimeType: file.type,
          size: file.size,
          userId: session.user.id,
          severity: 'info',
        });

        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");

        return NextResponse.json({
          url: `/uploads/${secureFilename}`,
          type: isVideo ? "video" : isImage ? "image" : "document",
          message: `Fájl sikeresen feltöltve`,
          fileName: secureFilename,
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
        });

      } catch (writeError) {
        await logAPIError(writeError, {
          context: 'File upload write error',
          filename: secureFilename,
          userId: session.user.id,
        });

        return NextResponse.json(
          { error: "Hiba történt a fájl mentése során" },
          { status: 500 }
        );
      }

    } catch (error) {
      await logAPIError(error, {
        context: 'File upload general error',
        endpoint: '/api/upload',
        method: 'POST',
      });

      return NextResponse.json(
        { error: "Hiba történt a feltöltés során" },
        { status: 500 }
      );
    }
  }, session?.user?.role);
}

// DELETE endpoint for removing uploaded files
export async function DELETE(request: Request) {
  return withRateLimit("admin", async () => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Unauthorized - Admin access required" },
          { status: 403 }
        );
      }

      // CSRF protection
      if (!validateCSRFMiddleware(request, session.user.id)) {
        return NextResponse.json(
          { error: "Invalid CSRF token" },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(request.url);
      const filename = searchParams.get("filename");

      if (!filename) {
        return NextResponse.json(
          { error: "Hiányzó fájlnév" },
          { status: 400 }
        );
      }

      // Validate filename security
      const sanitizedFilename = sanitizeFilename(filename);
      if (sanitizedFilename !== filename) {
        return NextResponse.json(
          { error: "Érvénytelen fájlnév" },
          { status: 400 }
        );
      }

      const uploadDir = path.join(process.cwd(), "public/uploads");
      const filePath = path.join(uploadDir, filename);

      // Validate path security
      const resolvedFilePath = path.resolve(filePath);
      const resolvedUploadDir = path.resolve(uploadDir);
      
      if (!resolvedFilePath.startsWith(resolvedUploadDir)) {
        await logAPIError(new Error(`Path traversal attempt in file deletion: ${filename}`), {
          context: 'File deletion security',
          filename,
          userId: session.user.id,
        });
        
        return NextResponse.json(
          { error: "Érvénytelen fájl útvonal" },
          { status: 400 }
        );
      }

      // Check if file exists
      try {
        await access(filePath, constants.F_OK);
      } catch {
        return NextResponse.json(
          { error: "A fájl nem található" },
          { status: 404 }
        );
      }

      // Delete file
      await unlink(filePath);

      // Log deletion for audit
      await logAPIError(new Error(`File deleted: ${filename}`), {
        context: 'File deletion audit',
        filename,
        userId: session.user.id,
        severity: 'info',
      });

      return NextResponse.json({
        success: true,
        message: "Fájl sikeresen törölve",
      });

    } catch (error) {
      await logAPIError(error, {
        context: 'File deletion error',
        endpoint: '/api/upload',
        method: 'DELETE',
      });

      return NextResponse.json(
        { error: "Hiba történt a fájl törlése során" },
        { status: 500 }
      );
    }
  });
}
