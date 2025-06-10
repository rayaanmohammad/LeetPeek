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
    return true; // Needed to keep sendResponse async
  }
});

async function fetchLeetCodeProfile(username) {
  try {
    // Query for profile + stats
    const profileQuery = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          submitStats {
            acSubmissionNum {
              difficulty
              count
            }
          }
          profile {
            ranking
          }
        }
      }
    `;

    const profileRes = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com",
        "Origin": "https://leetcode.com"
      },
      body: JSON.stringify({
        query: profileQuery,
        variables: { username }
      })
    });

    const profileJson = await profileRes.json();
    const user = profileJson.data?.matchedUser;
    if (!user) throw new Error("User not found");

    // Extract solved data
    let totalSolved = 0, easySolved = 0, mediumSolved = 0, hardSolved = 0;
    for (let item of user.submitStats.acSubmissionNum) {
      if (item.difficulty === "All") totalSolved = item.count;
      if (item.difficulty === "Easy") easySolved = item.count;
      if (item.difficulty === "Medium") mediumSolved = item.count;
      if (item.difficulty === "Hard") hardSolved = item.count;
    }

    // Query for recent submission separately
    const submissionQuery = `
      query {
        recentSubmissionList(username: "${username}", limit: 1) {
          id
          title
          titleSlug
          timestamp
          statusDisplay
          lang
        }
      }
    `;

    const subRes = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com",
        "Origin": "https://leetcode.com"
      },
      body: JSON.stringify({ query: submissionQuery })
    });

    const subJson = await subRes.json();
    const submissions = subJson.data?.recentSubmissionList || [];
    const lastSubmission = submissions.length > 0 ? submissions[0] : null;

    return {
      username: user.username,
      solved: totalSolved,
      rank: user.profile?.ranking ?? "N/A",
      easySolved,
      mediumSolved,
      hardSolved,
      lastSubmission: lastSubmission ? {
        title: lastSubmission.title,
        titleSlug: lastSubmission.titleSlug,
        timestamp: parseInt(lastSubmission.timestamp),
        status: lastSubmission.statusDisplay,
        lang: lastSubmission.lang,
        id: lastSubmission.id
      } : null
    };

  } catch (err) {
    console.error(`Failed to fetch stats for ${username}:`, err);
    return {
      username,
      solved: 'N/A',
      rank: 'N/A',
      easySolved: 'N/A',
      mediumSolved: 'N/A',
      hardSolved: 'N/A',
      lastSubmission: null
    };
  }
}
