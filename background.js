const extensionApi = globalThis.browser ?? globalThis.chrome;

extensionApi.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action !== 'fetch') return false;

  const usernames = Array.isArray(message.usernames) ? message.usernames : [];
  Promise.all(usernames.map(fetchLeetCodeProfile))
    .then(users => sendResponse({ users }))
    .catch(error => {
      console.error('Could not load profiles:', error);
      sendResponse({ error: 'Could not reach LeetCode.' });
    });

  return true;
});

async function queryLeetCode(query, username) {
  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { username } })
  });

  if (!response.ok) throw new Error(`LeetCode returned ${response.status}`);
  const result = await response.json();
  if (result.errors?.length) throw new Error(result.errors[0].message);
  return result.data;
}

async function fetchLeetCodeProfile(username) {
  try {
    const profile = await queryLeetCode(`
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          submitStats {
            acSubmissionNum {
              difficulty
              count
            }
          }
          profile { ranking }
        }
      }
    `, username);

    const matchedUser = profile?.matchedUser;
    if (!matchedUser) throw new Error('User not found');

    const counts = Object.fromEntries(
      (matchedUser.submitStats?.acSubmissionNum ?? []).map(item => [item.difficulty, item.count])
    );

    let lastSubmission = null;
    try {
      const submission = await queryLeetCode(`
        query getRecentSubmission($username: String!) {
          recentSubmissionList(username: $username, limit: 1) {
            id
            title
            titleSlug
            timestamp
            statusDisplay
            lang
          }
        }
      `, username);
      const latest = submission?.recentSubmissionList?.[0];
      if (latest) {
        lastSubmission = {
          title: latest.title,
          titleSlug: latest.titleSlug,
          timestamp: Number(latest.timestamp),
          status: latest.statusDisplay,
          lang: latest.lang
        };
      }
    } catch (error) {
      console.warn(`Recent submission unavailable for ${username}:`, error);
    }

    return {
      username: matchedUser.username,
      solved: counts.All ?? null,
      easySolved: counts.Easy ?? null,
      mediumSolved: counts.Medium ?? null,
      hardSolved: counts.Hard ?? null,
      rank: matchedUser.profile?.ranking ?? null,
      lastSubmission
    };
  } catch (error) {
    console.error(`Could not load ${username}:`, error);
    return { username, error: error.message };
  }
}
