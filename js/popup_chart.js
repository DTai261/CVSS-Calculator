

function executeContentScript() {

    let criticalSum = 0;
    let highSum = 0;
    let mediumSum = 0;
    let lowSum = 0;

    // Find the table on the page with exactly five columns
    const tables = document.querySelectorAll('.q-table');
    let targetTable = null;

    // Iterate through tables and find the one with five columns
    for (const table of tables) {
        const headers = table.querySelectorAll('thead th');
        if (headers.length === 5) {
            targetTable = table;
            break;
        }
    }

    if (!targetTable) {
        console.error('Table with five columns not found on the page.');
        return;
    }

    // Iterate through table rows and calculate sums
    const rows = targetTable.querySelectorAll('tbody tr');
    rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4) {
            const severity = cells[2].textContent.trim().toUpperCase();
            const count = parseInt(cells[3].textContent.trim(), 10);

            switch (severity) {
                case 'CRITICAL':
                    criticalSum += count;
                    break;
                case 'HIGH':
                    highSum += count;
                    break;
                case 'MEDIUM':
                    mediumSum += count;
                    break;
                case 'LOW':
                    lowSum += count;
                    break;
                default:
                    // Handle other severity levels or errors
                    break;
            }
        }
    });

    // Send the calculated sums to the popup script
    chrome.runtime.sendMessage({
        type: 'updateForm',
        data: {
            criticalSum,
            highSum,
            mediumSum,
            lowSum
        }
    });
}


