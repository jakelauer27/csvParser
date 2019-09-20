const git = require("simple-git/promise")("../aggregator");
const request = require("request");

async function getCommitMessages() {


  const messages = commits.all.map(commit => commit.message);


  return messages;
  // const commits = await git.log("0e306edb778e555635ccf68d79d86bcc5bb8c784", "d58ca90");
  // const commits = await git.log("d58ca9000e24ec923bacb9ed49a85bd26e5d7157", "e1fdb4e6808759c28deacb105e547b0e2e44cf0c");
  // const commits = await git.log("2315366ea16a563cb7ca977c3aeef9a2aa83348c", "2efdba984d227b94cb8ade2138d431ab88d0c68f");
  // const commits = await git.log("445f3c7526fb0884de56d80826493047b031ab0d", "1085caa1162a6e35f11ab4d5500ce805e0273834");
  // const commits = await git.log("756cbfd0cbb5fd1b0b4ad3517227b59c483578ae", "4330830a89b312860c0f0eebe5b8330165843fd6");
  // const commits = await git.log("756cbfd0cbb5fd1b0b4ad3517227b59c483578ae", "e21802abd1703f90a66bb9f9fcaac40d47e884ae");
  // const commits = await git.log("756cbfd0cbb5fd1b0b4ad3517227b59c483578ae", "c0ddb521a3a25e5f32d1e8010159e33622462525"); // Flat Earth
}

