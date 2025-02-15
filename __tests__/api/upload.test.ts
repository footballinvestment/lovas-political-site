// __tests__/api/upload.test.ts
import { POST } from '@/app/api/upload/route';
import { NextRequest } from 'next/server';

describe('Upload API', () => {
  describe('Security - File Content Validation', () => {
    it('should detect PHP file disguised as image', async () => {
      const fakeFile = new File(
        ['<?php echo "malicious"; ?>'],
        'test.jpg',
        { type: 'image/jpeg' }
      );
      const formData = new FormData();
      formData.append('file', fakeFile);

      const response = await POST(
        new NextRequest('http://localhost:3000/api/upload', {
          method: 'POST',
          body: formData
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('A fájl malware-t tartalmazhat');
    });

    it('should validate image file structure', async () => {
      const fakeFile = new File(
        ['invalid image content'],
        'test.jpg',
        { type: 'image/jpeg' }
      );
      const formData = new FormData();
      formData.append('file', fakeFile);

      const response = await POST(
        new NextRequest('http://localhost:3000/api/upload', {
          method: 'POST',
          body: formData
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Sérült képfájl');
    });

    it('should detect embedded malicious content in valid image', async () => {
      // JPEG header + malicious content
      const content = new Uint8Array([
        0xFF, 0xD8, 0xFF, // Valid JPEG header
        ...new TextEncoder().encode('<?php echo "malicious"; ?>')
      ]);
      
      const fakeFile = new File([content], 'test.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', fakeFile);

      const response = await POST(
        new NextRequest('http://localhost:3000/api/upload', {
          method: 'POST',
          body: formData
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('A fájl malware-t tartalmazhat');
    });

    it('should accept valid image file', async () => {
      // Valid JPEG file content
      const content = new Uint8Array([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
        0x49, 0x46, 0x00, 0x01, // JPEG header
        ...new Array(100).fill(0) // Image data
      ]);
      
      const fakeFile = new File([content], 'valid.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', fakeFile);

      const response = await POST(
        new NextRequest('http://localhost:3000/api/upload', {
          method: 'POST',
          body: formData
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('Fájl sikeresen feltöltve');
    });
  });
});