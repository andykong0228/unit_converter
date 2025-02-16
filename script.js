let translations = {}; // Stores translation data
let units = {}; // Stores unit data
let selectedLang = localStorage.getItem("selectedLanguage") || "en";
let selectedUnitType = "length"; // Default unit type

// Load translations dynamically from translations.json
async function loadTranslations() {
    try {
        let response = await fetch("translations.json");
        if (!response.ok) throw new Error("Failed to load translations.json");

        translations = await response.json();
        updateUI(); // Update UI after loading translations
    } catch (error) {
        console.error("Error loading translations:", error);
    }
}

// Load units dynamically from units.json
async function loadUnits() {
    try {
        let response = await fetch("units.json");
        if (!response.ok) throw new Error("Failed to load units.json");

        let data = await response.json();
        units = data[selectedLang] || {}; // Load the units for the selected language
        populateUnits(); // Populate dropdowns after loading units
    } catch (error) {
        console.error("Error loading units:", error);
    }
}

// Function to update UI elements based on the selected language
function updateUI() {
    if (!translations[selectedLang]) return;

    document.querySelector("h2").innerText = translations[selectedLang].title;
    document.querySelector("label[for='input-value']").innerText = translations[selectedLang].enterValue;
    document.querySelector("label[for='from-unit']").innerText = translations[selectedLang].from;
    document.querySelector("label[for='to-unit']").innerText = translations[selectedLang].to;
    document.querySelector("button").innerText = translations[selectedLang].convert;
    document.querySelector("label[for='language-selector']").innerText = translations[selectedLang].selectLanguage;

    // Update placeholder text dynamically
    document.getElementById("input-value").placeholder = translations[selectedLang].placeholder;

    // Update tab labels dynamically
    document.querySelector(`button[onclick="switchTab('length')"]`).innerText = translations[selectedLang].length;
    document.querySelector(`button[onclick="switchTab('weight')"]`).innerText = translations[selectedLang].weight;
    document.querySelector(`button[onclick="switchTab('temperature')"]`).innerText = translations[selectedLang].temperature;
    document.querySelector(`button[onclick="switchTab('speed')"]`).innerText = translations[selectedLang].speed;
    document.querySelector(`button[onclick="switchTab('area')"]`).innerText = translations[selectedLang].area;
    document.querySelector(`button[onclick="switchTab('volume')"]`).innerText = translations[selectedLang].volume;
}


// Function to switch tabs
function switchTab(unitType) {
    selectedUnitType = unitType;

    // Remove active class from all buttons, then add to the selected tab
    document.querySelectorAll(".tab-button").forEach(button => {
        button.classList.remove("active");
    });
    document.querySelector(`button[onclick="switchTab('${unitType}')"]`).classList.add("active");

    // Populate dropdowns for the new unit type
    populateUnits();

    // Clear the input field and result every time the user switches tabs
    document.getElementById("input-value").value = "";
    document.getElementById("result").innerText = "";
}


// Populate unit dropdowns
function populateUnits() {
    let fromUnit = document.getElementById("from-unit");
    let toUnit = document.getElementById("to-unit");

    fromUnit.innerHTML = "";
    toUnit.innerHTML = "";

    let defaultOption1 = new Option(translations[selectedLang].makeSelection, "", true, true);
    let defaultOption2 = new Option(translations[selectedLang].makeSelection, "", true, true);
    defaultOption1.disabled = true;
    defaultOption2.disabled = true;
    fromUnit.add(defaultOption1);
    toUnit.add(defaultOption2);

    // Populate dropdowns with translated unit names
    Object.keys(units[selectedUnitType] || {}).forEach(unit => {
        let option1 = new Option(unit, unit);
        let option2 = new Option(unit, unit);
        fromUnit.add(option1);
        toUnit.add(option2);
    });
}

// Function to perform conversion
function convert() {
    let inputValue = parseFloat(document.getElementById("input-value").value);
    let fromUnit = document.getElementById("from-unit").value;
    let toUnit = document.getElementById("to-unit").value;

    if (fromUnit === "" || toUnit === "") {
        document.getElementById("result").innerText = translations[selectedLang].makeSelection;
        return;
    }

    if (isNaN(inputValue)) {
        document.getElementById("result").innerText = "Please enter a valid number.";
        return;
    }

    let result;
    
    if (selectedUnitType === "temperature") {
        result = convertTemperature(inputValue, fromUnit, toUnit);
    } else {
        result = (inputValue / units[selectedUnitType][fromUnit]) * units[selectedUnitType][toUnit];
    }

    // Determine how many decimals to display dynamically
    let formattedResult = result % 1 === 0 ? result.toFixed(0) : result.toFixed(4);

    document.getElementById("result").innerText = `${translations[selectedLang].result} ${formattedResult} ${toUnit}`;
}

// Temperature conversion logic
function convertTemperature(value, from, to) {
    if (from === to) return value;

    if (from === "Celsius" && to === "Fahrenheit") return (value * 9 / 5) + 32;
    if (from === "Celsius" && to === "Kelvin") return value + 273.15;
    if (from === "Fahrenheit" && to === "Celsius") return (value - 32) * 5 / 9;
    if (from === "Fahrenheit" && to === "Kelvin") return (value - 32) * 5 / 9 + 273.15;
    if (from === "Kelvin" && to === "Celsius") return value - 273.15;
    if (from === "Kelvin" && to === "Fahrenheit") return (value - 273.15) * 9 / 5 + 32;
}

// Function to change language and reload translations
async function changeLanguage() {
    selectedLang = document.getElementById("language-selector").value;
    localStorage.setItem("selectedLanguage", selectedLang);

    await loadTranslations(); // Reload translations
    await loadUnits(); // Reload units for the selected language
    updateUI();
}

function reverseUnits() {
    let fromUnit = document.getElementById("from-unit");
    let toUnit = document.getElementById("to-unit");

    // Swap values
    let tempValue = fromUnit.value;
    fromUnit.value = toUnit.value;
    toUnit.value = tempValue;
}

// Load everything on page load
document.addEventListener("DOMContentLoaded", async () => {
    await loadTranslations(); // Load translations before UI updates
    await loadUnits(); // Load units before populating dropdowns
    document.getElementById("language-selector").value = selectedLang;
    updateUI();
});

