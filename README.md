<p align="center">
  <img src="icons/icon_128.png" alt="LeetPeek LP icon" width="88" height="88">
</p>

<h1 align="center">LeetPeek</h1>

<p align="center">A pocket-sized LeetCode scorecard for Firefox and Chrome.</p>

Keep a roster of LeetCode usernames in your browser toolbar. Each profile card shows solved problems by difficulty, global rank, and the latest submission with a link to its problem. The popup uses a compact, retro scorecard design; usernames stay in local extension storage.

## Build and install

Run `powershell -ExecutionPolicy Bypass -File .\build.ps1` from this directory. The source has separate `manifest.firefox.json` and `manifest.chrome.json` files. The script copies each one as `manifest.json` into its browser's package while sharing the JavaScript, popup, styles, and icons. Generated files in `dist/` are ignored by Git.

- **Firefox, temporary install:** Open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `dist/leetpeek-firefox.zip` or `dist/firefox/manifest.json`.
- **Chrome, unpacked install:** Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `dist/chrome`.

The Firefox manifest uses a background script and retains the existing [Firefox add-on](https://addons.mozilla.org/en-US/firefox/addon/leetpeek/) ID; the Chrome manifest uses a service worker. Neither package includes the other browser's background field.

## Use

Open the popup, choose **Manage users**, and enter a LeetCode username. Return to **The board** to see the latest stats. **Refresh** requests updated data. Usernames are saved in the browser's local extension storage; profile requests go directly to `leetcode.com`.

## Publishing

Upload `dist/leetpeek-firefox.zip` as an update to the existing Firefox listing and `dist/leetpeek-chrome.zip` to the Chrome Web Store. Before submission, test a temporary/unpacked install in both browsers with a real username and confirm each store's listing and privacy disclosures.
