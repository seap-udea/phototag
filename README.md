# Photo Tagging App

A modern, interactive photo tagging application built with Next.js, React, and TypeScript. This application allows users to click on any point in an image and add names of people at those specific locations.

## Features

- 🖼️ **High-resolution image display** - Shows images with the highest possible resolution
- 🎯 **Precise click positioning** - Click anywhere on the image to add tags
- 👤 **Person tagging** - Add first and last names for each person
- 🏷️ **Visual tag display** - Tags appear as styled boxes with arrows pointing to the clicked location
- ✏️ **Easy editing** - Hover over tags to delete them
- 📱 **Responsive design** - Works on desktop and mobile devices
- 🎨 **Modern UI** - Clean, professional interface with Tailwind CSS

## Technology Stack

- **Next.js 15** - React framework with App Router
- **React 18** - UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd phototag
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **View the image** - The application displays a high-resolution sample image
2. **Click to tag** - Click anywhere on the image where you want to add a person's name
3. **Enter details** - Fill in the first name and last name in the modal that appears
4. **Submit** - Click "Add Person" to create the tag
5. **View tags** - Tags appear as blue boxes with arrows pointing to the clicked location
6. **Remove tags** - Hover over a tag and click the X button to delete it
7. **View summary** - See all tagged people in the summary section below the image

## Project Structure

```
phototag/
├── src/
│   └── app/
│       ├── layout.tsx          # Root layout with metadata
│       ├── page.tsx            # Main application component
│       └── globals.css         # Global styles
├── public/
│   └── sample-image.jpg        # High-resolution sample image
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## Key Components

### Main Page (`src/app/page.tsx`)
- Handles image display and click events
- Manages tag state and positioning
- Renders the modal for adding new tags
- Displays the summary of all tagged people

### Features Implemented

1. **Image Click Handling**
   - Calculates precise click coordinates as percentages
   - Opens modal for tag input at click location

2. **Tag Management**
   - Stores tags with unique IDs, coordinates, and names
   - Positions tags absolutely on the image
   - Provides delete functionality

3. **Modal Interface**
   - Clean form for entering first and last names
   - Form validation and submission
   - Cancel functionality

4. **Responsive Design**
   - Mobile-friendly interface
   - Adaptive layout for different screen sizes
   - Touch-friendly interactions

## Customization

### Adding Your Own Image

1. Replace `public/sample-image.jpg` with your own high-resolution image
2. Update the image source in `src/app/page.tsx` if needed
3. Ensure the image is optimized for web (JPEG/PNG format recommended)

### Styling Changes

The application uses Tailwind CSS for styling. You can customize:
- Colors in the tag boxes and buttons
- Font sizes and spacing
- Modal appearance
- Overall layout and spacing

### Adding Features

Some potential enhancements:
- Save/load tags from localStorage or a database
- Export tagged data as JSON
- Multiple image support
- Tag categories or colors
- Undo/redo functionality

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Quality

The project includes:
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for consistent styling
- Responsive design principles

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is open source and available under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions, please open an issue in the repository.