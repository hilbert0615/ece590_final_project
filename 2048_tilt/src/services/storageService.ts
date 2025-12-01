import { supabase } from './supabase';

/**
 * 上传头像到 Supabase Storage 的 avatars 桶，并返回公开 URL
 */
export const uploadAvatar = async (
  userId: string,
  uri: string
): Promise<{ publicUrl?: string; error?: string }> => {
  try {
    // 使用 fetch 读取为 ArrayBuffer，避免在部分 RN 环境下 Response.blob 不可用的问题
    const res = await fetch(uri);
    if (!res.ok) {
      return { error: `Failed to read the file: ${res.status}` };
    }
    const arrayBuffer = await res.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    // 根据扩展名推断内容类型，默认 jpg
    const getExt = (u: string) => {
      const clean = u.split('?')[0];
      const parts = clean.split('.');
      return parts.length > 1 ? parts.pop()!.toLowerCase() : 'jpg';
    };
    const ext = getExt(uri);
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    const fileName = `${Date.now()}.${ext}`;
    const path = `${userId}/${fileName}`;

    // 确保你在 Supabase 控制台创建了名为 'avatars' 的桶，并设置为 public 读取
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, fileBytes, { contentType, upsert: true });

    if (uploadError) {
      console.error('Profile picture upload failed:', uploadError);
      return { error: uploadError.message };
    }

    // 获取公开访问 URL（需要桶为 public，或配置签名 URL）
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const publicUrl = data.publicUrl;
    console.log('[uploadAvatar] uploaded path:', path, 'publicUrl:', publicUrl);
    if (!publicUrl) {
      return { error: 'Failed to obtain the public address of the profile picture' };
    }

    return { publicUrl };
  } catch (e: any) {
    console.error('Error uploading profile picture:', e);
    return { error: e?.message || 'Upload failed' };
  }
};
