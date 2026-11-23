const API = '/api';
let token = localStorage.getItem('connectly_token') || '';
let currentUser = null;
let authMode = 'login';
const $ = id => document.getElementById(id);
const headers = () => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) });
async function request(url, options = {}) {
  const res = await fetch(API + url, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}
function toast(message) { const el = $('toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2600); }
function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }
function initials(name='U') { return escapeHtml(name.trim().charAt(0).toUpperCase() || 'U'); }
function setAuthMode(mode) { authMode = mode; document.querySelectorAll('[data-auth]').forEach(b => b.classList.toggle('active', b.dataset.auth === mode)); $('registerFields').classList.toggle('hidden', mode !== 'register'); $('authSubmit').textContent = mode === 'login' ? 'Log in' : 'Create account'; $('authMessage').textContent = ''; }
document.querySelectorAll('[data-auth]').forEach(b => b.addEventListener('click', () => setAuthMode(b.dataset.auth)));
$('authForm').addEventListener('submit', async e => {
  e.preventDefault(); const fd = new FormData(e.target); const body = Object.fromEntries(fd.entries()); $('authSubmit').disabled = true;
  try { const data = await request('/auth/' + (authMode === 'login' ? 'login' : 'register'), { method: 'POST', body: JSON.stringify(body) }); token = data.token; localStorage.setItem('connectly_token', token); await loadApp(); }
  catch (err) { $('authMessage').textContent = err.message; } finally { $('authSubmit').disabled = false; }
});
async function loadApp() {
  try { const data = await request('/auth/me'); currentUser = data.user; $('authView').classList.add('hidden'); $('appView').classList.remove('hidden'); $('sidebar').classList.remove('hidden'); $('rightRail').classList.remove('hidden'); $('logoutBtn').classList.remove('hidden'); $('welcome').textContent = `Hi, ${currentUser.name}`; document.querySelector('.current-avatar').textContent = initials(currentUser.name); document.querySelector('.mini-avatar').textContent = initials(currentUser.name); await showView('feed'); }
  catch (_err) { logout(false); }
}
function logout(show=true) { token = ''; currentUser = null; localStorage.removeItem('connectly_token'); $('authView').classList.remove('hidden'); $('appView').classList.add('hidden'); $('sidebar').classList.add('hidden'); $('rightRail').classList.add('hidden'); $('logoutBtn').classList.add('hidden'); $('welcome').textContent = ''; if (show) toast('You have logged out.'); }
$('logoutBtn').addEventListener('click', () => logout());
async function showView(view) {
  ['feed','discover','profile'].forEach(v => $(v+'View').classList.toggle('hidden', v !== view));
  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  if (view === 'feed') await loadPosts(); if (view === 'profile') await loadProfile(); if (view === 'discover') $('userSearch').focus();
}
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
$('refreshBtn').addEventListener('click', loadPosts);
$('postForm').addEventListener('submit', async e => { e.preventDefault(); const content = $('postContent').value.trim(); const imageUrl = $('postImageUrl').value.trim(); if (!content) return; try { await request('/posts', { method:'POST', body:JSON.stringify({content, imageUrl}) }); $('postContent').value = ''; $('postImageUrl').value = ''; toast('Your post has been published!'); await loadPosts(); } catch(err) { toast(err.message); } });
async function loadPosts() { try { const {posts} = await request('/posts'); $('postsList').innerHTML = posts.length ? posts.map(renderPost).join('') : '<div class="card post muted">No posts yet. Be the first to share something!</div>'; } catch(err) { toast(err.message); } }
function renderPost(post) {
  const author = post.author || {}; const liked = (post.likes || []).some(id => String(id) === currentUser.id);
  const comments = (post.comments || []).map(c => `<div class="comment"><b>${escapeHtml(c.author?.name || 'User')}</b>${escapeHtml(c.text)}</div>`).join('');
  const image = post.imageUrl ? `<img class="post-image" src="${escapeHtml(post.imageUrl)}" alt="Post image" onerror="this.remove()">` : '';
  const own = String(author._id) === currentUser.id;
  return `<article class="card post" data-id="${post._id}"><div class="post-head"><div class="avatar">${initials(author.name)}</div><div><div class="post-author">${escapeHtml(author.name || 'User')}</div><div class="post-handle">@${escapeHtml(author.username || '')}</div></div><span class="post-time">${new Date(post.createdAt).toLocaleString()}</span></div><div class="post-content">${escapeHtml(post.content)}</div>${image}<div class="post-actions"><button class="action ${liked?'liked':''}" data-action="like">${liked?'♥':'♡'} ${post.likes?.length || 0} Likes</button><button class="action" data-action="focus-comment">▢ ${post.comments?.length || 0} Comments</button>${own?'<button class="action" data-action="delete">Delete</button>':''}</div><div class="comments">${comments}<form class="comment-form"><input name="text" placeholder="Write a comment..." maxlength="500" required><button class="btn ghost" type="submit">Send</button></form></div></article>`;
}
$('postsList').addEventListener('click', async e => { const btn = e.target.closest('[data-action]'); if (!btn) return; const card = btn.closest('.post'); const id = card.dataset.id; try { if (btn.dataset.action === 'like') await request(`/posts/${id}/like`, {method:'POST'}); else if (btn.dataset.action === 'delete') { if (!confirm('Delete this post?')) return; await request(`/posts/${id}`, {method:'DELETE'}); toast('Post deleted.'); } else if (btn.dataset.action === 'focus-comment') { card.querySelector('input[name="text"]').focus(); return; } await loadPosts(); } catch(err) { toast(err.message); } });
$('postsList').addEventListener('submit', async e => { if (!e.target.matches('.comment-form')) return; e.preventDefault(); const card = e.target.closest('.post'); const text = new FormData(e.target).get('text'); try { await request(`/posts/${card.dataset.id}/comments`, {method:'POST', body:JSON.stringify({text})}); await loadPosts(); } catch(err) { toast(err.message); } });
let searchTimer;
$('userSearch').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(searchUsers, 300); });
$('topSearch').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('userSearch').value = e.target.value.trim(); showView('discover').then(searchUsers); } });
async function searchUsers() { const q = $('userSearch').value.trim(); if (!q) { $('userResults').innerHTML = ''; return; } try { const {users} = await request('/users/search?q=' + encodeURIComponent(q)); $('userResults').innerHTML = users.length ? users.map(u => `<div class="user-result"><div class="avatar">${initials(u.name)}</div><div class="user-meta"><b>${escapeHtml(u.name)}</b><p>@${escapeHtml(u.username)} · ${u.followers} followers</p></div><button class="btn ${u.isFollowing?'ghost':'primary'}" data-follow="${u.id}">${u.isFollowing?'Following':'Follow'}</button></div>`).join('') : '<p class="muted small">No users found.</p>'; } catch(err) { toast(err.message); } }
$('userResults').addEventListener('click', async e => { const btn = e.target.closest('[data-follow]'); if (!btn) return; try { const d = await request(`/users/${btn.dataset.follow}/follow`, {method:'POST'}); toast(d.message); await searchUsers(); } catch(err) { toast(err.message); } });
async function loadProfile() { try { const {user} = await request('/auth/me'); currentUser = user; $('profileAvatar').textContent = initials(user.name); $('profileName').textContent = user.name; $('profileUsername').textContent = '@' + user.username; $('profileBio').textContent = user.bio || 'No bio added yet.'; $('profileFollowers').textContent = user.followers; $('profileFollowing').textContent = user.following; $('editName').value = user.name; $('editBio').value = user.bio || ''; } catch(err) { toast(err.message); } }
$('profileForm').addEventListener('submit', async e => { e.preventDefault(); try { await request('/users/me', {method:'PUT', body:JSON.stringify({name:$('editName').value, bio:$('editBio').value})}); $('profileMessage').textContent = 'Profile updated successfully.'; await loadProfile(); $('welcome').textContent = `Hi, ${currentUser.name}`; } catch(err) { $('profileMessage').textContent = err.message; } });
if (token) loadApp();