async function getUniquePivotalIds() {
  const messages = await getCommitMessages();

  const allPivotalIds = messages
    .map(message => /(^|\s+)\[\#?(\d+)/g.exec(message))
    .filter(groups => groups && groups.length > 2)
    .map(groups => groups[2]);


  const uniquePivotalIdsMap = {};

  allPivotalIds.forEach(id => uniquePivotalIdsMap[id] = true);

  const uniquePivotalIds = Object.keys(uniquePivotalIdsMap);

  return uniquePivotalIds;
}

async function getUpsourceReviewQuery() {
  const uniquePivotalIds = await getUniquePivotalIds();

  console.log(uniquePivotalIds.join(" or "));
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
    case "feature": return 1;
    case "bug": return 2;
    case "chore": return 3;
  }
}

function sortStoryFunction(a, b) {
  return getStoryDisplayIndex(a) - getStoryDisplayIndex(b);
}

async function getReleaseInfo() {
  const uniquePivotalIds = await getUniquePivotalIds();

  const pivotalStoriesIncludingNull = await Promise.all(uniquePivotalIds.map((id) => {
    return pivotalApiGetRequest(`https://www.pivotaltracker.com/services/v5/stories/${id}`);
  }));

  const pivotalStories = pivotalStoriesIncludingNull
    .filter(story => story !== null)
    .filter(story => story.kind === "story");

  const newConsumerStories = pivotalStories
    .filter(story => story.labels.some(label => label.kind === "label" && label.name === "new consumer"))
    .sort(sortStoryFunction);
  
  const prototypeStories = pivotalStories
    .filter(story => story.labels.some(label => label.kind === "label" && label.name === "prototype"))
    .sort(sortStoryFunction);
  
  const otherStories = pivotalStories
    .filter(story => story.labels.every(label => label.kind !== "label" || (label.name !== "prototype" && label.name !== "new consumer")))
    .sort(sortStoryFunction);

  const unacceptedStories = pivotalStories
    .filter(story => story.current_state !== "accepted")
    .sort(sortStoryFunction);

  if (newConsumerStories.length > 0) {
    console.log("# New consumer stories:\n");
    
    newConsumerStories.forEach((story) => {
      console.log(`#${story.id} [${story.story_type}] ${story.name.trim()}`);
    });
  }
  if (prototypeStories.length > 0) {
    if (newConsumerStories.length > 0) {
      console.log("&nbsp;\n&nbsp;\n&nbsp;\n# Prototype stories:\n");
    } else {
      console.log("# Prototype stories:\n");
    }

    prototypeStories.forEach((story) => {
      console.log(`#${story.id} [${story.story_type}] ${story.name.trim()}`);
    });
  }
  if (otherStories.length > 0) {
    if (newConsumerStories.length > 0 || prototypeStories.length > 0) {
      console.log("&nbsp;\n&nbsp;\n&nbsp;\n# Other stories:\n");
    } else {
      console.log("# All stories:\n");
    }

    otherStories.forEach((story) => {
      console.log(`#${story.id} [${story.story_type}] ${story.name.trim()}`);
    });
  }
  if (unacceptedStories.length > 0) {
    const storiesWithReviews = await Promise.all(unacceptedStories.map(async (story) => {
      story.reviews = await pivotalApiGetRequest(`https://www.pivotaltracker.com/services/v5/projects/2145699/stories/${story.id}/reviews`);

      if (story.reviews) {
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

      return story;
    }));

    console.log("&nbsp;\n&nbsp;\n&nbsp;\n# Unaccepted stories without a tested feature flag:\n");

    const storiesWithoutFeatureFlagReviews = storiesWithReviews.filter(story => !story.passesFeatureFlagReview);

    storiesWithoutFeatureFlagReviews.forEach((story) => {
      let noFeatureFlagText = ``;

      if (!story.hasFeatureFlagReviews) {
        noFeatureFlagText = ` (no feature flag)`;
      }

      console.log(`#${story.id} [${story.story_type}] ${story.name.trim()}${noFeatureFlagText}`);
    });
    

    const storiesRequiringCodeReview = storiesWithReviews.filter(story => story.requiresCodeReview);

    if (storiesRequiringCodeReview.length > 0) {
      console.log("&nbsp;\n&nbsp;\n&nbsp;\n# Stories requiring code review:\n");

      storiesRequiringCodeReview.forEach((story) => {
        console.log(`#${story.id} [${story.story_type}] ${story.name.trim()}`);
      });
    }

    const storiesRequiringQAReview = storiesWithReviews.filter(story => story.requiresQAReview && !story.passesFeatureFlagReview);

    if (storiesRequiringQAReview.length > 0) {
      console.log("&nbsp;\n&nbsp;\n&nbsp;\n# Stories requiring QA review:\n");

      storiesRequiringQAReview.forEach((story) => {
        console.log(`#${story.id} [${story.story_type}] ${story.name.trim()}`);
      });
    }

    const storiesRequiringDesignReview = storiesWithReviews.filter(story => story.requiresDesignReview && !story.passesFeatureFlagReview);

    if (storiesRequiringDesignReview.length > 0) {
      console.log("&nbsp;\n&nbsp;\n&nbsp;\n# Stories requiring design review:\n");

      storiesRequiringDesignReview.forEach((story) => {
        console.log(`#${story.id} [${story.story_type}] ${story.name.trim()}`);
      });
    }

    const storiesWithFeatureFlagReviews = storiesWithReviews.filter(story => story.hasFeatureFlagReviews);

    if (storiesWithFeatureFlagReviews.length > 0) {
      console.log("&nbsp;\n&nbsp;\n&nbsp;\n# Stories with feature flag reviews:\n");

      storiesWithFeatureFlagReviews.forEach((story) => {
        console.log(`#${story.id} [${story.story_type}] ${story.name.trim()}`);
      });
    }

    const storiesRequiringFeatureFlagReviews = storiesWithReviews.filter(story => story.requiresFeatureFlagReview);

    if (storiesRequiringFeatureFlagReviews.length > 0) {
      console.log("&nbsp;\n&nbsp;\n&nbsp;\n# Stories requiring feature flag reviews:\n");

      storiesRequiringFeatureFlagReviews.forEach((story) => {
        console.log(`#${story.id} [${story.story_type}] ${story.name.trim()}`);
      });
    }
  }
}

getReleaseInfo();
