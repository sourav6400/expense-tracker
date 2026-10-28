# Ledger — personal expense tracker

Laravel 12, React 19, Inertia.js 3, Vite, and SQLite. Designed for personal finances in Bangladeshi taka (BDT).

## Run locally

Requirements: PHP 8.2+, Composer, Node.js 22+, and the PHP SQLite extension.

```sh
composer install
npm install
```

For a fresh checkout, copy `.env.example` to `.env`, create `database/database.sqlite`, set `DB_CONNECTION=sqlite`, then run:

```sh
php artisan key:generate
php artisan migrate
npm run build
php artisan serve
```

Open http://127.0.0.1:8000 and create an account. New accounts start with a cash wallet and default categories, with no sample financial records. For development, run `npm run dev` alongside `php artisan serve` for hot reload.

## Included

- Registration, sign in, sign out, session regeneration, CSRF protection, and rate-limited authentication.
- Private user-owned accounts, categories, transactions, and budgets, validated on the server.
- Dashboard with total balance, monthly income, expenses, savings, category breakdown, and six-month cash-flow chart.
- Add, edit, and delete income, expenses, and transfers; search by title, notes, or category; filter by month and transaction type.
- Cash, bank, bKash, Nagad, savings, and credit card accounts, with editable opening balances.
- Custom categories and colors. Categories are retained to preserve financial history.
- Monthly category budgets, automatic spending progress, and over-budget indications.
- Reports with cash-flow and spending charts; CSV export of all historical transactions.
- Responsive layouts, keyboard-accessible forms, and focus-managed dialogs.

## Accounting rules

All amounts are stored as integer poisha (100 poisha = 1 taka). Transaction amounts are positive; the transaction type determines the effect. Account balances derive from the current transaction records, so edits and deletions immediately reverse their old effects.

A transfer is one atomic database record with a source and destination account. It reduces the source balance and increases the destination balance equally. Transfers never enter income, expense, or savings calculations. A credit card purchase is an expense; paying the card is a transfer. Negative card balances represent outstanding debt. Opening balances are nonnegative; historical card debt can be entered as a dated expense.

Dashboard totals use the selected month, while total balance includes all historical transactions. Budget remaining sums only expenses in categories with a budget for that month. CSV export includes all months and protects text fields against spreadsheet formula execution.

## Verify

```sh
php artisan test
node --test --test-isolation=none tests/Unit/finance.test.js
npm run build
```

PHP tests cover authentication, registration, ownership, monetary precision, transfer validation, transaction updates/deletion, budget upserts, and CSV export. JavaScript tests cover transfer balance conservation and budget calculations.

## Backup

For SQLite, stop application writes and copy `database/database.sqlite` to a secure backup location. Preserve `.env` separately because it contains the application key. Restore the database while application writes are stopped, then run `php artisan migrate` after upgrading. Keep backups and `.env` out of source control and the public directory. Production hosting should provide scheduled encrypted backups and a tested restore process.

## Further phases from the feature reference

This implementation is the personal-finance MVP. Recurring entries and bill reminders, receipt uploads, savings goals, debt schedules, subcategories, bank imports, password reset email, multi-currency conversion, household sharing, AI/OCR, and paid plans remain future work. It does not connect to banks or automatically move real money.

Before public deployment, configure HTTPS, production mail, `APP_DEBUG=false`, secure session cookies, and scheduled backups. Serve only the `public` directory.
