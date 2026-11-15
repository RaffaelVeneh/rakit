# RAKIT

**Register komponen & gear komputer.** A Laravel + Inertia + React storefront and operator console presented as a controlled engineering sheet — with a holographic Three.js hero, interactive 3D diagrams, a full light/dark temperature switch, and a motion setting.

## Stack

- **Backend:** Laravel 13, PHP 8.3, MySQL 8
- **Frontend:** Inertia 3, React 19, Vite 8, Tailwind CSS 4
- **3D:** Three.js 0.186 (hero chip, pyramid, padlock, console globe, hardware gear, software layers)
- **Charts:** Chart.js (MIS performance figure)
- **Local runtime:** Docker Compose (app + nginx + MySQL + phpMyAdmin) or a local PHP/MySQL setup

## What is in here

- **Storefront** — catalogue register, product plates, drawing-table hero, cart, checkout, order receipt, customer portal.
- **Operator console** — queue, catalogue, categories, orders, customers, audit trail.
- **Reference modules** — management pyramid, TPS, OAS, MIS, ISS, matrix, quizzes.
- **System sheets** — hardware and software specifications read from the running application.
- **Design system** — `DESIGN.md` records the sheet language; `PRODUCT.md` records the product intent.
- **Motion** — page transitions, scroll reveals, magnetic controls, confetti on results, and a toggle for readers who need the sheet to hold still.
- **Temperature** — the header's sun/moon switch re-tempers every surface, including modules, the console, the boot sheet, and the 3D viewports.

## Requirements

- PHP 8.3+
- Composer
- Node.js 20+ and npm
- MySQL 8 (Docker can provide it)

## Local setup

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
```

Set the database in `.env`. The reference dump at `database/msi_db.sql` contains the schema, seed data, triggers, and stored procedures used by the application:

```bash
mysql -u <user> -p <database> < database/msi_db.sql
```

Then build and serve:

```bash
npm run build
php artisan serve
```

Open `http://localhost:8000`.

### Docker

```bash
docker compose up -d --build
```

The stack exposes the storefront at `http://localhost:8000` and phpMyAdmin at `http://localhost:8080`. For the app container, the database host is `db` (port `3306`); for commands run on the host against the mapped port, use `127.0.0.1:33060`.

## Notes

- The `.env` file is intentionally not committed. Only `.env.example` is tracked.
- Catalogue photography is third-party placeholder imagery, served by the original host. Missing images fall back to the sheet's drafting hatch.
- The application has its own **motion** setting rather than inheriting the operating system preference; the switch is in every layout's header.
- The theme preference is stored in `localStorage` and applied by a blocking script in the document head, so the boot sheet and the page agree on the temperature.

## License

The application code is provided for the RAKIT project. Laravel itself is open-sourced software under the MIT license.
