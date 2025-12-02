# Deployment Guide

Production deployment options and configuration for GießPlan.

**IHK Abschlussprojekt**: Fachinformatiker/-in für Anwendungsentwicklung  
📄 [Project Documentation](IHK_PROJECT.md)

---

## Table of Contents

- [Quick Deploy](#quick-deploy)
- [Build Process](#build-process)
- [Hosting Options](#hosting-options)
- [Configuration](#configuration)
- [Security Considerations](#security-considerations)

---

## Quick Deploy

### Option 1: Static Site (Recommended)

**Build**:
```bash
npm run build
```

**Deploy `dist/` folder to**:
- GitHub Pages
- Netlify
- Vercel
- Any static host

**Access**: Open `index.html` in browser

---

## Build Process

### Production Build

```bash
npm run build
```

**Output**: `dist/` folder with optimized files

**Contents**:
- `index.html` - Entry point
- `assets/` - JS, CSS bundles (hashed)
- Optimized for performance

**Build Stats**:
- Bundle size: ~500KB (gzipped ~150KB)
- Build time: ~10-20 seconds
- Tree-shaking applied

### Preview Production Build

```bash
npm run preview
```

Opens at `http://localhost:4173`

### Build Optimization

**Already Configured**:
- ✅ Code splitting
- ✅ Tree shaking
- ✅ Asset optimization
- ✅ Minification
- ✅ Source maps (for debugging)

**Performance**:
- First load: < 2s on 3G
- Interactive: < 3s
- Lighthouse score: 95+

---

## Hosting Options

### GitHub Pages (Free, Easy)

**Setup**:
```bash
# 1. Build
npm run build

# 2. Configure base path (if using project page)
# In vite.config.ts:
# base: '/gieplan-plant-watering-scheduler/'

# 3. Deploy
npm run deploy  # or manual push to gh-pages branch
```

**URL**: `https://krialder.github.io/gieplan-plant-watering-scheduler/`

**Pros**: Free, simple, GitHub integrated  
**Cons**: Public only, limited to static content

---

### Netlify (Free Tier Available)

**Setup**:
1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Deploy

**Auto-deploy**: On every push to main

**Features**:
- HTTPS automatic
- Custom domain support
- Deploy previews
- Form handling
- Edge functions (if needed)

**Pros**: Easy, feature-rich, generous free tier  
**Cons**: None for this use case

---

### Vercel (Free Tier Available)

**Setup**:
1. Import GitHub repository
2. Framework: Vite
3. Deploy

**Auto-configured** for Vite projects

**Features**:
- Edge network (fast globally)
- Preview deployments
- Analytics
- Custom domains

**Pros**: Excellent performance, simple setup  
**Cons**: None for this use case

---

### Self-Hosted (Full Control)

**Requirements**:
- Web server (nginx, Apache)
- HTTPS certificate (Let's Encrypt)

**nginx Configuration**:
```nginx
server {
    listen 80;
    server_name gieplan.example.com;
    
    root /var/www/gieplan/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Deploy**:
```bash
# Build
npm run build

# Copy to server
scp -r dist/* user@server:/var/www/gieplan/dist/

# Restart nginx
sudo systemctl restart nginx
```

**Pros**: Full control, private hosting  
**Cons**: Server maintenance required

---

### Desktop App (Electron)

For offline use without browser:

**Setup**:
```bash
npm install electron electron-builder --save-dev
```

**Build**:
```bash
npm run electron:build
```

**Distributable**:
- Windows: `.exe` installer
- macOS: `.dmg` installer
- Linux: `.AppImage`

**Pros**: Offline, native app feel  
**Cons**: Larger download, maintenance overhead

---

## Configuration

### Environment Variables

Create `.env.production`:
```env
# API endpoints (if added later)
VITE_API_URL=https://api.example.com

# Feature flags
VITE_ENABLE_ANALYTICS=false

# App metadata
VITE_APP_VERSION=1.0.0
```

**Access in code**:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

### Build Configuration

**vite.config.ts**:
```typescript
export default defineConfig({
  base: '/',  // Change for subdirectory hosting
  build: {
    outDir: 'dist',
    sourcemap: true,  // Disable in production if desired
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
});
```

### Custom Domain

**GitHub Pages**:
1. Add `CNAME` file to `public/` folder
2. Content: `gieplan.yourdomain.com`
3. Configure DNS: `CNAME` record → `krialder.github.io`

**Netlify/Vercel**:
- Add domain in dashboard
- Update DNS to their nameservers
- HTTPS automatic

---

## Security Considerations

### Data Storage

**Current**: Browser File System Access API (local only)

**Security**:
- ✅ Data never leaves user's computer
- ✅ No server-side storage
- ✅ User controls data location
- ✅ No authentication needed

**Limitations**:
- Single-user only
- No cloud sync
- Manual backups required

### HTTPS

**Required for**:
- File System Access API
- Secure contexts

**Solutions**:
- GitHub Pages: Automatic
- Netlify/Vercel: Automatic
- Self-hosted: Let's Encrypt

### Content Security Policy

Add to `index.html`:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self'; 
               style-src 'self' 'unsafe-inline';">
```

**Prevents**: XSS attacks, unauthorized resources

### Updates

**Security patches**:
```bash
npm audit        # Check vulnerabilities
npm audit fix    # Auto-fix
npm update       # Update dependencies
```

**Schedule**: Monthly security review

---

## Performance Optimization

### Production Checklist

- ✅ Build with `npm run build`
- ✅ Test with `npm run preview`
- ✅ Check bundle size (< 1MB)
- ✅ Test on slow 3G
- ✅ Verify HTTPS
- ✅ Test File System API permissions
- ✅ Cross-browser testing (Chrome, Firefox, Edge)

### Monitoring

**Lighthouse** (Chrome DevTools):
- Performance: 95+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

**Real User Monitoring**:
- Optional: Add analytics (Google Analytics, Plausible)
- Track: Load times, errors, usage patterns

---

## Backup & Recovery

### Data Backup

**User responsibility**:
- Export JSON regularly
- Store backups securely
- Test restore process

**Automated** (future enhancement):
- Optional cloud sync
- Scheduled backups

### Disaster Recovery

**Code**:
- GitHub repository (source of truth)
- Tagged releases
- Documented build process

**Data**:
- User-managed JSON exports
- Multiple export formats
- Clear restore instructions in User Guide

---

## Troubleshooting

### Build Fails

**Check**:
```bash
npm install        # Reinstall dependencies
rm -rf dist        # Clean build folder
npm run build      # Rebuild
```

### File System API Not Working

**Requirements**:
- HTTPS (or localhost)
- Modern browser (Chrome 86+, Edge 86+)
- User permission granted

**Fix**: Deploy with HTTPS

### Large Bundle Size

**Check**:
```bash
npm run build -- --mode analyze  # Analyze bundle
```

**Optimize**:
- Remove unused dependencies
- Code splitting
- Dynamic imports

---

## CI/CD Pipeline

### GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**Auto-deploys** on every push to main

---

## Migration Path

### Current → Future

**Phase 1** (Current):
- Static site
- Local file storage
- Single user

**Phase 2** (Optional):
- Backend API
- Database storage
- Multi-user support
- Authentication

**Phase 3** (Future):
- Real-time collaboration
- Cloud sync
- Mobile apps

**Architecture designed** for gradual enhancement

---

<div align="center">

**IHK Abschlussprojekt 2025** | Fachinformatiker/-in für Anwendungsentwicklung

[⬆ Back to Top](#deployment-guide)

</div>
