# JOROBEAN Landing Page

A mobile-first landing page for JOROBEAN #1, a 3D-printed footwear brand.

## Features

- Responsive, mobile-first design
- Dark/Light mode toggle (auto-detects system preference)
- Pre-order form
- Automatically updating year in footer
- Simple and clean interface

## How to Use

1. Simply open the `index.html` file in any modern web browser.
2. To customize:
   - Edit `index.html` to change content
   - Modify `styles.css` to adjust styling
   - Update `script.js` for additional functionality

## Structure

- **Hero Section**: Full-screen intro with brand name and tagline
- **Features Section**: Highlights key product features
- **About Section**: Information about the product and designer
- **Pre-Order Form**: Collects user information for pre-orders
- **Footer**: Copyright and social links

## Customization

### Images
Replace the placeholder image URL in the CSS with your actual product image:
```css
background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('path/to/your/image.jpg');
```

### Colors
Modify the CSS variables in the `:root` selector to change the color scheme:
```css
:root {
    --primary-color: #3a86ff;
    --secondary-color: #ff006e;
    /* other variables */
}
```

## Technologies Used

- HTML5
- CSS3 (with CSS Variables and Flexbox)
- JavaScript (Vanilla)
- Font Awesome for icons

## License

This project is free to use for personal or commercial purposes. 