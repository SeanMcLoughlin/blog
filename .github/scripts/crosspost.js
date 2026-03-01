'use strict';

const matter = require('gray-matter');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SITE_URL = 'https://seanmcloughl.in';
const BLUESKY_HANDLE = process.env.BLUESKY_HANDLE;
const BLUESKY_APP_PASSWORD = process.env.BLUESKY_APP_PASSWORD;
const BEFORE_SHA = process.env.BEFORE_SHA;
const STATE_FILE = path.resolve('_data/bluesky_posts.json');

function getChangedFiles(filter) {
  if (!BEFORE_SHA || BEFORE_SHA === '0000000000000000000000000000000000000000') {
    return [];
  }
  try {
    const out = execSync(`git diff --name-only --diff-filter=${filter} ${BEFORE_SHA} HEAD -- _posts/`)
      .toString()
      .trim();
    return out ? out.split('\n') : [];
  } catch {
    return [];
  }
}

function permalinkFromFilename(filename) {
  const slug = path.basename(filename)
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .replace(/\.md$/, '');
  return `/${slug}/`;
}

function parsePost(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const { data } = matter(content);

  if (data.published === false) return null;
  if (data.date && new Date(data.date) > new Date()) return null;

  const permalink = data.permalink || permalinkFromFilename(filepath);
  return {
    title: data.title,
    url: SITE_URL + permalink,
  };
}

async function createSession() {
  const res = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: BLUESKY_HANDLE, password: BLUESKY_APP_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Auth failed: ${await res.text()}`);
  return res.json();
}

async function createPost(session, title, url) {
  const res = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.accessJwt}`,
    },
    body: JSON.stringify({
      repo: session.did,
      collection: 'app.bsky.feed.post',
      record: {
        $type: 'app.bsky.feed.post',
        text: title,
        embed: {
          $type: 'app.bsky.embed.external',
          external: { uri: url, title, description: '' },
        },
        createdAt: new Date().toISOString(),
      },
    }),
  });
  if (!res.ok) throw new Error(`Create post failed: ${await res.text()}`);
  return res.json();
}

async function replyToPost(session, parentUri, parentCid, text) {
  const res = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.accessJwt}`,
    },
    body: JSON.stringify({
      repo: session.did,
      collection: 'app.bsky.feed.post',
      record: {
        $type: 'app.bsky.feed.post',
        text,
        reply: {
          root: { uri: parentUri, cid: parentCid },
          parent: { uri: parentUri, cid: parentCid },
        },
        createdAt: new Date().toISOString(),
      },
    }),
  });
  if (!res.ok) throw new Error(`Reply failed: ${await res.text()}`);
  return res.json();
}

async function main() {
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

  const added = getChangedFiles('A');
  const modified = getChangedFiles('M');

  if (added.length === 0 && modified.length === 0) {
    console.log('No post changes detected.');
    return;
  }

  let session = null;
  let changed = false;

  for (const file of added) {
    const filename = path.basename(file);
    const post = parsePost(file);
    if (!post) {
      console.log(`Skipping ${filename} (draft or future-dated)`);
      continue;
    }
    if (state[filename]) {
      console.log(`Skipping ${filename} (already in state)`);
      continue;
    }

    console.log(`New post: ${filename}`);
    if (!session) session = await createSession();
    const result = await createPost(session, post.title, post.url);
    console.log(`Posted: ${result.uri}`);

    state[filename] = {
      uri: result.uri,
      cid: result.cid,
      url: post.url,
      posted_at: new Date().toISOString(),
    };
    changed = true;
  }

  for (const file of modified) {
    const filename = path.basename(file);
    const post = parsePost(file);
    if (!post) {
      console.log(`Skipping ${filename} (draft or future-dated)`);
      continue;
    }

    const existing = state[filename];
    if (!existing) {
      console.log(`Modified but not in state, treating as new: ${filename}`);
      if (!session) session = await createSession();
      const result = await createPost(session, post.title, post.url);
      state[filename] = {
        uri: result.uri,
        cid: result.cid,
        url: post.url,
        posted_at: new Date().toISOString(),
      };
      changed = true;
    } else if (existing.url !== post.url) {
      if (existing.uri) {
        console.log(`URL changed for ${filename}, replying to original post...`);
        if (!session) session = await createSession();
        await replyToPost(session, existing.uri, existing.cid, `Updated link: ${post.url}`);
        console.log(`Replied to ${existing.uri}`);
      } else {
        console.log(`URL changed for ${filename} but no Bluesky post to reply to (skipped at initial import)`);
      }
      state[filename].url = post.url;
      changed = true;
    } else {
      console.log(`No relevant changes for ${filename}`);
    }
  }

  if (changed) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
    console.log('State file updated.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
