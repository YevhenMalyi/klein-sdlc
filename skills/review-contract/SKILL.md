---
name: review-contract
description: >-
  The review contract, REVIEW.md, injected for the review lanes to preload. A host's
  reviewer agent lists `klein-sdlc:review-contract` in its `skills` frontmatter and
  starts with the contract in context. Not a workflow: there is nothing to run, and a
  person never needs to invoke it.
---

The klein-sdlc review contract, read from the plugin at load time so the lane that
preloaded this skill holds the current version:

!`cat ${CLAUDE_PLUGIN_ROOT}/REVIEW.md`
