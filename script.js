let translations = {}; // Stores translation data
let units = {}; // Stores unit data
let selectedLang = localStorage.getItem("selectedLanguage") || "en";
let selectedUnitType = "length"; // Default unit type

let currencyData = {};

async function loadCurrencies() {
    try {
        let response = await fetch("currencies.json");
        if (!response.ok) throw new Error("Failed to load currencies.json");

        currencyData = await response.json();
    } catch (error) {
        console.error("Error loading currencies:", error);
    }
}

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

const currencyAPIKey = "2068983c972db65eaebd7c9f"; // Replace with your actual API key

async function loadCurrencyRates() {
    let lastFetchTime = localStorage.getItem("lastCurrencyFetch");
    let currentTime = Date.now();
    let timeDifference = (currentTime - lastFetchTime) / (1000 * 60 * 60); // Convert milliseconds to hours

    // Only fetch new rates if 12+ hours have passed since the last API call
    if (!lastFetchTime || timeDifference >= 12) {
        try {
            let response = await fetch(`https://v6.exchangerate-api.com/v6/${currencyAPIKey}/latest/USD`);
            if (!response.ok) throw new Error("Failed to load currency rates");

            let data = await response.json();
            localStorage.setItem("currencyRates", JSON.stringify(data.conversion_rates));
            localStorage.setItem("lastCurrencyFetch", currentTime); // Update last fetch time
        } catch (error) {
            console.error("Error fetching currency rates:", error);
        }
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
    document.querySelector(`button[onclick="switchTab('currency')"]`).innerText = translations[selectedLang].currency;
}

// Function to switch tabs
function switchTab(unitType) {
    selectedUnitType = unitType;

    document.querySelectorAll(".tab-button").forEach(button => {
        button.classList.remove("active");
    });
    document.querySelector(`button[onclick="switchTab('${unitType}')"]`).classList.add("active");

    populateUnits();

    // Load exchange rates ONLY IF the user selects the currency tab
    if (unitType === "currency") {
        loadCurrencyRates(); // Calls API only if needed
    }

    document.getElementById("result").innerText = ""; // Clear result when switching
}

// Populate unit dropdowns
async function populateUnits() {
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

    if (selectedUnitType === "currency") {
        // 🔹 Ensure currency data is properly loaded
        if (!currencyData || Object.keys(currencyData).length === 0) {
            console.error("Currency data is not loaded.");
            return;
        }

        Object.keys(currencyData).forEach(currencyCode => {
            let currencyInfo = currencyData[currencyCode];
            if (!currencyInfo || !currencyInfo.name) return;

            let currencyName = currencyInfo.name[selectedLang] || currencyInfo.name["en"];
            let currencySymbol = currencyInfo.symbol;
            let displayText = `${currencyCode} - ${currencyName} (${currencySymbol})`;

            let option1 = new Option(displayText, currencyCode);
            let option2 = new Option(displayText, currencyCode);
            fromUnit.add(option1);
            toUnit.add(option2);
        });
    } else {
        // 🔹 Ensure unit data is properly loaded
        if (!units[selectedUnitType] || Object.keys(units[selectedUnitType]).length === 0) {
            console.error("Unit data is not loaded for", selectedUnitType);
            return;
        }

        Object.keys(units[selectedUnitType]).forEach(unit => {
            let unitName = translations[selectedLang]?.units?.[selectedUnitType]?.[unit] || unit;
            let option1 = new Option(unitName, unit);
            let option2 = new Option(unitName, unit);
            fromUnit.add(option1);
            toUnit.add(option2);
        });
    }
}

// Function to perform conversion
function convert() {
    let inputValue = parseFloat(document.getElementById("input-value").value);
    let fromUnit = document.getElementById("from-unit").value;
    let toUnit = document.getElementById("to-unit").value;

    if (!fromUnit || !toUnit) {
        document.getElementById("result").innerText = translations[selectedLang].makeSelection;
        return;
    }

    if (isNaN(inputValue)) {
        document.getElementById("result").innerText = "Please enter a valid number.";
        return;
    }

    let result;

    if (selectedUnitType === "currency") {
        let rates = JSON.parse(localStorage.getItem("currencyRates")) || {};
        if (!rates[fromUnit] || !rates[toUnit]) {
            document.getElementById("result").innerText = "Exchange rates unavailable.";
            return;
        }

        result = (inputValue / rates[fromUnit]) * rates[toUnit];

        let fromCurrencyName = currencyData[fromUnit]?.name[selectedLang] || currencyData[fromUnit]?.name["en"] || fromUnit;
        let toCurrencyName = currencyData[toUnit]?.name[selectedLang] || currencyData[toUnit]?.name["en"] || toUnit;
        let isEqualToText = translations[selectedLang]?.isEqualTo || translations["en"].isEqualTo;

        // 🔹 Get Current Date, Time, and Timezone
        let now = new Date();
        let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Get system timezone
        let timestamp = now.toLocaleString(selectedLang, { dateStyle: "short", timeStyle: "short" });

        document.getElementById("result").innerHTML = 
            `${inputValue} ${fromCurrencyName} ${isEqualToText} ${result.toFixed(2)} ${toCurrencyName} <br>
            <small>${timestamp} (${timezone})</small>`;
        return;
    } else if (selectedUnitType === "temperature") {
        result = convertTemperature(inputValue, fromUnit, toUnit);
    } else {
        result = (inputValue / units[selectedUnitType][fromUnit]) * units[selectedUnitType][toUnit];
    }

    if (selectedUnitType !== "currency") {
        let formattedResult = result % 1 === 0 ? result.toFixed(0) : result.toFixed(2);
        document.getElementById("result").innerText = `${translations[selectedLang].result} ${formattedResult} ${toUnit}`;
    }
}

// Temperature conversion logic
// function convertTemperature(value) {
//     if (!units || !units[selectedLang] || !units[selectedLang].temperature || !units["en"].temperature) {
//         console.error("Temperature unit data is missing.");
//         return NaN; // Prevents breaking the app
//     }

//     let tempUnits = units[selectedLang].temperature; // Get translated temperature units
//     let tempUnitsEn = units["en"].temperature; // Get English temperature units

//     // 🔹 Fetch selected units directly from index.html dropdowns
//     let fromUnit = document.getElementById("from-unit").value;
//     let toUnit = document.getElementById("to-unit").value;

//     // 🔹 Map translated unit names to their English equivalents
//     let fromEnglish = Object.keys(tempUnitsEn).find(key => tempUnits[key] === fromUnit) || fromUnit;
//     let toEnglish = Object.keys(tempUnitsEn).find(key => tempUnits[key] === toUnit) || toUnit;

//     if (fromEnglish === toEnglish) return value; // If both are the same, return the input value

//     // 🔹 Perform temperature conversion
//     if (fromEnglish === "Celsius" && toEnglish === "Fahrenheit") return (value * 9 / 5) + 32;
//     if (fromEnglish === "Celsius" && toEnglish === "Kelvin") return value + 273.15;
//     if (fromEnglish === "Fahrenheit" && toEnglish === "Celsius") return (value - 32) * 5 / 9;
//     if (fromEnglish === "Fahrenheit" && toEnglish === "Kelvin") return (value - 32) * 5 / 9 + 273.15;
//     if (fromEnglish === "Kelvin" && toEnglish === "Celsius") return value - 273.15;
//     if (fromEnglish === "Kelvin" && toEnglish === "Fahrenheit") return (value - 273.15) * 9 / 5 + 32;

//     return NaN; // Ensure a valid number is always returned
// }
function convertTemperature(value) {
    // 🔹 Get user-selected units
    let fromUnit = document.getElementById("from-unit").value;
    let toUnit = document.getElementById("to-unit").value;

    // 🔹 Ensure `units.json` is fully loaded and temperature data exists
    if (!units || !units[selectedLang] || !units[selectedLang].temperature || !units["en"] || !units["en"].temperature) {
        console.error("Temperature unit data is missing.");
        return NaN;
    }

    let tempUnits = units[selectedLang].temperature; // 🔹 Get temperature units in the selected language
    let tempUnitsEn = units["en"].temperature; // 🔹 Get temperature units in English

    console.log("Selected Language:", selectedLang);
    console.log("Available Temperature Units:", tempUnits);
    console.log("Available English Temperature Units:", tempUnitsEn);
    console.log("From Unit:", fromUnit);
    console.log("To Unit:", toUnit);

    // 🔹 Convert translated unit names to English
    let fromEnglish = Object.keys(tempUnitsEn).find(key => tempUnits[selectedLang].temperature[key] === fromUnit) || fromUnit;
    let toEnglish = Object.keys(tempUnitsEn).find(key => tempUnits[selectedLang].temperature[key] === toUnit) || toUnit;

    console.log("Mapped From Unit to English:", fromEnglish);
    console.log("Mapped To Unit to English:", toEnglish);

    if (fromEnglish === toEnglish) return value; // If both are the same, return the input value

    // 🔹 Perform temperature conversion
    if (fromEnglish === "Celsius" && toEnglish === "Fahrenheit") return (value * 9 / 5) + 32;
    if (fromEnglish === "Celsius" && toEnglish === "Kelvin") return value + 273.15;
    if (fromEnglish === "Fahrenheit" && toEnglish === "Celsius") return (value - 32) * 5 / 9;
    if (fromEnglish === "Fahrenheit" && toEnglish === "Kelvin") return (value - 32) * 5 / 9 + 273.15;
    if (fromEnglish === "Kelvin" && toEnglish === "Celsius") return value - 273.15;
    if (fromEnglish === "Kelvin" && toEnglish === "Fahrenheit") return (value - 273.15) * 9 / 5 + 32;

    return NaN; // Ensure a valid number is always returned
}

function convertCurrency() {
    let amount = parseFloat(document.getElementById("input-value").value);
    let fromCurrency = document.getElementById("from-unit").value;
    let toCurrency = document.getElementById("to-unit").value;

    if (!amount || !fromCurrency || !toCurrency) {
        document.getElementById("result").innerText = "Please enter a valid amount and select currencies.";
        return;
    }

    let rates = JSON.parse(localStorage.getItem("currencyRates")) || {};

    if (!rates[fromCurrency] || !rates[toCurrency]) {
        document.getElementById("result").innerText = "Exchange rates unavailable. Try again later.";
        return;
    }

    let convertedAmount = (amount / rates[fromCurrency]) * rates[toCurrency];

    let fromCurrencyName = currencyData[fromCurrency]?.name || fromCurrency;
    let toCurrencyName = currencyData[toCurrency]?.name || toCurrency;

    document.getElementById("result").innerText = 
        `${amount} ${fromCurrencyName} is equal to ${convertedAmount.toFixed(2)} ${toCurrencyName}`;
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

    let tempValue = fromUnit.value;
    fromUnit.value = toUnit.value;
    toUnit.value = tempValue;
}

// Load everything on page load
document.addEventListener("DOMContentLoaded", async () => {
    await loadTranslations();
    await loadUnits(); // 🔹 Ensure unit data is loaded
    await loadCurrencies();
    document.getElementById("language-selector").value = selectedLang;
    updateUI();
    populateUnits();
});

