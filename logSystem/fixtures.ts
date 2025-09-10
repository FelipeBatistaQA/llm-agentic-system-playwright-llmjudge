import { test as base } from '@playwright/test';
import { PlaywrightLogger } from './PlaywrightLogger';
import { JudgeLogger } from './JudgeLogger';

export const test = base.extend<{
  autoLogger: void;
}>({
  autoLogger: [async ({ }, use, testInfo) => {
    const testName = testInfo.title.replace(/[^a-zA-Z0-9]/g, '-');
    PlaywrightLogger.initTestLogs(testName);
    PlaywrightLogger.setCurrentTestName(testName);
    JudgeLogger.setCurrentTestName(testInfo.title);
    
    console.log(`[TEST START] ${testInfo.title}`);
    
    await use();
    
    await PlaywrightLogger.attachLogsToTest(testName);
    console.log(`[TEST END] ${testInfo.title}`);
    
  }, { auto: true }]
});

export { expect } from '@playwright/test';