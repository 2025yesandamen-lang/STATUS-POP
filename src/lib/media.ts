export interface UploadedMedia {
  secureUrl: string;
  publicId: string;
}

export async function uploadMedia(dataUrl: string, purpose: 'product' | 'flyer'): Promise<UploadedMedia> {
  const signatureResponse = await fetch('/api/media/signature', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ purpose }),
  });
  const signature = await signatureResponse.json() as {
    cloudName?: string;
    apiKey?: string;
    timestamp?: number;
    folder?: string;
    publicId?: string;
    signature?: string;
    message?: string;
  };
  if (!signatureResponse.ok || !signature.cloudName || !signature.apiKey || !signature.timestamp ||
      !signature.folder || !signature.publicId || !signature.signature) {
    throw new Error(signature.message || 'Could not prepare a secure Cloudinary upload.');
  }

  const imageBlob = await (await fetch(dataUrl)).blob();
  if (imageBlob.size > 8 * 1024 * 1024) throw new Error('Images must be smaller than 8 MB to save to your account.');
  const form = new FormData();
  form.append('file', imageBlob);
  form.append('api_key', signature.apiKey);
  form.append('timestamp', String(signature.timestamp));
  form.append('folder', signature.folder);
  form.append('public_id', signature.publicId);
  form.append('signature', signature.signature);

  const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const uploaded = await cloudinaryResponse.json() as {
    secure_url?: string;
    public_id?: string;
    asset_id?: string;
    error?: { message?: string };
  };
  if (!cloudinaryResponse.ok || !uploaded.secure_url || !uploaded.public_id || !uploaded.asset_id) {
    throw new Error(uploaded.error?.message || 'Cloudinary could not store this image.');
  }

  const confirmResponse = await fetch('/api/media/confirm', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      purpose,
      publicId: uploaded.public_id,
      secureUrl: uploaded.secure_url,
      assetId: uploaded.asset_id,
    }),
  });
  const confirmation = await confirmResponse.json() as { message?: string };
  if (!confirmResponse.ok) throw new Error(confirmation.message || 'The upload completed, but could not be linked to your account.');
  return { secureUrl: uploaded.secure_url, publicId: uploaded.public_id };
}
