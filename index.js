const git = require("simple-git/promise")("../aggregator");
const request = require("request");

let numberOfStoriesPrinted = 0;

async function getCommitMessages() {
  // const commits = await git.log("0e306edb778e555635ccf68d79d86bcc5bb8c784", "d58ca90");
  // const commits = await git.log("d58ca9000e24ec923bacb9ed49a85bd26e5d7157", "e1fdb4e6808759c28deacb105e547b0e2e44cf0c");
  // const commits = await git.log("2315366ea16a563cb7ca977c3aeef9a2aa83348c", "2efdba984d227b94cb8ade2138d431ab88d0c68f");
  // const commits = await git.log("445f3c7526fb0884de56d80826493047b031ab0d", "1085caa1162a6e35f11ab4d5500ce805e0273834");
  // const commits = await git.log("756cbfd0cbb5fd1b0b4ad3517227b59c483578ae", "4330830a89b312860c0f0eebe5b8330165843fd6");
  // const commits = await git.log("756cbfd0cbb5fd1b0b4ad3517227b59c483578ae", "e21802abd1703f90a66bb9f9fcaac40d47e884ae");
  // const commits = await git.log("756cbfd0cbb5fd1b0b4ad3517227b59c483578ae", "c0ddb521a3a25e5f32d1e8010159e33622462525"); // Flat Earth
  const commits = await git.log("c0ddb521a3a25e5f32d1e8010159e33622462525", "6e85f3ea1733f3d538ffef8682b62fd14ff6f1dc"); // Illuminati

  return commits.all.map(commit => commit.message);
}

