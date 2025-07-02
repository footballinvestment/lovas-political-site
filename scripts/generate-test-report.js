// scripts/generate-test-report.js
const fs = require('fs');
const path = require('path');

// Timestamp a fájlnévhez
const timestamp = new Date().toISOString().replace(/[:.]/g, '_');

// Riport könyvtár létrehozása, ha nem létezik
const reportDir = path.join(process.cwd(), 'test-reports');
if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir);
}

try {
    // Test eredmények beolvasása
    const testResults = require('../test-report.json');
    
    // HTML riport generálása
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Report ${timestamp}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .success { color: green; }
            .failure { color: red; }
            .suite { margin: 20px 0; }
            .test { margin: 10px 0 10px 20px; }
            .details { margin-left: 40px; color: #666; }
        </style>
    </head>
    <body>
        <h1>Test Report - ${new Date().toLocaleString()}</h1>
        <div>
            <p>Total Tests: ${testResults.numTotalTests}</p>
            <p>Passed Tests: ${testResults.numPassedTests}</p>
            <p>Failed Tests: ${testResults.numFailedTests}</p>
            <p>Time: ${testResults.startTime}</p>
        </div>
        <div class="results">
    `;

    testResults.testResults.forEach(suite => {
        html += `<div class="suite">
            <h2>${suite.name}</h2>`;
        
        suite.testResults.forEach(test => {
            const status = test.status === 'passed' ? 'success' : 'failure';
            html += `
            <div class="test">
                <div class="${status}">
                    ${test.title} - ${test.status.toUpperCase()}
                </div>
                ${test.failureMessages ? `
                <div class="details">
                    <pre>${test.failureMessages.join('\n')}</pre>
                </div>` : ''}
            </div>`;
        });

        html += `</div>`;
    });

    html += `
        </div>
    </body>
    </html>`;

    // HTML riport mentése
    const reportPath = path.join(reportDir, `test_report_${timestamp}.html`);
    fs.writeFileSync(reportPath, html);

    // Log eredmények mentése
    const logPath = path.join(reportDir, `test_results_${timestamp}.log`);
    fs.writeFileSync(logPath, JSON.stringify(testResults, null, 2));

    console.log(`Test report generated:
    HTML Report: ${reportPath}
    Log File: ${logPath}`);

    // Töröljük az ideiglenes JSON fájlt
    fs.unlinkSync(path.join(process.cwd(), 'test-report.json'));

} catch (error) {
    console.error('Error generating test report:', error);
    process.exit(1);
}