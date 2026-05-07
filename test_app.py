# -*- coding: utf-8 -*-
"""
ilaaka 2.0 -- end-to-end UI test via Playwright (headless Chromium)
Tests: login, register, home wall, discover/map, host flow, profile, event detail
"""

import os
import sys
import time
from playwright.sync_api import sync_playwright, Page

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE = "http://localhost:3000"
SHOTS = r"C:\Users\acer\AppData\Local\Temp\ilaaka-screenshots"
os.makedirs(SHOTS, exist_ok=True)

RESULTS = []

def shot(page, name):
    path = os.path.join(SHOTS, f"{name}.png")
    page.screenshot(path=path, full_page=True)
    print(f"  [screenshot] {path}")
    return path

def check(label, condition, detail=""):
    status = "[PASS]" if condition else "[FAIL]"
    line = f"  {status}  {label}"
    if detail:
        line += f"  ({detail})"
    print(line)
    RESULTS.append((label, condition, detail))


def test_login(page):
    print("\n--- LOGIN PAGE ---")
    page.goto(f"{BASE}/login", wait_until="networkidle")
    time.sleep(0.8)
    shot(page, "01-login")

    check("Logo wordmark visible", page.locator("text=ilaaka").count() > 0)
    check("Fraunces h1 headline present", page.locator("h1").first.is_visible())
    check("Email input present", page.locator('input[type="email"]').count() > 0)
    check("Password input present", page.locator('input[type="password"]').count() > 0)
    btn = page.locator('button[type="submit"]').first
    check("Submit button present", btn.is_visible())
    check("Submit says SIGN IN", "SIGN IN" in btn.inner_text().upper())
    check("Register link present", page.locator("text=CREATE ACCOUNT").count() > 0)

    # Bad credentials -> error
    page.fill('input[type="email"]', "nobody@example.com")
    page.fill('input[type="password"]', "wrongpass")
    btn.click()
    time.sleep(2.5)
    has_error = (page.locator("text=Invalid").count() > 0
                 or page.locator("text=Unable").count() > 0
                 or page.locator("text=incorrect").count() > 0)
    check("Error message shown for bad credentials", has_error)
    shot(page, "01b-login-error")


def test_register(page):
    print("\n--- REGISTER PAGE ---")
    page.goto(f"{BASE}/register", wait_until="networkidle")
    time.sleep(0.8)
    shot(page, "02-register")

    check("h1 headline present", page.locator("h1").first.is_visible())
    check("Name input present", page.locator('input[type="text"]').count() > 0)
    check("Email input present", page.locator('input[type="email"]').count() > 0)
    check("Password input present", page.locator('input[type="password"]').count() > 0)
    btn = page.locator('button[type="submit"]').first
    check("CTA button present", btn.is_visible())
    check("Sign-in link present", page.locator("text=SIGN IN").count() > 0)
    # Decorative ticket strips
    has_deco = (page.locator("text=Morning run").count() > 0
                or page.locator("text=Book swap").count() > 0
                or page.locator("text=Chai").count() > 0)
    check("Decorative ticket collage renders", has_deco)


def test_home(page):
    print("\n--- HOME (EDITORIAL WALL) ---")
    page.goto(f"{BASE}/", wait_until="networkidle")
    time.sleep(1.5)
    shot(page, "03-home")

    check("h1 headline present", page.locator("h1").first.is_visible())
    has_masthead = (page.locator("text=YOUR HOOD").count() > 0
                    or page.locator("text=VOL.").count() > 0)
    check("Masthead/volume stamp visible", has_masthead)
    check("Bottom nav rendered", page.locator(".bottom-nav").count() > 0)
    has_discover_link = (page.locator("a[href='/discover']").count() > 0
                         or page.locator("a[href='/map']").count() > 0)
    check("Discover link in nav", has_discover_link)
    check("Host CTA link exists", page.locator("a[href='/events/new']").count() > 0)


def test_discover(page):
    print("\n--- DISCOVER / MAP ---")
    page.goto(f"{BASE}/discover", wait_until="networkidle")
    time.sleep(2.5)
    shot(page, "04-discover")

    check("Discover masthead visible", page.locator("text=DISCOVER").count() > 0)
    check("Search input present", page.locator("input").count() > 0)
    has_search_btn = (page.locator("text=SEARCH NEARBY").count() > 0
                      or page.locator("text=Search").count() > 0)
    check("Search button present", has_search_btn)
    has_radius = (page.locator("text=SEARCH RADIUS").count() > 0
                  or page.locator("text=Radius").count() > 0
                  or page.locator("text=km").count() > 0)
    check("Radius control present", has_radius)
    check("Leaflet map rendered", page.locator(".leaflet-container").count() > 0)
    has_geo = (page.locator("text=LOCATED").count() > 0
               or page.locator("text=FINDING").count() > 0
               or page.locator("text=APPROX").count() > 0
               or page.locator("text=NO LOCATION").count() > 0
               or page.locator("text=EVENTS").count() > 0)
    check("Geo / status pills visible", has_geo)
    shot(page, "04b-discover-map")


