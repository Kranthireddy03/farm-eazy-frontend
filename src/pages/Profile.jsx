import React, { useState } from 'react';
import AvatarCropper from '../components/AvatarCropper';
import AppPage from '../components/layout/AppPage';
import { Button } from '../components/ui/button';

function Profile() {
  const [user, setUser] = useState({
    username: 'john_doe',
    email: 'john@example.com',
    phone: '9876543210',
    avatar: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar);
  const [cropMode, setCropMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    setUploadProgress(0);
    setUploadError('');
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadstart = () => setUploadProgress(10);
      reader.onprogress = (ev) => {
        if (ev.lengthComputable) {
          setUploadProgress(Math.round((ev.loaded / ev.total) * 80));
        }
      };
      reader.onload = (ev) => {
        setAvatarPreview(ev.target.result);
        setCropMode(true);
        setUploadProgress(100);
      };
      reader.onerror = () => setUploadError('Failed to read image file.');
      reader.readAsDataURL(file);
    }
  };

  const handleCrop = (croppedDataUrl) => {
    setAvatarPreview(croppedDataUrl);
    setCropMode(false);
  };

  const handleSave = () => {
    setEditMode(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarPreview(ev.target.result);
        setCropMode(true);
        setUploadProgress(100);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <AppPage title="Profile" description="Manage your account details and avatar.">
      <div className="flex justify-center">
        <div className="ops-panel w-full max-w-md p-8">
          <div className="flex flex-col items-center mb-6">
            <label htmlFor="avatar-upload" className="cursor-pointer">
              <img
                src={avatarPreview || `https://ui-avatars.com/api/?name=${user.username}&background=374151&color=fff`}
                alt="User avatar"
                className="w-24 h-24 rounded-full border-2 border-primary object-cover mb-2"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
            {cropMode && avatarPreview && <AvatarCropper src={avatarPreview} onCrop={handleCrop} />}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full rounded-full h-2 mt-2 bg-muted">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
            {uploadError && <p className="text-destructive text-sm mt-2">{uploadError}</p>}
            <span className="font-medium text-foreground">@{user.username}</span>
            <span className="text-xs mt-1 text-muted-foreground">Drag and drop image to upload</span>
          </div>
          <form className="space-y-4">
            <div>
              <label className="form-label" htmlFor="username">Username</label>
              <input
                type="text"
                name="username"
                id="username"
                value={user.username}
                onChange={handleChange}
                className="form-input disabled:opacity-60"
                disabled={!editMode}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="email">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                value={user.email}
                onChange={handleChange}
                className="form-input disabled:opacity-60"
                disabled={!editMode}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="phone">Phone</label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={user.phone}
                onChange={handleChange}
                className="form-input disabled:opacity-60"
                disabled={!editMode}
              />
            </div>
            {editMode ? (
              <Button type="button" className="w-full" onClick={handleSave}>Save</Button>
            ) : (
              <Button type="button" variant="outline" className="w-full" onClick={() => setEditMode(true)}>
                Edit profile
              </Button>
            )}
          </form>
        </div>
      </div>
    </AppPage>
  );
}

export default Profile;
