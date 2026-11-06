# The Last Door — Multiplayer Escape Room

A cooperative browser puzzle game with shared inventory, server-authoritative answers, live room updates, invitation links, and a JSON room editor.

**Language:** TypeScript / Node.js 24.12+  
**Platform:** Windows, macOS, Linux; modern browser  
**Status:** First-release learning project. See implemented scope and limitations below; this is not a production-completeness claim.

## Features

- Three linked puzzles, an inventory, attempt counter, and shared escape state.
- Cryptographically random room IDs and invite links.
- Server-sent events keep connected teammates synchronized.
- Room editor validates 1–20 clue/code/item records and restarts the room.
- No third-party runtime packages or install step.

## Requirements and quick start

Clone the repository, enter its folder, and install the language/platform tools listed above. Commands run from the repository root. No credentials are required except for Backup Vault's explicitly generated secrets.

```sh
git clone https://github.com/netcodermike/multiplayer-escape-room.git
cd multiplayer-escape-room
node server.ts
# Open http://127.0.0.1:3000 in two browser tabs.
# Create a room in one tab and copy its invite URL to the other.
```

## Verification

```sh
node --test test.ts
```

Create a room and join it in a second tab. Enter `742`, `reward`, then `12`; both tabs should see rewards and the open exit. Try a wrong answer and verify only the attempt counter changes. Replace the puzzle set with the sample editor JSON and solve `42`. Restart the server and confirm old rooms no longer exist.

See [validation notes](docs/VALIDATION.md) for what was actually executed during authoring. A committed CI workflow is a future check until its run is observed successful.

## Architecture and data

`game.ts` contains the pure room model, answer reducer, and editor validation. `server.ts` implements HTTP routes and in-memory room sessions. `public/index.html` contains the responsive browser UI. `test.ts` exercises game progression and validation.

`POST /api/create` returns `{id}`. Other endpoints require `?room=ID`: `GET /api/events` streams public state, `POST /api/solve` accepts `{answer}`, and `POST /api/edit` accepts `{rooms:[{clue,code,item}]}`. Answers stay server-side until players edit their own room. Room state is serialized through Node's event loop. `PORT` changes the listener port; the default host is loopback. There are at most 1,000 rooms, and inactive disconnected rooms expire after one hour.

## Limitations and next steps

Rooms disappear on server restart. Anyone with a room URL can solve or edit it; no account, host role, scoring anti-cheat, or rate limiting. Connections count browser tabs, not unique people. Loopback is suitable for same-machine play; remote play requires deliberate host binding, HTTPS, and an authenticated proxy. This is local source code, not an automatically deployed hosted game. Browser code is plain JavaScript; server/game logic is TypeScript. Native Node type stripping runs TypeScript but does not type-check it.

## Troubleshooting

Use Node 24.12 or newer if `.ts` imports fail. `EADDRINUSE` means port 3000 is occupied; set `PORT` to another value. A stale invitation gives room-not-found after restart; create a new room. A connecting banner usually indicates a stopped server. Malformed puzzle JSON is rejected without replacing the current game. Stop with Ctrl+C.

## Development

Read the source entry point described above, make a focused change, run the verification command, and exercise the relevant manual scenario. [Contributing](CONTRIBUTING.md) explains bug reports and pull requests; [security notes](SECURITY.md) describe the trust assumptions. Runtime/generated files are ignored. No telemetry or paid API dependencies are included.

## License

[MIT](LICENSE), copyright 2026 netcodermike.
