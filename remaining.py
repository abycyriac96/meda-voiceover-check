import base64
import datetime
import tempfile
from pathlib import Path
from urllib.parse import unquote
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait

base = 'https://dev.blackhaven-industries.pages.dev'
with webdriver.Safari() as browser:
    def js(code, *args):
        return browser.execute_script(code, *args)

    def get(selector):
        return browser.find_element(By.CSS_SELECTOR, selector)

    browser.get(base + '/rfq/')
    # Capture the browser's mailto navigation without starting a mail client.
    payload = js("""
        const form = document.querySelector('form');
        for (const [name,value] of Object.entries(arguments[0])) form.elements.namedItem(name).value = value;
        form.querySelectorAll('input[type=checkbox]').forEach(box => box.checked = true);
        window.addEventListener('beforeunload', () => {});
        const sandbox = document.createElement('iframe');
        sandbox.hidden = true;
        document.body.append(sandbox);
        // Safari's automation session has no configured sender. The site only creates a mailto.
        return [...new FormData(form)].map(pair=>pair.map(String));
    """, dict(requestorName='Dev QA', organization='Accessibility test', email='qa@example.test',
              requirementTitle='Test equipment quote', quoteDeadline=str(datetime.date.today()+datetime.timedelta(days=7)),
              description='Test only, please ignore.', deliveryLocation='Dothan, Alabama'))
    get('button[type=submit]').click()
    assert get('#prepared-email').is_displayed(), js("return document.querySelector('#error-summary').innerText")
    uri = unquote(get('#prepared-email').get_attribute('href'))
    assert uri.startswith('mailto:') and 'Test equipment quote' in uri and 'qa@example.test' in uri, uri
    assert 'Nothing has been sent' in get('#submit-status').text, get('#submit-status').text
    print('RFQ draft and fallback confirmed; no Send action performed', flush=True)

    browser.get(base + '/demo/community/')
    get('[data-go=report]').click()
    Select(get('#category')).select_by_index(1)
    get('#location').send_keys('QA test intersection')
    get('#description').send_keys('QA test photo and staff assignment')
    with tempfile.TemporaryDirectory() as folder:
        photo = Path(folder)/'test.png'
        photo.write_bytes(base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jPuoAAAAASUVORK5CYII='))
        get('#photo').send_keys(str(photo))
        get('#report-form button[type=submit]').click()
        request = WebDriverWait(browser,10).until(lambda _: get('#success-id').text)
    get('#success-view [data-go=track]').click()
    get('#track-form button[type=submit]').click()
    assert get('#track-result img').get_attribute('src').startswith('data:image/png;')
    print('Community upload and tracked photo confirmed', flush=True)
    get('[data-view=staff]').click()
    Select(get('#assign-'+request)).select_by_visible_text('Public works')
    Select(get('#status-'+request)).select_by_visible_text('In progress')
    browser.refresh()
    get('[data-view=staff]').click()
    assert Select(get('#assign-'+request)).first_selected_option.text == 'Public works'
    assert Select(get('#status-'+request)).first_selected_option.text == 'In progress'
    assert get('#queue img').is_displayed()
    print('Staff assignment, status and photo survived reload', flush=True)

