# Marketing plan — Skip Ad for YouTube

How to get more installs and users for a free extension, and where each step
stands. Plan agreed on 2026-11-23; status checked on 2026-11-25.

Store listing:
<https://chromewebstore.google.com/detail/kdembckigpophgcgjfmbenkgnnkdoofe>

**Status:** ✅ done · 🟡 partly done · ⬜ not started · ❓ check by hand
(outside the repo)

## The idea

Most installs come from people **searching the Chrome Web Store**, and a
listing with good ratings turns those searchers into installs. Outside
promotion mostly gives an early push so that ranking can start. So the order
is: ratings and listing first, then launch posts, then more stores.

**Why that order:** a launch post is a one-time spike. If people land on a
listing with zero ratings, many won't install, and a launch can't be done
twice. Get the README, the listing, and some ratings ready before posting
anywhere.

**Our angle:** trust. Many ad-related extensions were sold and turned into
adware. "Open source, no data collected, no network requests, only
youtube.com" is a real reason to pick this one.

## Do now

| #   | Step                                                                                                   | Status | Notes                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Rating prompt** in the popup at 50 ads skipped; Rate or × ends it for good                           | 🟡     | Built: 1.2.0 (Phase 6) and the auto-open in 1.3.0 (Phase 7). **Not live yet:** the store still has 1.1.0. Upload `dist/yt-skip-ad-1.3.0-store.zip`.                       |
| 2   | **Rate** link in the popup footer, to the store reviews page                                           | 🟡     | Built in 1.2.0; live once 1.3.0 is uploaded.                                                                                                                              |
| 3   | **GitHub star** as a plain link (no GitHub iframe button: the network lock would block it)             | 🟡     | Built in 1.2.0 ("Source ★"); live once 1.3.0 is uploaded.                                                                                                                 |
| 4   | **Store description** leads with the benefit and the trust angle                                       | ✅     | "Skips the ad for you. Collects nothing.", then a privacy section ([listing.md](store/listing.md)). Paste it again with the 1.3.0 upload: it now mentions the rating ask. |
| 5   | **Store screenshots** show the popup and the counter                                                   | ✅     | `docs/store/screenshot-*.png`, light and dark popup.                                                                                                                      |
| 6   | **README: store badge and link**                                                                       | ✅     | Badge and link at the top of the README (2026-11-25).                                                                                                                     |
| 7   | **README: GIF demo** at the top (an ad being skipped)                                                  | ✅     | `docs/demo.gif`: an ad skipped, then the popup opening at 51 with the rating prompt (2026-11-25).                                                                         |
| 8   | **GitHub repo topics:** `chrome-extension`, `youtube`, `privacy`, `manifest-v3`, `ad-skipper`          | ✅     | Topics, description, and website set on GitHub (2026-11-25).                                                                                                              |
| 9   | **Edge Add-ons:** submit the same store zip; no code change, less competition, no developer fee        | ⬜     |                                                                                                                                                                           |
| 10  | **Awesome lists:** PRs to add it to awesome-chrome-extensions and awesome-privacy lists                | ⬜     | Read each list's rules first (some want a star count or age).                                                                                                             |
| 11  | **"It stopped working" issue template** (`.github/ISSUE_TEMPLATE/`), so breakages are reported quickly | ⬜     | YouTube changes its page often; fast fixes protect the rating more than any marketing.                                                                                    |

## In 2–4 weeks

Once a few real users have confirmed it works and the listing has some
ratings.

| #   | Step                                                                                                                       | Status | Notes                                                                           |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| 12  | **Blog post** on Dev.to or Hashnode: how the MAIN-world trusted click works                                                | ⬜     | Long-term search traffic, and good for your developer profile.                  |
| 13  | **Reddit:** r/chrome_extensions, r/SideProject, r/opensource (r/privacy if its rules allow); tell the story, link the post | ⬜     | Read each subreddit's self-promotion rules first. Space posts a few days apart. |
| 14  | **Show HN** on Hacker News, with the technical angle                                                                       | ⬜     | Not on the same day as Reddit.                                                  |
| 15  | **Translated listings:** Bengali, Hindi, Spanish, Portuguese, Indonesian                                                   | ⬜     | Local searches have less competition; low effort.                               |
| 16  | **LinkedIn:** in the README, the store's developer info, and blog posts (not in the popup)                                 | ⬜     | People interested in you look there; in the popup it reads as self-promotion.   |

## Later (1–2 months)

| #   | Step                                                                       | Status | Notes                                                                                                                                                                                                   |
| --- | -------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 17  | **Product Hunt** launch                                                    | ⬜     | A modest boost, cheap to do.                                                                                                                                                                            |
| 18  | **Firefox Add-ons (AMO)**                                                  | ⬜     | Firefox's Manifest V3 differs: needs real testing. Its users care about privacy, which fits.                                                                                                            |
| 19  | **Featured badge:** apply once it has ratings and a track record           | ⬜     | Already close: Manifest V3, two permissions, a privacy policy.                                                                                                                                          |
| 20  | **Support / donation link** (Ko-fi or Buy Me a Coffee) in the popup footer | ⬜     | No account yet. Check payouts first: both need Stripe or PayPal, which may not pay out in Bangladesh; Patreon or a local platform may be the realistic choice. Add the link only once an account works. |

## Never

- Buying reviews, review-exchange groups, or spamming comment sections:
  they break store policy and can get the listing removed.
- A reward for rating, or a feature locked behind it (store policy).
- Anything that sends data off the device, including GitHub's live star
  button or analytics to measure the marketing. The privacy promise is the
  main selling point.
