// Stuff in this file is copypasted more or less verbatim from the game
var hyperchallengedMultiplier = [1, 1.2, 1.5, 1.7, 3, 5, 8, 13, 21, 34, 55, 100, 400]


let numberFormatter = false;
if (window.BigInt && window.Intl && window.Intl.NumberFormat) {
    // Check if there's BigInt support + a browser that can sanely format BigInts (some versions of Chrome/Firefox can't).
    try {
        numberFormatter = new Intl.NumberFormat("en-US");
        if (!numberFormatter || numberFormatter.format(BigInt(1234)) !== "1,234") {
            numberFormatter = false;
        }
    } catch (e) {
        // Browser can't do it, leave numberFormatter set to false to fall back to regex code
        numberFormatter = false;
        console.log("Using slower number formatting code: browser failed self-test");
    }
} else {
    console.log("Using slower number formatting code: browser doesn't support necessary features");
}

function format(input, accuracy = 0, long = false) {
    let power;
    let mantissa;
    if (input instanceof Decimal) {
        // Gets power and mantissa if input is of type decimal
        power = input.e;
        mantissa = input.mantissa;
    } else if (typeof input === "number" && input !== 0) {
        // Gets power and mantissa if input is of type number and isnt 0
        power = Math.floor(Math.log10(Math.abs(input)));
        mantissa = input / Math.pow(10, power);
    } else {
        // If it isn't one of those two it isn't formattable, return 0
        return "0";
    }
    // This prevents numbers from jittering between two different powers by rounding errors
    if (mantissa > 9.9999999) {
        mantissa = 1;
        ++power;
    }
    if (mantissa < 1 && mantissa > 0.9999999) {
        mantissa = 1;
    }

    // If the power is less than 12 it's effectively 0
    if (power < -12) {
        return "0";
    } else if (power < 6 || (long && power < 13)) {
        // If the power is less than 6 or format long and less than 13 use standard formatting (123,456,789)
        // Gets the standard representation of the number, safe as power is guaranteed to be > -12 and < 13
        let standard = mantissa * Math.pow(10, power);
        // Rounds up if the number experiences a rounding error
        if (standard - Math.floor(standard) > 0.9999999) {
            standard = Math.ceil(standard);
        }
        // If the power is less than 1 or format long and less than 3 apply toFixed(accuracy) to get decimal places
        if ((power < 1 || (long && power < 3)) && accuracy > 0) {
            standard = standard.toFixed(accuracy);
        } else {
            // If it doesn't fit those criteria drop the decimal places
            standard = Math.floor(standard);
        }
        // Turn the number to string
        const standardString = standard.toString();
        // Split it on the decimal place
        const [front, back] = standardString.split('.');
        // Apply a number group 3 comma regex to the front
        const frontFormatted = numberFormatter
            ? numberFormatter.format(BigInt(front))
            : front.replace(/(\d)(?=(\d{3})+$)/g, "$1,");
        // if the back is undefined that means there are no decimals to display, return just the front
        if (back === undefined) {
            return frontFormatted;
        } else {
            // Else return the front.back
            return frontFormatted + "." + back;
        }
    } else if (power < 1e6) {
        // If the power is less than 1e6 then apply standard scientific notation
        // Makes mantissa be rounded down to 2 decimal places
        const mantissaLook = (Math.floor(mantissa * 100) / 100).toFixed(2);
        // Makes the power group 3 with commas
        const powerLook = numberFormatter
            ? numberFormatter.format(BigInt(power))
            : power.toString().replace(/(\d)(?=(\d{3})+$)/g, "$1,");
        // returns format (1.23e456,789)
        return mantissaLook + "e" + powerLook;
    } else if (power >= 1e6) {
        // if the power is greater than 1e6 apply notation scientific notation
        // Makes mantissa be rounded down to 2 decimal places
        let mantissaLook = Math.floor(mantissa * 100) / 100;
        // Makes mantissa be to 2 decimal places
        mantissaLook = mantissaLook.toFixed(2);
        mantissaLook = mantissaLook.toString();
        // Drops the power down to 4 digits total but never greater than 1000 in increments that equate to notations, (1234000 -> 1.234) ( 12340000 -> 12.34) (123400000 -> 123.4) (1234000000 -> 1.234)
        let powerDigits = Math.ceil(Math.log10(power));
        let powerFront = ((powerDigits - 1) % 3) + 1;
        let powerLook = power / Math.pow(10, powerDigits - powerFront);
        if (powerLook === 1000) {
            powerLook = 1;
            powerFront = 1;
        }
        powerLook = powerLook.toFixed(4 - powerFront);
        powerLook = powerLook.toString();
        // Return relevant notations alongside the "look" power based on what the power actually is
        if (power < 1e9) {
            return mantissaLook + "e" + powerLook + "M";
        }
        if (power < 1e12) {
            return mantissaLook + "e" + powerLook + "B";
        }
        if (power < 1e15) {
            return mantissaLook + "e" + powerLook + "T";
        }
        if (power < 1e18) {
            return mantissaLook + "e" + powerLook + "Qa";
        }
        if (power < 1e21) {
            return mantissaLook + "e" + powerLook + "Qi";
        }
        if (power < 1e24) {
            return mantissaLook + "e" + powerLook + "Sx";
        }
        if (power < 1e27) {
            return mantissaLook + "e" + powerLook + "Sp";
        }
        if (power < 1e30) {
            return mantissaLook + "e" + powerLook + "Oc";
        }
        if (power < 1e33) {
            return mantissaLook + "e" + powerLook + "No";
        }
        if (power < 1e36) {
            return mantissaLook + "e" + powerLook + "Dc";
        }
        if (power < 1e39) {
            return mantissaLook + "e" + powerLook + "UDc";
        }
        if (power < 1e42) {
            return mantissaLook + "e" + powerLook + "DDc";
        }
        if (power < 1e45) {
            return mantissaLook + "e" + powerLook + "TDc";
        }
        if (power < 1e48) {
            return mantissaLook + "e" + powerLook + "QaDc";
        }
        if (power < 1e51) {
            return mantissaLook + "e" + powerLook + "QaDc";
        }
        // If it doesn't fit a notation then default to mantissa e power
        return mantissa + "e" + power;
    } else {
        // Failsafe
        return "undefined";
    }
}

function c15rewardreincmultiplier(e) {
    //Chal 6-10 Scaling [100000]
    if (e < 100000) return 1;
    return Math.pow(0.98, Math.log(e/2.5e4)/Math.log(2));
}

function challengeRequirement(targetLevel, corruption, researches, shopTome, c15, plat8) {
    let completions = targetLevel - 1;
    const base = 3.5e9;
    let c10Reduction = (1e8 * (researches) + 2e7 * shopTome);

    let requirementMultiplier = 1;
    requirementMultiplier *= Math.max(1, hyperchallengedMultiplier[corruption] / (1 + plat8 / 2.5));
    if (completions >= 60) {
        requirementMultiplier *= Math.pow(1 + completions, 5) / 7200
    }
    if (completions >= 25) {
        requirementMultiplier *= Math.pow(1 + completions, 5) / 625
    }
    if (completions < 25) {
        requirementMultiplier *= Math.min(Math.pow(1 + completions, 2), Math.pow(1.3797, completions));
    }
    requirementMultiplier *= c15rewardreincmultiplier(c15);
    return Decimal.pow(10, (base - c10Reduction) * requirementMultiplier);
}
