import React, { useState } from 'react';
import AvatarCropper from '../components/AvatarCropper';

function Profile() {
  // Example user data, replace with real API/user context
  const [user, setUser] = useState({
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '9876543210',
    username: 'john_doe',
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
    // Save cropped avatar to backend here
  };

  const handleSave = () => {
    setEditMode(false);
    // Save user details to backend here
  };

  // Drag-and-drop avatar upload
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-md bg-slate-800 rounded-xl shadow-lg p-8 border border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-white">Profile</h2>
        <div className="flex flex-col items-center mb-6">
          <label htmlFor="avatar-upload" className="cursor-pointer">
            <img
              src={avatarPreview || 'https://ui-avatars.com/api/?name=' + user.fullName + '&background=374151&color=fff'}
              alt="User avatar"
              className="w-24 h-24 rounded-full border-2 border-green-500 object-cover mb-2"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              aria-label="Drag and drop avatar image"
            />
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              aria-label="Upload avatar"
            />
          </label>
          {cropMode && avatarPreview && <AvatarCropper src={avatarPreview} onCrop={handleCrop} />}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-slate-600 rounded-full h-2 mt-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          )}
          {uploadError && (
            <div className="text-red-400 text-sm mt-2">{uploadError}</div>
          )}
          <span className="text-white font-medium">{user.fullName}</span>
          <span className="text-xs text-slate-400 mt-1">Drag and drop image to upload</span>
        </div>
        <form className="space-y-4" aria-label="Profile form">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="fullName">Full Name</label>
            <input
              type="text"
              name="fullName"
              id="fullName"
              value={user.fullName}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-60"
              disabled={!editMode}
              aria-label="Full Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={user.email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-60"
              disabled={!editMode}
              aria-label="Email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="phone">Phone</label>
            <input
              type="tel"
              name="phone"
              id="phone"
              value={user.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-60"
              disabled={!editMode}
              aria-label="Phone"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="username">Username</label>
            <input
              type="text"
              name="username"
              id="username"
              value={user.username}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-60"
              disabled={!editMode}
              aria-label="Username"
            />
          </div>
          {editMode ? (
            <button type="button" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition" onClick={handleSave} aria-label="Save profile">Save</button>
          ) : (
            <button type="button" className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-lg transition" onClick={() => setEditMode(true)} aria-label="Edit profile">Edit</button>
          )}
        </form>
      </div>
    </div>
  );
}

export default Profile;
