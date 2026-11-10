export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  format: string;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey?: string;
}

const CLOUDINARY_STORAGE_KEY = 'signovanta_cloudinary_config';

export const DEFAULT_CLOUDINARY_CONFIG: CloudinaryConfig = {
  cloudName: 'ftiyctrq',
  uploadPreset: 'signovanta',
};

export function getSavedCloudinaryConfig(): CloudinaryConfig {
  try {
    const envConfig = {
      cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || DEFAULT_CLOUDINARY_CONFIG.cloudName,
      uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || DEFAULT_CLOUDINARY_CONFIG.uploadPreset,
      apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '',
    };
    if (envConfig.cloudName && envConfig.uploadPreset) return envConfig;

    const stored = localStorage.getItem(CLOUDINARY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.cloudName && parsed.uploadPreset) return parsed;
    }
  } catch (err) {
    console.warn('Error reading Cloudinary config:', err);
  }
  return DEFAULT_CLOUDINARY_CONFIG;
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
  maxSizeMb: number = 10
): { isValid: boolean; error?: string } {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  const typeValid =
    (allowedTypes.includes('image') && isImage) ||
    (allowedTypes.includes('pdf') && isPdf);

  if (!typeValid) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed formats: ${allowedTypes.join(', ').toUpperCase()}`,
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
 * Uploads a file permanently to Cloudinary cloud with real-time progress callback.
 * Base64 browser-only storage is strictly forbidden.
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
  if (!config?.cloudName || !config?.uploadPreset) {
    throw new Error('Cloudinary cloud name or upload preset is not configured.');
  }

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
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
          if (!data.secure_url) {
            reject(new Error('Cloudinary response missing secure_url.'));
            return;
          }
          resolve({
            url: data.secure_url,
            publicId: data.public_id,
            fileName: file.name,
            fileSize: file.size,
            format: data.format || file.type.split('/')[1] || 'bin',
          });
        } catch {
          reject(new Error('Failed to parse Cloudinary response.'));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.error?.message || `Cloudinary rejected upload with status ${xhr.status}`));
        } catch {
          reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error during media upload to Cloudinary. Check your internet connection.'));
    xhr.send(formData);
  });
}
