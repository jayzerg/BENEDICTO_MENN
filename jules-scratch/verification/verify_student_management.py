from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3000/login")
        page.get_by_role("button", name="Admin").click()
        page.get_by_placeholder("Enter 6-digit code").fill("262366")
        page.get_by_role("button", name="Sign In").click()

        page.wait_for_url("http://localhost:3000/admin/dashboard")

        page.get_by_role("button", name="Students").click()

        page.screenshot(path="jules-scratch/verification/verification.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)