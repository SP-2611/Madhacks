# Badger prevention game

Turn UW–Madison's mandatory alcohol, drug, consent and hazing prevention modules into a short pixel-art game starring an original badger character (red scarf, not Bucky).

## Problem

Every incoming student has to complete online prevention modules. Most click through them as fast as possible and remember little. The law (Clery Act as amended by VAWA 2013, the Drug-Free Schools and Communities Act, and the Stop Campus Hazing Act) only requires schools to deliver prevention programs, not to make them boring. A format students actually pay attention to could improve what they retain.

## Solution

A 15-minute top-down RPG where you play a badger through a first semester in Madison. Each area of campus holds a scenario where you make choices and see realistic consequences, and the game ends with a completion record the university could track.

Scenario ideas:

- **House party:** pacing drinks, what a standard drink is, recognizing alcohol poisoning, when to call 911.
- **Friend in trouble:** bystander intervention ("the 3 Ds": direct, distract, delegate) and Wisconsin's limited amnesty for people who call for help (verify the exact statute before using it).
- **Consent:** reading signals and asking clearly. Handled as dialogue and reflection, never as points or a "win," with a content warning and an always-visible link to campus resources.
- **Club initiation:** recognizing hazing and where to report it.
- **Pills from a friend:** prescription stimulant misuse and fentanyl contamination, plus where to get naloxone and test strips.

## Demo

In 2 minutes judges see: the badger walking across a pixel campus, one full scenario played with a branching choice, the consequence screen, and the end-of-game completion summary.

## Stack

- **Game:** Phaser 3 (JavaScript, runs in the browser, no install).
- **Content:** scenarios written as JSON files so non-coders on the team can write and edit them.
- **Art:** hand-made pixel sprites (badger sprite already drafted).
- **Stretch:** Claude API to let NPCs answer free-text questions, kept on a short leash with vetted source material.

## Risks

- **Accuracy:** health and legal facts must come from UHS, the Dean of Students and state law, not memory. Budget time to cite sources.
- **Tone:** gamifying sexual assault or overdoses can feel flippant. Keep serious scenes sober and respectful.
- **Scope:** five scenarios is too many for a hackathon. Ship one polished scenario and stub the rest.
- **Art time:** pixel art eats hours. Reuse one tile set.

## Prize tracks

To fill in once the MadHacks sponsor and category list is out. Likely fits: social good, best game, best design.
