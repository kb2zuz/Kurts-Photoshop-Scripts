// Measures color values from Count Tool points in an Photoshop image and export them as RGB and LAB values to a .csv file
// Prep: Prepare a file in photoshop by putting 1 or more "Count Tool" points across an image. (NOT Eyedroppers)
// Use: On a prepared file, in Photoshop choose File->Scripts->Browse and select this .jsx
// Be careful not to place counts at the very edge of the image, if sample size from a point exceeds the edge of the image, you may get dark values

// To change output file name or location change outputFilePath variable below
// By using this you are responsible to make sure the file path is clear... Unsure if it will overwrite or not depending on the OS. 
// The author of this code is not responsible if it overwrites a file.

// Lab values are those reported by Photoshop, I do not know if they are exactly the same as CIELAB/D50/2º or the exact math photoshop uses. 
// If you want to use this script to test/validate, please share your findings with the author of this code

#target photoshop

// Output file path and name (change this variable as needed to change location or name of output file)
var outputFilePath = "~/Desktop/color_values.csv";

// Ensure there's an active document
if (app.documents.length > 0) {
    var doc = app.activeDocument;

    // Get the Count Tool items in the image
    var countItems = doc.countItems;

    // Ask for the sample size
    var  sampleSize = parseInt(prompt("Enter sample size (e.g., 3 for 3x3):", "3"), 10);

    // Function to check if a number is an integer (may be redundant now as it is parsed to Int on input, but may change later)
    function isInteger(value) {
        return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
    }

    // Check if the sample size is valid
    if (isInteger( sampleSize) &&  sampleSize > 0) {

        // Open a new CSV file for writing
        var file = new File(outputFilePath);
        file.open("w");

        // Write the header information
        file.writeln("Filename:, " + doc.name);
        file.writeln("Color Profile:, " + doc.colorProfileName);
        file.writeln("Bit Depth:, " + doc.bitsPerChannel + "-bit");
        file.writeln("");
        file.writeln("Sample Point, R, G, B, L*, a*, b*");

        // Function to get the average color (until I can figure out a way to call sampleColor with a defined sample size)
        // Warning: Weird results may occur at the edge of the frame... 
        // e.g.: if I do a "3" (3x3) sample at the right most pixel, 
        // it will ignore and not add the column of pixels outside of the frame to the total
        // then still divide by 9 points, leading to a lower than expected: not great,
        // but basically the same as if the outside of the frame is 0. (The danger is that the user is expected to think)
        function getAverageColor(x, y, size) {
            var rTotal = 0, gTotal = 0, bTotal = 0;
            var lTotal = 0, aTotal = 0, bTotalLab = 0;
            var sampleCount = 0;

            for (var i = -Math.floor(size / 2); i <= Math.floor(size / 2); i++) {
                for (var j = -Math.floor(size / 2); j <= Math.floor(size / 2); j++) {
                    var sampleX = x + i;
                    var sampleY = y + j;

                    // Ensure sample coordinates are within image bounds
                    if (sampleX >= 0 && sampleX < doc.width && sampleY >= 0 && sampleY < doc.height) {
                        var sampleColor = doc.colorSamplers.add([sampleX, sampleY]);
                        var rgbColor = sampleColor.color.rgb;
                        var labColor = sampleColor.color.lab;

                        rTotal += rgbColor.red;
                        gTotal += rgbColor.green;
                        bTotal += rgbColor.blue;

                        lTotal += labColor.l;
                        aTotal += labColor.a;
                        bTotalLab += labColor.b;

                        sampleCount++;

                        // Remove the color sampler
                        sampleColor.remove();
                    }
                }
            }

            return {
                rgb: {
                    red: rTotal / sampleCount,
                    green: gTotal / sampleCount,
                    blue: bTotal / sampleCount
                },
                lab: {
                    l: lTotal / sampleCount,
                    a: aTotal / sampleCount,
                    b: bTotalLab / sampleCount
                }
            };
        }

        // Loop through each Count Tool point and get its average color value
        for (var i = 0; i < countItems.length; i++) {
            var countItem = countItems[i];
            var x = countItem.position[0];
            var y = countItem.position[1];

            var avgColor = getAverageColor(x, y,  sampleSize);

            // Write the average RGB and Lab (Photoshop Lab, not sure how different from CIELAB) values to the CSV file
            file.writeln(
                "Point " + (i + 1) + ", " +
                avgColor.rgb.red.toFixed(2) + ", " +
                avgColor.rgb.green.toFixed(2) + ", " +
                avgColor.rgb.blue.toFixed(2) + ", " +
                avgColor.lab.l.toFixed(2) + ", " +
                avgColor.lab.a.toFixed(2) + ", " +
                avgColor.lab.b.toFixed(2)
            );
        }

        // Close the file
        file.close();

        // Alert message
        alert("Color values exported to " + outputFilePath);
    } else {
        alert("Invalid sample size. Please re-run and enter a positive integer.");
        exit();
    }
} else {
    alert("No active Photoshop document found.");
}
