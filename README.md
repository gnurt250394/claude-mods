# claude-mods

A Claude Code marketplace (`vbee-mods`) with two mods:

- `vn-spinner`: the spinner word and the turn line in playful Vietnamese.
- `cute-mascot`: a pixel-art bee above the prompt that reacts to each turn, with a ting and a notification after a long turn.

## Install

```sh
claude plugin marketplace add ~/Project/vbee/claude-mods
claude plugin install vn-spinner@vbee-mods
claude plugin install cute-mascot@vbee-mods
claude plugin list
```

## Bee commands

- `/bee`: show the bee again after hiding it.
- `/bee hide`: hide the bee for the rest of the session.
- `/bee mute`: no ting and no notification after a long turn, kept across sessions.
- `/bee unmute`: ting and notification back on.

## Develop

```sh
claude --plugin-dir mods/<mod>
claude plugin validate mods/<mod>
claude plugin test mods/<mod>
bash scripts/trace-tests.sh
node scripts/make-ting.mjs --check
```
