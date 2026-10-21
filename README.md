# testing-examples

A set of small apps, each built to show a different kind of testing. Every scenario lives in its own folder with its own README, dependencies and instructions, so you can pick one up without touching the others.

Everything runs on localhost. The apps are TypeScript on Node, with SQLite where they need a database.

## Scenarios

| # | Folder | What it covers | Status |
| --- | --- | --- | --- |
| 1 | [01-otp-signup](01-otp-signup) | Sign-up wizard with a one-time code sent by email. Elf, Dwarf or Man? | App built up to "Check your emails". Tests to do. |

## Adding a scenario

Make a folder named `NN-short-name`, give it a README that explains how to run it and what's worth testing, and add a row to the table above.
