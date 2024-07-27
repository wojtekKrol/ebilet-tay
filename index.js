import 'dotenv/config';
import {chromium} from 'playwright';
import {playSoundLoop} from './soundPlayer.js';
import logger from './logger.js';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function refreshPage(page) {
    // The URL to check after login
    const url = 'https://www.ebilet.pl/muzyka/pop/taylor-swift-resale-buy'; // Replace with your target URL
    logger.info('Navigating to the target URL');
    await page.goto(url, {waitUntil: 'domcontentloaded'});
    await sleep(1000); // Wait for the page to load
    logger.success('Page refreshed');
}

async function login(page) {
    logger.info('Navigating to the login page');
    await page.goto('https://sklep.ebilet.pl/LoginRegister?returnUrl=/customer/profile');

    logger.info('Filling in the login details');
    await page.fill('input[placeholder="E-mail"]', process.env.EMAIL);
    await page.fill('input[placeholder="Hasło"]', process.env.PASSWORD);

    logger.info('Accepting cookie or agreement prompts if visible');
    const cookieButtonVisible = await page.isVisible('button:has-text("OK, zgadzam się")');
    if (cookieButtonVisible) {
        await page.click('button:has-text("OK, zgadzam się")');
    }

    logger.info('Clicking the login button');
    await page.click('button:has-text("Zaloguj")');
}

async function clickButtonByText(page, text, maxAttempts = 5) {
    let attempts = 0;
    let buttonFound = false;
    while (attempts < maxAttempts && !buttonFound) {
        attempts++;
        logger.info(`Attempt ${attempts}: Looking for the button with text "${text}"`);
        const buttons = await page.getByText(text).all();

        if (buttons.length >= 3) {
            try {
                await buttons[2].click();
                buttonFound = true;
                logger.success(`Third "${text}" button clicked.`);
            } catch (error) {
                logger.error(`Error clicking the third "${text}" button: ${error}`);
            }
        } else {
            logger.warn(`The third "${text}" button not found. Retrying...`);
            await page.waitForTimeout(2000); // Wait for 2 seconds before retrying
        }
    }

    if (!buttonFound) {
        logger.error(`Failed to find and click the third "${text}" button after maximum attempts.`);
    }

    return buttonFound;
}

async function checkForTextAndRefresh(page, searchText, numOfButtons = 3) {
    let found = false;
    while (!found) {
        logger.info('Refreshing the page and checking for the text');
        await refreshPage(page);

        const elements = await page.getByText(searchText).all();
        if (elements.length !== numOfButtons) {
            found = true;
            logger.success(`Text "${searchText}" not found. Stopping the script.`);

            // Play sound with looping
            playSoundLoop('alarm.mp3');
        } else {
            logger.info(`Text "${searchText}" found ${elements.length} times. Refreshing...`);
            await sleep(500); // Wait for 0.5 seconds before refreshing
        }
    }
}

(async () => {
    const browser = await chromium.launch({headless: true}); // Set to false if you want to run in non-headless mode
    logger.info('Browser launched');
    const context = await browser.newContext({
        viewport: {width: 1600, height: 1600},
    });
    const page = await context.newPage();

    await login(page);
    logger.success('Login completed');

    await refreshPage(page);

    logger.info('Accepting cookie or agreement prompts if visible');
    const isVisible = await page.locator('button:has-text("OK, zgadzam się")').isVisible();
    if (isVisible) {
        await page.click('button:has-text("OK, zgadzam się")');
    }

    await sleep(1000); // Wait for the page to load

    logger.info('Clicking the third "Powiadom mnie" button');
    if (!await clickButtonByText(page, 'Powiadom mnie')) {
        await browser.close();
        logger.error('Browser closed due to failure in clicking the button');
        return;
    }
    await sleep(1000);

    logger.info('Filling in the email for notification');
    await page.fill('input[placeholder=" "]', process.env.NOTIFICATION_EMAIL); // Use environment variable for notification email

    logger.info('Submitting the form');
    await page.click('//*[@id="cdk-overlay-2"]/div/div[1]/div/form/div/button');
    await sleep(1000);

    await refreshPage(page);

    const searchText = 'Powiadomienia';
    const numOfButtons = 3
    logger.info('Starting to check for the text and refresh the page if not found');
    await checkForTextAndRefresh(page, searchText, numOfButtons);
})();
