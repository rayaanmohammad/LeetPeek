# Development

LeetPeek shares its JavaScript, popup, styles, and icons between Firefox and Chrome. Each browser has its own source manifest: `manifest.firefox.json` uses a background script and keeps the existing Firefox add-on ID; `manifest.chrome.json` uses a service worker.

## Build

From the repository root, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

The script copies each source manifest as `manifest.json` into its browser package. `dist/` is generated and ignored by Git.

| Browser | Unpacked directory | ZIP package |
| --- | --- | --- |
| Firefox | `dist/firefox` | `dist/leetpeek-firefox.zip` |
| Chrome | `dist/chrome` | `dist/leetpeek-chrome.zip` |

## Test locally

- **Firefox:** Open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `dist/leetpeek-firefox.zip` or `dist/firefox/manifest.json`.
- **Chrome:** Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `dist/chrome`.

Add a real LeetCode username in the popup and check the stats, recent-submission link, and refresh action in both browsers.

## Publish

Upload `dist/leetpeek-firefox.zip` as an update to the existing Firefox listing and `dist/leetpeek-chrome.zip` to the Chrome Web Store. Before submission, confirm each store's listing and privacy disclosures.
