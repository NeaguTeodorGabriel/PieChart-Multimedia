# Pie Chart Creator

A more complex HTML and CSS web interface for creating pie chart data. This project provides a user interface to input pie chart slices with labels, values, and colors, organized in a structured codebase.

## Features

- Input form for adding pie chart slices
- Display of current data entries
- Placeholder area for the pie chart visualization
- Responsive design with modern styling
- Organized component structure

## Project Structure

```
PieChart/
├── index.html          # Main HTML file
├── README.md           # This file
└── src/
    ├── styles.css      # Main CSS styles
    └── components/
        ├── form.html       # Form component
        ├── data-list.html  # Data list component
        └── chart.html      # Chart placeholder component
```

## Usage

1. Open `index.html` in a web browser.
2. Fill in the label, value, and color for each pie chart slice.
3. Click "Add Slice" to add the data (note: no functionality implemented for actual chart generation).
4. View the added data in the "Current Data" section.
5. The "Pie Chart" section contains a placeholder for where the actual pie chart would be rendered.

## Files

- `index.html`: The main HTML structure
- `src/styles.css`: Advanced CSS styles with animations, gradients, and responsive design
- `src/components/`: Separate HTML files for different UI components (for organizational purposes)

## Note

This project only includes the UI components. No JavaScript functionality is implemented for generating or displaying the actual pie chart. The component files in `src/components/` are separate for code organization but are not dynamically included.