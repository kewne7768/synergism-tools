class SaveProcessor {
    _requestedOutputConfig;
    _saveGames;

    constructor(saveGames, requestedOutput) {
        this._saveGames = saveGames;
        this._requestedOutput = requestedOutput;
    }

    /**
     * @return {Promise}
     */
    transform() {
        return new Promise((resolve, reject) => {
            /** @var {Map<string, object>} saveGameDateMap */
            let saveGameDateMap = new Map();

            // Step 1: Sort all of the savegames by offlinetick.
            this._saveGames = this._saveGames.sort((a, b) => {
                return a.offlinetick < b.offlinetick ? -1 : (a.offlinetick > b.offlinetick ? 1 : 0);
            });

            // Step 2: Find the latest savegame of each day.
            this._saveGames.forEach((save) => {
                let date = new Date(save.offlinetick);
                let isoDate = date.getIsoLocalTimezoneDate();

                // If not present in the map, add it. Otherwise check the save with the latest offlinetick.
                if (saveGameDateMap.has(isoDate)) {
                    let currentSave = saveGameDateMap.get(isoDate);
                    if (save.offlinetick > currentSave.offlinetick) {
                        saveGameDateMap.set(isoDate, save);
                    }
                } else {
                    saveGameDateMap.set(isoDate, save);
                }
            });

            // Convert to facts.
            let saveGameFactsMap = new Map();
            for (let [date, saveGame] of saveGameDateMap) {
                saveGameFactsMap.set(date, this.getSavegameFacts(saveGame));
            }

            // Final step: Resolve!
            resolve(saveGameFactsMap);
        });
    }

    getBestSavegameHistoryPerSecond(saveGame, historyKind, lemonade) {
        let hist = saveGame.history[historyKind];
        if (!hist || !hist.length) {
            return 0;
        }

        let best = 0;
        for (let i = 0; i < hist.length; ++i) {
            if (hist[i][lemonade]) {
                let thisSecondly = hist[i][lemonade] / hist[i].seconds;
                if (thisSecondly > best) {
                    best = thisSecondly;
                }
            }
        }

        return best;
    }

    sumDictionaryObject(dict) {
        Object.keys(dict).reduce(((previousValue, currentValue) => {
            return previousValue + dict[currentValue];
        }), 0);
    }

    getSavegameFacts(saveGame) {
        let facts = new SaveFacts();
        facts.version = saveGame.version;
        facts.datetime = saveGame.offlinetick;
        facts.bestWowPlatonicCubesPerSecond = this.getBestSavegameHistoryPerSecond(saveGame, 'ascend', 'wowPlatonicCubes');
        facts.bestWowHypercubesPerSecond = this.getBestSavegameHistoryPerSecond(saveGame, 'ascend', 'wowHypercubes');
        // TODO: Try to calc current run for best variables and improve if needed

        // TODO: Include upgrade costs (or make those a thing of their own?)
        facts.openedWowHypercubes = this.sumDictionaryObject(saveGame.hypercubeBlessings ?? {});
        facts.openedWowPlatonicCubes = this.sumDictionaryObject(saveGame.platonicBlessings ?? {});

        return facts;
    }
}

class SaveFacts {
    version;
    datetime;
    bestWowPlatonicCubesPerSecond = 0;
    bestWowHypercubesPerSecond = 0;
    openedWowPlatonicCubes = 0;
    openedWowHypercubes = 0;
}

// behave as people expect it to
Date.prototype.getIsoLocalTimezoneDate = function () {
    return `${this.getFullYear()}-${this.getMonth() + 1}-${this.getDate()}`;
};
