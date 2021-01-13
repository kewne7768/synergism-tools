class GraphApp {
    saveGames = [];
    /** @field {Set} saveGameTimeMap */
    saveGameTimeSet;

    constructor() {
        this.saveGameTimeSet = new Set();
    }

    /**
     * Feeeeeed meeeeeeeeee.
     * @param {string} saveIdentifier Some kind of identifier (filename)
     * @param {string} saveGame Base64'd save
     */
    feedSave(saveIdentifier, saveGame) {
        try {
            saveGame = atob(saveGame);
        } catch (e) {
            console.error("Fed non-base64 garbage in %s.", saveIdentifier);
            return false;
        }

        try {
            saveGame = JSON.parse(saveGame);
        } catch (e) {
            console.error("Fed non-json base64 in %s.", saveIdentifier);
            return false;
        }

        if (!('offlinetick' in saveGame) || !('version' in saveGame) || !('fifthOwnedDiamonds' in saveGame)) {
            console.error("Fed base64-JSON that doesn't look like a Synergism savegame in %s.", saveIdentifier);
            return false;
        }

        if (this.saveGameTimeSet.has(saveGame.offlinetick)) {
            console.error("Fed duplicate savegame for offlinetick %s, %s", saveGame.offlinetick, saveIdentifier);
            return false;
        }

        saveGame._saveIdentifier = saveIdentifier;

        this.saveGames.push(saveGame);
        this.saveGameTimeSet.add(saveGame.offlinetick);
    }
}

class GraphAppUi {
    _app;

    /**
     * @param {GraphApp} graphApp
     */
    constructor(graphApp) {
        this._app = graphApp;
    }

    registerEvents() {
        document.body.addEventListener("drop", this.onDrop.bind(this), false);
        document.body.addEventListener("dragover", this.dragPreventDefault, false);
        document.body.addEventListener("dragenter", this.dragPreventDefault, false);
    }

    dragPreventDefault(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     *
     * @param {DragEvent} e
     */
    onDrop(e) {
        e.preventDefault();
        console.info("Files: %o", e.dataTransfer.files);
        this.acceptFiles(e.dataTransfer.files);
    }

    /**
     *
     * @param {HTMLInputElement} picker
     */
    onFilePickerChange(picker) {
        console.info("Files: %o", picker.files);
        this.acceptFiles(picker.files);
    }

    /**
     *
     * @param {FileList} fileList
     */
    acceptFiles(fileList) {
        console.info("Files are accepted.");
        let allPromises = [];
        for (let i = 0; i < fileList.length; ++i) {
            if (fileList[i].size > (100 * 1024)) {
                console.error("File %s is more than 100KB in size. Disregarding.", fileList[i].name);
                continue;
            }

            // We'll try to read all of the files at the same time. What could possibly go wrong?
            let readerPromise = fileList[i].text();
            allPromises.push(readerPromise);
            readerPromise.then(t => {
                this._app.feedSave(fileList[i].name, t);
            }).catch(e => {
                console.error("File reader failed! %s", e);
            });
        }

        Promise.allSettled(allPromises).then(p => {
            this.buildDataset();
        });
    }

    buildDataset() {
        let tf = new SaveProcessor(this._app.saveGames, {});
        tf.transform().then((datas) => {
            this.renderDataset(datas);
        });
    }

    arrayGetMinObjectValue(arr, key, getMax) {
        return arr.reduce(getMax ? (p, c) => {
            if (p < c[key]) {
                return c[key];
            }
            return p;
        } : (p, c) => {
            if (p > c[key]) {
                return c[key];
            }
            return p;
        }, getMax ? -Infinity : Infinity);
    }

    renderDataset(datas) {
        console.info("Rendering this: %o", datas);
        let chart = document.getElementById("chart");
        let context = chart.getContext("2d");

        let values = Array.from(datas.values());

        let lowestPlatonic = this.arrayGetMinObjectValue(values, "bestWowPlatonicCubesPerSecond");
        let highestPlatonic = this.arrayGetMinObjectValue(values, "bestWowPlatonicCubesPerSecond", true);
        let lowestHypercube = this.arrayGetMinObjectValue(values, "bestWowHypercubesPerSecond");
        let highestHypercube = this.arrayGetMinObjectValue(values, "bestWowHypercubesPerSecond", true);

        let axisMin = Math.min(lowestHypercube, lowestPlatonic * 10);
        let axisMax = Math.max(highestHypercube, highestPlatonic * 10);

        console.info("Axis stuff %s %s", axisMin, axisMax);

        let chartConfig = {
            type: "line",
            options: {
                scales: {
                    yAxes: [
                        {
                            id: "wowPlatonicCubesAxis",
                            scaleLabel: {
                                display: true,
                                labelString: "Platonics/s",
                            },
                            ticks: {
                                suggestedMin: axisMin / 10,
                                suggestedMax: axisMax / 10,
                            },
                        },
                        {
                            id: "wowHypercubesAxis",
                            scaleLabel: {
                                display: true,
                                labelString: "Hypercubes/s",
                            },
                            ticks: {
                                suggestedMin: axisMin,
                                suggestedMax: axisMax,
                            },
                        }
                    ]
                }
            },
            data: {
                labels: Array.from(datas.keys()),
                datasets: [
                    {
                        label: "Best Platonic Cubes per Second",
                        data: values.map(facts => facts.bestWowPlatonicCubesPerSecond),
                        borderColor: 'lightgoldenrodyellow',
                        fill: false,
                        yAxisID: "wowPlatonicCubesAxis",
                    },
                    {
                        label: "Best Wow! Hypercubes per Second",
                        data: values.map(facts => facts.bestWowHypercubesPerSecond),
                        borderColor: 'crimson',
                        fill: false,
                        yAxisID: "wowHypercubesAxis",
                    },
                ]
            }
        };
        // do absolutely nothing with it because it's useless, but maybe it's useful to keep around for debugging
        window.chartObj = new Chart(context, chartConfig);
        window.renderedData = datas;
    }
}

window.graphApp = new GraphApp();
window.graphAppUi = new GraphAppUi(graphApp);
