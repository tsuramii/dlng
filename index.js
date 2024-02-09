const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.DUOLINGO_JWT}`,
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
};

const { sub } = JSON.parse(
  Buffer.from(process.env.DUOLINGO_JWT.split(".")[1], "base64").toString()
);

const userResponse = await fetch(
  `https://www.duolingo.com/2017-06-30/users/${sub}?fields=fromLanguage,learningLanguage,xpGains`,
  {
    headers,
  }
);
const { fromLanguage, learningLanguage, xpGains } = await userResponse.json();

// Target XP for the number of lessons
const targetXP = parseInt(process.env.TARGET_XP);

let currentXP = 0;
let totalXP = targetXP;

while (currentXP < targetXP) {
  const sessionResponse = await fetch(
    "https://www.duolingo.com/2017-06-30/sessions",
    {
      body: JSON.stringify({
        challengeTypes: [
          "assist",
          "characterIntro",
          "characterMatch",
          "characterPuzzle",
          "characterSelect",
          "characterTrace",
          "completeReverseTranslation",
          "definition",
          "dialogue",
          "form",
          "freeResponse",
          "gapFill",
          "judge",
          "listen",
          "listenComplete",
          "listenMatch",
          "match",
          "name",
          "listenComprehension",
          "listenIsolation",
          "listenTap",
          "partialListen",
          "partialReverseTranslate",
          "readComprehension",
          "select",
          "selectPronunciation",
          "selectTranscription",
          "syllableTap",
          "syllableListenTap",
          "speak",
          "tapCloze",
          "tapClozeTable",
          "tapComplete",
          "tapCompleteTable",
          "tapDescribe",
          "translate",
          "typeCloze",
          "typeClozeTable",
          "typeCompleteTable",
        ],
        fromLanguage,
        isFinalLevel: false,
        isV2: true,
        juicy: true,
        learningLanguage,
        skillId: xpGains.find((xpGain) => xpGain.skillId).skillId,
        smartTipsVersion: 2,
        type: "SPEAKING_PRACTICE",
      }),
      headers,
      method: "POST",
    }
  );

  const session = await sessionResponse.json();

  const xpGain = session.xpGain || 0;
  currentXP += xpGain;
  totalXP = targetXP - currentXP;

  console.log(`Current XP: ${currentXP}, Total XP Remaining: ${totalXP}`);
}
