const extensionApi = globalThis.browser ?? globalThis.chrome;
const mainPage = document.getElementById('main-page');
const settingsPage = document.getElementById('settings-page');
const dataContainer = document.getElementById('data-container');
const refreshButton = document.getElementById('refresh-btn');
const usernameInput = document.getElementById('username-input');
const usernameList = document.getElementById('username-list');
const formMessage = document.getElementById('form-message');
const numberFormatter = new Intl.NumberFormat();
let currentRequest = 0;

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function formatNumber(value) {
  return typeof value === 'number' ? numberFormatter.format(value) : '—';
}

function relativeTime(timestamp) {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return 'Time unknown';
  const elapsed = Math.max(0, Math.floor(Date.now() / 1000 - timestamp));
  if (elapsed < 60) return 'Just now';
  if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ago`;
  if (elapsed < 86400) return `${Math.floor(elapsed / 3600)}h ago`;
  return `${Math.floor(elapsed / 86400)}d ago`;
}

function showView(view) {
  const showSettings = view === 'settings';
  mainPage.hidden = showSettings;
  settingsPage.hidden = !showSettings;
  if (showSettings) {
    renderUsernameList();
    usernameInput.focus();
  } else {
    loadData();
  }
}

function renderNotice(title, detail) {
  const notice = createElement('div', 'notice');
  notice.append(createElement('span', 'notice-symbol', '✳'));
  notice.append(createElement('h3', '', title));
  notice.append(createElement('p', '', detail));
  dataContainer.replaceChildren(notice);
}

function renderUser(user, index) {
  const card = createElement('article', 'user-card');
  const top = createElement('div', 'card-top');
  top.append(createElement('span', 'card-index', `NO. ${String(index + 1).padStart(2, '0')}`));
  top.append(createElement('span', 'card-status', user.error ? 'UNAVAILABLE' : 'PROFILE / LIVE'));
  card.append(top);

  const name = createElement('h3', 'user-name');
  const profileLink = createElement('a', '', user.username);
  profileLink.href = `https://leetcode.com/u/${encodeURIComponent(user.username)}/`;
  profileLink.target = '_blank';
  profileLink.rel = 'noopener noreferrer';
  name.append(profileLink);
  card.append(name);

  if (user.error) {
    card.append(createElement('p', 'card-error', 'Profile unavailable. Check the username or try refreshing.'));
    return card;
  }

  const total = createElement('div', 'total-row');
  const totalNumber = createElement('span', 'total-number', formatNumber(user.solved));
  const totalLabel = createElement('span', 'total-label', 'PROBLEMS\nSOLVED');
  total.append(totalNumber, totalLabel);
  card.append(total);

  const breakdown = createElement('div', 'breakdown');
  for (const [label, value, className] of [
    ['EASY', user.easySolved, 'easy'],
    ['MEDIUM', user.mediumSolved, 'medium'],
    ['HARD', user.hardSolved, 'hard']
  ]) {
    const stat = createElement('div', `stat ${className}`);
    stat.append(createElement('span', 'stat-label', label));
    stat.append(createElement('strong', 'stat-value', formatNumber(value)));
    breakdown.append(stat);
  }
  card.append(breakdown);

  const meta = createElement('div', 'card-meta');
  meta.append(createElement('span', '', 'GLOBAL RANK'));
  meta.append(createElement('strong', '', user.rank == null ? 'UNRANKED' : `#${formatNumber(user.rank)}`));
  card.append(meta);

  if (user.lastSubmission) {
    const submission = createElement('div', 'submission');
    const submissionTop = createElement('div', 'submission-top');
    submissionTop.append(createElement('span', '', 'LAST SUBMISSION'));
    submissionTop.append(createElement('time', '', relativeTime(user.lastSubmission.timestamp)));
    submission.append(submissionTop);
    const title = createElement('p', 'submission-title');
    const problemTitle = user.lastSubmission.title || 'Untitled problem';
    if (user.lastSubmission.titleSlug) {
      const problemLink = createElement('a', '', problemTitle);
      problemLink.href = `https://leetcode.com/problems/${encodeURIComponent(user.lastSubmission.titleSlug)}/`;
      problemLink.target = '_blank';
      problemLink.rel = 'noopener noreferrer';
      title.append(problemLink);
    } else {
      title.textContent = problemTitle;
    }
    submission.append(title);
    const details = [user.lastSubmission.status, user.lastSubmission.lang].filter(Boolean).join('  /  ');
    if (details) submission.append(createElement('p', 'submission-detail', details));
    card.append(submission);
  }

  return card;
}

