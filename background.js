browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fetch') {
    if (!message.usernames || message.usernames.length === 0) {
      sendResponse({ users: [] });
      return;
    }

    Promise.all(message.usernames.map(fetchLeetCodeProfile))
      .then(users => sendResponse({ users }))
      .catch(err => {
        console.error("Error fetching users:", err);
        sendResponse({ users: [] });
      });
    return true;
  }
});

async function fetchLeetCodeProfile(username) {
  try {
    const response = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);
    const data = await response.json();

    if (data.status !== 'success') throw new Error('API error');

    return {
      username,
      solved: data.totalSolved,
      rank: data.ranking,
      easySolved: data.easySolved,
      mediumSolved: data.mediumSolved,
      hardSolved: data.hardSolved
    };
  } catch (err) {
    console.error(`Failed to fetch stats for ${username}:`, err);
    return {
      username,
      solved: 'N/A',
      rank: 'N/A',
      easySolved: 'N/A',
      mediumSolved: 'N/A',
      hardSolved: 'N/A'
    };
  }
}
