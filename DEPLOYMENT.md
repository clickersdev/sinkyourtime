# Deployment Guide

This guide covers how to deploy the Sink Your Time application to various platforms.

## Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Git repository set up

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open http://localhost:5173 in your browser

## Building for Production

1. Build the application:

```bash
npm run build
```

2. Preview the production build:

```bash
npm run preview
```

The built files will be in the `dist` directory.

## Deployment Options

### Vercel (Recommended)

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Deploy:

```bash
vercel
```

3. Follow the prompts to configure your deployment

### Netlify

1. Build the project:

```bash
npm run build
```

2. Drag and drop the `dist` folder to Netlify's deploy area

Or use Netlify CLI:

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### GitHub Pages

1. Add to your `vite.config.ts`:

```typescript
export default defineConfig({
  base: "/your-repo-name/",
  // ... other config
});
```

2. Build and deploy:

```bash
npm run build
git add dist
git commit -m "Deploy to GitHub Pages"
git subtree push --prefix dist origin gh-pages
```

### Static Hosting (AWS S3, etc.)

1. Build the project:

```bash
npm run build
```

2. Upload the contents of the `dist` directory to your static hosting service

## Environment Variables

The application doesn't require any environment variables as it's a client-side only application with local data storage.

## Browser Compatibility

The application supports:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## PWA Features (Future)

To enable PWA features:

1. Install PWA plugin:

```bash
npm install vite-plugin-pwa
```

2. Configure in `vite.config.ts`:

```typescript
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ],
});
```

## Troubleshooting

### Build Errors

- Ensure all dependencies are installed: `npm install`
- Check TypeScript errors: `npm run build:check`
- Clear node_modules and reinstall if needed

### Runtime Errors

- Check browser console for errors
- Ensure IndexedDB is supported in your browser
- Verify all required browser APIs are available

### Performance Issues

- Enable gzip compression on your hosting provider
- Consider using a CDN for static assets
- Monitor bundle size with `npm run build`

## Support

For deployment issues, check:

1. Browser console for errors
2. Network tab for failed requests
3. Application logs in your hosting provider's dashboard
