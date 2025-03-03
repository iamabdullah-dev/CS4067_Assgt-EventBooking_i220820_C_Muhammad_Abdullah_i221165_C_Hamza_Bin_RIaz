const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const testScripts = [
  { name: 'User Service', script: 'test:user' },
  { name: 'Booking Service', script: 'test:booking' },
  { name: 'Event Service', script: 'test:event' },
  { name: 'Notification Service', script: 'test:notification' }
];

// Results storage
const results = {
  startTime: new Date(),
  endTime: null,
  services: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

// Run a single test script and capture output
function runTest(scriptName, npmScript) {
  return new Promise((resolve, reject) => {
    console.log(`\n\n========== Running ${scriptName} Tests ==========\n`);
    
    const testProcess = exec(`npm run ${npmScript}`, { maxBuffer: 1024 * 1024 });
    let output = '';
    
    testProcess.stdout.on('data', (data) => {
      process.stdout.write(data);
      output += data;
    });
    
    testProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
      output += data;
    });
    
    testProcess.on('close', (code) => {
      const serviceResult = {
        name: scriptName,
        exitCode: code,
        output: output,
        tests: parseTestResults(output)
      };
      
      results.services.push(serviceResult);
      
      // Update summary
      serviceResult.tests.forEach(test => {
        results.summary.total++;
        if (test.status === 'PASSED') results.summary.passed++;
        else if (test.status === 'FAILED') results.summary.failed++;
        else if (test.status === 'SKIPPED') results.summary.skipped++;
      });
      
      resolve(serviceResult);
    });
  });
}

// Parse test results from output
function parseTestResults(output) {
  const tests = [];
  const lines = output.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for test result lines (format: "Test name: PASSED/FAILED/SKIPPED")
    if (line.includes('test:') && (line.includes('PASSED') || line.includes('FAILED') || line.includes('SKIPPED'))) {
      const parts = line.split(':');
      const testName = parts[0].trim();
      const status = line.includes('PASSED') ? 'PASSED' : line.includes('FAILED') ? 'FAILED' : 'SKIPPED';
      
      tests.push({
        name: testName,
        status: status
      });
    }
  }
  
  return tests;
}

// Generate HTML report
function generateHtmlReport(results) {
  const reportDir = path.join(__dirname, 'test-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir);
  }
  
  const reportPath = path.join(reportDir, `report-${new Date().toISOString().replace(/:/g, '-')}.html`);
  
  let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Microservices Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .summary { margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
    .service { margin: 30px 0; border: 1px solid #ddd; border-radius: 5px; overflow: hidden; }
    .service-header { padding: 10px 15px; background-color: #eee; font-weight: bold; }
    .service-body { padding: 15px; }
    .test-list { list-style-type: none; padding: 0; }
    .test-item { padding: 8px; margin: 5px 0; border-radius: 3px; }
    .passed { background-color: #dff0d8; color: #3c763d; }
    .failed { background-color: #f2dede; color: #a94442; }
    .skipped { background-color: #fcf8e3; color: #8a6d3b; }
    .stats { display: flex; gap: 20px; }
    .stat-item { padding: 10px; border-radius: 5px; text-align: center; flex: 1; }
    .total { background-color: #d9edf7; color: #31708f; }
    .pass-count { background-color: #dff0d8; color: #3c763d; }
    .fail-count { background-color: #f2dede; color: #a94442; }
    .skip-count { background-color: #fcf8e3; color: #8a6d3b; }
  </style>
</head>
<body>
  <h1>Microservices Test Report</h1>
  <div class="summary">
    <p>Started: ${results.startTime.toLocaleString()}</p>
    <p>Completed: ${results.endTime.toLocaleString()}</p>
    <p>Duration: ${Math.round((results.endTime - results.startTime) / 1000)} seconds</p>
    
    <div class="stats">
      <div class="stat-item total">
        <h3>Total Tests</h3>
        <p>${results.summary.total}</p>
      </div>
      <div class="stat-item pass-count">
        <h3>Passed</h3>
        <p>${results.summary.passed}</p>
      </div>
      <div class="stat-item fail-count">
        <h3>Failed</h3>
        <p>${results.summary.failed}</p>
      </div>
      <div class="stat-item skip-count">
        <h3>Skipped</h3>
        <p>${results.summary.skipped}</p>
      </div>
    </div>
  </div>
  `;
  
  // Add service results
  results.services.forEach(service => {
    html += `
  <div class="service">
    <div class="service-header">${service.name} (Exit Code: ${service.exitCode})</div>
    <div class="service-body">
      <h3>Tests:</h3>
      <ul class="test-list">
    `;
    
    service.tests.forEach(test => {
      html += `<li class="test-item ${test.status.toLowerCase()}">${test.name}: ${test.status}</li>`;
    });
    
    html += `
      </ul>
    </div>
  </div>
    `;
  });
  
  html += `
</body>
</html>
  `;
  
  fs.writeFileSync(reportPath, html);
  console.log(`\nTest report generated: ${reportPath}`);
  return reportPath;
}

// Main function to run all tests
async function runAllTests() {
  console.log('Starting test suite...');
  
  try {
    // Run each test script sequentially
    for (const test of testScripts) {
      await runTest(test.name, test.script);
    }
    
    // Generate report
    results.endTime = new Date();
    const reportPath = generateHtmlReport(results);
    
    // Print summary
    console.log('\n========== Test Summary ==========');
    console.log(`Total Tests: ${results.summary.total}`);
    console.log(`Passed: ${results.summary.passed}`);
    console.log(`Failed: ${results.summary.failed}`);
    console.log(`Skipped: ${results.summary.skipped}`);
    console.log(`Report: ${reportPath}`);
    
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run all tests
runAllTests(); 