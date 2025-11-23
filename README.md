# John B. Roberts - Personal Portfolio

A modern, responsive, and professional personal portfolio website designed for GitHub Pages.

## 🚀 Overview

This project is a complete redesign of my personal website, built with modern HTML5, CSS3, and Vanilla JavaScript. It focuses on performance, accessibility, and a premium visual design.

**Key Features:**
-   **Modern Design:** Clean aesthetic with dark/light mode support.
-   **Responsive:** Mobile-first approach ensuring perfect rendering on all devices.
-   **Fast Performance:** Optimized for speed with no heavy frameworks.
-   **SEO Friendly:** Semantic HTML and Open Graph tags included.
-   **Interactive:** Smooth scrolling, scroll animations, and hover effects.

## 🛠️ Tech Stack

-   **HTML5:** Semantic structure.
-   **CSS3:** Custom properties (variables), Flexbox, Grid, and media queries.
-   **JavaScript:** Vanilla JS for DOM manipulation and interactivity (no jQuery).
-   **Icons:** FontAwesome 6.
-   **Fonts:** Inter (Google Fonts).

## 📂 File Structure

```
roberjo.github.io/
├── assets/
│   ├── css/
│   │   └── style.css       # Main stylesheet
│   ├── js/
│   │   └── main.js         # Main logic (theme, scroll, menu)
│   └── images/             # Store your images here
├── index.html              # Main landing page
├── 404.html                # Custom error page
└── README.md               # Documentation
```

## 💻 Local Development

Since this is a static site, you don't need a complex build process. However, we have included professional tooling for code quality and testing.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/roberjo/roberjo.github.io.git
    cd roberjo.github.io
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Open `index.html`** in your browser to view the site.
4.  **For a better experience (hot reloading),** use a simple local server like VS Code's "Live Server" extension or Python:
    ```bash
    # Python 3
    python -m http.server 8000
    ```
    Then visit `http://localhost:8000`.

## 🧪 Testing & Quality Assurance

This project includes a suite of professional tools to ensure code quality, performance, and accessibility.

### Linting & Formatting
*   **ESLint**: Checks JavaScript for errors and best practices.
*   **Stylelint**: Enforces consistent CSS conventions.
*   **HTMLHint**: Validates HTML structure.
*   **Prettier**: Automatically formats code.

```bash
# Run all linters
npm run lint

# Format code
npm run format
```

### Automated Testing
*   **Playwright**: End-to-end testing for browser interactions.

```bash
# Run tests (headless)
npm test

# Run tests with UI
npx playwright test --ui
```

### Performance & Accessibility
*   **Lighthouse CI**: Audits performance, accessibility, SEO, and best practices.

```bash
# Run Lighthouse audit
npm run lhci
```

## 📝 Customization Guide

This site is designed to be easily updated by editing the HTML directly.

### 1. Personal Information
Open `index.html` and look for the comments. Update the text content for:
-   **Hero Section:** Your name and tagline.
-   **About Section:** Your bio and photo.
-   **Experience:** Your work history.
-   **Contact:** Your email and social links.

### 2. Images
-   Place your photos in `assets/images/`.
-   Update the `src` attributes in `index.html` to point to your files (e.g., `assets/images/profile.jpg`).
-   **Placeholder Services Used:**
    -   [UI Avatars](https://ui-avatars.com/) for initials.
    -   [Placehold.co](https://placehold.co/) for project thumbnails.

### 3. Contact Form
The contact form uses [Formspree](https://formspree.io/).
1.  Go to Formspree and create a free account.
2.  Create a new form and get your unique endpoint URL.
3.  Update the `action` attribute in the `<form>` tag in `index.html`:
    ```html
    <form action="https://formspree.io/f/YOUR_FORM_ID" ...>
    ```

### 4. Social Links
Update the `href` attributes in the footer and contact section with your actual profile URLs.

## 🎨 Theming

The site uses CSS variables in `assets/css/style.css`. You can easily change the color scheme by modifying the `:root` variables:

```css
:root {
    --primary-color: #3b82f6; /* Change this to your brand color */
    /* ... */
}
```

## 🚀 Deployment

### GitHub Pages
1.  Commit and push your changes to the `main` (or `master`) branch.
2.  Go to your repository **Settings** > **Pages**.
3.  Ensure the source is set to **Deploy from a branch** and select your main branch.
4.  Your site will be live at `https://roberjo.github.io/`.

### Custom Domain
If you want to use a custom domain (e.g., `johnroberts.io`):
1.  Add a `CNAME` file to the root directory containing only your domain name (e.g., `johnroberts.io`).
2.  Configure your DNS provider (GoDaddy, Namecheap, etc.) to point to GitHub Pages.
    -   **A Record:** Point `@` to GitHub's IPs (`185.199.108.153`, etc.).
    -   **CNAME Record:** Point `www` to `roberjo.github.io`.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
