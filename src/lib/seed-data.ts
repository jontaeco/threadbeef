import type { Category, Platform } from "@/types";

interface SeedMessage {
  author: "a" | "b";
  body: string;
  timestamp: string;
  score: number | null;
  quoted_text: string | null;
}

interface SeedArgument {
  platform: Platform;
  platformSource: string;
  originalUrl: string;
  title: string;
  contextBlurb: string;
  topicDrift: string;
  category: Category;
  heatRating: number;
  userADisplayName: string;
  userBDisplayName: string;
  userAZinger: string | null;
  userBZinger: string | null;
  messages: SeedMessage[];
  entertainmentScore: number;
  status: "approved";
  totalVotes: number;
  votesA: number;
  votesB: number;
  reactions: {
    dead: number;
    both_wrong: number;
    actually: number;
    peak_internet: number;
    spicier: number;
    hof_material: number;
  };
  viewCount: number;
  shareCount: number;
}

export const SEED_ARGUMENTS: SeedArgument[] = [
  // 1. food_takes — spaghetti breaking (from mockup)
  {
    platform: "reddit",
    platformSource: "r/cooking",
    originalUrl: "https://reddit.com/r/cooking/example1",
    title: "Is it acceptable to break spaghetti before boiling?",
    contextBlurb:
      "A heated debate about pasta etiquette spiraled into questioning each other's entire cooking philosophy.",
    topicDrift:
      "Started about: pasta length → Ended about: whether Gordon Ramsay is overrated",
    category: "food_takes",
    heatRating: 4,
    userADisplayName: "PastaLover42",
    userBDisplayName: "ChefMike_Real",
    userAZinger: "Breaking spaghetti is violence against Italian culture",
    userBZinger: "I'll snap every noodle in this box and sleep like a baby",
    messages: [
      {
        author: "a",
        body: "Breaking spaghetti before boiling it should be a criminal offense. There is ZERO reason to do it. Get a bigger pot.",
        timestamp: "2024-03-15T14:23:00Z",
        score: 847,
        quoted_text: null,
      },
      {
        author: "b",
        body: "Lmao calm down it's pasta not a religious artifact. Some of us have normal-sized pots and don't need to perform a ceremony every time we make dinner.",
        timestamp: "2024-03-15T14:25:00Z",
        score: 623,
        quoted_text: null,
      },
      {
        author: "a",
        body: "It literally affects how the sauce clings to the noodle. Short broken pieces can't twirl properly. This is basic pasta science.",
        timestamp: "2024-03-15T14:28:00Z",
        score: 412,
        quoted_text: null,
      },
      {
        author: "b",
        body: '"Pasta science" I\'m screaming. You probably also think water has a memory and crystals heal people.',
        timestamp: "2024-03-15T14:30:00Z",
        score: 891,
        quoted_text: "It literally affects how the sauce clings to the noodle",
      },
      {
        author: "a",
        body: "Go ahead and laugh. When you're sitting there with your sad little broken pasta pieces that won't stay on your fork, I'll be over here with my perfectly twirled forkful living my best life.",
        timestamp: "2024-03-15T14:35:00Z",
        score: 356,
        quoted_text: null,
      },
      {
        author: "b",
        body: "I eat my pasta with a SPOON because I'm an ADULT and I do what I WANT. Stay mad about noodle length, spaghetti cop.",
        timestamp: "2024-03-15T14:38:00Z",
        score: 1247,
        quoted_text: null,
      },
    ],
    entertainmentScore: 8.7,
    status: "approved",
    totalVotes: 2847,
    votesA: 1523,
    votesB: 1324,
    reactions: {
      dead: 156,
      both_wrong: 23,
      actually: 89,
      peak_internet: 234,
      spicier: 12,
      hof_material: 45,
    },
    viewCount: 12450,
    shareCount: 342,
  },

  // 2. tech — tabs vs spaces
  {
    platform: "hackernews",
    platformSource: "Hacker News",
    originalUrl: "https://news.ycombinator.com/example2",
    title: "Tabs vs Spaces: The definitive answer",
    contextBlurb:
      "What started as a code review comment turned into an existential crisis about developer identity.",
    topicDrift:
      "Started about: indentation → Ended about: whether self-taught devs are 'real' programmers",
    category: "tech",
    heatRating: 3,
    userADisplayName: "rustacean_99",
    userBDisplayName: "mass_assignment",
    userAZinger: "Spaces are for people who peaked in bootcamp",
    userBZinger: "Your tab width is as inconsistent as your commit messages",
    messages: [
      {
        author: "a",
        body: "Using spaces for indentation in 2024 is like using a horse and buggy. Tabs exist for a reason — they're semantically correct and accessible.",
        timestamp: "2024-02-10T09:15:00Z",
        score: 234,
        quoted_text: null,
      },
      {
        author: "b",
        body: "Tabs render differently across editors. Spaces are consistent everywhere. This isn't about preference, it's about professionalism.",
        timestamp: "2024-02-10T09:18:00Z",
        score: 189,
        quoted_text: null,
      },
      {
        author: "a",
        body: "That's literally the POINT. Tabs let each developer choose their preferred width. It's more accessible for developers with visual impairments who need wider indentation.",
        timestamp: "2024-02-10T09:22:00Z",
        score: 567,
        quoted_text: "Tabs render differently across editors",
      },
      {
        author: "b",
        body: "Oh cool you're using accessibility as a shield for your formatting preference now? Google, Facebook, Airbnb all use spaces. But sure, you know better.",
        timestamp: "2024-02-10T09:25:00Z",
        score: 312,
        quoted_text: null,
      },
      {
        author: "a",
        body: "Appeal to authority fallacy. Those same companies also use monorepos the size of small countries. Doesn't mean we all should.",
        timestamp: "2024-02-10T09:30:00Z",
        score: 445,
        quoted_text: null,
      },
      {
        author: "b",
        body: "You literally just mass-reply \"skill issue\" on every code review. Maybe the real issue is your inability to collaborate with a team that disagrees with you.",
        timestamp: "2024-02-10T09:33:00Z",
        score: 678,
        quoted_text: null,
      },
      {
        author: "a",
        body: "Collaboration doesn't mean conformity. And if your entire engineering culture is built on space-counting, maybe the culture is the problem.",
        timestamp: "2024-02-10T09:40:00Z",
        score: 223,
        quoted_text: null,
      },
    ],
    entertainmentScore: 7.4,
    status: "approved",
    totalVotes: 1893,
    votesA: 1105,
    votesB: 788,
    reactions: {
      dead: 89,
      both_wrong: 234,
      actually: 156,
      peak_internet: 67,
      spicier: 8,
      hof_material: 12,
    },
    viewCount: 8920,
    shareCount: 156,
  },

  // 3. petty — dishwasher loading
  {
    platform: "reddit",
    platformSource: "r/mildlyinfuriating",
    originalUrl: "https://reddit.com/r/mildlyinfuriating/example3",
    title: "My roommate loads the dishwasher like a psychopath",
    contextBlurb:
      "A passive-aggressive photo turned into a full-blown confrontation about domestic competence.",
    topicDrift:
      "Started about: plate angles → Ended about: who pays more rent",
    category: "petty",
    heatRating: 5,
    userADisplayName: "CleanFreak_2024",
    userBDisplayName: "VibeCheck_Larry",
    userAZinger: "You load a dishwasher like you've never seen water before",
    userBZinger: null,
    messages: [
      {
        author: "a",
        body: "FOR THE LAST TIME: bowls go on the TOP rack, facing DOWNWARD at a 45-degree angle. Not straight up. Not sideways. Not \"however they fit.\"",
        timestamp: "2024-04-20T18:00:00Z",
        score: 1234,
        quoted_text: null,
      },
      {
        author: "b",
        body: "Bro it's a dishwasher not a NASA launch sequence. You put stuff in, soap goes in, button gets pressed. Dishes come out clean. End of story.",
        timestamp: "2024-04-20T18:05:00Z",
        score: 2341,
        quoted_text: null,
      },
      {
        author: "a",
        body: "Except they DON'T come out clean when you stack everything on top of each other like a Jenga tower. The water can't reach anything!",
        timestamp: "2024-04-20T18:08:00Z",
        score: 987,
        quoted_text: null,
      },
      {
        author: "b",
        body: "I've been washing dishes this way for 28 years and I'm still alive. Maybe the real dirty thing here is your need to control how everyone does everything.",
        timestamp: "2024-04-20T18:12:00Z",
        score: 1567,
        quoted_text: null,
      },
      {
        author: "a",
        body: "28 years of doing it wrong is still doing it wrong. The manual literally has a diagram.",
        timestamp: "2024-04-20T18:15:00Z",
        score: 876,
        quoted_text: null,
      },
      {
        author: "b",
        body: "YOU READ THE DISHWASHER MANUAL?! Oh my god. Oh my actual god. That's the most unhinged thing I've ever heard. I need to call someone.",
        timestamp: "2024-04-20T18:18:00Z",
        score: 4521,
        quoted_text: null,
      },
    ],
    entertainmentScore: 9.2,
    status: "approved",
    totalVotes: 5234,
    votesA: 1987,
    votesB: 3247,
    reactions: {
      dead: 456,
      both_wrong: 12,
      actually: 34,
      peak_internet: 567,
      spicier: 89,
      hof_material: 123,
    },
    viewCount: 23100,
    shareCount: 891,
  },

  // 4. philosophy — is a hot dog a sandwich
  {
    platform: "twitter",
    platformSource: "@PhilosophyTakes",
    originalUrl: "https://twitter.com/example4",
    title: "Is a hot dog a sandwich? A philosophical inquiry.",
    contextBlurb:
      "Two strangers went to war over structural classification of encased meats.",
    topicDrift:
      "Started about: sandwich taxonomy → Ended about: whether language is real",
    category: "philosophy",
    heatRating: 2,
    userADisplayName: "StructuralPurist",
    userBDisplayName: "ChaosEnjoyer",
    userAZinger: "By your logic, a Pop-Tart is a calzone",
    userBZinger: "Imagine gatekeeping bread",
    messages: [
      {
        author: "a",
        body: "A hot dog is NOT a sandwich. A sandwich requires two separate pieces of bread. A hot dog bun is a single piece. This is not debatable.",
        timestamp: "2024-01-05T12:00:00Z",
        score: 342,
        quoted_text: null,
      },
      {
        author: "b",
        body: "A sub roll is also one piece of bread. Is a sub not a sandwich? You've just eliminated every hoagie from the sandwich canon.",
        timestamp: "2024-01-05T12:03:00Z",
        score: 567,
        quoted_text: null,
      },
      {
        author: "a",
        body: "A sub roll is MEANT to be a single piece. It's a variant. A hot dog bun is fundamentally different in structural intent.",
        timestamp: "2024-01-05T12:06:00Z",
        score: 123,
        quoted_text: null,
      },
      {
        author: "b",
        body: '"Structural intent" lmaooo the bread doesn\'t have INTENTIONS. It\'s BREAD.',
        timestamp: "2024-01-05T12:08:00Z",
        score: 891,
        quoted_text: "A hot dog bun is fundamentally different in structural intent",
      },
      {
        author: "a",
        body: "By your logic a taco is a sandwich. A wrap is a sandwich. A CREPE is a sandwich. You see how this falls apart?",
        timestamp: "2024-01-05T12:12:00Z",
        score: 445,
        quoted_text: null,
      },
      {
        author: "b",
        body: "Maybe the problem isn't my definition. Maybe the problem is that 'sandwich' was always a spectrum and you're afraid to accept that.",
        timestamp: "2024-01-05T12:15:00Z",
        score: 234,
        quoted_text: null,
      },
      {
        author: "a",
        body: "A spectrum. You want sandwiches to be a SPECTRUM. I'm logging off.",
        timestamp: "2024-01-05T12:18:00Z",
        score: 678,
        quoted_text: null,
      },
    ],
    entertainmentScore: 8.1,
    status: "approved",
    totalVotes: 3456,
    votesA: 1234,
    votesB: 2222,
    reactions: {
      dead: 234,
      both_wrong: 456,
      actually: 123,
      peak_internet: 345,
      spicier: 5,
      hof_material: 67,
    },
    viewCount: 15670,
    shareCount: 567,
  },

  // 5. aita — wedding playlist
  {
    platform: "reddit",
    platformSource: "r/AmItheAsshole",
    originalUrl: "https://reddit.com/r/AmItheAsshole/example5",
    title: "AITA for playing \"my\" song at someone else's wedding?",
    contextBlurb:
      "OP requested a song at a wedding that the bride considers 'her song,' and things got ugly.",
    topicDrift:
      "Started about: a DJ request → Ended about: who peaked in high school",
    category: "aita",
    heatRating: 4,
    userADisplayName: "WeddingGuest_88",
    userBDisplayName: "BrideVibes2024",
    userAZinger: null,
    userBZinger: "You requested my song at MY wedding. Read the room.",
    messages: [
      {
        author: "a",
        body: "It's a public song. Nobody owns a song. I asked the DJ to play Don't Stop Believin' because it's a classic. How is that offensive?",
        timestamp: "2024-05-10T21:00:00Z",
        score: 567,
        quoted_text: null,
      },
      {
        author: "b",
        body: "Because it was literally on our DO NOT PLAY list that we sent to the DJ. That song is our first dance at the AFTER party. You KNEW this.",
        timestamp: "2024-05-10T21:03:00Z",
        score: 1234,
        quoted_text: null,
      },
      {
        author: "a",
        body: "I didn't see any list. And even if I did, it's a wedding reception not a dictatorship. People want to have fun.",
        timestamp: "2024-05-10T21:06:00Z",
        score: 234,
        quoted_text: null,
      },
      {
        author: "b",
        body: "My mother-in-law literally HANDED you the program with the playlist guidelines. You used it as a coaster.",
        timestamp: "2024-05-10T21:10:00Z",
        score: 2341,
        quoted_text: "I didn't see any list",
      },
      {
        author: "a",
        body: "Ok maybe I skimmed it but who reads wedding programs cover to cover? There were like 14 pages.",
        timestamp: "2024-05-10T21:14:00Z",
        score: 123,
        quoted_text: null,
      },
      {
        author: "b",
        body: "The DO NOT PLAY list was on page ONE. In BOLD. With a BORDER around it. You're either illiterate or deliberately chaotic and honestly both options are concerning.",
        timestamp: "2024-05-10T21:18:00Z",
        score: 3456,
        quoted_text: null,
      },
    ],
    entertainmentScore: 8.9,
    status: "approved",
    totalVotes: 4567,
    votesA: 987,
    votesB: 3580,
    reactions: {
      dead: 345,
      both_wrong: 56,
      actually: 12,
      peak_internet: 456,
      spicier: 23,
      hof_material: 89,
    },
    viewCount: 19800,
    shareCount: 678,
  },

  // 6. gaming — difficulty settings
  {
    platform: "reddit",
    platformSource: "r/gaming",
    originalUrl: "https://reddit.com/r/gaming/example6",
    title: "Playing on easy mode is still 'beating' the game",
    contextBlurb:
      "A casual gamer defended their right to enjoy games on easy mode and summoned the git gud brigade.",
    topicDrift:
      "Started about: difficulty settings → Ended about: whether gaming is 'work'",
    category: "gaming",
    heatRating: 3,
    userADisplayName: "CasualAndy",
    userBDisplayName: "GitGud_Sensei",
    userAZinger: "I paid $70 for this game, I'll play it however I want",
    userBZinger: null,
    messages: [
      {
        author: "a",
        body: "Just finished Elden Ring on easy mode with summons and I loved every second. The story was amazing. Don't @ me.",
        timestamp: "2024-06-01T15:00:00Z",
        score: 1567,
        quoted_text: null,
      },
      {
        author: "b",
        body: "Elden Ring doesn't HAVE an easy mode. You mean you over-leveled and used spirit ashes for every fight. That's not beating the game, that's watching it.",
        timestamp: "2024-06-01T15:04:00Z",
        score: 892,
        quoted_text: null,
      },
      {
        author: "a",
        body: "The developers PUT spirit ashes in the game. They're an intended mechanic. Using them IS playing the game as designed.",
        timestamp: "2024-06-01T15:08:00Z",
        score: 2345,
        quoted_text: null,
      },
      {
        author: "b",
        body: "They also put a jump button in but that doesn't mean you should bunny hop through every boss fight. Some things are there as training wheels.",
        timestamp: "2024-06-01T15:12:00Z",
        score: 456,
        quoted_text: null,
      },
      {
        author: "a",
        body: "I have a full-time job, two kids, and maybe 45 minutes to game per night. I don't have TIME to die 47 times to Malenia. Some of us have lives.",
        timestamp: "2024-06-01T15:18:00Z",
        score: 3456,
        quoted_text: null,
      },
      {
        author: "b",
        body: "Then play a different game??? Not every game is for every person. I don't complain that ballet is too hard, I just don't do ballet.",
        timestamp: "2024-06-01T15:22:00Z",
        score: 678,
        quoted_text: null,
      },
      {
        author: "a",
        body: "\"Just don't play it\" is the laziest take. Accessibility in gaming matters. Not everyone has the reflexes of a caffeinated teenager.",
        timestamp: "2024-06-01T15:28:00Z",
        score: 1890,
        quoted_text: null,
      },
    ],
    entertainmentScore: 7.8,
    status: "approved",
    totalVotes: 3210,
    votesA: 2345,
    votesB: 865,
    reactions: {
      dead: 67,
      both_wrong: 89,
      actually: 234,
      peak_internet: 123,
      spicier: 15,
      hof_material: 34,
    },
    viewCount: 14200,
    shareCount: 234,
  },

  // 7. food_takes — ketchup on steak
  {
    platform: "reddit",
    platformSource: "r/unpopularopinion",
    originalUrl: "https://reddit.com/r/unpopularopinion/example7",
    title: "Putting ketchup on a well-done steak is perfectly valid",
    contextBlurb:
      "A self-proclaimed steak enthusiast defended their condiment choices against the food police.",
    topicDrift:
      "Started about: ketchup → Ended about: classism in food culture",
    category: "food_takes",
    heatRating: 5,
    userADisplayName: "KetchupKing_420",
    userBDisplayName: "SteakSnob_Prime",
    userAZinger: "You spent $80 on a steak to taste... steak? Groundbreaking.",
    userBZinger:
      "Ketchup on steak is how you tell a chef you don't respect them",
    messages: [
      {
        author: "a",
        body: "I like my steak well-done with ketchup and I'm tired of pretending I don't. It tastes good. Food is supposed to taste good to YOU.",
        timestamp: "2024-07-15T19:00:00Z",
        score: 2345,
        quoted_text: null,
      },
      {
        author: "b",
        body: "This is genuinely the most violent thing I've read today. A chef spent years perfecting their craft so you could drown it in tomato sugar paste.",
        timestamp: "2024-07-15T19:03:00Z",
        score: 1678,
        quoted_text: null,
      },
      {
        author: "a",
        body: "Imagine being this pressed about what another person puts in their mouth. It's MY steak. I PAID for it. The transaction is complete.",
        timestamp: "2024-07-15T19:07:00Z",
        score: 3456,
        quoted_text: null,
      },
      {
        author: "b",
        body: "You paid for a well-done steak. That's already a crime. The ketchup is just the getaway car.",
        timestamp: "2024-07-15T19:10:00Z",
        score: 4567,
        quoted_text: null,
      },
      {
        author: "a",
        body: "This is exactly the kind of food elitism that makes people afraid to eat in public. Let people enjoy things without your culinary gatekeeping.",
        timestamp: "2024-07-15T19:15:00Z",
        score: 1890,
        quoted_text: null,
      },
      {
        author: "b",
        body: "I'm not gatekeeping, I'm MOURNING. That cow didn't sacrifice its life so you could turn it into a leather coaster with Heinz on top.",
        timestamp: "2024-07-15T19:18:00Z",
        score: 5678,
        quoted_text: null,
      },
    ],
    entertainmentScore: 9.1,
    status: "approved",
    totalVotes: 6789,
    votesA: 3456,
    votesB: 3333,
    reactions: {
      dead: 567,
      both_wrong: 34,
      actually: 45,
      peak_internet: 678,
      spicier: 123,
      hof_material: 234,
    },
    viewCount: 31200,
    shareCount: 1234,
  },

  // 8. tech — light mode vs dark mode
  {
    platform: "twitter",
    platformSource: "@DevTwitter",
    originalUrl: "https://twitter.com/example8",
    title: "People who use light mode are psychopaths",
    contextBlurb:
      "A casual tweet about IDE themes turned into a deep dive on productivity, eye health, and personality disorders.",
    topicDrift:
      "Started about: screen themes → Ended about: whether night owls are smarter",
    category: "tech",
    heatRating: 2,
    userADisplayName: "DarkModeDan",
    userBDisplayName: "LightModeLexi",
    userAZinger: null,
    userBZinger: "Dark mode users just want to feel edgy while writing CRUD apps",
    messages: [
      {
        author: "a",
        body: "If you code in light mode you're either a psychopath or you hate your retinas. There is no third option.",
        timestamp: "2024-08-20T10:00:00Z",
        score: 892,
        quoted_text: null,
      },
      {
        author: "b",
        body: "I use light mode because studies show higher readability and comprehension with dark text on light backgrounds. But go off.",
        timestamp: "2024-08-20T10:03:00Z",
        score: 456,
        quoted_text: null,
      },
      {
        author: "a",
        body: "\"Studies show\" nobody cares about your study. My eyes physically hurt looking at your screen. It's like staring into the sun with syntax highlighting.",
        timestamp: "2024-08-20T10:06:00Z",
        score: 1234,
        quoted_text: "studies show higher readability",
      },
      {
        author: "b",
        body: "Your eyes hurt because you code at 2am in a pitch black room eating Doritos. That's not a theme problem, that's a lifestyle problem.",
        timestamp: "2024-08-20T10:09:00Z",
        score: 2345,
        quoted_text: null,
      },
      {
        author: "a",
        body: "Ok now I KNOW you're a morning person. This explains everything. Morning people and light mode users are the same breed of unhinged.",
        timestamp: "2024-08-20T10:14:00Z",
        score: 678,
        quoted_text: null,
      },
      {
        author: "b",
        body: "I wake up at 6am, open my MacBook to BLINDING white VS Code, and write better code before breakfast than you do all night. Stay dark, stay mediocre.",
        timestamp: "2024-08-20T10:18:00Z",
        score: 1567,
        quoted_text: null,
      },
    ],
    entertainmentScore: 7.6,
    status: "approved",
    totalVotes: 2345,
    votesA: 1567,
    votesB: 778,
    reactions: {
      dead: 123,
      both_wrong: 345,
      actually: 67,
      peak_internet: 234,
      spicier: 8,
      hof_material: 23,
    },
    viewCount: 10500,
    shareCount: 189,
  },
];
