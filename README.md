# Aggregator-Release-Info

## dependencies:

* Node 12

# Setup

* Clone the aggregator repo into a directory that is a sibling to the aggregator-release-info directory, and name it `aggregator-release` (`git clone https://github.com/campspot/aggregator.git aggregator-release`)
* In the aggregator-release repo folder, `git checkout staging`

# Creating a new release with what is on master

* In the `aggregator-release` repo: `git fetch`
* In the `aggregator-release` repo: `git checkout staging`
* In the `aggregator-release` repo: `git pull`
* In the `aggregator-release` repo: `git checkout -b release/[your release name here]`
* In the `aggregator-release` repo: `git merge origin/master`
* In the `aggregator-release-info` repo: copy the current value for the `releaseCommits` const and add it to the list of `previousReleaseCommitLogs` (feel free to add comment on that line naming the deploy)
* Go to the aggregator project in GitHub and copy the most recent commit hash from the aggregator staging branch.
* In the `aggregator-release-info` repo: replace the HEAD value for the previous release with the latest commit hash on staging.
* In the `aggregator-release-info` repo: replace the 'from' value in the releaseCommits variable with the latest commit hash on staging.
* In the `aggregator-release-info` repo: run `node index.js`