document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('chartForm');


    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (currentTab.url.match(/bug\.report\.night-wolf\.io\/#\/round\/(\d+)\/statistic/)) {

            chrome.scripting.executeScript({
                target: { tabId: currentTab.id },
                function: executeContentScript,
            });
            }
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        //============================================================================//

        var canvas = document.createElement("canvas");
        canvas.id = "myChart";
        canvas.width = 500;
        canvas.height = 300;
        canvas.setAttribute("data-chart-type", "doughnut");

        // Find the container element where you want to insert the canvas
        var container = document.querySelector(".container");

        // Find the target element to insert the canvas before
        var targetElement = document.getElementById("test");

        // Get the parent node of the target element
        var parent = targetElement.parentNode;

        // Insert the canvas before the target element
        parent.insertBefore(canvas, targetElement);

        //============================================================================//
        
        // Get input values
        const criticalValue = parseFloat(document.getElementById('critical').value) || 0;
        const highValue = parseFloat(document.getElementById('high').value) || 0;
        const mediumValue = parseFloat(document.getElementById('medium').value) || 0;
        const lowValue = parseFloat(document.getElementById('low').value) || 0;

        // Create data for the pie chart
        const labels = ['Critical', 'High', 'Medium', 'Low'];
        const values = [criticalValue, highValue, mediumValue, lowValue];

        // Filter out data points and labels with a value of 0
        const filteredLabels = labels.filter((label, index) => values[index] !== 0);
        const filteredValues = values.filter(value => value !== 0);

        const colorsMap = {
            'Critical': '#8c59b3',
            'High': '#ff3333',
            'Medium': '#ffcc33',
            'Low': '#339933'
        };
        const backgroundColors = filteredLabels.map(label => colorsMap[label]);

        // Create data for the pie chart
        const data = {
            labels: filteredLabels,
            datasets: [{
                data: filteredValues,
                backgroundColor: backgroundColors,
                borderWidth: 2, // Adjust to make the chart thinner
                datalabels: {
                    labels: {
                    index: {
                        color: 'black',
                        font: {
                            family: "sans-serif",
                            size: 10,
                        },
                        formatter: (val, ctx) => ctx.chart.data.labels[ctx.dataIndex],
                        align: 'end',
                        anchor: 'end',
                    },
                    },
                },
            },
            {
                data: filteredValues,
                backgroundColor: 'transparent',
                borderWidth: 0,
                datalabels: {
                    labels: {
                        value: {
                            color: 'black',
                            align: 'center',
                            font: {
                                size: 9,
                                weight: 'bold',
                            },
                        },
                    },
                    formatter: (val, ctx) => `(${val})`, 
                },                
            }
            ],
        };

        // Get the canvas element for the chart
        const ctx = document.getElementById('myChart');

        // Configure the doughnut chart options
        const chartOptions = {
            responsive: false,
            maintainAspectRatio: false,
            tooltips: false,
            cutout: 30, // Adjust to make the inner circle bigger
            plugins: {
                title: {
                    display: true,
                    text: 'Vulnerabilities',
                    font: {
                        weight: "bold",
                        size: 18,
                    },
                    backgroundColor: 'white',
                    padding: {
                        bottom: 35,
                    },
                    position: 'top',
                    x: -200, // Center horizontally
                    y: -150,
                },
                legend: {
                    position: 'right',
                    font: {
                        size: 15,
                    },
                    reverse: true, // Reverse the legend labels
                    padding: 1, // Set padding to 0 to remove excess space
                },
                customBorder: {
                    color: '#d6d6d6',
                    backgroundColor: 'white',
                    offset: {
                        left: 5,
                        right: 5
                    }
                }
                
            },
            layout: {
                padding: {
                    top: 10, // Adjust top padding for the error level labels
                    bottom: 10,
                    left: 10,
                    right: 10
                },
            },
            backgroundColor: 'transparent',
        
        
        };

        new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: chartOptions, // Use the configured options
            plugins: [
                ChartDataLabels,
                {
                    id: 'customBorder',
                    afterDraw: (chart, args, opts) => {
                        const {
                            ctx,
                            legend: {
                                _margins,
                                legendHitBoxes
                            }
                        } = chart;
                
                        // Calculate the top position for the legend box
                        const topOffset = 8;
                        const top = legendHitBoxes.reduce((acc, curr) => (acc < curr.top ? acc : curr.top), Number.MAX_SAFE_INTEGER) - (opts?.offset?.top || 0) - topOffset;
                
                        // Calculate the left position for the legend box
                        const left = legendHitBoxes.reduce((acc, curr) => (acc > curr.left ? curr.left : acc), Number.MAX_SAFE_INTEGER);
                
                        // Calculate the total height required for the legend box
                        const paddingBetweenLegends = 12;
                        const totalLegendHeight = legendHitBoxes.reduce((acc, curr) => acc + curr.height, 0) + (opts?.offset?.top || 0) + (opts?.offset?.bottom || 0) + (paddingBetweenLegends * legendHitBoxes.length);
                
                        const width = legendHitBoxes[legendHitBoxes.length - 1].left + legendHitBoxes[legendHitBoxes.length - 1].width - left + 28;
                
                        const borderRadius = 3; // Adjust this value to set the border radius
                
                        ctx.strokeStyle = opts.color || Chart.defaults.color;
                
                        ctx.beginPath();
                        ctx.moveTo(left - (opts?.offset?.left || 0) + borderRadius, top);
                        ctx.lineTo(left - (opts?.offset?.left || 0) + width - borderRadius, top);
                        ctx.arc(left - (opts?.offset?.left || 0) + width - borderRadius, top + borderRadius, borderRadius, -Math.PI / 2, 0);
                        ctx.lineTo(left - (opts?.offset?.left || 0) + width, top + totalLegendHeight - borderRadius);
                        ctx.arc(left - (opts?.offset?.left || 0) + width - borderRadius, top + totalLegendHeight - borderRadius, borderRadius, 0, Math.PI / 2);
                        ctx.lineTo(left - (opts?.offset?.left || 0) + borderRadius, top + totalLegendHeight);
                        ctx.arc(left - (opts?.offset?.left || 0) + borderRadius, top + totalLegendHeight - borderRadius, borderRadius, Math.PI / 2, Math.PI);
                        ctx.lineTo(left - (opts?.offset?.left || 0), top + borderRadius);
                        ctx.arc(left - (opts?.offset?.left || 0) + borderRadius, top + borderRadius, borderRadius, Math.PI, -Math.PI / 2);
                        ctx.closePath();
                
                        ctx.stroke();
                    }
                }
                
                
                
                
            ]
        });

        //===========================================================================//
        var button = document.createElement("button");
            button.id = "copyChartButton";
            button.textContent = "Download the chart";

            // Append the button to the body or any other container element
            // document.body.appendChild(button);
            

            // Find the <h1> element by its id
            var cvssHeading = document.getElementById("cvssHeading");

            // Insert the button before the <h1> element
            cvssHeading.parentNode.insertBefore(button, cvssHeading);

        //===========================================================================//

        const copyChartButton = document.getElementById('copyChartButton');
        copyChartButton.addEventListener('click', function () {
            // Capture the chart as an image using html2canvas
            html2canvas(document.getElementById('myChart')).then(function (canvas) {
                // Convert the canvas to a data URL
                const image = canvas.toDataURL('image/png');

                // Create a temporary textarea element to hold the image data URL
                const tempTextArea = document.createElement('textarea');
                tempTextArea.value = image;

                // Append the textarea to the document body and select its content
                document.body.appendChild(tempTextArea);
                tempTextArea.select();

                // Copy the image data URL to the clipboard
                // document.execCommand('copy');

                // Remove the temporary textarea
                document.body.removeChild(tempTextArea);

                //============================================================================//
                // Your data URI (replace this with your actual data URI)
                var dataURI = image;

                // Create an Image object
                var img = new Image();

                // When the image is loaded, do the following:
                img.onload = function () {
                    // Create a canvas element
                    var canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;

                    // Get the 2D drawing context of the canvas
                    var ctx = canvas.getContext("2d");

                    // Draw the image onto the canvas
                    ctx.drawImage(img, 0, 0);
                    

                    // Extract the image data as a PNG image
                    var pngImageData = canvas.toDataURL("image/png");

                    // Now, 'pngImageData' contains the PNG image data, and you can use it as needed
                    console.log(pngImageData);

                    // If you want to display the image on the page, you can create an <img> element
                    var pngImageElement = new Image();
                    pngImageElement.src = pngImageData;
                    pngImageElement.style.display = "none";
                    document.body.appendChild(pngImageElement); // Add it to the document
                    
                    // Create a temporary link element to download the image
                    const link = document.createElement('a');
                    link.href = pngImageData;
                    link.download = 'chart.png';

                    // Trigger the link programmatically to start the download
                    link.click();
                };

                // Set the 'src' attribute of the Image object to your data URI
                img.src = dataURI;

            });


            
        });

    });

});

