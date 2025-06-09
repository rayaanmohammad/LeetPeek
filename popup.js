const mainPage = document.getElementById('main-page');
const settingsPage = document.getElementById('settings-page');
const settingsBtn = document.getElementById('settings-btn');
const backBtn = document.getElementById('back-btn');
const refreshBtn = document.getElementById('refresh-btn');
const dataContainer = document.getElementById('data-container');
const addBtn = document.getElementById('add-btn');
const usernameInput = document.getElementById('username-input');
const usernameList = document.getElementById('username-list');

usernameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    addBtn.click();
  }
});

settingsBtn.onclick = () => {
  mainPage.style.display = 'none';
  settingsPage.style.display = 'block';
  renderUsernameList();
};

backBtn.onclick = () => {
  settingsPage.style.display = 'none';
  mainPage.style.display = 'block';
  loadData();
};

addBtn.onclick = async () => {
  const username = usernameInput.value.trim();
  if (!username) return;
  const { usernames = [] } = await browser.storage.local.get('usernames');
  if (!usernames.includes(username)) {
    usernames.push(username);
    await browser.storage.local.set({ usernames });
    usernameInput.value = '';
    renderUsernameList();
  }
};

async function removeUsername(username) {
  const { usernames = [] } = await browser.storage.local.get('usernames');
  const updated = usernames.filter(u => u !== username);
  await browser.storage.local.set({ usernames: updated });
  renderUsernameList();
}

async function renderUsernameList() {
  const { usernames = [] } = await browser.storage.local.get('usernames');
  usernameList.innerHTML = '';
  usernames.forEach(username => {
    const li = document.createElement('li');
    li.textContent = username;
    const btn = document.createElement('button');
    btn.textContent = 'remove';
    btn.classList.add('remove-btn');
    btn.onclick = () => removeUsername(username);
    li.appendChild(btn);
    usernameList.appendChild(li);
  });
}

refreshBtn.onclick = async () => {
  await loadData();
};

async function loadData() {
  dataContainer.textContent = 'Peeking...';
  const { usernames = [] } = await browser.storage.local.get('usernames');
  const response = await browser.runtime.sendMessage({ action: 'fetch', usernames });
  if (response && response.users) {
    dataContainer.innerHTML = '';

    response.users.forEach(user => {
      const div = document.createElement('div');
      div.className = 'user-box';

      const usernameStrong = document.createElement('strong');
      usernameStrong.textContent = user.username;
      div.appendChild(usernameStrong);

      div.appendChild(document.createElement('br'));

      const solvedText = document.createTextNode(`Solved: ${user.solved}`);
      div.appendChild(solvedText);

      div.appendChild(document.createElement('br'));

      const easySpan = document.createElement('span');
      easySpan.className = 'easy';
      easySpan.textContent = `Easy solved: ${user.easySolved || 'N/A'}`;
      div.appendChild(easySpan);

      div.appendChild(document.createElement('br'));

      const mediumSpan = document.createElement('span');
      mediumSpan.className = 'medium';
      mediumSpan.textContent = `Medium solved: ${user.mediumSolved || 'N/A'}`;
      div.appendChild(mediumSpan);

      div.appendChild(document.createElement('br'));

      const hardSpan = document.createElement('span');
      hardSpan.className = 'hard';
      hardSpan.textContent = `Hard solved: ${user.hardSolved || 'N/A'}`;
      div.appendChild(hardSpan);

      div.appendChild(document.createElement('br'));

      const rankText = document.createTextNode(`Rank: ${user.rank || 'N/A'}`);
      div.appendChild(rankText);

      dataContainer.appendChild(div);
    });
  } else {
    dataContainer.textContent = 'Failed to load data.';
  }
}
loadData();
