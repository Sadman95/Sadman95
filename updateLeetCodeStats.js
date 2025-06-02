// updateLeetCodeStats.js
const fs = require('fs');
const https = require('https');

const username = 'Sadman95'; // <== Replace with your LeetCode username
const readmeFilePath = './README.md'; // Adjust if your README has a different name or location

function fetchLeetCodeStats(username) {
  return new Promise((resolve, reject) => {
    const query = JSON.stringify({
      query: `
        query {
          matchedUser(username: "${username}") {
            submitStats: submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
        }
      `
    });

    const options = {
      hostname: 'leetcode.com',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': query.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const result = JSON.parse(data);
        const stats = result.data.matchedUser.submitStats.acSubmissionNum;
        resolve(stats);
      });
    });

    req.on('error', reject);
    req.write(query);
    req.end();
  });
}

function updateReadme(stats) {
  const easy = stats.find((s) => s.difficulty === 'Easy').count;
  const medium = stats.find((s) => s.difficulty === 'Medium').count;
  const hard = stats.find((s) => s.difficulty === 'Hard').count;
  const total = stats.find((s) => s.difficulty === 'All').count;

  const statsMarkdown = `
## 🏅 My LeetCode Stats

| Difficulty | Problems Solved |
|------------|-----------------|
| Easy       | ${easy}          |
| Medium     | ${medium}        |
| Hard       | ${hard}          |
| **Total**  | **${total}**     |
`;

  let readme = fs.readFileSync(readmeFilePath, 'utf8');

  const startMarker = '<!-- LEETCODE_STATS_START -->';
  const endMarker = '<!-- LEETCODE_STATS_END -->';

  const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'm');
  const newContent = `${startMarker}\n${statsMarkdown}\n${endMarker}`;

  if (regex.test(readme)) {
    readme = readme.replace(regex, newContent);
  } else {
    readme += `\n${newContent}`;
  }

  fs.writeFileSync(readmeFilePath, readme);
}

(async () => {
  try {
    const stats = await fetchLeetCodeStats(username);
    updateReadme(stats);
    console.log('✅ README updated with latest LeetCode stats!');
  } catch (error) {
    console.error('❌ Failed to fetch/update stats:', error);
  }
})();
