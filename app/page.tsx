'use client';
import { useEffect, useState } from 'react';

const UPLOAD_API = 'https://6x56relss4r4q6ujvzbbs6k54y0zfuma.lambda-url.ap-southeast-2.on.aws/';
const GALLERY_API = 'https://47z3ppyivynsem43h3hojjhy4e0ezdkk.lambda-url.ap-southeast-2.on.aws/';

type Photo = { photoId: string; caption: string; size: number; uploadedAt: number };

async function post(url: string, body: object) {
  const r = await fetch(url, { method: 'POST', body: JSON.stringify(body) });
  return r.json();
}

export default function Home() {
  const [userId, setUserId] = useState('');
  const [input, setInput] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [sort, setSort] = useState<'date' | 'size'>('date');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gallery-user');
      if (saved) setUserId(saved);
    } catch {}
  }, []);

  const load = async (uid: string) => {
    const d = await post(GALLERY_API, { action: 'list', userId: uid });
    setPhotos(d.photos ?? []);
  };

  useEffect(() => { if (userId) load(userId); }, [userId]);

  const login = () => {
    const u = input.trim().toLowerCase();
    if (!u) return;
    try { localStorage.setItem('gallery-user', u); } catch {}
    setUserId(u);
  };

  const logout = () => {
    try { localStorage.removeItem('gallery-user'); } catch {}
    setUserId(''); setPhotos([]);
  };

  const upload = async (file: File) => {
    setMsg('Uploading...');
    try {
      const s = await post(UPLOAD_API, { userId, fileName: file.name, contentType: file.type });
      await fetch(s.url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      await post(GALLERY_API, { action: 'confirm', userId, key: s.key, size: file.size, caption: file.name });
      setMsg('Uploaded!');
      load(userId);
    } catch (e) {
      setMsg('Upload failed');
    }
  };

  const del = async (p: Photo) => {
    if (!confirm('Delete this photo?')) return;
    await post(GALLERY_API, { action: 'delete', userId, key: p.photoId });
    load(userId);
  };

  const sorted = [...photos].sort((a, b) =>
    sort === 'date' ? b.uploadedAt - a.uploadedAt : b.size - a.size
  );

  if (!userId) {
    return (
      <main style={{ maxWidth: 320, margin: '80px auto', display: 'grid', gap: 8 }}>
        <h2>Photo Gallery</h2>
        <input placeholder="Your email / username" value={input} onChange={e => setInput(e.target.value)} />
        <button onClick={login}>Enter</button>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 640, margin: '40px auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>My Photos</h1>
        <button onClick={logout}>Logout</button>
      </div>
      <p>User: {userId}</p>
      <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
      <p>{msg}</p>
      <div style={{ margin: '12px 0' }}>
        Sort by:{' '}
        <button onClick={() => setSort('date')}>Date</button>{' '}
        <button onClick={() => setSort('size')}>Size</button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {sorted.map(p => (
          <li key={p.photoId} style={{ display: 'flex', gap: 8, padding: '8px 0', alignItems: 'center' }}>
            <span style={{ flex: 1 }}>{p.caption} ({(p.size / 1024).toFixed(0)} KB, {new Date(p.uploadedAt).toLocaleString()})</span>
            <button onClick={() => del(p)}>Delete</button>
          </li>
        ))}
        {sorted.length === 0 && <li>No photos yet</li>}
      </ul>
    </main>
  );
}