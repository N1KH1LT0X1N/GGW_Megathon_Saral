# Fix Auth Issues - Quick Solutions

## Problem
The app is requiring Google OAuth authentication but it's failing to verify or authenticate properly.

## Quick Fixes

### Option 1: Clear Browser Storage (Easiest)

Open your browser console (F12) and run:

```javascript
// Clear all auth data
localStorage.clear();
sessionStorage.clear();

// Then reload the page
window.location.reload();
```

### Option 2: Disable Auth Requirement (For Development)

**Temporary fix to bypass authentication:**

Edit `frontend/src/App.js` and remove the `ProtectedRoute` wrapper:

**Change from:**
```javascript
<Route path="/api-setup" element={
  <ProtectedRoute>
    <ApiSetup />
  </ProtectedRoute>
} />
```

**To:**
```javascript
<Route path="/api-setup" element={<ApiSetup />} />
```

Do this for all protected routes.

### Option 3: Fix Google OAuth Setup

The Google Client ID is configured, but you need to ensure:

1. **Backend `.env` has:**
```env
GOOGLE_CLIENT_ID=729612365097-fk1g4tp3eebtksurr80l9dn9n9jlb1gc.apps.googleusercontent.com
JWT_SECRET=your_jwt_secret_key_change_in_production
```

2. **Frontend `.env` has:**
```env
REACT_APP_GOOGLE_CLIENT_ID=729612365097-fk1g4tp3eebtksurr80l9dn9n9jlb1gc.apps.googleusercontent.com
```

3. **Google Cloud Console Settings:**
   - Add authorized JavaScript origins: `http://localhost:3000`
   - Add authorized redirect URIs: `http://localhost:3000`

### Option 4: Make Auth Optional

**Edit `frontend/src/contexts/AuthContext.jsx`:**

Change line 41-50 to catch and ignore errors:

```javascript
const verifyToken = async () => {
  try {
    const response = await api.get('/auth/verify');
    setUser(response.data.user);
  } catch (error) {
    console.warn('Token verification skipped:', error.message);
    // Don't logout, just set loading to false
    setUser({ email: 'dev@example.com', name: 'Dev User' }); // Mock user for dev
  } finally {
    setLoading(false);
  }
};
```

## Restart Both Servers

After making changes:

**Backend:**
```bash
cd c:/python/GGW_Megathon_Saral/backend
# Ctrl+C to stop
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd c:/python/GGW_Megathon_Saral/frontend
# Ctrl+C to stop
npm start
```

## Test Auth Endpoint

Check if backend auth is working:

```bash
curl http://localhost:8000/api/auth/verify
```

Should return: `{"detail":"Not authenticated"}` or similar

## Still Having Issues?

**Check browser console (F12) for:**
- CORS errors
- 401/403 errors
- Network errors

**Common fixes:**
- Make sure backend is running on port 8000
- Make sure frontend is on port 3000
- Clear browser cache and cookies
- Try in incognito/private browsing mode
