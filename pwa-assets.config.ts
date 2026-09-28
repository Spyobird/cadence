import { defineConfig, type Preset } from '@vite-pwa/assets-generator/config'

// The day ring (icon draft A), gold on #0F1113. Its square is already opaque and filled, so no padding.
// Regenerate with `npm run icons`, then commit the PNGs.
const preset: Preset = {
  transparent: {
    sizes: [64, 192, 512],
    favicons: [[48, 'favicon.ico']],
    padding: 0,
  },
  maskable: { sizes: [], padding: 0 },
  apple: {
    sizes: [180],
    padding: 0,
    resizeOptions: { background: '#0F1113' },
  },
}

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset,
  images: ['public/icon.svg'],
})
