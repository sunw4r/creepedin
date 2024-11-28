let autoscrollActive = false;

function removeAccentsAndSpecialChars(str) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z\s]/g, "");
}

// Remove special characters from a string
function removeSpecialContent(text) {
    // Remove text enclosed in parentheses
    text = text.replace(/\([^)]*\)/g, "");

    // Remove text enclosed in square brackets
    text = text.replace(/\[[^\]]*\]/g, "");

    // Remove text enclosed in curly braces
    text = text.replace(/\{[^}]*\}/g, "");

    // Remove suffix starting with comma or vertical bar
    text = text.replace(/[,|].*$/, "");

    // Remove emojis using a regex (this may not catch all emojis)
    text = text.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "");

    return text;
}

// Remove duplicated spaces
function removeExtraSpaces(text) {
    return text.replace(/\s{2,}/g, " ");
}

// Remove special characters from a string
function sanitizeFullName(fullName) {
    let sanitized = removeSpecialContent(fullName.toLowerCase());
    sanitized = removeAccentsAndSpecialChars(sanitized);
    sanitized = removeExtraSpaces(sanitized);
    return sanitized.trim();
}

// Remove duplicates from an array
function removeDuplicatesFromArray(array) {
    // Create a Set from the array to automatically remove duplicates
    const uniqueSet = new Set(array);

    // Convert the Set to an array and sort it
    const uniqueArray = Array.from(uniqueSet).sort();

    return uniqueArray;
}

// Format names using the selected patterns
function formatNames(namesArray, formatPatterns, domain = "") {
    const formattedNames = [];

    for (const fullName of namesArray) {
        if (!fullName || fullName.trim() === "") {
            console.error("empty name.");
            continue;
        }

        const cleanName = sanitizeFullName(fullName);
        const nameParts = cleanName.trim().split(" ");

        if (nameParts.length < 2) {
            console.error(`incomplete name: ${fullName}`);
            continue;
        }

        let firstName = nameParts[0];
        let secondName = nameParts.length > 2 ? nameParts[1] : "";
        let lastName = nameParts[nameParts.length - 1];

        for (const formatPattern of formatPatterns) {
            let formattedName = formatPattern
                .replace("{domain}", domain)
                .replace("{firstname}", firstName)
                .replace("{secondname}", secondName)
                .replace("{lastname}", lastName)
                .replace("{firstname_firstletter}", firstName.charAt(0))
                .replace(
                    "{secondname_firstletter}",
                    secondName ? secondName.charAt(0) : ""
                )
                .replace("{lastname_firstletter}", lastName.charAt(0));
            // Skip if the formatted name is empty or invalid
            if (formattedName.trim() === "" || formattedName[0] === "@") {
                continue;
            }
            formattedNames.push(formattedName);
        }
    }

    return removeDuplicatesFromArray(formattedNames);
}

function updateList() {
    chrome.storage.local.get("dataList", (data) => {
        if (data.dataList) {
            dataField.value = data.dataList.join("\n");
        }
    });
}

// Get patterns from the checkboxes and the custom pattern field
function getPatternList() {
    const selectedPatterns = []; // Store selected patterns here

    // Loop through the pattern checkboxes
    document
        .querySelectorAll(".pattern-checkbox:not(#selectAll)")
        .forEach((checkbox) => {
            if (checkbox.checked) {
                // Get the corresponding label's text (pattern)
                const label = checkbox.parentElement;
                selectedPatterns.push(label.textContent.trim());
            }
        });

    // Get the custom pattern from the input field
    const customPattern = document.getElementById("patternField").value.trim();

    // Add the custom pattern to the list if it's not empty
    if (customPattern) {
        selectedPatterns.push(customPattern);
    }

    return selectedPatterns;
}

//If popup is open, update realtime
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "DOM_MUTATION") {
        updateList();
    }
});