async function getUniquePivotalIds() {
  const messages = await getCommitMessages();

  const allPivotalIds = messages
    .map(message => /(^|\s+)\[\#?(\d+)/g.exec(message))
    .filter(groups => groups && groups.length > 2)
    .map(groups => groups[2]);


  const uniquePivotalIdsMap = {};

  allPivotalIds.forEach(id => uniquePivotalIdsMap[id] = true);

  return Object.keys(uniquePivotalIdsMap);
}

async function getUpsourceUrl(pivotalIds) {
  const queryParam = `branch: master and not #{closed review} and (${pivotalIds.join(" or ")})`;

  return `https://upsource.campspot.com/consumer?query=${encodeURIComponent(queryParam).replace(/\(/, "%28").replace(/\)/, "%29")}`;
}

async function pivotalApiGetRequest(url) {
  const requestOptions = {
    uri: url,
    method: 'GET',
    headers: {
      accept: 'application/json',
      "X-TrackerToken": "577620a5ebe6fef87049e3ad2fe2a37b"
    }
  };

  return await new Promise((resolve) => {
    request(requestOptions, (err, response, body) => {
      if (body) {
        resolve(JSON.parse(body));
      } else {
        resolve(null);
      }
    });
  });
}

function getStoryDisplayIndex(story) {
  switch (story.story_type) {
    case "feature":
      return 1;
    case "bug":
      return 2;
    case "chore":
      return 3;
  }
}

function sortStoryFunction(a, b) {
  return getStoryDisplayIndex(a) - getStoryDisplayIndex(b);
}

function printStoryInfo(story) {
  let noFeatureFlagText = ``;

  if (!story.hasFeatureFlagReviews) {
    noFeatureFlagText = ` (no feature flag)`;
  }

  console.log(`#${story.id} [${story.story_type}] ${story.name.trim()}${noFeatureFlagText}`);

  numberOfStoriesPrinted++;
}

function printListOfStories(header, stories) {
  if (stories.length > 0) {
    stories.sort(sortStoryFunction);

    let newLines = ``;

    if (numberOfStoriesPrinted > 0) {
      newLines = `&nbsp;\n&nbsp;\n&nbsp;\n`;
    }

    console.log(`${newLines}# ${header}:\n`);

    stories.forEach(printStoryInfo);
  }
}

async function attachReviewInfoToStories(stories) {
  return await Promise.all(stories.map(async (story) => {
    story.reviews = await pivotalApiGetRequest(`https://www.pivotaltracker.com/services/v5/projects/2145699/stories/${story.id}/reviews`);

    if (story.reviews && Array.isArray(story.reviews)) {
      story.reviews = story.reviews.filter(review => review.kind === "review");
    } else {
      story.reviews = [];
    }

    story.codeReviews = story.reviews.filter(review => review.review_type_id === 7604);
    story.qaReviews = story.reviews.filter(review => review.review_type_id === 7602);
    story.designReviews = story.reviews.filter(review => review.review_type_id === 7603);
    story.featureFlagReviews = story.reviews.filter(review => review.review_type_id === 5527847);

    story.requiresCodeReview = story.codeReviews.length === 0 || story.codeReviews.some(review => review.status !== "pass");
    story.requiresDesignReview = story.designReviews.some(review => review.status !== "pass");
    story.requiresQAReview = story.qaReviews.some(review => review.status !== "pass");

    story.hasFeatureFlagReviews = story.featureFlagReviews.length > 0;
    story.requiresFeatureFlagReview = story.featureFlagReviews.some(review => review.status !== "pass");
    story.passesFeatureFlagReview = story.hasFeatureFlagReviews && story.featureFlagReviews.every(review => review.status === "pass");
  }));
}

async function getReleaseInfo() {
  const uniquePivotalIds = await getUniquePivotalIds();

  const pivotalStoriesIncludingNull = await Promise.all(uniquePivotalIds.map((id) => {
    return pivotalApiGetRequest(`https://www.pivotaltracker.com/services/v5/stories/${id}`);
  }));

  const pivotalStories = pivotalStoriesIncludingNull
    .filter(story => story !== null)
    .filter(story => story.kind === "story");

  pivotalStories.forEach((story) => {
    story.isNewConsumer = story.labels.some(label => label.kind === "label" && label.name === "new consumer");
    story.isPrototype = story.labels.some(label => label.kind === "label" && label.name === "prototype");
  });

  printListOfStories(
    "New consumer stories",
    pivotalStories.filter(story => story.isNewConsumer)
  );

  printListOfStories(
    "Prototype stories",
    pivotalStories.filter(story => story.isPrototype)
  );

  printListOfStories(
    numberOfStoriesPrinted > 0 ? "Other stories" : "All stories",
    pivotalStories
      .filter(story => !story.isNewConsumer)
      .filter(story => !story.isPrototype)
  );

  await attachReviewInfoToStories(pivotalStories);

  printListOfStories(
    "Unaccepted stories without a tested feature flag",
    pivotalStories
      .filter(story => story.current_state !== "accepted")
      .filter(story => !story.passesFeatureFlagReview)
  );

  printListOfStories(
    "Stories requiring code review",
    pivotalStories.filter(story => story.requiresCodeReview)
  );

  printListOfStories(
    "Stories requiring QA review",
    pivotalStories
      .filter(story => story.requiresQAReview)
      .filter(story => !story.hasFeatureFlagReviews)
      .filter(story => !story.isPrototype)
  );

  printListOfStories(
    "Stories requiring design review",
    pivotalStories
      .filter(story => story.requiresDesignReview)
      .filter(story => !story.hasFeatureFlagReviews)
      .filter(story => !story.isPrototype)
  );

  printListOfStories(
    "Stories requiring feature flag reviews",
    pivotalStories.filter(story => story.requiresFeatureFlagReview)
  );

  printListOfStories(
    "Stories with feature flag reviews",
    pivotalStories.filter(story => story.hasFeatureFlagReviews)
  );

  console.log(`&nbsp;\n&nbsp;\n&nbsp;\n# Commits with open or no reviews:\n`);
  console.log(`[View commits in upsource](${await getUpsourceUrl(uniquePivotalIds)})`);
}

getReleaseInfo();
