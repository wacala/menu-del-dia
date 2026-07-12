#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src/pages');

const replacements = {
  // RegisterPage
  "RegisterPage.jsx": [
    ['>First Name<', ">{t('auth.firstName')}<"],
    ['>Last Name<', ">{t('auth.lastName')}<"],
    ['>Confirm Password<', ">{t('auth.confirmPassword')}<"],
    ['>I want to<', ">{t('auth.iWantTo')}<"],
    ['Buy food', "t('auth.buyFood')"],
    ['Sell food', "t('auth.sellFood')"],
    ['Creating account...', "{t('auth.creatingAccount')}"],
    ["'Create account'", "t('auth.createAccountBtn')"],
    ['>Already have an account', ">{t('auth.haveAccount')}"],
    ['Sign in</Link>', "t('auth.signInLink')}</Link>"],
    ['Check your email', "{t('auth.checkEmail')}"],
    ['We sent a verification link to:', "{t('auth.verificationSent')}"],
    ['Click the link in the email to activate your account before logging in.', "{t('auth.verificationInstructions')}"],
    ['Back to Login', "{t('auth.backToLogin')}"],
  ],
};

for (const [file, reps] of Object.entries(replacements)) {
  const filePath = path.join(pagesDir, file);
  if (!fs.existsSync(filePath)) { console.log('SKIP', file); continue; }
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [old, neo] of reps) {
    content = content.split(old).join(neo);
  }
  fs.writeFileSync(filePath, content);
  console.log('OK', file);
}
console.log('Done');