//If popup is closed, update on open
document.addEventListener("DOMContentLoaded", () => {
    const dataField = document.getElementById("dataField");
    const textPattern = document.getElementById("patternField");
    const textDomain = document.getElementById("domainField");
    const exportButton = document.getElementById("exportButton");
    const clearButton = document.getElementById("clearButton");
    // Get references to the "Select All" checkbox and all pattern checkboxes
    const selectAllCheckbox = document.querySelector("#selectAll");
    const patternCheckboxes = document.querySelectorAll(
        ".pattern-checkbox:not(#selectAll)"
    );
    // Get reference to the AutoScroll button
    const autoscrollButton = document.getElementById("autoscrollButton");

    // Function to check/uncheck all pattern checkboxes based on "Select All" state
    function toggleSelectAll() {
        const patternCheckboxes = document.querySelectorAll(
            ".pattern-checkbox:not(#selectAll)"
        );
        patternCheckboxes.forEach((checkbox) => {
            checkbox.checked = selectAllCheckbox.checked;
            const label = checkbox.parentElement;
            if (checkbox.checked) {
                label.classList.add("checked");
            } else {
                label.classList.remove("checked");
            }
            // Update chrome storage
            chrome.storage.local.set({ [checkbox.id]: checkbox.checked });
        });
    }

    // Function to verify if all pattern checkboxes are checked
    function areAllChecked() {
        let allChecked = true;
        patternCheckboxes.forEach((checkbox) => {
            if (!checkbox.checked) {
                allChecked = false;
            }
        });
        return allChecked;
    }

    // Restore the previous state of user's choices
    chrome.storage.local.get(null, (data) => {
        if (data.domain) {
            textDomain.value = data.domain;
        }
        if (data.customPattern) {
            textPattern.value = data.customPattern;
        }
        if (data.selectAll) {
            selectAllCheckbox.checked = data.selectAll;
        }
        patternCheckboxes.forEach((checkbox) => {
            if (data[checkbox.id]) {
                checkbox.checked = data[checkbox.id];
                const label = checkbox.parentElement;
                if (checkbox.checked) {
                    label.classList.add("checked");
                } else {
                    label.classList.remove("checked");
                }
            }
        });
        if (data.autoscroll) {
            autoscrollActive = data.autoscroll;
            autoscrollButton.classList.add("autoscroll-on");
            autoscrollButton.textContent = "Autoscroll ON";
        }
    });

    updateList();

    exportButton.addEventListener("click", () => {
        let formattedNames = formatNames(
            dataField.value.split("\n"),
            getPatternList(),
            textDomain.value
        );
        const blob = new Blob([formattedNames.join("\n")], {
            type: "text/plain;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "exported-creepedin.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    clearButton.addEventListener("click", () => {
        dataField.value = "";
        chrome.storage.local.clear(() => {
            console.log("CreepedIn Storage cleared");
        });
    });

    // Add a click event listener to the "Select All" checkbox
    selectAllCheckbox.addEventListener("click", toggleSelectAll);

    // Add event listener to all checkboxes on pattern field
    patternCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", function () {
            const label = this.parentElement;
            if (this.checked) {
                label.classList.add("checked");
                if (areAllChecked()) {
                    selectAllCheckbox.checked = true;
                    // Update chrome storage
                    chrome.storage.local.set({ selectAll: true });
                }
            } else {
                label.classList.remove("checked");
                selectAllCheckbox.checked = false;
                // Update chrome storage
                chrome.storage.local.set({ selectAll: false });
            }
        });
    });

    // Add event listener to the AutoScroll button
    autoscrollButton.addEventListener("click", () => {
        // Toggle autoscroll state
        autoscrollActive = !autoscrollActive;

        // Update button style and text
        if (autoscrollActive) {
            autoscrollButton.classList.add("autoscroll-on");
            autoscrollButton.textContent = "Autoscroll ON";
            chrome.storage.local.set({ autoscroll: true });
        } else {
            autoscrollButton.classList.remove("autoscroll-on");
            autoscrollButton.textContent = "Autoscroll OFF";
            chrome.storage.local.set({ autoscroll: false });
        }

        // Send message to background script
        chrome.runtime.sendMessage({
            type: "TOGGLE_AUTOSCROLL",
            active: autoscrollActive,
        });
    });
});

// Update chrome storage when input is changed
document.addEventListener("input", (event) => {
    const target = event.target;

    if (target.matches("#patternField")) {
        chrome.storage.local.set({ customPattern: target.value.trim() });
    } else if (target.matches("#domainField")) {
        chrome.storage.local.set({ domain: target.value.trim() });
    }
});

// Update chrome storage when any checkbox is changed
document.addEventListener("change", (event) => {
    const target = event.target;

    if (target.matches("#selectAll")) {
        chrome.storage.local.set({ selectAll: target.checked });
    } else if (target.matches(".pattern-checkbox")) {
        chrome.storage.local.set({ [target.id]: target.checked });
    }
});