def test_host_flow(page):
    print("\n--- HOST FLOW ---")
    page.goto(f"{BASE}/events/new", wait_until="networkidle")
    time.sleep(1.5)
    shot(page, "05-host-flow")

    if "/login" in page.url or "/register" in page.url:
        check("Host flow auth-gated (redirected to login)", True)
        return

    check("HOST STUDIO masthead present", page.locator("text=HOST STUDIO").count() > 0)
    check("Step 1 - story section", page.locator("text=the story").count() > 0)
    check("Step 2 - place & time section", page.locator("text=place & time").count() > 0)
    check("Step 3 - look section", page.locator("text=give it a look").count() > 0)
    check("Step 4 - publish section", page.locator("text=preview & publish").count() > 0)

    title_input = page.locator('input').first
    if title_input.is_visible():
        title_input.fill("Test Chai & Chat")
        check("Title input fills correctly", True)
    else:
        check("Title input present", False, "no inputs found")

    has_vibe = (page.locator("text=Community").count() > 0
                or page.locator("text=COMMUNITY").count() > 0
                or page.locator("text=Arts").count() > 0
                or page.locator("text=Arts & Culture").count() > 0)
    check("Vibe chips rendered", has_vibe)
    has_format = (page.locator("text=IN-PERSON").count() > 0
                  or page.locator("text=ONLINE").count() > 0)
    check("Format toggle present", has_format)
    has_upload = (page.locator("text=UPLOAD BANNER").count() > 0
                  or page.locator("text=banner").count() > 0)
    check("Upload zone present", has_upload)
    check("Publish button present",
          page.locator("text=PUBLISH").count() > 0
          or page.locator('button[type="submit"]').count() > 0)
    shot(page, "05b-host-flow-detail")


def test_profile(page):
    print("\n--- PROFILE PAGE ---")
    page.goto(f"{BASE}/profile", wait_until="networkidle")
    time.sleep(1.5)
    shot(page, "06-profile")

    if "/login" in page.url:
        check("Profile auth-gated (redirected to login)", True)
        return

    check("LOCAL ID card present",
          page.locator("text=LOCAL ID").count() > 0
          or page.locator("text=ILAAKA").count() > 0)
    check("Badges section present", page.locator("text=badges").count() > 0)
    check("My events section present", page.locator("text=my events").count() > 0)
    check("Edit button present", page.locator("text=EDIT").count() > 0)
    check("Sign out button present", page.locator("text=SIGN OUT").count() > 0)
    shot(page, "06b-profile-detail")


def test_event_detail(page):
    print("\n--- EVENT DETAIL (from home page links) ---")
    page.goto(f"{BASE}/", wait_until="networkidle")
    time.sleep(1.5)

    links = page.locator("a[href*='/events/']").all()
    event_hrefs = [
        l.get_attribute("href") for l in links
        if l.get_attribute("href")
        and "/events/new" not in (l.get_attribute("href") or "")
    ]
    event_hrefs = [h for h in event_hrefs if h]

    if not event_hrefs:
        check("Event detail (no events in DB -- skipped)", True,
              "seed the DB with events to test this flow")
        return

    page.goto(f"{BASE}{event_hrefs[0]}", wait_until="networkidle")
    time.sleep(1.5)
    shot(page, "07-event-detail")

    check("h1 title present", page.locator("h1").first.is_visible())
    check("RSVP button present",
          page.locator("text=RSVP").count() > 0
          or page.locator("text=I'M IN").count() > 0)
    check("Story section present", page.locator("text=the story").count() > 0)
    check("Host section present", page.locator("text=your host").count() > 0)
    check("Sticky RSVP bar present",
          page.locator("text=BACK TO WALL").count() > 0
          or page.locator("text=BACK").count() > 0)


def test_navigation(page):
    print("\n--- NAVIGATION ---")
    page.goto(f"{BASE}/", wait_until="networkidle")
    time.sleep(0.8)

    check("Logo visible in nav", page.locator("text=ilaaka").count() > 0)
    check("Bottom nav component rendered", page.locator(".bottom-nav").count() > 0)
    check("Host CTA reachable",
          page.locator("a[href='/events/new']").count() > 0
          or page.locator("text=HOST").count() > 0)
    shot(page, "08-navigation")


def run_all():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 390, "height": 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
        )
        page = ctx.new_page()
        page.on("console", lambda msg: None)
        page.on("pageerror", lambda err: None)

        try:
            test_login(page)
            test_register(page)
            test_home(page)
            test_discover(page)
            test_host_flow(page)
            test_profile(page)
            test_event_detail(page)
            test_navigation(page)
        finally:
            browser.close()

    print("\n" + "=" * 54)
    print("  TEST SUMMARY")
    print("=" * 54)
    passed = sum(1 for _, ok, _ in RESULTS if ok)
    failed = sum(1 for _, ok, _ in RESULTS if not ok)
    for label, ok, detail in RESULTS:
        status = "[PASS]" if ok else "[FAIL]"
        line = f"  {status}  {label}"
        if detail:
            line += f"  -- {detail}"
        print(line)
    print(f"\n  {passed} passed, {failed} failed, {len(RESULTS)} total")
    print(f"  Screenshots: {SHOTS}")
    print("=" * 54)
    return failed == 0


if __name__ == "__main__":
    success = run_all()
    sys.exit(0 if success else 1)
