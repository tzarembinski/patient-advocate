# Medical Timeline Maker

A professional web app that visualizes patient treatment schedules with swim lane timelines, designed for medical and healthcare applications.

## Features

- **File Upload**: Support for Excel (.xlsx, .xls) and CSV files
- **Swim Lane Layout**: Categories organized in horizontal lanes for clear visualization
- **Milestone Markers**: Diamond-shaped markers (◆) for single-date events
- **Duration Bars**: Horizontal bars showing treatment periods with cycle shading
- **Smart Labeling**:
  - Long bars display labels inside (white text)
  - Short bars display labels outside to the right (dark text)
  - Labels show event name and date range in MM/DD format
- **Cycle Shading**: Treatment bars show alternating darker/lighter segments representing treatment cycles
- **Automatic Complications Placement**: Complications category always appears at the bottom of the timeline
- **Color-Coded Categories**: Distinct colors for different treatment categories
- **Mobile Responsive**: Fully optimized for viewing on phones and tablets
- **Professional Design**: Clean, healthcare-appropriate aesthetic matching clinical timeline standards

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## File Format

Your Excel or CSV file should contain the following columns:

- **Name**: Event name (e.g., "Disease Diagnosis", "Pembrolizumab", "ctDNA Test 1")
- **Begin date**: Start date (supports MM/DD/YY, MM/DD/YYYY, Excel date serial)
- **End date**: End date (optional - leave empty for milestones)
- **Category**: Treatment category (e.g., "Milestones", "Line 1", "Complications")

### Supported Categories

The app includes predefined colors for common medical categories:
- **Milestones**: Key events (diagnosis, treatment start, response) - Amber
- **Ext. Biomarker Assess**: External biomarker assessments - Blue
- **Line 1**: First-line treatments - Green (with cycle shading)
- **Line 2**: Second-line treatments - Purple (with cycle shading)
- **Complications**: Treatment complications - Red (always displayed at bottom)

Custom categories are automatically assigned colors from a predefined palette.

### Advanced Features

**Smart Labeling System**
- Bars wider than 80px: Label appears inside the bar with white text
- Bars narrower than 80px: Label appears outside to the right with dark text on light background
- All labels include event name and date range (MM/DD format)

**Cycle Shading**
- Treatment bars automatically display alternating shaded segments
- Each segment represents ~3 weeks (one treatment cycle)
- Subtle 15-20% opacity variation between adjacent cycles
- Helps visualize treatment rhythm and duration at a glance

**Category Ordering**
- Complications automatically placed at the bottom for better visibility
- Other categories maintain their natural order

### Example Data

| Name | Begin date | End date | Category |
|------|------------|----------|----------|
| Disease Diagnosis | 01/15/2024 | | Milestones |
| Pembrolizumab | 02/01/2024 | 08/30/2024 | Line 1 |
| ctDNA Test 1 | 01/20/2024 | 01/25/2024 | Ext. Biomarker Assess |
| Neuropathy | 10/15/2024 | 11/30/2024 | Complications |

A sample CSV file (`sample-data.csv`) is included in the project.

## Usage

1. Click "Upload Excel or CSV File" button
2. Select your data file
3. The timeline will automatically generate with:
   - Each category displayed as a separate swim lane
   - Complications category positioned at the bottom
   - Milestones (events without end dates) shown as diamond markers with labels
   - Duration events (with end dates) shown as horizontal bars with cycle shading
   - Smart label positioning (inside for long bars, outside for short bars)
4. Labels show event names and dates in MM/DD format
5. Treatment bars display alternating cycle shading for easy visualization
6. Scroll horizontally on mobile devices to view the full timeline

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **xlsx** - Excel file parsing
- **date-fns** - Date manipulation
