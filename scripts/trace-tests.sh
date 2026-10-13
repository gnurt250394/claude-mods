#!/usr/bin/env bash
# Prints each criterion id of Requirements 1 to 6 that no test name holds as a whole id.
set -euo pipefail

cd "$(dirname "$0")/.."

COUNTS="1:5 2:4 3:12 4:13 5:8 6:17"

held=$(grep -hoE "test\((['\"])[0-9. ]+:" mods/*/test/*.test.ts | sed -E "s/^test\(['\"]//; s/:$//" | tr ' ' '\n' | sort -u)
missing=0

for entry in $COUNTS; do
  req=${entry%%:*}
  total=${entry##*:}

  for n in $(seq 1 "$total"); do
    id="$req.$n"

    if ! grep -qxF "$id" <<<"$held"; then
      echo "$id"
      missing=1
    fi
  done
done

exit "$missing"
