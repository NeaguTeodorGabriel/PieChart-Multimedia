# Pie Chart Creator

A more complex HTML and CSS web interface for creating pie chart data. This project provides a user interface to input pie chart slices with labels, values, and colors, organized in a structured codebase.

## Features

 - Full-screen, split layout with left sidebar and right chart area (Stage 2 layout)
- Responsive design with modern styling
- Organized component structure
 - Scrollable "Current Data" with inline editing for slice values
 - Automatic pastel color selection for new slices
 - Automatic pastel color selection for new slices
 - Export the chart from the top-right menu with format (PNG/JPG/SVG), scale (1x/2x/3x) and background (transparent/white)

## Project Structure

```
PieChart/
├── index.html          # Main HTML file
5. The "Pie Chart" section contains a canvas powered by the Canvas API.
└── src/
    ├── styles.css      # Main CSS styles
    └── components/
        ├── form.html       # Form component
To run: open `index.html` in a web browser (or serve the directory with a local server). The UI uses a full-screen split layout — left sidebar contains the form and data list, while the right 70% of the screen shows the canvas chart. The canvas is responsive and works with device pixel ratio scaling.
        └── chart.html      # Chart placeholder component
The UI uses a fixed, full-screen split layout — left sidebar (30% width) contains the form and data list and keeps the purple gradient background, while the right 70% of the screen shows the canvas chart. The site is fixed (no page scrolling); adding a slice updates the pie chart immediately and appends the slice at the top of the list (so the page doesn't scroll).
```

## Usage

1. Open `index.html` in a web browser.
2. Fill in the label, value, and color for each pie chart slice.
3. Click "Add Slice" to add the data and see the pie chart render on the canvas.
4. View the added data in the "Current Data" section.
        - The data list is scrollable and you can edit a slice value by pressing "Edit" next to any item.
5. The "Pie Chart" section contains a placeholder for where the actual pie chart would be rendered.

## Files

- `index.html`: The main HTML structure
- `src/styles.css`: Advanced CSS styles with animations, gradients, and responsive design
- `src/components/`: Separate HTML files for different UI components (for organizational purposes)

## Note

This project now includes a Canvas API implementation to generate and display the pie chart in the browser. The new `src/pieChart.js` adds the following features:

- Draws pie slices using the Canvas 2D API
- Hover to display tooltips
- Add and remove slices from the form and data list
 - Add and remove slices from the form and data list; edit values inline in the data list and the chart updates automatically

To run: open `index.html` in a browser (or serve the directory with a local server). The canvas is responsive and works with device pixel ratio scaling.