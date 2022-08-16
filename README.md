# Testing OpenC3 with Playwright

NOTE: All commands are assumed to be executed from this (playwright) directory unless otherwise noted

1.  Start openc3

        OPENC3> openc3.bat start

1.  Open OpenC3 in your browser. It should take you to the login screen. Set the password to "password"

1.  Install testing dependencies with yarn

        playwright> yarn
        playwright> npx playwright install

1.  Open playwright and run tests

        playwright> yarn playwright test --headed --project=chromium

1.  Enable the playwright inspector / debugger with

        playwright> set PWDEBUG=1
        playwright> yarn playwright test --headed --project=chromium

1.  _[Optional]_ Fix istanbul/nyc coverage source lookups (use `fixlinux` if not on Windows).
    Tests will run successfully without this step and you will get coverage statistics, but line-by-line coverage won't work.

        playwright> yarn fixwindows

1.  Create code coverage

        playwright> yarn coverage

Code coverage reports can be viewed at [playwright/coverage/index.html](./coverage/index.html)
