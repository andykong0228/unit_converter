// Unit conversion factors
const units = {
    length: {
        "Meters": 1,
        "Kilometers": 0.001,
        "Centimeters": 100,
        "Millimeters": 1000,
        "Miles": 0.000621371,
        "Yards": 1.09361,
        "Feet": 3.28084,
        "Inches": 39.3701
    },
    weight: {
        "Kilograms": 1,
        "Grams": 1000,
        "Pounds": 2.20462,
        "Ounces": 35.274
    },
    temperature: {
        "Celsius": 1,
        "Fahrenheit": 1,
        "Kelvin": 1
    },
    speed: {
        "Meters per second": 1,
        "Kilometers per hour": 3.6,
        "Miles per hour": 2.23694,
        "Feet per second": 3.28084,
        "Knots": 1.94384
    },
    area: {
        "Square meters": 1,
        "Square kilometers": 0.000001,
        "Square centimeters": 10000,
        "Square millimeters": 1000000,
        "Square miles": 3.861e-7,
        "Square yards": 1.19599,
        "Square feet": 10.7639,
        "Square inches": 1550.003
    },
    volume: {
        "Liters": 1,
        "Milliliters": 1000,
        "Cubic meters": 0.001,
        "Cubic centimeters": 1000,
        "Cubic inches": 61.0237,
        "Cubic feet": 0.0353147,
        "Gallons (US)": 0.264172,
        "Gallons (UK)": 0.219969
    }
};

// Track the selected unit type (default: Length)
let selectedUnitType = "length";

// Function to switch tabs
function switchTab(unitType) {
    selectedUnitType = unitType;

    // Update active tab styling
    document.querySelectorAll(".tab-button").forEach(button => {
        button.classList.remove("active");
    });
    document.querySelector(`button[onclick="switchTab('${unitType}')"]`).classList.add("active");

    // Populate the unit dropdowns based on selected unit type
    populateUnits();
}

// Populate unit dropdowns
function populateUnits() {
    let fromUnit = document.getElementById("from-unit");
    let toUnit = document.getElementById("to-unit");

    fromUnit.innerHTML = "";
    toUnit.innerHTML = "";

    // Add default "Make a selection" option
    let defaultOption1 = new Option("Make a selection", "", true, true);
    let defaultOption2 = new Option("Make a selection", "", true, true);
    defaultOption1.disabled = true;
    defaultOption2.disabled = true;
    fromUnit.add(defaultOption1);
    toUnit.add(defaultOption2);

    Object.keys(units[selectedUnitType]).forEach(unit => {
        let option1 = new Option(unit, unit);
        let option2 = new Option(unit, unit);
        fromUnit.add(option1);
        toUnit.add(option2);
    });
}

// Conversion logic
function convert() {
    let inputValue = parseFloat(document.getElementById("input-value").value);
    let fromUnit = document.getElementById("from-unit").value;
    let toUnit = document.getElementById("to-unit").value;

    // Prevent conversion if user hasn't selected valid units
    if (fromUnit === "" || toUnit === "") {
        document.getElementById("result").innerText = "Please select both units.";
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

    document.getElementById("result").innerText = `Result: ${result.toFixed(2)} ${toUnit}`;
}

// Temperature conversion
function convertTemperature(value, from, to) {
    if (from === to) return value;

    if (from === "Celsius" && to === "Fahrenheit") return (value * 9 / 5) + 32;
    if (from === "Celsius" && to === "Kelvin") return value + 273.15;
    if (from === "Fahrenheit" && to === "Celsius") return (value - 32) * 5 / 9;
    if (from === "Fahrenheit" && to === "Kelvin") return (value - 32) * 5 / 9 + 273.15;
    if (from === "Kelvin" && to === "Celsius") return value - 273.15;
    if (from === "Kelvin" && to === "Fahrenheit") return (value - 273.15) * 9 / 5 + 32;
}

// Initialize unit options on page load
populateUnits();