async function loadData() {
  const request = ++currentRequest;
  refreshButton.disabled = true;
  dataContainer.setAttribute('aria-busy', 'true');
  renderNotice('Tuning in…', 'Fetching the latest stats from LeetCode.');

  try {
    const { usernames = [] } = await extensionApi.storage.local.get('usernames');
    if (request !== currentRequest) return;
    document.getElementById('user-count').textContent = `${String(usernames.length).padStart(2, '0')} ${usernames.length === 1 ? 'USER' : 'USERS'}`;
    if (usernames.length === 0) {
      renderNotice('The board is empty.', 'Open Manage users to add your first LeetCode username.');
      return;
    }

    const response = await extensionApi.runtime.sendMessage({ action: 'fetch', usernames });
    if (request !== currentRequest) return;
    if (!Array.isArray(response?.users)) throw new Error(response?.error || 'No data returned');
    dataContainer.replaceChildren(...response.users.map(renderUser));
  } catch (error) {
    console.error('Could not refresh stats:', error);
    if (request === currentRequest) renderNotice('Connection lost.', 'Could not load the board. Try refreshing in a moment.');
  } finally {
    if (request === currentRequest) {
      refreshButton.disabled = false;
      dataContainer.setAttribute('aria-busy', 'false');
    }
  }
}

async function renderUsernameList() {
  try {
    const { usernames = [] } = await extensionApi.storage.local.get('usernames');
    document.getElementById('roster-count').textContent = `${String(usernames.length).padStart(2, '0')} ${usernames.length === 1 ? 'ENTRY' : 'ENTRIES'}`;
    if (usernames.length === 0) {
      usernameList.replaceChildren(createElement('li', 'roster-empty', 'No users saved yet. Add one above.'));
      return;
    }

    usernameList.replaceChildren(...usernames.map((username, index) => {
      const item = createElement('li', 'roster-item');
      item.append(createElement('span', 'roster-index', String(index + 1).padStart(2, '0')));
      item.append(createElement('span', 'roster-name', username));
      const removeButton = createElement('button', 'remove-button', 'REMOVE ×');
      removeButton.type = 'button';
      removeButton.setAttribute('aria-label', `Remove ${username}`);
      removeButton.addEventListener('click', () => removeUsername(username));
      item.append(removeButton);
      return item;
    }));
  } catch (error) {
    console.error('Could not read usernames:', error);
    formMessage.textContent = 'Could not read saved usernames.';
  }
}

async function removeUsername(username) {
  try {
    const { usernames = [] } = await extensionApi.storage.local.get('usernames');
    await extensionApi.storage.local.set({ usernames: usernames.filter(saved => saved !== username) });
    formMessage.textContent = `${username} removed.`;
    renderUsernameList();
  } catch (error) {
    console.error('Could not remove username:', error);
    formMessage.textContent = 'Could not remove username.';
  }
}

document.getElementById('settings-btn').addEventListener('click', () => showView('settings'));
document.getElementById('back-btn').addEventListener('click', () => showView('main'));
refreshButton.addEventListener('click', loadData);
document.getElementById('add-form').addEventListener('submit', async event => {
  event.preventDefault();
  const username = usernameInput.value.trim();
  if (!username) return;

  try {
    const { usernames = [] } = await extensionApi.storage.local.get('usernames');
    if (usernames.some(saved => saved.toLowerCase() === username.toLowerCase())) {
      formMessage.textContent = 'That username is already on the roster.';
      return;
    }
    await extensionApi.storage.local.set({ usernames: [...usernames, username] });
    usernameInput.value = '';
    formMessage.textContent = `${username} added.`;
    renderUsernameList();
    usernameInput.focus();
  } catch (error) {
    console.error('Could not save username:', error);
    formMessage.textContent = 'Could not save username.';
  }
});

loadData();
