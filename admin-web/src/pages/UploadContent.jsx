// UploadContent.jsx
// หน้าอัปโหลดไฟล์รูป/วิดีโอ **ลบ YouTube ออกทั้งหมดแล้ว**

import React, { useEffect, useState } from 'react';
import axios from 'axios';

// ปรับ BASE_URL ให้ตรง backend
const BASE_URL = 'http://localhost:5000/api';

const initialFileForm = {
  title: '',
  type: 'image',
  file: null,
  durationSeconds: 10,
  playlistName: 'default',
  playlistOrder: 0
};

const UploadContent = () => {
  const [fileForm, setFileForm] = useState(initialFileForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushMessage, setPushMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewType, setPreviewType] = useState('');
  const [previewError, setPreviewError] = useState('');

  const handleFileInputChange = (e) => {
    const { name, value } = e.target;
    setFileForm((prev) => ({
      ...prev,
      [name]:
        name === 'durationSeconds' || name === 'playlistOrder'
          ? Number(value)
          : value
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const detectedType = file.type.startsWith('video') ? 'video' : 'image';
    setFileForm((prev) => ({
      ...prev,
      file,
      type: detectedType
    }));

    // Clear existing preview URL
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    const nextUrl = URL.createObjectURL(file);
    if (file.type.startsWith('image')) {
      setPreviewUrl(nextUrl);
      setPreviewType('image');
      setPreviewError('');
    } else if (file.type.startsWith('video')) {
      setPreviewUrl(nextUrl);
      setPreviewType('video');
      setPreviewError('');
    } else {
      setPreviewUrl('');
      setPreviewType('');
      setPreviewError('ไม่สามารถพรีวิวไฟล์นี้ได้');
      URL.revokeObjectURL(nextUrl);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setPushMessage('');

    if (!fileForm.file) {
      setError('Please choose a file to upload');
      return;
    }

    setLoadingUpload(true);
    try {
      const formData = new FormData();
      formData.append('title', fileForm.title || fileForm.file.name);
      formData.append('type', fileForm.type);
      formData.append('durationSeconds', String(fileForm.durationSeconds));
      formData.append('playlistName', fileForm.playlistName);
      formData.append('playlistOrder', String(fileForm.playlistOrder));
      formData.append('file', fileForm.file);

      const res = await axios.post(`${BASE_URL}/content/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage(res.data?.message || 'Upload success');
      setFileForm(initialFileForm);
      setPreviewUrl('');
      setPreviewType('');
      setPreviewError('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoadingUpload(false);
    }
  };

  const handlePushToPlayer = async () => {
    setPushMessage('');
    setPushing(true);
    try {
      const res = await axios.post(`${BASE_URL}/publish`);
      setPushMessage(res.data?.message || 'ส่งขึ้นอุปกรณ์เรียบร้อย');
    } catch (err) {
      console.error(err);
      setPushMessage(err.response?.data?.message || 'ส่งไปยังอุปกรณ์ไม่สำเร็จ');
    } finally {
      setPushing(false);
    }
  };

  // Revoke object URL on cleanup
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full pt-10 relative">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-2xl font-semibold">Upload Content</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 justify-center">
        {/* Image / Video Upload ONLY */}
        <section className="p-5 rounded-xl border border-slate-700 bg-slate-900/70 shadow space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Image / Video</h3>
            {loadingUpload && (
              <span className="text-xs text-slate-300">Uploading...</span>
            )}
          </div>

          <form className="space-y-3" onSubmit={handleUploadSubmit}>
            <div>
              <label className="block mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={fileForm.title}
                onChange={handleFileInputChange}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
                placeholder="ตั้งชื่อไฟล์"
                required
              />
            </div>

            <div>
              <label className="block mb-1">Select File</label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="w-full text-sm"
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                Images or videos are supported.
              </p>
            </div>

            {/* Preview block */}
            {(previewUrl || previewError) && (
              <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Preview</span>
                  {previewType && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-700 text-[11px] uppercase tracking-wide">
                      {previewType}
                    </span>
                  )}
                </div>
                {previewType === 'image' && (
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="w-full max-h-64 object-contain rounded-md bg-slate-900"
                  />
                )}
                {previewType === 'video' && (
                  <video
                    src={previewUrl}
                    controls
                    className="w-full max-h-64 rounded-md bg-slate-900"
                  />
                )}
                {previewError && (
                  <p className="text-sm text-amber-300">{previewError}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1">Duration (seconds)</label>
                <input
                  type="number"
                  name="durationSeconds"
                  value={fileForm.durationSeconds}
                  onChange={handleFileInputChange}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
                  min="3"
                />
              </div>

              <div>
                <label className="block mb-1">Playlist Name</label>
                <input
                  type="text"
                  name="playlistName"
                  value={fileForm.playlistName}
                  onChange={handleFileInputChange}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1">Order</label>
                <input
                  type="number"
                  name="playlistOrder"
                  value={fileForm.playlistOrder}
                  onChange={handleFileInputChange}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
                />
              </div>

              <div>
                <label className="block mb-1">Detected Type</label>
                <input
                  type="text"
                  value={fileForm.type}
                  disabled
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="submit"
                disabled={loadingUpload}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-accent hover:bg-rose-600 text-white text-sm font-medium disabled:opacity-60"
              >
                {loadingUpload ? 'Uploading...' : 'อัพโหลดไฟล์'}
              </button>

              <button
                type="button"
                onClick={handlePushToPlayer}
                disabled={pushing}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-accent text-sm font-medium text-white bg-accent hover:bg-rose-600 disabled:opacity-60 shadow-lg"
              >
                {pushing ? 'กำลังส่ง...' : 'ส่งคอนเทนต์ไปยังอุปกรณ์'}
              </button>
            </div>
          </form>
        </section>
      </div>

      {(message || error) && (
        <div className="mt-1 text-sm">
          {message && <p className="text-emerald-400">{message}</p>}
          {error && <p className="text-red-400">{error}</p>}
        </div>
      )}

      {pushMessage && (
        <div className="mt-1 text-sm text-sky-200">{pushMessage}</div>
      )}
    </div>
  );
};

export default UploadContent;
