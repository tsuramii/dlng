const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.DUOLINGO_JWT}`,
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
};

const { sub } = JSON.parse(
  Buffer.from(process.env.DUOLINGO_JWT.split(".")[1], "base64").toString()
);

const userResponse = fetch(
  `https://www.duolingo.com/2017-06-30/users/${sub}?fields=fromLanguage,learningLanguage,xpGains`,
  {
    headers,
  }
);

userResponse
  .then((response) => {
    if (!response.ok) {
      throw new Error(
        `Failed to fetch user data: ${response.status} - ${response.statusText}`
      );
    }
    return response.json();
  })
  .then(({ fromLanguage, learningLanguage, xpGains }) => {
    // Target XP for the number of lessons
    const targetXP = parseInt(process.env.TARGET_XP);

    let currentXP = 0;
    let totalXP = targetXP;

    function fetchSession() {
      fetch("https://www.duolingo.com/2017-06-30/sessions", {
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
      })
        .then((sessionResponse) => {
          if (!sessionResponse.ok) {
            console.error(
              `Failed to fetch session data: ${sessionResponse.status} - ${sessionResponse.statusText}`
            );
            throw new Error("Failed to fetch session data");
          }
          return sessionResponse.json();
        })
        .then((session) => {
          const xpGain = session.xpGain || 0;
          currentXP += xpGain;
          totalXP = targetXP - currentXP;

          console.log(
            `Current XP: ${currentXP}, Total XP Remaining: ${totalXP}`
          );

          if (currentXP < targetXP) {
            fetchSession();
          }
        })
        .catch((error) => {
          console.error("An error occurred:", error);
        });
    }

    fetchSession();
  })
  .catch((error) => {
    console.error("An error occurred:", error);
  });
