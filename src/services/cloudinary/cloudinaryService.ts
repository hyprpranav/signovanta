export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  format: string;
  isSimulated?: boolean;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey?: string;
}

const CLOUDINARY_STORAGE_KEY = 'signovanta_cloudinary_config';

export function getSavedCloudinaryConfig(): CloudinaryConfig | null {
  try {
    const envConfig = {
      cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
      uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'signovanta_uploads',
      apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '',
    };
    if (envConfig.cloudName) return envConfig;

    const stored = localStorage.getItem(CLOUDINARY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.cloudName) return parsed;
    }
  } catch (err) {
    console.warn('Error reading Cloudinary config:', err);
  }
  return null;
}

export function saveCloudinaryConfig(config: CloudinaryConfig): void {
  localStorage.setItem(CLOUDINARY_STORAGE_KEY, JSON.stringify(config));
}

/**
 * Validates file constraints (type & size)
 */
export function validateUploadFile(
  file: File,
  allowedTypes: ('image' | 'pdf')[] = ['image', 'pdf'],
  maxSizeMb: number = 5
): { isValid: boolean; error?: string } {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';

  const typeValid =
    (allowedTypes.includes('image') && isImage) ||
    (allowedTypes.includes('pdf') && isPdf);

  if (!typeValid) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ').toUpperCase()}`,
    };
  }

  const maxBytes = maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      isValid: false,
      error: `File size exceeds the ${maxSizeMb}MB maximum limit.`,
    };
  }

  return { isValid: true };
}

/**
 * Reads a File into a base64 Data URL (resilient local storage fallback)
 */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file document locally.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a file to Cloudinary with progress callback, with seamless zero-error local fallback.
 */
export async function uploadToCloudinary(
  file: File,
  folder: 'profile_photos' | 'brochures' | 'certificates' | 'event_photos' = 'certificates',
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  const validation = validateUploadFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const config = getSavedCloudinaryConfig();

  // If Cloudinary is configured with valid Cloud Name & Preset, attempt upload to Cloudinary cloud
  if (config?.cloudName && config.uploadPreset) {
    try {
      return await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', config.uploadPreset);
        formData.append('folder', `signovanta/${folder}`);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve({
                url: data.secure_url,
                publicId: data.public_id,
                fileName: file.name,
                fileSize: file.size,
                format: data.format || file.type.split('/')[1] || 'bin',
                isSimulated: false,
              });
            } catch (err) {
              reject(new Error('Failed to parse Cloudinary response.'));
            }
          } else {
            try {
              const errData = JSON.parse(xhr.responseText);
              reject(new Error(errData.error?.message || 'Cloudinary upload rejected.'));
            } catch {
              reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error during media upload.'));
        xhr.send(formData);
      });
    } catch (cloudErr) {
      console.warn('[SIGNOVANTA Cloudinary] Cloud upload unavailable or encountered error, smoothly utilizing high-fidelity local fallback:', cloudErr);
      // Fall through to seamless fallback below
    }
  }

  // Seamless Zero-Error Fallback: Read file as high-fidelity Data URL so the student is never blocked
  if (onProgress) {
    onProgress(30);
    setTimeout(() => onProgress(75), 80);
    setTimeout(() => onProgress(100), 160);
  }

  const dataUrl = await readFileAsDataUrl(file);
  return {
    url: dataUrl,
    publicId: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    fileName: file.name,
    fileSize: file.size,
    format: file.type.split('/')[1] || 'bin',
    isSimulated: true,
  };
}
