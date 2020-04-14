const git = require("simple-git/promise")("../aggregator-release");
const request = require("request");
const Rox = require("rox-node");

const aggregatorProjectId = 2145699;
const roxApiKey = "5be1d296b38fed12b215194d";

let numberOfStoriesPrinted = 0;
let previousReleaseDate = null;
let currentReleaseDate = null;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getCommitMessages() {
  const previousReleaseCommitLogs = [
    await git.log({from: "756cbfd0cbb5fd1b0b4ad3517227b59c483578ae", to: "c0ddb521a3a25e5f32d1e8010159e33622462525"}), // Flat Earth
    await git.log({from: "c0ddb521a3a25e5f32d1e8010159e33622462525", to: "139660b03daad7e9dec5600e89d35faa1a1ade89"}), // Package Discounts
    await git.log({from: "139660b03daad7e9dec5600e89d35faa1a1ade89", to: "bcf2ad304e0fb5fa265e44f8c930781549451a8b"}), // Blocks/Occupancy query optimizations + Jersey client update
    await git.log({from: "bcf2ad304e0fb5fa265e44f8c930781549451a8b", to: "b03c029b1c6de119c88d12f2d1f5ebd99250f3e8"}), // Occupancy logic speed
    await git.log({from: "b03c029b1c6de119c88d12f2d1f5ebd99250f3e8", to: "5b249b8d46150d6d0d411734b999f49c5e1686a7"}), // External error handling + Jersey client flags
    await git.log({from: "5b249b8d46150d6d0d411734b999f49c5e1686a7", to: "1f7634d93f7c13ae8666db83190b6fb949126b96"}), // Illuminati
    await git.log({from: "1f7634d93f7c13ae8666db83190b6fb949126b96", to: "a7f6c37989a4a8983d3aaddbb71fac66c9d32f46"}), // Terms of service link hotfix
    await git.log({from: "a7f6c37989a4a8983d3aaddbb71fac66c9d32f46", to: "e175866494904a92ef546e081d8affeb9be94d04"}), // Websocket fix
    await git.log({from: "e175866494904a92ef546e081d8affeb9be94d04", to: "b71263520f521683dc448abb1960d47944669692"}), // Map zoom fix
    await git.log({from: "b71263520f521683dc448abb1960d47944669692", to: "985ee57deb431524113d0dc530581cb37d6993d7"}), // Map panning + redirect fix
    await git.log({from: "985ee57deb431524113d0dc530581cb37d6993d7", to: "086623e584a4a90a5f98de1e3f8867f55a6c0b41"}), // www redirect fix
    await git.log({from: "086623e584a4a90a5f98de1e3f8867f55a6c0b41", to: "83fd5373f86846f9cdf137593921ddc29703deff"}), // More specific redirects + aggregator copyright year
    await git.log({from: "83fd5373f86846f9cdf137593921ddc29703deff", to: "77b72ade5641e494d880b9b8d152fdcd92eee7c9"}), // Antarctica
    await git.log({from: "77b72ade5641e494d880b9b8d152fdcd92eee7c9", to: "045096aac4857f54911631144a2e5d36c5e814e4"}), // Antarctica cofokie prefix - staging db changes
    await git.log({from: "045096aac4857f54911631144a2e5d36c5e814e4", to: "407abbb073853fd1bfd04206ba846ab042c4daed"}), // Aggregator V1
    await git.log({from: "407abbb073853fd1bfd04206ba846ab042c4daed", to: "d76e034dc30f18ed894d6de5744d30d6f3f36ea8"}), // Fluoride
    await git.log({from: "d76e034dc30f18ed894d6de5744d30d6f3f36ea8", to: "65f660ec990683ad250463a8b45e138ea5a32f19"}), // Aggregator Aggregator
    await git.log({from: "65f660ec990683ad250463a8b45e138ea5a32f19", to: "45b588fb551d6e787a917766d521144b77d1eb24"}), // Immortal Keanu Reeves
    await git.log({from: "45b588fb551d6e787a917766d521144b77d1eb24", to: "bedc3bc614bd67a148af8be9537115476fa06d8c"}), // Lizard People
    await git.log({from: "bedc3bc614bd67a148af8be9537115476fa06d8c", to: "f79648211abdc3cd29cb1523d45ec72512270734"}), // Birds Aren't Real
    await git.log({from: "f79648211abdc3cd29cb1523d45ec72512270734", to: "5ebee4e23f1d573dd32091e2f25fcc456ca1154e"}), // Black Helicopters
    await git.log({from: "5ebee4e23f1d573dd32091e2f25fcc456ca1154e", to: "2b144de198c83cf61b072d35b83ddf420cae24aa"}), // Mandela Effect
    await git.log({from: "2b144de198c83cf61b072d35b83ddf420cae24aa", to: "dc2134321a19c42f0bfe341f76656f8651cae888"}), // 5G
    await git.log({from: "dc2134321a19c42f0bfe341f76656f8651cae888", to: "33d0ffcaac6d3f502f13522e6cdda2658f407f9a"}), // Accessibility
    await git.log({from: "dc2134321a19c42f0bfe341f76656f8651cae888", to: "33d0ffcaac6d3f502f13522e6cdda2658f407f9a"}), // Accessibility
    await git.log({from: "33d0ffcaac6d3f502f13522e6cdda2658f407f9a", to: "8d45b1ad91a08d737a5b0d5662a2bb5070413230"}), // The Kraken
    await git.log({from: "8d45b1ad91a08d737a5b0d5662a2bb5070413230", to: "d6ecb0573154f36cccb4f24cd3a3683fae764976"}), // The Kraken HF2
    await git.log({from: "d6ecb0573154f36cccb4f24cd3a3683fae764976", to: "96da4134f1d5e340307df5b5133a77b42ea833cf"}), // The Kraken HF3
    await git.log({from: "96da4134f1d5e340307df5b5133a77b42ea833cf", to: "5d9faabbbf5ecabe2f16f512ae8675533a2c9029"}), // www request origin hotfix
    await git.log({from: "5d9faabbbf5ecabe2f16f512ae8675533a2c9029", to: "3933017eb7ea811ff05866b2e620f73e4ea1e4c2"}), // Deep State
    await git.log({from: "3933017eb7ea811ff05866b2e620f73e4ea1e4c2", to: "ef7df81a001ec7716d11eae96199c558dd1b81f3"}), // Mud Floods
    await git.log({from: "ef7df81a001ec7716d11eae96199c558dd1b81f3", to: "fcf55f855f65027058215eb4a5087e07d66f9cab"}), // Aliens built the Pyramids
    await git.log({from: "fcf55f855f65027058215eb4a5087e07d66f9cab", to: "5de26d197288878ff454fc0b25cacb8bd4244e53"}), // Hollow Earth
    await git.log({from: "5de26d197288878ff454fc0b25cacb8bd4244e53", to: "5d2fa8ae61ea589011151d4733091a733526cb48"}), // Card connect iframe updates
    await git.log({from: "5d2fa8ae61ea589011151d4733091a733526cb48", to: "663f19c584ba9c6d3c8150d4b080b228b19de276"}), // Tupac Lives
  ];

  const releaseCommits = await git.log({from: "663f19c584ba9c6d3c8150d4b080b228b19de276", to: "HEAD"}); // Corn Syrup
  const lastRelease = previousReleaseCommitLogs[previousReleaseCommitLogs.length - 1];

  previousReleaseDate = Date.parse(lastRelease.latest.date);
  currentReleaseDate = Date.parse(releaseCommits.all[releaseCommits.total - 1].date);

  const allPreviousReleaseCommits = previousReleaseCommitLogs.flatMap(commits => commits.all);
  const allPreviousReleaseCommitsMap = {};

  allPreviousReleaseCommits.forEach((commit) => {
    allPreviousReleaseCommitsMap[commit.date + commit.message] = true;
  });

  const duplicateCommits = [];
  const dedupedCommits = releaseCommits.all.filter((commit) => {
    if (allPreviousReleaseCommitsMap[commit.date + commit.message]) {
      duplicateCommits.push(commit);

      return false;
    } else {
      return true;
    }
  });

  if (duplicateCommits.length > 0) {
    console.warn("Removing some duplicate commits:");
    console.warn(duplicateCommits.map(commit => commit.message).join("\n"));
    console.warn("\n\n\n\n");
  }

  return dedupedCommits.map(commit => commit.message);
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

function getAllUnattachedCommitsUpsourceUrl() {
  return getUpsourceUrl(`branch: master and not #{closed review} and not #{open review}`);
}

function getStoryReviewsUpsourceUrl(story) {
  return getUpsourceUrl(`branch: master and ${story.id}`);
}

function getUpsourceUrl(query) {
  return `https://upsource.campspot.com/consumer?query=${encodeURIComponent(query).replace(/\(/, "%28").replace(/\)/, "%29")}`;
}

async function getStoriesAcceptedAfterPreviousRelease() {
  return await pivotalApiGetRequest(`https://www.pivotaltracker.com/services/v5/projects/${aggregatorProjectId}/stories?accepted_after=${previousReleaseDate.valueOf()}`);
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
  return await Promise.all(stories.map(async (story, i) => {
    // await sleep(5000 * i);

    story.reviews = await pivotalApiGetRequest(`https://www.pivotaltracker.com/services/v5/projects/${story.project_id}/stories/${story.id}/reviews`);

    if (story.reviews && Array.isArray(story.reviews)) {
      story.reviews = story.reviews.filter(review => review.kind === "review");
    } else {
      story.reviews = [];
    }

    story.codeReviews = story.reviews.filter(review => review.review_type_id === 7604 || review.review_type_id === 4628937 || review.review_type_id === 4165914 || review.review_type_id === 618);
    story.qaReviews = story.reviews.filter(review => review.review_type_id === 7602 || review.review_type_id === 4628939 || review.review_type_id === 4165912 || review.review_type_id === 616);
    story.designReviews = story.reviews.filter(review => review.review_type_id === 7603 || review.review_type_id === 617);
    story.featureFlagReviews = story.reviews.filter(review => review.review_type_id === 5527847 || review.review_type_id === 5675322);

    story.requiresCodeReview = story.codeReviews.length === 0 || story.codeReviews.some(review => review.status !== "pass");
    story.requiresDesignReview = story.designReviews.some(review => review.status !== "pass");
    story.requiresQAReview = (((story.story_type === "feature" && !story.isSpike) || story.story_type === "bug") && story.qaReviews.length === 0) || story.qaReviews.some(review => review.status !== "pass");

    story.hasFeatureFlagReviews = story.featureFlagReviews.length > 0;
    story.requiresFeatureFlagReview = story.featureFlagReviews.some(review => review.status !== "pass");
    story.passesFeatureFlagReview = story.hasFeatureFlagReviews && story.featureFlagReviews.every(review => review.status === "pass");
  }));
}

async function attachBlockersToStories(stories) {
  await Promise.all(stories.filter(story => !story.blockers).map(async (story) => {
    story.blockers = await pivotalApiGetRequest(`https://www.pivotaltracker.com/services/v5/projects/${story.project_id}/stories/${story.id}/blockers`);

    if (!Array.isArray(story.blockers)) {
      story.blockers = [];
    } else {
      story.blockers
        .filter(blocker => blocker.description.startsWith("#"))
        .forEach((blocker) => {
          blocker.storyIdFromDescription = parseInt(blocker.description.substr(1).trim());
        });
    }
  }));

  await addMissingStoriesFromBlockers(stories);
}

async function addMissingStoriesFromBlockers(stories) {
  const blockerStoryIds = {};
  const existingStoryIds = {};

  stories.forEach((story) => {
    existingStoryIds[story.id] = true;
  });

  stories.forEach((story) => {
    story.blockers
      .filter(blocker => blocker.storyIdFromDescription)
      .filter(blocker => !existingStoryIds[blocker.storyIdFromDescription])
      .forEach(blocker => blockerStoryIds[blocker.storyIdFromDescription] = true);
  });

  const newStoryIds = Object.keys(blockerStoryIds);

  let newStories = await Promise.all(newStoryIds.map(async (storyId) => {
    return await pivotalApiGetRequest(`https://www.pivotaltracker.com/services/v5/stories/${storyId}`);
  }));

  newStories = newStories
    .filter(story => story !== null)
    .filter(story => story.kind === "story");

  newStories.forEach((story) => {
    story.transient = true;

    stories.push(story);
  });

  if (newStories.length > 0) {
    await attachBlockersToStories(stories);
  } else {
    stories.forEach((story) => {
      story.blockers = story.blockers.map((blocker) => {
        return stories.find(s => s.id == blocker.storyIdFromDescription) || blocker;
      });
    });
  }
}

async function attachRolloutInfoToStories(stories) {
  await Rox.setup(roxApiKey);

  const containers = {};

  stories.forEach((story) => {
    story.flags = story.hasFeatureFlagReviews ? story.flags : [];

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

function countEstimateSum(stories) {
  return stories.reduce((a, b) => {
    if (!isNaN(a.estimate)) {
      return a.estimate + (b.estimate || 0);
    } else {
      return (a || 0) + (b.estimate || 0)
    }
  }, 0);
}

function storyIsClosedOutAndCarriedOver(story) {
  return story.labels.some(label => label.kind === "label" && label.name === "close out and carry over");
}

function storyIsConsumer(story) {
  return story.labels.some(label => label.kind === "label" && (label.name === "new consumer" || label.name === "consumer"));
}

function storyIsAggregator(story) {
  return story.labels.some(label => label.kind === "label" && (label.name === "prototype" || label.name === "aggregator"));
}

function storyIsSpike(story) {
  return story.labels.some(label => label.kind === "label" && label.name === "spike");
}

function storyIsObsolete(story) {
  return story.labels.some(label => label.kind === "label" && label.name === "obsolete");
}

async function getReleaseInfo() {
  const uniquePivotalIds = await getUniquePivotalIds();

  const pivotalStoriesIncludingNull = await Promise.all(uniquePivotalIds.map((id) => {
    return pivotalApiGetRequest(`https://www.pivotaltracker.com/services/v5/stories/${id}`);
  }));

  const allPivotalStories = pivotalStoriesIncludingNull
    .filter(story => story !== null)
    .filter(story => story.kind === "story");

  const storiesAcceptedAfterPreviousRelease = await getStoriesAcceptedAfterPreviousRelease();

  storiesAcceptedAfterPreviousRelease
    .filter(story => allPivotalStories.every(s => s.id !== story.id))
    .filter(story => Date.parse(story.accepted_at) >= currentReleaseDate)
    .forEach((story) => {
      allPivotalStories.push(story);
    });

  allPivotalStories.forEach((story) => {
    story.isConsumer = storyIsConsumer(story);
    story.isAggregator = storyIsAggregator(story);
    story.isSpike = storyIsSpike(story);
    story.isObsolete = storyIsObsolete(story);
  });

  const closedOutStories = allPivotalStories.filter(story => storyIsClosedOutAndCarriedOver(story));

  const pivotalStories = allPivotalStories
    .filter(story => !storyIsClosedOutAndCarriedOver(story))
    .filter(story => !story.isObsolete);

  await attachBlockersToStories(pivotalStories);

  attachFlagInfoToStories(pivotalStories);

  await attachReviewInfoToStories(pivotalStories);
  await attachRolloutInfoToStories(pivotalStories);

  const storiesOnRelease = pivotalStories.filter(story => !story.transient);

  const features = storiesOnRelease.filter(story => story.story_type === "feature");
  const chores = storiesOnRelease.filter(story => story.story_type === "chore");
  const bugs = storiesOnRelease.filter(story => story.story_type === "bug");

  const featureEstimationSum = countEstimateSum(features);
  const choreEstimationSum = countEstimateSum(chores);
  const bugEstimationSum = countEstimateSum(bugs);

  console.log(`${features.length} Feature${features.length === 1 ? '' : 's'} (${featureEstimationSum} point${featureEstimationSum === 1 ? '' : 's'})`);
  console.log(`${chores.length} Chore${chores.length === 1 ? '' : 's'} (${choreEstimationSum} point${choreEstimationSum === 1 ? '' : 's'})`);
  console.log(`${bugs.length} Bug${bugs.length === 1 ? '' : 's'} (${bugEstimationSum} point${bugEstimationSum === 1 ? '' : 's'})`);

  printListOfStories(
    "Stories to have flags turned on",
    pivotalStories
      .filter(story => story.current_state === "accepted")
      .filter(story => story.flags.some(flag => !flag.enabled))
      .filter(story => {
        const storiesWithSameFlag = pivotalStories
          .filter(s => s !== story)
          .filter(s => {
            return s.flags.some((flag1) => {
              return story.flags.some((flag2) => {
                return flag1.fullName === flag2.fullName;
              });
            });
          });

        return storiesWithSameFlag.every(s => s.current_state === "accepted");
      })
  );

  printListOfStories(
    "New Features",
    features.filter(story => story.current_state === "accepted")
  );

  printListOfStories(
    "New Fixes",
    bugs.filter(story => story.current_state === "accepted")
  );

  printListOfStories(
    "Carry-over stories",
    closedOutStories
  );

  printListOfStories(
    "Consumer stories",
    storiesOnRelease.filter(story => story.isConsumer)
  );

  printListOfStories(
    "Aggregator stories",
    storiesOnRelease.filter(story => story.isAggregator)
  );

  printListOfStories(
    numberOfStoriesPrinted > 0 ? "Other stories" : "All stories",
    storiesOnRelease
      .filter(story => !story.isConsumer)
      .filter(story => !story.isAggregator)
  );

  printListOfStories(
    "Stories requiring code review",
    storiesOnRelease.filter(story => story.requiresCodeReview),
    {
      printUpsource: true
    }
  );

  printListOfStories(
    "Stories requiring QA review",
    storiesOnRelease
      .filter(story => story.requiresQAReview)
      .filter(story => !story.hasFeatureFlagReviews)
  );

  printListOfStories(
    "Stories requiring design review",
    storiesOnRelease
      .filter(story => story.requiresDesignReview)
      .filter(story => !story.hasFeatureFlagReviews)
      .filter(story => !story.isAggregator)
  );

  printListOfStories(
    "Stories requiring feature flag reviews",
    storiesOnRelease.filter(story => story.requiresFeatureFlagReview)
  );

  console.log(`&nbsp;\n&nbsp;\n&nbsp;\n# Upsource:\n`);
  console.log(`[Commits with open or no reviews](${getAllUnclosedReviewsUpsourceUrl(uniquePivotalIds)})`);
  console.log(`[Commits with no attached review](${getAllUnattachedCommitsUpsourceUrl()})`);
}

getReleaseInfo().then(() => {
  process.exit();
});
