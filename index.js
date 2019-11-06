const git = require("simple-git/promise")("../aggregator");
const request = require("request");
const Rox = require("rox-node");

let numberOfStoriesPrinted = 0;

async function getCommitMessages() {
  // const commits = await git.log({from: "756cbfd0cbb5fd1b0b4ad3517227b59c483578ae", to: "c0ddb521a3a25e5f32d1e8010159e33622462525"}); // Flat Earth
  // const commits = await git.log({from: "c0ddb521a3a25e5f32d1e8010159e33622462525", to: "139660b03daad7e9dec5600e89d35faa1a1ade89"}); // Package Discounts
  // const commits = await git.log({from: "139660b03daad7e9dec5600e89d35faa1a1ade89", to: "bcf2ad304e0fb5fa265e44f8c930781549451a8b"}); // Blocks/Occupancy query optimizations + Jersey client update
  // const commits = await git.log({from: "bcf2ad304e0fb5fa265e44f8c930781549451a8b", to: "b03c029b1c6de119c88d12f2d1f5ebd99250f3e8"}); // Occupancy logic speed
  // const commits = await git.log({from: "b03c029b1c6de119c88d12f2d1f5ebd99250f3e8", to: "5b249b8d46150d6d0d411734b999f49c5e1686a7"}); // External error handling + Jersey client flags
  const commits = await git.log({from: "5b249b8d46150d6d0d411734b999f49c5e1686a7", to: "HEAD"}); // Illuminati

  return commits.all.map(commit => commit.message);
}

async function getUniquePivotalIds() {
  const messages = await getCommitMessages();

  const allPivotalIds = messages
    .map(message => /(^|\s+)\[#?(\d+)/g.exec(message))
    .filter(groups => groups && groups.length > 2)
    .map(groups => groups[2]);

  const uniquePivotalIdsMap = {};

  allPivotalIds.forEach(id => uniquePivotalIdsMap[id] = true);

  return Object.keys(uniquePivotalIdsMap);
}

function getFeatureFlagData(story) {
  if (!story.description) {
    return [];
  }

  const featureFlagNameMatches = [...story.description.matchAll(/(^|[^\w.?/])([a-z]\w+\.[a-z]\w+)([^\w.?/]|$)/gm)];

  return featureFlagNameMatches
    .filter(match => match)
    .filter(match => match.length >= 3)
    .filter(match => !!match[2])
    .map((match) => {
      const fullFeatureFlagName = match[2];

      const fullNameComponents = fullFeatureFlagName.split(/\./);

      const container = fullNameComponents[0];
      const name = fullNameComponents[1];

      return {
        fullName: fullFeatureFlagName,
        fullNameComponents: fullNameComponents,
        container: container,
        name: name,
        url: `https://app.rollout.io/app/5be1d296b38fed12b215194a/flags?filter=${fullFeatureFlagName}`
      };
    })
    .filter(flagData => !/^(js|ts|png|gradle|io|kt|java|hooksPath)$/gi.test(flagData.name));
}

function getAllUnclosedReviewsUpsourceUrl(pivotalIds) {
  return getUpsourceUrl(`branch: master and not #{closed review} and (${pivotalIds.join(" or ")})`);
}

function getStoryReviewsUpsourceUrl(story) {
  return getUpsourceUrl(`branch: master and ${story.id}`);
}

function getUpsourceUrl(query) {
  return `https://upsource.campspot.com/consumer?query=${encodeURIComponent(query).replace(/\(/, "%28").replace(/\)/, "%29")}`;
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

function printStoryInfo(story, options = {}) {
  let flagText = ``;

  if (story.hasFeatureFlagReviews) {
    if (story.flags.length > 0) {
      flagText = story.flags
        .map(flag => `[Flag (${flag.enabled ? 'on' : 'off'})](${flag.url})`)
        .join(" ");
    } else {
      flagText = `(description missing flag)`;
    }
  } else {
    flagText = `(no flags)`;
  }

  let upsourceLink = ``;

  if (story.requiresCodeReview) {
    upsourceLink = `[Upsource](${getStoryReviewsUpsourceUrl(story)})`;
  }

  const components = [
    `#${story.id} [${story.story_type}] ${story.name.trim()}`,
    flagText,
    options.printUpsource ? upsourceLink : ''
  ];

  const storyInfo = components
    .filter(str => !!str)
    .join(" ");

  console.log(storyInfo);

  numberOfStoriesPrinted++;
}

function printListOfStories(header, stories, options = {}) {
  if (stories.length > 0) {
    stories.sort(sortStoryFunction);

    console.log(`&nbsp;\n&nbsp;\n&nbsp;`);
    console.log(`# ${header}:\n`);

    stories.forEach((story) => printStoryInfo(story, options));
  }
}

async function attachReviewInfoToStories(stories) {
  return await Promise.all(stories.map(async (story) => {
    story.reviews = await pivotalApiGetRequest(`https://www.pivotaltracker.com/services/v5/projects/${story.project_id}/stories/${story.id}/reviews`);

    if (story.reviews && Array.isArray(story.reviews)) {
      story.reviews = story.reviews.filter(review => review.kind === "review");
    } else {
      story.reviews = [];
    }

    story.codeReviews = story.reviews.filter(review => review.review_type_id === 7604 || review.review_type_id === 4628937);
    story.qaReviews = story.reviews.filter(review => review.review_type_id === 7602 || review.review_type_id === 4628939);
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

async function attachRolloutInfoToStories(stories) {
  await Rox.setup("5be1d296b38fed12b215194d");

  const containers = {};

  stories.forEach((story) => {
    story.flags.forEach((flag) => {
      if (!containers[flag.container]) {
        containers[flag.container] = {};
      }
      if (!containers[flag.container][flag.name]) {
        containers[flag.container][flag.name] = new Rox.Flag();
      }
    });
  });

  await Promise.all(
    Object.keys(containers)
      .map((containerName) => {
        const containerValue = containers[containerName];

        return Rox.register(containerName, containerValue);
      })
  );

  stories.forEach((story) => {
    story.flags.forEach((flag) => {
      flag.rollout = {
        container: containers[flag.container],
        flag: containers[flag.container][flag.name]
      };

      flag.enabled = flag.rollout.flag.isEnabled();
    });
  });
}

function attachFlagInfoToStories(stories) {
  stories.forEach((story) => {
    story.flags = getFeatureFlagData(story);
  });

  return stories;
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

  attachFlagInfoToStories(pivotalStories);

  await attachReviewInfoToStories(pivotalStories);
  await attachRolloutInfoToStories(pivotalStories);

  const features = pivotalStories.filter(story => story.story_type === "feature");
  const chores = pivotalStories.filter(story => story.story_type === "chore");
  const bugs = pivotalStories.filter(story => story.story_type === "bug");

  console.log(`${features.length} Features`);
  console.log(`${chores.length} Chores`);
  console.log(`${bugs.length} Bugs`);

  printListOfStories(
    "Stories to have flags turned on",
    pivotalStories
      .filter(story => story.current_state === "accepted")
      .filter(story => story.flags.some(flag => !flag.enabled))
  );

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
      .filter(story => !story.hasFeatureFlagReviews || story.flags.some(flag => flag.enabled))
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
  console.log(`[View commits in upsource](${getAllUnclosedReviewsUpsourceUrl(uniquePivotalIds)})`);
}

getReleaseInfo().then(() => {
  process.exit();
});
