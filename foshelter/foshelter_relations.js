"use strict";

// input is JSON.parse()d
function foshelterAscendants(save) {
    const dwellers = save.dwellers.dwellers;
    const dwellerNames = new Map;

    for (let i = dwellers.length - 1; i >= 0; i -= 1)
        dwellerNames.set(dwellers[i].serializeId, dwellers[i].name + (dwellers[i].lastName !== "" ? " " + dwellers[i].lastName : ""));

    const dwellerMap = [];

    for (let i = dwellers.length - 1; i >= 0; i -= 1) {
        let dweller = dwellers[i];

        let name = dwellerNames.get(dweller.serializeId);
        let asc = dweller.relations.ascendants.map(i => i !== -1 ? `"${dwellerNames.get(i)}"` : null);

        dwellerMap.push([name, {
            name: name,
            gender: dweller.gender,
            level: dweller.experience.currentLevel
        }, {
            parents: asc[0] === null ? [] : [asc[0], asc[1]],
            paternal_grandparents: asc[2] === null ? [] : [asc[2], asc[3]],
            maternal_grandparents: asc[4] === null ? [] : [asc[4], asc[5]]
        }]);
    }

    dwellerMap.sort();

    const ascendants = new Map;
    for (let i = 0; i < dwellerMap.length; i += 1) {
        let dweller = dwellerMap[i];

        ascendants.set(dweller[1], dweller[2]);
    }

    return ascendants;
}

function htmlRender(element, ascendants) {
    while (element.children.length > 1) {
        element.removeChild(element.lastElementChild);
    }

    const output = new DocumentFragment;

    ascendants.forEach((ascendants, dweller) => {
        let row = output.appendChild(document.createElement("tr"));

        row.appendChild(document.createElement("td")).innerText = dweller.name;
        row.appendChild(document.createElement("td")).innerText = dweller.gender === 1 ? "female" : "male";
        row.appendChild(document.createElement("td")).innerText = dweller.level;
        row.appendChild(document.createElement("td")).innerText = ascendants.parents.join(", ");
        row.appendChild(document.createElement("td")).innerText = ascendants.paternal_grandparents.join(", ");
        row.appendChild(document.createElement("td")).innerText = ascendants.maternal_grandparents.join(", ");
    });

    element.appendChild(output);
}

function decrypt(data) {
    // Fallout Shelter uses a static key and IV ... yes, you heard that right
    let cipher = sjcl.codec.base64.toBits(data);
    let plainBits = sjcl.mode.cbc.decrypt(new sjcl.cipher.aes([0xa7ca9f33, 0x66d892c2, 0xf0bef417, 0x341ca971, 0xb69ae9f7, 0xbacccffc, 0xf43c62d1, 0xd7d021f9]), cipher, sjcl.codec.hex.toBits("7475383967656A693334307438397532"));
    let json = sjcl.codec.utf8String.fromBits(plainBits);

    try {
        return JSON.parse(json)
    } catch (e) {
        throw "Corrupted save file"
    }
}

sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();