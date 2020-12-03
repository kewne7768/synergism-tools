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

function renderTable() {
    let c15Field = document.querySelector("[name=c15]");
    let plat8Field = document.querySelector("[name=plat8]");
    let shopTomeField = document.querySelector("[name=shopTome]");
    let researchesField = document.querySelector("[name=researches]");
    let targetLevelField = document.querySelector("[name=targetLevel]");

    let c15Value = fieldToNumeric(c15Field);
    let plat8Value = fieldToNumeric(plat8Field);
    let shopTomeValue = fieldToNumeric(shopTomeField);
    let researchesValue = fieldToNumeric(researchesField);
    let targetLevelValue = fieldToNumeric(targetLevelField);

    let table = document.querySelector("#resultTable tbody");
    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }

    for (let i = 0; i < hyperchallengedMultiplier.length; ++i) {
        let cost = challengeRequirement(targetLevelValue, i, researchesValue, shopTomeValue, c15Value, plat8Value);
        let rowHtml = `<th scope="row">Hyperchallenged ${i}</th><td>${format(cost)}</td>`;
        let frag = document.createElement("tr");
        frag.innerHTML = rowHtml;
        table.appendChild(frag);
    }
}

function loadStuff() {
    let jsonStuff = localStorage.getItem("synergismc10costs");
    if (jsonStuff !== null) {
        try {
            let json = JSON.parse(jsonStuff);
            let inputs = document.querySelectorAll("input");
            inputs.forEach((tag) => {
                if (tag.name in json) {
                    tag.value = json[tag.name];
                }
            });
        } catch (e) {
            // ignore bad json silently
        }
    }
}

function saveStuff() {
    let obj = {};
    let inputs = document.querySelectorAll("input");
    inputs.forEach((tag) => {
        if (tag.value) {
            obj[tag.name] = tag.value;
        }
    });
    localStorage.setItem("synergismc10costs", JSON.stringify(obj));
}
