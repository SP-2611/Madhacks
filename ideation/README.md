# Ideation

One file per idea (e.g. `idea-name.md`). Suggested outline:

- **Problem:** who has it and why it matters
- **Solution:** what we build, in one or two sentences
- **Demo:** what judges see in 2 minutes
- **Stack:** languages, APIs, hardware
- **Risks:** what could stop us from finishing in time
- **Prize tracks:** which sponsor or category prizes it fits

## Ideas

- [Badger prevention game](badger-prevention-game.md): mandatory prevention modules as a pixel-art RPG

Tail of the Badger (An introduction to madison to new students)

Bucky loses his tail and the user needs to help bucky find the tail (help him find it across campus)

Bucky vs Phishing(Morgridge Hall)
Bucky vs Safe Drinking (Dormitory)(safety resources)
Bucky vs courses (bascom hills)
Bucky vs Drugs (333 Campus UHS) (Where is narcan) 


. Agree on the game’s core
  Title: Tail of the Badger
  Audience: New UW–Madison students
  Goal: Find Bucky’s missing mascot tail while learning how to navigate campus life.
  Format: A browser-based, story-driven game with short puzzles and conversations.
  Target playtime: 5–10 minutes for the hackathon prototype.
  Opening story:
  Bucky is getting ready for a welcome event, but his tail has disappeared. Follow his route across campus, help the students you meet, and collect clues to find    it.
  Main gameplay loop:
  Choose a location → meet a character → complete an activity → receive feedback → collect a clue → unlock the next location.
2. Decide what you are actually building
  Feature
  Hackathon MVP
  Later
  Campus map
  Illustrated map with clickable locations
  Movement, animations, more buildings
  Story
  One connected mystery
  Multiple routes and optional side stories
  Phishing chapter
  Inspect a fictional message
  More types of scams
  Residence-hall chapter
  Short AI conversation with preset alternatives
  More scenarios
  Course chapter
  Preview labeled “Coming soon”
  Schedule puzzle
  UHS resource chapter
  Preview labeled “Coming soon”
  Verified resource-finding activity
  Notebook
  Collected clues and resource links
  Saved personal checklist
  Ending
  Recover the tail and recap learning
  Replayable scenarios

Skip accounts, multiplayer, a database, and a full 3D campus for the first version.
  3. Design the screens before coding
  You need approximately seven screens or screen states:
  Title screen: Start, how to play, sound toggle.
  Introduction: Bucky explains the missing tail.
  Campus map: Available, locked, and completed locations.
  Chapter scene: Character, dialogue, and interactive activity.
  Chapter recap: What happened, what you learned, and your clue.
  Notebook: Clues and verified campus resources.
  Ending: Find the tail and review the completed journey.
  Use the same chapter layout repeatedly so you don’t have to build each location from scratch.
4. Write the first two chapters
  Chapter one — The Suspicious Message
  Setting: Morgridge Hall
  Learning goal: Practice checking a suspicious message before acting.
  Scene: A message says someone found Bucky’s tail and asks the player to sign in to claim it.
  Interaction:
  Select parts of the message to inspect.
  Examine the sender, link destination, and requested action.
  Choose how to verify the claim.
  Receive an explanation and retry if needed.
  Story reward: An independently verified lost-and-found notice points toward the residence hall.
  Use fictional addresses and a harmless domain such as example.com. Don’t collect credentials or open a real suspicious site.
  Chapter two — Look Out for Your Badgers
  Setting: A residence-hall common room
  Learning goal: Practice respecting someone’s decision not to drink.
  Scene: A fictional student says, “I don’t want to drink tonight, but I don’t want everyone making a big deal of it.”
  Interaction:
  Type a response or choose a preset option.
  Have up to three short exchanges.
  Get specific feedback about respecting boundaries and offering support.
  Retry if desired.
  Story reward: The student remembers where Bucky left his event supplies.
  Ending: The tail is in the welcome-event costume box. The characters you helped join Bucky for the event.
