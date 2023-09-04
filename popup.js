function removeAccentsAndSpecialChars(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z\s]/g, '');
}

function formatNames(namesArray, formatPattern) {

    const formattedNames = [];

    for (const fullName of namesArray) {
        if (!fullName || fullName.trim() === "") {
            console.error("empty name.");
            continue;
        }

        const cleanName = removeAccentsAndSpecialChars(fullName.toLowerCase());
        const nameParts = cleanName.trim().split(" ");

        if (nameParts.length < 2) {
            console.error(`incomplete name: ${fullName}`);
            continue;
        }

        let firstName = nameParts[0];
        let secondName = nameParts.length > 2 ? nameParts[1] : "";
        let lastName = nameParts[nameParts.length - 1];

        let formattedName = formatPattern
            .replace("{firstname}", firstName)
            .replace("{secondname}", secondName)
            .replace("{lastname}", lastName)
            .replace("{firstname_firstletter}", firstName.charAt(0))
            .replace("{secondname_firstletter}", secondName ? secondName.charAt(0) : "")
            .replace("{lastname_firstletter}", lastName.charAt(0));

        formattedNames.push(formattedName);
    }

    return formattedNames;
}

function updateList() {
    chrome.storage.local.get('dataList', data => {
        if (data.dataList) {
            dataField.value = data.dataList.join('\n');
        }
    });
}

//If popup is open, update realtime
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "DOM_MUTATION") {
        updateList();
    }
});

//If popup is closed, update on open
document.addEventListener('DOMContentLoaded', () => {

    const dataField = document.getElementById('dataField');
    const textPattern = document.getElementById('patternField');
    const exportButton = document.getElementById('exportButton');
    const clearButton = document.getElementById('clearButton');

    updateList();

    exportButton.addEventListener('click', () => {

        let formattedNames = formatNames(dataField.value.split('\n'), textPattern.value)

        const blob = new Blob([formattedNames.join('\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exported-creepedin.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    });

    clearButton.addEventListener('click', () => {

        dataField.value = "";
        chrome.storage.local.clear(() => {
            console.log('CreepedIn Storage cleared');
        });

    });

});