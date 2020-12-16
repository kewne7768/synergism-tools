"use strict";

function fieldToNumeric(field, def = 0) {
    let val;
    let text = field.value ? field.value.replace(/,/g, "") : "0";
    if (text && text.match(/[0-9]+e[0-9]+/)) {
        val = parseFloat(text);
    } else {
        val = parseInt(text, 10);
    }
    return isNaN(val) || !isFinite(val) ? def : val;
}

function tomeQuarkCost(level) {
    let cost = 0;
    level = Math.max(0, level);
    level = Math.min(15, level);
    while (level-- > 0) {
        cost += 500 + (level * 250);
    }
    return cost;
}

function onUpdate() {
    renderTable();

    let shopTomeField = document.querySelector("[name=shopTome]");
    document.getElementById("shopTomeQuarkCost").textContent = tomeQuarkCost(fieldToNumeric(shopTomeField)).toString();
    let c15Field = document.querySelector("[name=c15]");
    document.getElementById("c15RewardPct").textContent = format((1 - c15rewardreincmultiplier(fieldToNumeric(c15Field))) * 100, 4, true);

    saveStuff();
}

function getHorizontals(fieldType, baseValues) {
    switch (fieldType) {
        case "shopTome":
            return {shopTome: [0, 15]};
        case "plat8":
            return {plat8: [0, 1, 2, 3, 4, 5]};
        case "targetLevel":
            let levels = [1];
            for (let cur = baseValues.targetLevel - 2; cur <= baseValues.targetLevel + 2; ++cur) {
                if (cur > 1 && cur <= 80) {
                    levels.push(cur);
                }
            }
            return {targetLevel: levels};
        default:
            return {Cost: ["For selected"]};
    }
}

function renderTable() {
    let c15Field = document.querySelector("[name=c15]");
    let plat8Field = document.querySelector("[name=plat8]");
    let shopTomeField = document.querySelector("[name=shopTome]");
    let researchesField = document.querySelector("[name=researches]");
    let targetLevelField = document.querySelector("[name=targetLevel]");
    let plotHorizontalField = document.querySelector("[name=plotHorizontal]");

    let baseValues = {
        c15: fieldToNumeric(c15Field),
        plat8: fieldToNumeric(plat8Field),
        shopTome: fieldToNumeric(shopTomeField),
        researches: fieldToNumeric(researchesField),
        targetLevel: fieldToNumeric(targetLevelField),
    };

    let horizontal = getHorizontals(plotHorizontalField.value, baseValues);
    let horizontalKey = Object.keys(horizontal)[0];
    let horizontalValues = horizontal[horizontalKey];

    let table = document.querySelector("#resultTable");
    let thead = table.querySelector("thead tr");
    thead.querySelectorAll(".rowScope").forEach(r => r.remove());
    for (let i = 0; i < horizontalValues.length; ++i) {
        let th = document.createElement("th");
        th.classList.add("rowScope");
        th.textContent = `${horizontalKey}: ${horizontalValues[i]}`;
        thead.appendChild(th);
    }

    let tbody = table.querySelector("tbody");
    tbody.innerHTML = "";

    for (let i = 0; i < hyperchallengedMultiplier.length; ++i) {
        let rowHtml = `<th scope="row">Hyperchallenged ${i}</th>`;
        for (let j = 0; j < horizontalValues.length; ++j) {
            let changed = {};
            changed[horizontalKey] = horizontalValues[j];
            let call = Object.assign({}, baseValues, changed);
            let cost = challengeRequirement(call.targetLevel, i, call.researches, call.shopTome, call.c15, call.plat8);
            rowHtml += `<td>${format(cost)}</td>`;
        }
        let frag = document.createElement("tr");
        frag.innerHTML = rowHtml;
        tbody.appendChild(frag);
    }
}

function loadStuff() {
    let jsonStuff = localStorage.getItem("synergismc10costs");
    if (jsonStuff !== null) {
        try {
            let json = JSON.parse(jsonStuff);
            document.querySelectorAll("input").forEach((tag) => {
                if (tag.name in json) {
                    tag.value = json[tag.name];
                }
            });
            document.querySelectorAll("select").forEach((tag) => {
                if (tag.name in json) {
                    let opt = tag.querySelector(`[value=${json[tag.name]}]`);
                    if (opt) {
                        tag.selectedIndex = opt.index;
                    }
                }
            });
        } catch (e) {
            // ignore bad json silently
        }
    }
}

function saveStuff() {
    let obj = {};
    let inputs = document.querySelectorAll("input,select");
    inputs.forEach((tag) => {
        if (tag.value) {
            obj[tag.name] = tag.value;
        }
    });
    localStorage.setItem("synergismc10costs", JSON.stringify(obj));
}
